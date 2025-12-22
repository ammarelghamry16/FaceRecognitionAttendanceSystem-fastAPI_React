/**
 * Schedule Page - Weekly table view for students, list view for others
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { classApi } from '@/services/scheduleService';
import type { Class } from '@/services/scheduleService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, MapPin, BookOpen } from 'lucide-react';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'saturday'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Sat'];

export default function Schedule() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Fetch schedule based on role
  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      let response;

      if (user?.role === 'student' && user?.id) {
        response = await classApi.getByStudent(user.id);
      } else if (user?.role === 'mentor' && user?.id) {
        response = await classApi.getByMentor(user.id);
      } else {
        response = await classApi.getFullSchedule();
      }

      setClasses(response.data);
    } catch (err) {
      setError('Failed to load schedule');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  // Group classes by day
  const classesByDay = classes.reduce((acc, cls) => {
    const day = cls.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(cls);
    return acc;
  }, {} as Record<string, Class[]>);

  // Sort classes by time within each day
  Object.keys(classesByDay).forEach((day) => {
    classesByDay[day].sort((a, b) => a.schedule_time.localeCompare(b.schedule_time));
  });

  // Get unique time slots for table view
  const allTimeSlots = [...new Set(classes.map(c => c.schedule_time))].sort();

  // Get today's day
  const todayIndex = new Date().getDay();
  const todayName = DAYS_OF_WEEK[todayIndex] || 'sunday';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Student view - Weekly table
  if (user?.role === 'student') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground">Your weekly class schedule</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
            {error}
          </div>
        )}

        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You are not enrolled in any classes yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium text-sm w-20">Time</th>
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <th 
                        key={day} 
                        className={`p-3 text-center font-medium text-sm ${day === todayName ? 'bg-primary/10' : ''}`}
                      >
                        {DAY_LABELS[idx]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allTimeSlots.map((time) => (
                    <tr key={time} className="border-b">
                      <td className="p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">
                        {time}
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        const classForSlot = classesByDay[day]?.find(c => c.schedule_time === time);
                        const isToday = day === todayName;
                        return (
                          <td 
                            key={day} 
                            className={`p-2 text-center ${isToday ? 'bg-primary/5' : ''}`}
                          >
                            {classForSlot ? (
                              <div className={`p-2 rounded-lg text-xs ${
                                classForSlot.state === 'active' 
                                  ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
                                  : 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                              }`}>
                                <p className="font-medium truncate">{classForSlot.name}</p>
                                <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {classForSlot.room_number}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></div>
            <span>Active Session</span>
          </div>
        </div>
      </div>
    );
  }

  // Mentor/Admin view - List view with day filter
  const filteredClasses = selectedDay 
    ? classes.filter(c => c.day_of_week === selectedDay)
    : classes;

  const filteredByDay = filteredClasses.reduce((acc, cls) => {
    const day = cls.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(cls);
    return acc;
  }, {} as Record<string, Class[]>);

  Object.keys(filteredByDay).forEach((day) => {
    filteredByDay[day].sort((a, b) => a.schedule_time.localeCompare(b.schedule_time));
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' ? 'Full schedule view' : 'Your assigned classes'}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
          {error}
        </div>
      )}

      {/* Day Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedDay === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedDay(null)}
        >
          All Days
        </Button>
        {DAYS_OF_WEEK.map((day, idx) => (
          <Button
            key={day}
            variant={selectedDay === day ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay(day)}
          >
            {DAY_LABELS[idx]}
          </Button>
        ))}
      </div>

      {/* Schedule View */}
      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No classes found for this schedule.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {DAYS_OF_WEEK.filter((day) => filteredByDay[day]?.length > 0).map((day, idx) => (
            <div key={day}>
              <h2 className="text-lg font-semibold mb-3 sticky top-0 bg-background py-2 z-10 border-b">
                {DAY_LABELS[idx]} - <span className="capitalize">{day}</span>
              </h2>
              <div className="grid gap-3">
                {filteredByDay[day].map((cls) => (
                  <Card key={cls.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{cls.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {cls.schedule_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Room {cls.room_number}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {cls.course?.name || 'Course'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            cls.state === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : cls.state === 'completed'
                                ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}
                        >
                          {cls.state}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
