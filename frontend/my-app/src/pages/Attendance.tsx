/**
 * Attendance Page - Real backend integration
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, Play, Square, TrendingUp, Loader2, RefreshCw, Wifi, Download, FileText, Camera, Hand, Timer } from 'lucide-react';
import { attendanceApi } from '@/services/attendanceService';
import type { AttendanceSession, AttendanceRecord } from '@/services/attendanceService';
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

  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

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
        } else {
          // Fetch classes for mentor/admin - only today's classes
          let classesRes;
          if (user?.role === 'mentor' && user?.id) {
            // Mentors only see their assigned classes for today
            classesRes = await classApi.getByMentor(user.id);
            classesRes.data = classesRes.data.filter((c: Class) => c.day_of_week === today);
          } else {
            // Admins see all classes for today
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
      {isAdmin && !activeSession && (
        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-400">Spectate Mode</p>
                <p className="text-sm text-muted-foreground">
                  As an admin, you can view active sessions but cannot start or end them.
                  Only mentors can control attendance sessions for their classes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                <Button variant="destructive" onClick={handleEndSession}>
                  <Square className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin view - Show active session stats without controls */}
      {isAdmin && activeSession && (
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                Active Session (Viewing)
              </CardTitle>
              <Badge variant="outline">
                {classes.find(c => c.id === activeSession.class_id)?.name || 'Class'}
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
      )}

      {/* Class selector for admin to view sessions */}
      {isAdmin && !activeSession && (
        <Card>
          <CardHeader>
            <CardTitle>Select Class to View</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class to view its session" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} - {cls.day_of_week} {cls.schedule_time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      {activeSession && (
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
    </div>
  );
}
