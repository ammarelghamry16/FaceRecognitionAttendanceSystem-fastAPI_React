/**
 * Schedule Page - View schedule by day/role
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { classApi, Class } from '@/services/scheduleService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, MapPin, BookOpen } from 'lucide-react';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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

      if (selectedDay) {
        response = await classApi.getByDay(selectedDay);
      } else if (user?.role === 'student') {
        response = await classApi.getByStudent(user.id);
      } else if (user?.role === 'mentor') {
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
  }, [user, selectedDay]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin'
            ? 'Full schedule view'
            : user?.role === 'mentor'
            ? 'Your assigned classes'
            : 'Your enrolled classes'}
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
        {DAYS_OF_WEEK.map((day) => (
          <Button
            key={day}
            variant={selectedDay === day ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay(day)}
            className="capitalize"
          >
            {day.slice(0, 3)}
          </Button>
        ))}
      </div>

      {/* Schedule View */}
      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No classes found for this schedule.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {DAYS_OF_WEEK.filter((day) => classesByDay[day]?.length > 0).map((day) => (
            <div key={day}>
              <h2 className="text-lg font-semibold capitalize mb-3">{day}</h2>
              <div className="grid gap-3">
                {classesByDay[day].map((cls) => (
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
