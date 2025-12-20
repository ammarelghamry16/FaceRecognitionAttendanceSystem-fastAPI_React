/**
 * Classes Page - CRUD for classes
 */
import { useState, useEffect } from 'react';
import { classApi, courseApi } from '@/services/scheduleService';
import type { Class, ClassCreate, Course } from '@/services/scheduleService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, Clock, MapPin } from 'lucide-react';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<ClassCreate>({
    course_id: '',
    name: '',
    room_number: '',
    day_of_week: 'monday',
    schedule_time: '09:00',
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [classesRes, coursesRes] = await Promise.all([
        classApi.getAll(),
        courseApi.getAll(),
      ]);
      setClasses(classesRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await classApi.update(editingClass.id, formData);
      } else {
        await classApi.create(formData);
      }
      setShowForm(false);
      setEditingClass(null);
      setFormData({
        course_id: '',
        name: '',
        room_number: '',
        day_of_week: 'monday',
        schedule_time: '09:00',
      });
      fetchData();
    } catch (err) {
      setError('Failed to save class');
      console.error(err);
    }
  };

  // Handle edit
  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      course_id: cls.course_id,
      name: cls.name,
      room_number: cls.room_number,
      day_of_week: cls.day_of_week,
      schedule_time: cls.schedule_time,
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await classApi.delete(id);
      fetchData();
    } catch (err) {
      setError('Failed to delete class');
      console.error(err);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormData({
      course_id: '',
      name: '',
      room_number: '',
      day_of_week: 'monday',
      schedule_time: '09:00',
    });
  };

  // Get course name by ID
  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.name || 'Unknown Course';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">Manage class schedules</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={courses.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
          {error}
        </div>
      )}

      {courses.length === 0 && (
        <div className="p-4 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950 rounded-md">
          Please create a course first before adding classes.
        </div>
      )}

      {/* Class Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingClass ? 'Edit Class' : 'New Class'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <select
                    id="course"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Section A"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="room">Room Number</Label>
                  <Input
                    id="room"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    placeholder="e.g., 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day">Day of Week</Label>
                  <select
                    id="day"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background capitalize"
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                    required
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day} className="capitalize">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingClass ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Classes List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No classes found. Create your first class!
            </CardContent>
          </Card>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getCourseName(cls.course_id)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(cls)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cls.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="capitalize">{cls.day_of_week}</span>
                    <span>at {cls.schedule_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Room {cls.room_number}</span>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls.state === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : cls.state === 'completed'
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                    >
                      {cls.state}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
