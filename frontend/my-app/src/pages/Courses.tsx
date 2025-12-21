/**
 * Courses Page - CRUD for courses with mentor assignment
 */
import { useState, useEffect } from 'react';
import { courseApi } from '@/services/scheduleService';
import { authApi } from '@/services/authService';
import type { Course, CourseCreate, MentorInfo } from '@/services/scheduleService';
import type { User } from '@/services/authService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, Users, X, Check } from 'lucide-react';

export default function Courses() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseCreate>({
    code: '',
    name: '',
    description: '',
    mentor_ids: [],
  });

  // Fetch courses and mentors
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, mentorsRes] = await Promise.all([
        courseApi.getAll(),
        authApi.getMentors(),
      ]);
      setCourses(coursesRes.data);
      setMentors(mentorsRes);
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
      if (editingCourse) {
        await courseApi.update(editingCourse.id, formData);
        toast({
          title: 'Course Updated',
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await courseApi.create(formData);
        toast({
          title: 'Course Created',
          description: `${formData.name} has been created successfully.`,
        });
      }
      handleCancel();
      fetchData();
    } catch (err) {
      setError('Failed to save course');
      toast({
        title: 'Error',
        description: 'Failed to save course. Please try again.',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  // Handle edit
  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description || '',
      mentor_ids: course.mentor_ids || [],
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all associated classes.')) return;
    try {
      await courseApi.delete(id);
      toast({
        title: 'Course Deleted',
        description: 'The course has been deleted successfully.',
      });
      fetchData();
    } catch (err) {
      setError('Failed to delete course');
      toast({
        title: 'Error',
        description: 'Failed to delete course. Please try again.',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData({ code: '', name: '', description: '', mentor_ids: [] });
  };

  // Toggle mentor selection
  const toggleMentor = (mentorId: string) => {
    setFormData(prev => {
      const currentIds = prev.mentor_ids || [];
      if (currentIds.includes(mentorId)) {
        return { ...prev, mentor_ids: currentIds.filter(id => id !== mentorId) };
      } else {
        return { ...prev, mentor_ids: [...currentIds, mentorId] };
      }
    });
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
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Manage courses and assign mentors</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
          {error}
        </div>
      )}

      {/* Course Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCourse ? 'Edit Course' : 'New Course'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CS101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Introduction to Computer Science"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course description (optional)"
                />
              </div>

              {/* Mentor Selection */}
              <div className="space-y-2">
                <Label>Assigned Mentors</Label>
                <p className="text-sm text-muted-foreground">
                  Select mentors who can teach this course
                </p>
                {mentors.length === 0 ? (
                  <p className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md">
                    No mentors available. Create mentor accounts first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mentors.map((mentor) => {
                      const isSelected = formData.mentor_ids?.includes(mentor.id);
                      return (
                        <button
                          key={mentor.id}
                          type="button"
                          onClick={() => toggleMentor(mentor.id)}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:bg-accent'
                            }`}
                        >
                          {isSelected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                          <span>{mentor.full_name}</span>
                          {isSelected && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {formData.mentor_ids && formData.mentor_ids.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.mentor_ids.length} mentor(s) selected
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingCourse ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No courses found. Create your first course!
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{course.code}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(course)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {course.description || 'No description'}
                </p>

                {/* Mentors */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Mentors:</span>
                  </div>
                  {course.mentors && course.mentors.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {course.mentors.map((mentor: MentorInfo) => (
                        <span
                          key={mentor.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        >
                          {mentor.full_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No mentors assigned
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
