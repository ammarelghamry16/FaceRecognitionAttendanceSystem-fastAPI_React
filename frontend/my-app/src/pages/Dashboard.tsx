/**
 * Dashboard Page - Enhanced with widgets and real-time data
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotificationContext } from '@/context/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Users,
  Calendar,
  Bell,
  Clock,
  MapPin,
  TrendingUp,
  Camera,
  Play,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { CardSkeleton, ScheduleCardSkeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import { classApi, enrollmentApi } from '@/services/scheduleService';
import type { Class } from '@/services/scheduleService';

interface DashboardStats {
  courses: number;
  classes: number;
  students: number;
  mentors: number;
  attendanceRate: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotificationContext();
  const [stats, setStats] = useState<DashboardStats>({
    courses: 0,
    classes: 0,
    students: 0,
    mentors: 0,
    attendanceRate: 0,
  });
  const [todayClasses, setTodayClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        // Fetch today's classes based on user role
        let todaySchedule: Class[] = [];
        let studentCourses = 0;
        let studentClasses = 0;
        let mentorCourses = 0;
        let mentorClasses = 0;
        let mentorStudents = 0;
        
        try {
          if (user?.role === 'mentor' && user?.id) {
            // For mentors, get their assigned classes and filter by today
            const mentorScheduleRes = await classApi.getByMentor(user.id);
            const allMentorClasses = mentorScheduleRes.data || [];
            todaySchedule = allMentorClasses.filter(
              (cls: Class) => cls.day_of_week === today
            );
            // Count mentor's classes and unique courses
            mentorClasses = allMentorClasses.length;
            const uniqueCourseIds = new Set(allMentorClasses.map((cls: Class) => cls.course_id));
            mentorCourses = uniqueCourseIds.size;
            // Count unique students enrolled in mentor's classes
            const studentIds = new Set<string>();
            // Fetch enrollments for each class
            const enrollmentPromises = allMentorClasses.map((cls: Class) => 
              enrollmentApi.getByClass(cls.id).catch(() => ({ data: [] }))
            );
            const enrollmentResults = await Promise.all(enrollmentPromises);
            enrollmentResults.forEach((result) => {
              const enrollments = result.data || [];
              enrollments.forEach((enrollment: { student_id: string }) => {
                studentIds.add(enrollment.student_id);
              });
            });
            mentorStudents = studentIds.size;
          } else if (user?.role === 'student' && user?.id) {
            // For students, get their enrolled classes and filter by today
            const studentScheduleRes = await classApi.getByStudent(user.id);
            const allStudentClasses = studentScheduleRes.data || [];
            todaySchedule = allStudentClasses.filter(
              (cls: Class) => cls.day_of_week === today
            );
            // Count student's enrolled classes and unique courses
            studentClasses = allStudentClasses.length;
            const uniqueCourseIds = new Set(allStudentClasses.map((cls: Class) => cls.course_id));
            studentCourses = uniqueCourseIds.size;
          } else {
            // For admin, show all classes for today
            const scheduleRes = await classApi.getByDay(today);
            todaySchedule = scheduleRes.data || [];
          }
        } catch {
          todaySchedule = [];
        }

        // Set stats based on role
        if (user?.role === 'student') {
          setStats({
            courses: studentCourses,
            classes: studentClasses,
            students: 0,
            mentors: 0,
            attendanceRate: 0,
          });
        } else if (user?.role === 'mentor') {
          setStats({
            courses: mentorCourses,
            classes: mentorClasses,
            students: mentorStudents,
            mentors: 0,
            attendanceRate: 0,
          });
        } else {
          // Fetch dashboard stats from the stats endpoint for admin
          const [statsRes, coursesRes, classesRes] = await Promise.allSettled([
            api.get('/api/stats/dashboard'),
            api.get('/api/schedule/courses'),
            api.get('/api/schedule/classes'),
          ]);

          // Use stats from API if available
          if (statsRes.status === 'fulfilled' && statsRes.value.data) {
            const apiStats = statsRes.value.data;
            setStats({
              courses: apiStats.total_courses || 0,
              classes: apiStats.total_classes || 0,
              students: apiStats.total_students || 0,
              mentors: apiStats.total_mentors || 0,
              attendanceRate: apiStats.overall_attendance_rate || 0,
            });
          } else {
            // Fallback to counting from individual endpoints
            setStats({
              courses: coursesRes.status === 'fulfilled' ? coursesRes.value.data?.length || 0 : 0,
              classes: classesRes.status === 'fulfilled' ? classesRes.value.data?.length || 0 : 0,
              students: 0,
              mentors: 0,
              attendanceRate: 0,
            });
          }
        }

        setTodayClasses(todaySchedule);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please check your connection.');
        setStats({ courses: 0, classes: 0, students: 0, mentors: 0, attendanceRate: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [today, user?.role, user?.id]);

  const statCards = user?.role === 'admin' ? [
    { title: 'Courses', value: stats.courses, icon: BookOpen, color: 'text-blue-600' },
    { title: 'Classes', value: stats.classes, icon: Calendar, color: 'text-purple-600' },
    { title: 'Students', value: stats.students, icon: Users, color: 'text-green-600' },
    { title: 'Mentors', value: stats.mentors, icon: GraduationCap, color: 'text-indigo-600' },
    { title: 'Notifications', value: unreadCount, icon: Bell, color: 'text-orange-600' },
  ] : user?.role === 'mentor' ? [
    { title: 'My Courses', value: stats.courses, icon: BookOpen, color: 'text-blue-600' },
    { title: 'My Classes', value: stats.classes, icon: Calendar, color: 'text-purple-600' },
    { title: 'My Students', value: stats.students, icon: Users, color: 'text-green-600' },
    { title: 'Notifications', value: unreadCount, icon: Bell, color: 'text-orange-600' },
  ] : [
    // Student: only show their enrolled courses and classes
    { title: 'My Courses', value: stats.courses, icon: BookOpen, color: 'text-blue-600' },
    { title: 'My Classes', value: stats.classes, icon: Calendar, color: 'text-purple-600' },
    { title: 'Notifications', value: unreadCount, icon: Bell, color: 'text-orange-600' },
  ];

  // Recent notifications (last 3)
  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.first_name}! Here's what's happening today.
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {user?.role}
        </Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className={`grid gap-4 grid-cols-2 ${user?.role === 'admin' ? 'lg:grid-cols-5' : user?.role === 'mentor' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {isLoading ? (
          Array.from({ length: user?.role === 'admin' ? 5 : user?.role === 'mentor' ? 4 : 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription className="capitalize">{today}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/schedule">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ScheduleCardSkeleton key={i} />
                ))}
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.slice(0, 4).map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{cls.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {cls.schedule_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Room {cls.room_number}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={cls.state === 'active' ? 'default' : 'secondary'}
                      className={cls.state === 'active' ? 'bg-green-500' : ''}
                    >
                      {cls.state === 'active' && <Play className="h-3 w-3 mr-1" />}
                      {cls.state}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Attendance Rate (for students) */}
          {user?.role === 'student' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Your Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{stats.attendanceRate}%</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <Progress value={stats.attendanceRate} className="h-2" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.attendanceRate >= 90 ? "Keep it up! You're doing great." :
                    stats.attendanceRate >= 75 ? "Good progress, keep attending!" :
                      "Try to improve your attendance rate."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user?.role === 'student' && (
                <>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/face-enrollment">
                      <Camera className="h-4 w-4 mr-2" />
                      Face Enrollment
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/attendance">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      View Attendance
                    </Link>
                  </Button>
                </>
              )}
              {(user?.role === 'mentor' || user?.role === 'admin') && (
                <>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/attendance">
                      <Play className="h-4 w-4 mr-2" />
                      Start Session
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/classes">
                      <Calendar className="h-4 w-4 mr-2" />
                      Manage Classes
                    </Link>
                  </Button>
                </>
              )}
              {user?.role === 'admin' && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage Courses
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`text-sm p-2 rounded ${!notification.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <p className="font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link to="/notifications">View All</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
