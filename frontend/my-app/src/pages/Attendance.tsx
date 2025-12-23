/**
 * Attendance Page - Real backend integration
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, Play, Square, TrendingUp, Loader2, RefreshCw, Wifi, Download, FileText, Camera, Hand, Timer, X, AlertCircle, UserCheck } from 'lucide-react';
import { attendanceApi } from '@/services/attendanceService';
import type { AttendanceSession, AttendanceRecord } from '@/services/attendanceService';
import { aiApi } from '@/services/aiService';
import { exportToCSV, exportToPDF, type ExportRecord } from '@/utils/exportUtils';
import { CardSkeleton, TableRowSkeleton, Skeleton } from '@/components/ui/skeleton';
import { classApi } from '@/services/scheduleService';
import type { Class } from '@/services/scheduleService';
import { toast } from '@/hooks/useToast';

// Recognition window status type
interface RecognitionWindowStatus {
  is_active: boolean;
  elapsed_minutes: number;
  window_minutes: number;
  remaining_minutes: number;
  mode: 'auto' | 'manual_only';
}

// Recognition Window Status Component
const RecognitionWindowIndicator = ({ sessionId }: { sessionId: string }) => {
  const [status, setStatus] = useState<RecognitionWindowStatus | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await attendanceApi.getRecognitionWindowStatus(sessionId);
        setStatus(res);
        setCountdown(res.remaining_minutes * 60); // Convert to seconds
      } catch (err) {
        console.error('Failed to fetch recognition window status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  if (!status) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${status.is_active
      ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
      : 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800'
      }`}>
      {status.is_active ? (
        <>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-700 dark:text-blue-300">Auto Recognition Active</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatTime(countdown)}
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400">remaining</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Hand className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="font-medium text-orange-700 dark:text-orange-300">Manual Mode Only</span>
          </div>
          <span className="text-sm text-orange-600 dark:text-orange-400 ml-auto">
            Auto-recognition window expired ({status.window_minutes} min)
          </span>
        </>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { icon: typeof CheckCircle; className: string }> = {
    present: { icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    absent: { icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    late: { icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    excused: { icon: Clock, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  };
  const { icon: Icon, className } = config[status] || config.absent;
  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Extended session type with class info for admin view
interface ActiveSessionWithClass extends AttendanceSession {
  class_name?: string;
  mentor_name?: string;
  stats?: { present: number; absent: number; late: number };
}

export default function Attendance() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);
  const [studentStats, setStudentStats] = useState({ present: 0, late: 0, absent: 0, total: 0, rate: 0 });
  const [isLivePolling, setIsLivePolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Admin spectator mode state
  const [allActiveSessions, setAllActiveSessions] = useState<ActiveSessionWithClass[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Face scanning state
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; studentName?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start face scanner camera
  const startFaceScanner = useCallback(async () => {
    setShowFaceScanner(true);
    setScanResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not found');

      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error('[FaceScanner] Camera error:', err);
      toast({
        title: 'Camera Error',
        description: err instanceof Error ? err.message : 'Failed to access camera',
        variant: 'destructive',
      });
      setShowFaceScanner(false);
    }
  }, []);

  // Capture and recognize face for attendance
  const captureAndRecognize = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !activeSession) return;

    setIsScanningFace(true);
    setScanResult(null);

    try {
      // Capture frame
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      const ctx = captureCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas error');

      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);

      const imageData = captureCanvas.toDataURL('image/jpeg', 0.92);

      // Call face recognition API for attendance
      const result = await aiApi.recognizeForAttendanceBase64(activeSession.id, imageData);

      if (result.recognized && result.attendance_marked) {
        setScanResult({
          success: true,
          message: `Attendance marked as ${result.status}`,
          studentName: result.user_id,
        });
        toast({
          title: 'Attendance Marked',
          description: `Student recognized and marked as ${result.status}`,
          variant: 'success',
        });
      } else if (result.recognized && !result.attendance_marked) {
        setScanResult({
          success: false,
          message: result.message || 'Student already marked or not enrolled in this class',
        });
        toast({
          title: 'Already Marked',
          description: result.message || 'Student already has attendance record',
          variant: 'default',
        });
      } else {
        setScanResult({
          success: false,
          message: result.message || 'Face not recognized',
        });
        toast({
          title: 'Not Recognized',
          description: result.message || 'Face not found in database',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('[FaceScanner] Recognition error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Recognition failed';
      setScanResult({
        success: false,
        message: errorMessage,
      });
      toast({
        title: 'Recognition Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsScanningFace(false);
    }
  }, [activeSession]);

  // Close face scanner
  const closeFaceScanner = useCallback(() => {
    stopCamera();
    setShowFaceScanner(false);
    setScanResult(null);
  }, [stopCamera]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Fetch classes on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        if (user?.role === 'student') {
          // Fetch student's attendance history
          try {
            const history = await attendanceApi.getStudentHistory(user.id);
            setStudentHistory(history);
            const stats = await attendanceApi.getStudentStats(user.id);
            setStudentStats({
              present: stats.present,
              late: stats.late,
              absent: stats.absent,
              total: stats.total_sessions,
              rate: stats.attendance_rate,
            });
          } catch (err) {
            console.error('Failed to fetch student stats:', err);
            // Show zeros when API fails - no demo data
            setStudentStats({ present: 0, late: 0, absent: 0, total: 0, rate: 0 });
          }
        } else if (user?.role === 'admin') {
          // Admin: Fetch all active sessions for spectator mode
          try {
            // Fetch all active sessions and all classes (not just today's)
            const activeSessions = await attendanceApi.getAllActiveSessions();
            console.log('[Admin] Active sessions:', activeSessions);
            
            // Fetch all classes to get class names
            const allClassesRes = await classApi.getAll();
            console.log('[Admin] All classes:', allClassesRes.data);
            setClasses(allClassesRes.data);

            // Enrich sessions with class info and stats
            const enrichedSessions: ActiveSessionWithClass[] = await Promise.all(
              activeSessions.map(async (session) => {
                const classInfo = allClassesRes.data.find((c: Class) => c.id === session.class_id);
                let sessionStats = { present: 0, absent: 0, late: 0 };
                try {
                  const statsRes = await attendanceApi.getSessionStats(session.id);
                  sessionStats = { present: statsRes.present, absent: statsRes.absent, late: statsRes.late };
                } catch {
                  // Fallback: fetch records and calculate
                  try {
                    const sessionRecords = await attendanceApi.getSessionRecords(session.id);
                    sessionStats = {
                      present: sessionRecords.filter(r => r.status === 'present').length,
                      absent: sessionRecords.filter(r => r.status === 'absent').length,
                      late: sessionRecords.filter(r => r.status === 'late').length,
                    };
                  } catch { /* ignore */ }
                }
                return {
                  ...session,
                  class_name: classInfo?.name || 'Unknown Class',
                  mentor_name: classInfo?.mentor_id || 'Unknown',
                  stats: sessionStats,
                };
              })
            );
            setAllActiveSessions(enrichedSessions);
          } catch (err) {
            console.error('Failed to fetch active sessions:', err);
            // Fallback to regular class fetch
            const classesRes = await classApi.getByDay(today);
            setClasses(classesRes.data);
          }
        } else {
          // Mentor: Fetch classes for mentor - only today's classes
          let classesRes;
          if (user?.role === 'mentor' && user?.id) {
            // Mentors only see their assigned classes for today
            classesRes = await classApi.getByMentor(user.id);
            classesRes.data = classesRes.data.filter((c: Class) => c.day_of_week === today);
          } else {
            classesRes = await classApi.getByDay(today);
          }
          setClasses(classesRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, user?.role]);

  // Check for active session when class is selected
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!selectedClass) return;

      try {
        const session = await attendanceApi.getActiveSession(selectedClass);
        if (session) {
          setActiveSession(session);
          const sessionRecords = await attendanceApi.getSessionRecords(session.id);
          setRecords(sessionRecords);
          setLastUpdate(new Date());
        }
      } catch {
        // No active session
      }
    };

    checkActiveSession();
  }, [selectedClass]);

  // Admin: Handle selecting a session to view details
  const handleSelectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const session = allActiveSessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
      try {
        const sessionRecords = await attendanceApi.getSessionRecords(sessionId);
        setRecords(sessionRecords);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Failed to fetch session records:', err);
      }
    }
  };

  // Admin: Go back to all sessions view
  const handleBackToAllSessions = () => {
    setSelectedSessionId(null);
    setActiveSession(null);
    setRecords([]);
  };

  // Admin: Refresh all active sessions
  const refreshAllSessions = async () => {
    if (user?.role !== 'admin') return;
    try {
      const activeSessions = await attendanceApi.getAllActiveSessions();
      const enrichedSessions: ActiveSessionWithClass[] = await Promise.all(
        activeSessions.map(async (session) => {
          const classInfo = classes.find((c: Class) => c.id === session.class_id);
          let sessionStats = { present: 0, absent: 0, late: 0 };
          try {
            const sessionRecords = await attendanceApi.getSessionRecords(session.id);
            sessionStats = {
              present: sessionRecords.filter(r => r.status === 'present').length,
              absent: sessionRecords.filter(r => r.status === 'absent').length,
              late: sessionRecords.filter(r => r.status === 'late').length,
            };
          } catch { /* ignore */ }
          return {
            ...session,
            class_name: classInfo?.name || 'Unknown Class',
            mentor_name: classInfo?.mentor_id || 'Unknown',
            stats: sessionStats,
          };
        })
      );
      setAllActiveSessions(enrichedSessions);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to refresh sessions:', err);
    }
  };

  // Live polling for attendance records when session is active
  useEffect(() => {
    if (!activeSession) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsLivePolling(false);
      return;
    }

    setIsLivePolling(true);
    let previousCount = records.length;

    const pollRecords = async () => {
      try {
        const sessionRecords = await attendanceApi.getSessionRecords(activeSession.id);

        // Check for new records and show toast
        if (sessionRecords.length > previousCount) {
          const newRecords = sessionRecords.slice(0, sessionRecords.length - previousCount);
          newRecords.forEach(record => {
            toast({
              title: `Student Checked In`,
              description: `${record.student_id} marked as ${record.status}`,
              variant: record.status === 'present' ? 'success' : 'default',
            });
          });
        }
        previousCount = sessionRecords.length;

        setRecords(sessionRecords);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Failed to poll records:', err);
      }
    };

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(pollRecords, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [activeSession?.id]);

  // Admin: Auto-refresh all active sessions every 10 seconds
  useEffect(() => {
    if (user?.role !== 'admin' || selectedSessionId) return;

    const interval = setInterval(refreshAllSessions, 10000);
    return () => clearInterval(interval);
  }, [user?.role, selectedSessionId, classes]);

  // Start attendance session
  const handleStartSession = async () => {
    if (!selectedClass) return;

    setIsStarting(true);
    setError('');

    try {
      const session = await attendanceApi.startSession({
        class_id: selectedClass,
        late_threshold_minutes: 15,
      });
      setActiveSession(session);
      setRecords([]);
    } catch (err) {
      setError('Failed to start session. Please try again.');
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  // End attendance session
  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await attendanceApi.endSession(activeSession.id);
      setActiveSession(null);
      setRecords([]);
      setSelectedClass('');
    } catch (err) {
      setError('Failed to end session.');
      console.error(err);
    }
  };

  // Calculate stats from records
  const stats = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
  };

  // Export handlers
  const handleExportCSV = () => {
    const exportData: ExportRecord[] = records.map(r => ({
      studentId: r.student_id,
      status: r.status,
      date: new Date(r.marked_at).toLocaleDateString(),
      time: new Date(r.marked_at).toLocaleTimeString(),
      method: r.verification_method.replace('_', ' '),
      confidence: r.confidence_score,
    }));
    const className = classes.find(c => c.id === activeSession?.class_id)?.name || 'attendance';
    const date = new Date().toISOString().split('T')[0];
    exportToCSV(exportData, `${className}-${date}`);
  };

  const handleExportPDF = () => {
    const exportData: ExportRecord[] = records.map(r => ({
      studentId: r.student_id,
      status: r.status,
      date: new Date(r.marked_at).toLocaleDateString(),
      time: new Date(r.marked_at).toLocaleTimeString(),
      method: r.verification_method.replace('_', ' '),
      confidence: r.confidence_score,
    }));
    const className = classes.find(c => c.id === activeSession?.class_id)?.name || 'Attendance';
    const date = new Date().toLocaleDateString();
    exportToPDF(exportData, `attendance-${date}`, `${className} - Attendance Report (${date})`, stats);
  };

  const handleExportStudentCSV = () => {
    const exportData: ExportRecord[] = studentHistory.map(r => ({
      studentId: r.student_id,
      status: r.status,
      date: new Date(r.marked_at).toLocaleDateString(),
      time: new Date(r.marked_at).toLocaleTimeString(),
      method: r.verification_method.replace('_', ' '),
      confidence: r.confidence_score,
    }));
    exportToCSV(exportData, `my-attendance-${new Date().toISOString().split('T')[0]}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="p-6">
            <table className="w-full">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={4} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Student view
  if (user?.role === 'student') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">View your attendance history</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{studentStats.rate}%</div>
              <div className="text-sm text-muted-foreground">Attendance Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{studentStats.present}</div>
              <div className="text-sm text-muted-foreground">Present</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
              <div className="text-2xl font-bold">{studentStats.late}</div>
              <div className="text-sm text-muted-foreground">Late</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
              <div className="text-2xl font-bold">{studentStats.absent}</div>
              <div className="text-sm text-muted-foreground">Absent</div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Attendance</CardTitle>
              {studentHistory.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportStudentCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {studentHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No attendance records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentHistory.slice(0, 10).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.marked_at).toLocaleDateString()}</TableCell>
                      <TableCell><StatusBadge status={record.status} /></TableCell>
                      <TableCell>{new Date(record.marked_at).toLocaleTimeString()}</TableCell>
                      <TableCell className="capitalize">{record.verification_method.replace('_', ' ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mentor/Admin view
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin';
  const canControlSession = isMentor; // Only mentors can start/end sessions

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'View attendance sessions (spectate mode)' : 'Manage attendance sessions'}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
          {error}
        </div>
      )}

      {/* Admin spectate notice */}
      {isAdmin && allActiveSessions.length === 0 && !selectedSessionId && (
        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-400">Spectate Mode</p>
                <p className="text-sm text-muted-foreground">
                  No active sessions at the moment. Sessions will appear here when mentors start them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin: All Active Sessions Grid */}
      {isAdmin && !selectedSessionId && allActiveSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-lg font-semibold">{allActiveSessions.length} Active Session{allActiveSessions.length !== 1 ? 's' : ''}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAllSessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allActiveSessions.map((session) => (
              <Card 
                key={session.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors border-green-500/30 bg-green-50/30 dark:bg-green-950/10"
                onClick={() => handleSelectSession(session.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      {session.class_name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Started: {new Date(session.start_time).toLocaleTimeString()}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                        <div className="text-lg font-bold text-green-700 dark:text-green-400">{session.stats?.present || 0}</div>
                        <div className="text-xs text-green-600 dark:text-green-500">Present</div>
                      </div>
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                        <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{session.stats?.late || 0}</div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-500">Late</div>
                      </div>
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                        <div className="text-lg font-bold text-red-700 dark:text-red-400">{session.stats?.absent || 0}</div>
                        <div className="text-xs text-red-600 dark:text-red-500">Absent</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Admin: Selected Session Detail View */}
      {isAdmin && selectedSessionId && activeSession && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBackToAllSessions}>
            ← Back to All Sessions
          </Button>
          <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  {(activeSession as ActiveSessionWithClass).class_name || 'Active Session'} (Viewing)
                </CardTitle>
                <Badge variant="outline">
                  Started {new Date(activeSession.start_time).toLocaleTimeString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recognition Window Status */}
                <RecognitionWindowIndicator sessionId={activeSession.id} />

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.present}</div>
                    <div className="text-xs text-green-600 dark:text-green-500">Present</div>
                  </div>
                  <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.absent}</div>
                    <div className="text-xs text-red-600 dark:text-red-500">Absent</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.late}</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-500">Late</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Control - Only for mentors */}
      {canControlSession && (
        <Card className={activeSession ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {activeSession && <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />}
                {activeSession ? 'Active Session' : 'Start Session'}
              </CardTitle>
              {activeSession && (
                <Badge variant="outline">
                  {classes.find(c => c.id === activeSession.class_id)?.name || 'Class'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!activeSession ? (
              <div className="space-y-4">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.day_of_week} {cls.schedule_time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStartSession}
                  disabled={!selectedClass || isStarting}
                >
                  {isStarting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Attendance Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Recognition Window Status */}
                <RecognitionWindowIndicator sessionId={activeSession.id} />

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.present}</div>
                    <div className="text-xs text-green-600 dark:text-green-500">Present</div>
                  </div>
                  <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.absent}</div>
                    <div className="text-xs text-red-600 dark:text-red-500">Absent</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.late}</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-500">Late</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={startFaceScanner} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Student Face
                  </Button>
                  <Button variant="destructive" onClick={handleEndSession}>
                    <Square className="h-4 w-4 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Records Table - Show for mentor active session OR admin selected session */}
      {activeSession && (user?.role === 'mentor' || (user?.role === 'admin' && selectedSessionId)) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance Records</CardTitle>
              <div className="flex items-center gap-2">
                {isLivePolling && (
                  <Badge variant="outline" className="gap-1">
                    <Wifi className="h-3 w-3 text-green-500" />
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Live
                  </Badge>
                )}
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                {records.length > 0 && (
                  <div className="flex gap-1 ml-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF}>
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
                <p className="text-muted-foreground">
                  Waiting for students to check in via face recognition...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Records will appear automatically
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.student_id}</TableCell>
                      <TableCell><StatusBadge status={record.status} /></TableCell>
                      <TableCell>{new Date(record.marked_at).toLocaleTimeString()}</TableCell>
                      <TableCell className="capitalize">{record.verification_method.replace('_', ' ')}</TableCell>
                      <TableCell>
                        {record.confidence_score
                          ? `${(record.confidence_score * 100).toFixed(1)}%`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Face Scanner Modal */}
      {showFaceScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 bg-card rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Scan Student Face</h3>
              </div>
              <button
                onClick={closeFaceScanner}
                className="p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Camera View */}
            <div className="relative bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Face guide oval */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 rounded-[50%] border-4 border-primary/70" />
              </div>

              {/* Scanning overlay */}
              {isScanningFace && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                  <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                  <p className="text-lg">Recognizing face...</p>
                </div>
              )}

              {/* Result overlay */}
              {scanResult && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center text-white p-6 ${
                  scanResult.success ? 'bg-green-900/90' : 'bg-red-900/90'
                }`}>
                  {scanResult.success ? (
                    <>
                      <UserCheck className="w-16 h-16 mb-4 text-green-400" />
                      <p className="text-xl font-semibold">Attendance Marked!</p>
                      <p className="text-sm text-green-200 mt-2">{scanResult.message}</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
                      <p className="text-xl font-semibold">Not Recognized</p>
                      <p className="text-sm text-red-200 mt-2 text-center">{scanResult.message}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border space-y-3">
              {!scanResult ? (
                <>
                  <p className="text-sm text-center text-muted-foreground">
                    Position the student's face in the oval and click capture
                  </p>
                  <Button 
                    onClick={captureAndRecognize} 
                    className="w-full"
                    disabled={isScanningFace}
                  >
                    {isScanningFace ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recognizing...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Capture & Mark Attendance
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={closeFaceScanner} variant="outline" className="flex-1">
                    Close
                  </Button>
                  <Button onClick={() => setScanResult(null)} className="flex-1">
                    Scan Another
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
