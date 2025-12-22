/**
 * Users Management Page - Admin only CRUD for users
 */
import { useState, useEffect, useMemo } from 'react';
import { authApi } from '@/services/authService';
import { courseApi } from '@/services/scheduleService';
import type { User, RegisterData } from '@/services/authService';
import type { Course } from '@/services/scheduleService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Pencil,
    Loader2,
    Search,
    UserCheck,
    UserX,
    X,
    GraduationCap,
    Shield,
    Users as UsersIcon,
    BookOpen,
} from 'lucide-react';

type UserRole = 'student' | 'mentor' | 'admin';

interface UserFormData {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    student_id: string;
    major: string;
    group: string;
    course_ids: string[];
}

const initialFormData: UserFormData = {
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    student_id: '',
    major: '',
    group: '',
    course_ids: [],
};

// Majors and their groups
const majorGroups: Record<string, string[]> = {
    'Computer Science': ['CS-101', 'CS-102', 'CS-103', 'CS-104'],
    'Information Technology': ['IT-101', 'IT-102', 'IT-103'],
    'Software Engineering': ['SE-101', 'SE-102'],
    'Data Science': ['DS-101', 'DS-102'],
    'Cybersecurity': ['CY-101', 'CY-102'],
    'Artificial Intelligence': ['AI-101', 'AI-102'],
};

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
    student: GraduationCap,
    mentor: UsersIcon,
    admin: Shield,
};

