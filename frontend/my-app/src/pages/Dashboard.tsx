/**
 * Dashboard Page - Role-based overview
 */
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Calendar, Bell } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Courses',
      value: '12',
      description: 'Active courses',
      icon: BookOpen,
    },
    {
      title: 'Classes',
      value: '48',
      description: 'Total classes',
      icon: Calendar,
    },
    {
      title: 'Students',
      value: '256',
      description: 'Enrolled students',
      icon: Users,
    },
    {
      title: 'Notifications',
      value: '5',
      description: 'Unread',
      icon: Bell,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.first_name}! You are logged in as {user?.role}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role-specific content */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.role === 'admin' && (
              <ul className="space-y-2 text-sm">
                <li>• Manage courses and classes</li>
                <li>• View all schedules</li>
                <li>• Manage enrollments</li>
                <li>• View attendance reports</li>
              </ul>
            )}
            {user?.role === 'mentor' && (
              <ul className="space-y-2 text-sm">
                <li>• View your assigned classes</li>
                <li>• Activate class for attendance</li>
                <li>• Mark attendance manually</li>
                <li>• View class attendance history</li>
              </ul>
            )}
            {user?.role === 'student' && (
              <ul className="space-y-2 text-sm">
                <li>• View your schedule</li>
                <li>• Check attendance history</li>
                <li>• View notifications</li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Class "Data Structures" started</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Attendance confirmed for Algorithms</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>Schedule updated for tomorrow</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
