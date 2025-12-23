/**
 * Classes Page - Enhanced with sorting, filtering, and conflict validation
 */
import { useState, useEffect, useMemo } from 'react';
import { classApi, courseApi } from '@/services/scheduleService';
import type { Class, ClassCreate, Course, ClassConflict, ConflictCheckResult, MentorInfo } from '@/services/scheduleService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus, Pencil, Trash2, Loader2, Clock, MapPin, Search,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, AlertTriangle, CheckCircle2, X, ExternalLink, User
} from 'lucide-react';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ORDER: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7
};

// All available rooms in the building
const ALL_ROOMS = ['101', '102', '103', '104', '105', '201', '202', '203', '204', '205', '301', '302', '303', '304', '305'];

// Available time slots (24-hour format for testing)
const TIME_SLOTS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

type SortField = 'name' | 'day_of_week' | 'schedule_time' | 'room_number' | 'course';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function Classes() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ClassCreate>({
    course_id: '',
    name: '',
    room_number: '',
    day_of_week: 'monday',
    schedule_time: '09:00',
  });

  // Conflict state
  const [conflicts, setConflicts] = useState<ConflictCheckResult | null>(null);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [highlightedClassId, setHighlightedClassId] = useState<string | null>(null);

  // Sorting and filtering
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'day_of_week', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterRoom, setFilterRoom] = useState<string>('');

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

  // Get available mentors for selected course
  const availableMentors = useMemo((): MentorInfo[] => {
    if (!formData.course_id) return [];
    const course = courses.find(c => c.id === formData.course_id);
    return course?.mentors || [];
  }, [formData.course_id, courses]);

  // Get unique rooms for filter
  const uniqueRooms = useMemo(() => {
    const rooms = new Set(classes.map(c => c.room_number));
    return Array.from(rooms).sort();
  }, [classes]);

  // Get available rooms for selected day and time (rooms not occupied)
  const availableRooms = useMemo(() => {
    if (!formData.day_of_week || !formData.schedule_time) {
      return ALL_ROOMS;
    }
    
    // Find rooms that are occupied at this day/time
    const occupiedRooms = new Set(
      classes
        .filter(cls => 
          cls.day_of_week === formData.day_of_week && 
          cls.schedule_time === formData.schedule_time &&
          // Exclude the class being edited
          cls.id !== editingClass?.id
        )
        .map(cls => cls.room_number)
    );
    
    // Return rooms that are NOT occupied
    return ALL_ROOMS.filter(room => !occupiedRooms.has(room));
  }, [classes, formData.day_of_week, formData.schedule_time, editingClass?.id]);

  // Get course name by ID
  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.name || 'Unknown Course';
  };

  // Get mentor name by ID
  const getMentorName = (mentorId: string | undefined) => {
    if (!mentorId) return null;
    for (const course of courses) {
      const mentor = course.mentors?.find(m => m.id === mentorId);
      if (mentor) return mentor.full_name;
    }
    return null;
  };

  // Sort and filter classes
  const sortedAndFilteredClasses = useMemo(() => {
    let filtered = [...classes];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(query) ||
        cls.room_number.toLowerCase().includes(query) ||
        getCourseName(cls.course_id).toLowerCase().includes(query)
      );
    }

    // Apply day filter
    if (filterDay) {
      filtered = filtered.filter(cls => cls.day_of_week === filterDay);
    }

    // Apply course filter
    if (filterCourse) {
      filtered = filtered.filter(cls => cls.course_id === filterCourse);
    }

    // Apply room filter
    if (filterRoom) {
      filtered = filtered.filter(cls => cls.room_number === filterRoom);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'day_of_week':
          comparison = (DAY_ORDER[a.day_of_week] || 0) - (DAY_ORDER[b.day_of_week] || 0);
          break;
        case 'schedule_time':
          comparison = a.schedule_time.localeCompare(b.schedule_time);
          break;
        case 'room_number':
          comparison = a.room_number.localeCompare(b.room_number);
          break;
        case 'course':
          comparison = getCourseName(a.course_id).localeCompare(getCourseName(b.course_id));
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [classes, searchQuery, filterDay, filterCourse, filterRoom, sortConfig, courses]);

  // Check for conflicts when form data changes
  const checkConflicts = async () => {
    if (!formData.room_number || !formData.day_of_week || !formData.schedule_time) {
      setConflicts(null);
      return;
    }

    setIsCheckingConflicts(true);
    try {
      const response = await classApi.checkConflicts({
        room_number: formData.room_number,
        day_of_week: formData.day_of_week,
        schedule_time: formData.schedule_time,
        mentor_id: formData.mentor_id,
        exclude_class_id: editingClass?.id,
      });
      setConflicts(response.data);
    } catch (err) {
      console.error('Failed to check conflicts:', err);
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  // Debounced conflict check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showForm) {
        checkConflicts();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.room_number, formData.day_of_week, formData.schedule_time, formData.mentor_id, showForm]);

  // Handle sort
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterDay('');
    setFilterCourse('');
    setFilterRoom('');
  };

  const hasActiveFilters = searchQuery || filterDay || filterCourse || filterRoom;

  // Group classes by current sort field
  const groupedClasses = useMemo(() => {
    const groups: { key: string; label: string; classes: Class[] }[] = [];
    let currentGroup: { key: string; label: string; classes: Class[] } | null = null;

    sortedAndFilteredClasses.forEach((cls) => {
      let groupKey: string;
      let groupLabel: string;

      switch (sortConfig.field) {
        case 'day_of_week':
          groupKey = cls.day_of_week;
          groupLabel = cls.day_of_week.charAt(0).toUpperCase() + cls.day_of_week.slice(1);
          break;
        case 'schedule_time':
          // Group by hour
          const hour = cls.schedule_time.split(':')[0];
          groupKey = hour;
          const hourNum = parseInt(hour);
          groupLabel = `${hourNum > 12 ? hourNum - 12 : hourNum}:00 ${hourNum >= 12 ? 'PM' : 'AM'}`;
          break;
        case 'room_number':
          groupKey = cls.room_number;
          groupLabel = `Room ${cls.room_number}`;
          break;
        case 'course':
          groupKey = cls.course_id;
          groupLabel = getCourseName(cls.course_id);
          break;
        case 'name':
          // Group by first letter
          groupKey = cls.name.charAt(0).toUpperCase();
          groupLabel = groupKey;
          break;
        default:
          groupKey = 'all';
          groupLabel = 'All Classes';
      }

      if (!currentGroup || currentGroup.key !== groupKey) {
        currentGroup = { key: groupKey, label: groupLabel, classes: [] };
        groups.push(currentGroup);
      }
      currentGroup.classes.push(cls);
    });

    return groups;
  }, [sortedAndFilteredClasses, sortConfig.field, courses]);

  // Get group icon based on sort field
  const getGroupIcon = () => {
    switch (sortConfig.field) {
      case 'day_of_week':
        return '📅';
      case 'schedule_time':
        return '🕐';
      case 'room_number':
        return '🏠';
      case 'course':
        return '📚';
      case 'name':
        return '🔤';
      default:
        return '📋';
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for conflicts before submitting
    if (conflicts?.has_conflicts) {
      toast({
        title: 'Scheduling Conflict',
        description: 'Please resolve the conflicts before creating the class.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClass) {
        await classApi.update(editingClass.id, formData);
        toast({
          title: 'Class Updated',
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const response = await classApi.createWithValidation(formData);
        if (response.data.success) {
          toast({
            title: 'Class Created',
            description: `${formData.name} has been created successfully.`,
          });
        } else {
          setConflicts(response.data.conflicts);
          toast({
            title: 'Scheduling Conflict',
            description: 'Cannot create class due to scheduling conflicts.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }
      handleCancel();
      fetchData();
    } catch (err) {
      setError('Failed to save class');
      toast({
        title: 'Error',
        description: 'Failed to save class. Please try again.',
        variant: 'destructive',
      });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      course_id: cls.course_id,
      mentor_id: cls.mentor_id,
      name: cls.name,
      room_number: cls.room_number,
      day_of_week: cls.day_of_week,
      schedule_time: cls.schedule_time,
    });
    setConflicts(null);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await classApi.delete(id);
      toast({
        title: 'Class Deleted',
        description: 'The class has been deleted successfully.',
      });
      fetchData();
    } catch (err) {
      setError('Failed to delete class');
      toast({
        title: 'Error',
        description: 'Failed to delete class. Please try again.',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
    setConflicts(null);
    setFormData({
      course_id: '',
      name: '',
      room_number: '',
      day_of_week: 'monday',
      schedule_time: '09:00',
    });
  };

  // Navigate to conflicting class
  const navigateToConflict = (conflict: ClassConflict) => {
    setHighlightedClassId(conflict.id);
    setShowForm(false);

    // Apply filter to show the conflicting class
    setFilterDay(conflict.day_of_week);
    setFilterRoom(conflict.room_number);

    // Scroll to the class after a short delay
    setTimeout(() => {
      const element = document.getElementById(`class-${conflict.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Remove highlight after 3 seconds
    setTimeout(() => setHighlightedClassId(null), 3000);
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
      {/* Header */}
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>

              <select
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
              >
                <option value="">All Days</option>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day} className="capitalize">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </select>

              <select
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>

              <select
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
              >
                <option value="">All Rooms</option>
                {uniqueRooms.map((room) => (
                  <option key={room} value={room}>Room {room}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Sort buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center">Sort by:</span>
              {(['day_of_week', 'schedule_time', 'room_number', 'course', 'name'] as SortField[]).map((field) => (
                <Button
                  key={field}
                  variant={sortConfig.field === field ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleSort(field)}
                  className="capitalize"
                >
                  {field.replace('_', ' ')}
                  {getSortIcon(field)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <Label htmlFor="course">Course *</Label>
                  <select
                    id="course"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value, mentor_id: undefined })}
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
                  <Label htmlFor="mentor">Mentor</Label>
                  <select
                    id="mentor"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.mentor_id || ''}
                    onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value || undefined })}
                    disabled={!formData.course_id || availableMentors.length === 0}
                  >
                    <option value="">Select a mentor (optional)</option>
                    {availableMentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.full_name}
                      </option>
                    ))}
                  </select>
                  {formData.course_id && availableMentors.length === 0 && (
                    <p className="text-xs text-yellow-600">No mentors assigned to this course. Assign mentors in the Courses page first.</p>
                  )}
                  {!formData.course_id && (
                    <p className="text-xs text-muted-foreground">Select a course first to see available mentors</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="day">Day of Week *</Label>
                  <select
                    id="day"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background capitalize"
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value, room_number: '' })}
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
                  <Label htmlFor="time">Start Time *</Label>
                  <select
                    id="time"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value, room_number: '' })}
                    required
                  >
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Section A, Group 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Available Rooms *</Label>
                  <select
                    id="room"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    required
                  >
                    <option value="">Select an available room</option>
                    {availableRooms.map((room) => (
                      <option key={room} value={room}>
                        Room {room}
                      </option>
                    ))}
                  </select>
                  {availableRooms.length === 0 && (
                    <p className="text-xs text-yellow-600">No rooms available at this time. Try a different day or time.</p>
                  )}
                  {availableRooms.length > 0 && (
                    <p className="text-xs text-muted-foreground">{availableRooms.length} room(s) available</p>
                  )}
                </div>
              </div>

              {/* Conflict Warning */}
              {isCheckingConflicts && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking for conflicts...
                </div>
              )}

              {conflicts?.has_conflicts && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                    <AlertTriangle className="h-5 w-5" />
                    Scheduling Conflicts Detected
                  </div>

                  {conflicts.room_conflicts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        Room conflicts ({conflicts.room_conflicts.length}):
                      </p>
                      {conflicts.room_conflicts.map((conflict) => (
                        <div key={conflict.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border">
                          <div className="text-sm">
                            <span className="font-medium">{conflict.name}</span>
                            <span className="text-muted-foreground"> - {conflict.course_name}</span>
                            <br />
                            <span className="text-xs text-muted-foreground capitalize">
                              {conflict.day_of_week} at {conflict.schedule_time} in Room {conflict.room_number}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateToConflict(conflict)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {conflicts.mentor_conflicts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        Mentor conflicts ({conflicts.mentor_conflicts.length}):
                      </p>
                      {conflicts.mentor_conflicts.map((conflict) => (
                        <div key={conflict.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border">
                          <div className="text-sm">
                            <span className="font-medium">{conflict.name}</span>
                            <span className="text-muted-foreground"> - {conflict.course_name}</span>
                            <br />
                            <span className="text-xs text-muted-foreground capitalize">
                              {conflict.day_of_week} at {conflict.schedule_time}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateToConflict(conflict)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!conflicts?.has_conflicts && formData.room_number && formData.day_of_week && formData.schedule_time && !isCheckingConflicts && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  No scheduling conflicts
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || conflicts?.has_conflicts}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingClass ? 'Update' : 'Create'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedAndFilteredClasses.length} of {classes.length} classes
      </div>

      {/* Classes List - Grouped by sort field */}
      {sortedAndFilteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {hasActiveFilters
              ? 'No classes match your filters. Try adjusting your search criteria.'
              : 'No classes found. Create your first class!'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedClasses.map((group) => (
            <div key={group.key} className="space-y-3">
              {/* Group Header */}
              <div className="flex items-center gap-3">
                <span className="text-xl">{getGroupIcon()}</span>
                <h3 className="text-lg font-semibold">{group.label}</h3>
                <span className="text-sm text-muted-foreground">
                  ({group.classes.length} {group.classes.length === 1 ? 'class' : 'classes'})
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Group Classes Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.classes.map((cls) => (
                  <Card
                    key={cls.id}
                    id={`class-${cls.id}`}
                    className={`transition-all duration-300 ${highlightedClassId === cls.id
                      ? 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                      : ''
                      }`}
                  >
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
                        {cls.mentor_id && getMentorName(cls.mentor_id) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{getMentorName(cls.mentor_id)}</span>
                          </div>
                        )}
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