const roleColors: Record<UserRole, string> = {
    student: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    mentor: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    admin: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function Users() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>(initialFormData);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [isSaving, setIsSaving] = useState(false);

    // Generate next student ID based on existing IDs
    const generateNextStudentId = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const yearPrefix = `${currentYear}/`;
        
        // Find all student IDs that match the current year format
        const currentYearIds = users
            .filter(u => u.role === 'student' && u.student_id?.startsWith(yearPrefix))
            .map(u => {
                const numPart = u.student_id?.split('/')[1];
                return numPart ? parseInt(numPart, 10) : 0;
            })
            .filter(n => !isNaN(n));
        
        // Get the max number and add 1
        const maxNum = currentYearIds.length > 0 ? Math.max(...currentYearIds) : 0;
        const nextNum = maxNum + 1;
        
        // Format with leading zeros (e.g., 00001, 00012, 00123)
        return `${yearPrefix}${nextNum.toString().padStart(5, '0')}`;
    }, [users]);

    // Fetch users and courses
    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            setError('');
            const role = roleFilter !== 'all' ? roleFilter : undefined;
            const [usersData, coursesRes] = await Promise.all([
                authApi.getAllUsers(0, 100, role),
                courseApi.getAll(),
            ]);
            setUsers(usersData);
            setCourses(coursesRes.data);
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Get courses taught by a mentor
    const getMentorCourses = (mentorId: string): Course[] => {
        return courses.filter(course => course.mentor_ids?.includes(mentorId));
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    // Auto-fill student ID when opening form for new student
    useEffect(() => {
        if (showForm && !editingUser && formData.role === 'student' && !formData.student_id) {
            setFormData(prev => ({ ...prev, student_id: generateNextStudentId }));
        }
    }, [showForm, editingUser, formData.role, generateNextStudentId]);

    // Filter users by search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(
            (user) =>
                user.full_name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                (user.student_id && user.student_id.toLowerCase().includes(query))
        );
    }, [users, searchQuery]);

    // Validate password
    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/\d/.test(password)) {
            return 'Password must contain at least one digit';
        }
        return null;
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        // Validate password for new users
        if (!editingUser) {
            const passwordError = validatePassword(formData.password);
            if (passwordError) {
                setError(passwordError);
                setIsSaving(false);
                return;
            }
        }

        try {
            if (editingUser) {
                // Update existing user
                const updateData: Partial<User> = {
                    full_name: formData.full_name,
                    role: formData.role,
                };
                if (formData.role === 'student') {
                    if (formData.student_id) {
                        updateData.student_id = formData.student_id;
                    }
                    // Combine major and group
                    if (formData.major && formData.group) {
                        updateData.group = `${formData.major} - ${formData.group}`;
                    } else if (formData.major) {
                        updateData.group = formData.major;
                    }
                }
                await authApi.updateUser(editingUser.id, updateData);
                
                // If mentor, update course assignments
                if (formData.role === 'mentor') {
                    const currentCourseIds = courses
                        .filter(c => c.mentor_ids?.includes(editingUser.id))
                        .map(c => c.id);
                    
                    // Remove from courses no longer selected
                    for (const courseId of currentCourseIds) {
                        if (!formData.course_ids.includes(courseId)) {
                            try {
                                await courseApi.removeMentor(courseId, editingUser.id);
                            } catch (err) {
                                console.error(`Failed to remove mentor from course ${courseId}:`, err);
                            }
                        }
                    }
                    
                    // Add to newly selected courses
                    for (const courseId of formData.course_ids) {
                        if (!currentCourseIds.includes(courseId)) {
                            try {
                                await courseApi.assignMentor(courseId, editingUser.id);
                            } catch (err) {
                                console.error(`Failed to assign mentor to course ${courseId}:`, err);
                            }
                        }
                    }
                }
                
                toast({
                    title: 'User Updated',
                    description: `${formData.full_name} has been updated successfully.`,
                });
            } else {
                // Create new user
                const registerData: RegisterData = {
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    role: formData.role,
                };
                if (formData.role === 'student') {
                    if (formData.student_id) {
                        registerData.student_id = formData.student_id;
                    }
                    // Combine major and group
                    if (formData.major && formData.group) {
                        registerData.group = `${formData.major} - ${formData.group}`;
                    } else if (formData.major) {
                        registerData.group = formData.major;
                    }
                }
                await authApi.register(registerData);
                
                // If mentor, assign courses after creation
                if (formData.role === 'mentor' && formData.course_ids.length > 0) {
                    // Get the newly created user
                    const allUsers = await authApi.getAllUsers(0, 100, 'mentor');
                    const newMentor = allUsers.find(u => u.email === formData.email);
                    if (newMentor) {
                        // Assign mentor to selected courses
                        for (const courseId of formData.course_ids) {
                            try {
                                await courseApi.assignMentor(courseId, newMentor.id);
                            } catch (err) {
                                console.error(`Failed to assign mentor to course ${courseId}:`, err);
                            }
                        }
                    }
                }
                
                toast({
                    title: 'User Created',
                    description: `${formData.full_name} has been created successfully.`,
                });
            }
            handleCancel();
            fetchUsers();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save user';
            setError(message);
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Handle edit
    const handleEdit = (user: User) => {
        setEditingUser(user);
        // Try to extract major from group (format: "Major - Group")
        let major = '';
        let group = user.group || '';
        if (user.group && user.group.includes(' - ')) {
            const parts = user.group.split(' - ');
            major = parts[0];
            group = parts[1] || '';
        }
        // Get mentor's assigned courses
        const mentorCourseIds = user.role === 'mentor' 
            ? courses.filter(c => c.mentor_ids?.includes(user.id)).map(c => c.id)
            : [];
        setFormData({
            email: user.email,
            password: '',
            full_name: user.full_name,
            role: user.role,
            student_id: user.student_id || '',
            major: major,
            group: group,
            course_ids: mentorCourseIds,
        });
        setShowForm(true);
    };

    // Handle activate/deactivate
    const handleToggleActive = async (user: User) => {
        try {
            if (user.is_active) {
                await authApi.deactivateUser(user.id);
                toast({
                    title: 'User Deactivated',
                    description: `${user.full_name} has been deactivated.`,
                });
            } else {
                await authApi.activateUser(user.id);
                toast({
                    title: 'User Activated',
                    description: `${user.full_name} has been activated.`,
                });
            }
            fetchUsers();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update user status';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        }
    };

    // Cancel form
    const handleCancel = () => {
        setShowForm(false);
        setEditingUser(null);
        setFormData(initialFormData);
        setError('');
    };

    if (isLoading && users.length === 0) {
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
                    <h1 className="text-3xl font-bold">Users</h1>
                    <p className="text-muted-foreground">Manage system users</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            {error && !showForm && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
                    {error}
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or student ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                        <SelectItem value="mentor">Mentors</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* User Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{editingUser ? 'Edit User' : 'New User'}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name *</Label>
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        required
                                        disabled={!!editingUser}
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="e.g., Password1"
                                        required
                                        minLength={8}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Min 8 chars with uppercase, lowercase, and digit
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role *</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value: UserRole) => {
                                            const newData = { ...formData, role: value };
                                            // Auto-fill student ID when switching to student role
                                            if (value === 'student' && !editingUser && !formData.student_id) {
                                                newData.student_id = generateNextStudentId;
                                            }
                                            setFormData(newData);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="mentor">Mentor</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.role === 'student' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="student_id">Student ID</Label>
                                        <Input
                                            id="student_id"
                                            value={formData.student_id}
                                            readOnly
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Auto-generated (YEAR/NUMBER)
                                        </p>
                                    </div>
                                )}
                            </div>

                            {formData.role === 'student' && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="major">Major</Label>
                                        <Select
                                            value={formData.major}
                                            onValueChange={(value) => {
                                                setFormData({ ...formData, major: value, group: '' });
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select major" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(majorGroups).map((major) => (
                                                    <SelectItem key={major} value={major}>
                                                        {major}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="group">Group</Label>
                                        <Select
                                            value={formData.group}
                                            onValueChange={(value) => setFormData({ ...formData, group: value })}
                                            disabled={!formData.major}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={formData.major ? "Select group" : "Select major first"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formData.major && majorGroups[formData.major]?.map((group) => (
                                                    <SelectItem key={group} value={group}>
                                                        {group}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {formData.role === 'mentor' && (
                                <div className="space-y-2">
                                    <Label>Courses to Teach</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Select courses this mentor will teach
                                    </p>
                                    {courses.length === 0 ? (
                                        <p className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md">
                                            No courses available. Create courses first.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {courses.map((course) => {
                                                const isSelected = formData.course_ids.includes(course.id);
                                                return (
                                                    <button
                                                        key={course.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setFormData({
                                                                    ...formData,
                                                                    course_ids: formData.course_ids.filter(id => id !== course.id)
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    course_ids: [...formData.course_ids, course.id]
                                                                });
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${isSelected
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-background hover:bg-accent border-input'
                                                            }`}
                                                    >
                                                        {isSelected ? (
                                                            <X className="h-4 w-4" />
                                                        ) : (
                                                            <BookOpen className="h-4 w-4" />
                                                        )}
                                                        <span>{course.code} - {course.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {formData.course_ids.length > 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {formData.course_ids.length} course(s) selected
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    {editingUser ? 'Update' : 'Create'}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Users List */}
            <div className="grid gap-4">
                {filteredUsers.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            {searchQuery ? 'No users match your search.' : 'No users found.'}
                        </CardContent>
                    </Card>
                ) : (
                    filteredUsers.map((user) => {
                        const RoleIcon = roleIcons[user.role];
                        return (
                            <Card key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${roleColors[user.role]}`}>
                                                <RoleIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{user.full_name}</span>
                                                    <Badge variant="outline" className={roleColors[user.role]}>
                                                        {user.role}
                                                    </Badge>
                                                    {!user.is_active && (
                                                        <Badge variant="secondary">Inactive</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                                {user.role === 'student' && user.student_id && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Student ID: {user.student_id}
                                                    </p>
                                                )}
                                                {user.role === 'student' && user.group && (
                                                    <>
                                                        {user.group.includes(' - ') ? (
                                                            <>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Major: {user.group.split(' - ')[0]}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Group: {user.group.split(' - ')[1]}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">
                                                                Major: {user.group}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                                {user.role === 'mentor' && (
                                                    <>
                                                        {(() => {
                                                            const mentorCourses = getMentorCourses(user.id);
                                                            return (
                                                                <>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Courses: {mentorCourses.length}
                                                                    </p>
                                                                    {mentorCourses.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {mentorCourses.map(course => (
                                                                                <span
                                                                                    key={course.id}
                                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                                                                >
                                                                                    {course.code}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(user)}
                                                title="Edit user"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleToggleActive(user)}
                                                title={user.is_active ? 'Deactivate user' : 'Activate user'}
                                            >
                                                {user.is_active ? (
                                                    <UserX className="h-4 w-4 text-destructive" />
                                                ) : (
                                                    <UserCheck className="h-4 w-4 text-green-600" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${roleColors.student}`}>
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {users.filter((u) => u.role === 'student').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${roleColors.mentor}`}>
                                <UsersIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {users.filter((u) => u.role === 'mentor').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Mentors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${roleColors.admin}`}>
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {users.filter((u) => u.role === 'admin').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Admins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
