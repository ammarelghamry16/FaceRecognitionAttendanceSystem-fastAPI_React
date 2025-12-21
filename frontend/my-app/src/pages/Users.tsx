/**
 * Users Management Page - Admin only CRUD for users
 */
import { useState, useEffect, useMemo } from 'react';
import { authApi } from '@/services/authService';
import type { User, RegisterData } from '@/services/authService';
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
} from 'lucide-react';

type UserRole = 'student' | 'mentor' | 'admin';

interface UserFormData {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    student_id: string;
    group: string;
}

const initialFormData: UserFormData = {
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    student_id: '',
    group: '',
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>(initialFormData);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [isSaving, setIsSaving] = useState(false);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            setError('');
            const role = roleFilter !== 'all' ? roleFilter : undefined;
            const data = await authApi.getAllUsers(0, 100, role);
            setUsers(data);
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

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

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

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
                    updateData.group = formData.group || undefined;
                }
                await authApi.updateUser(editingUser.id, updateData);
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
                    if (formData.group) {
                        registerData.group = formData.group;
                    }
                }
                await authApi.register(registerData);
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
        setFormData({
            email: user.email,
            password: '',
            full_name: user.full_name,
            role: user.role,
            student_id: user.student_id || '',
            group: user.group || '',
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
                                        placeholder="Min 8 chars, uppercase, lowercase, digit"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role *</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
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
                                            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                            placeholder="e.g., STU001"
                                        />
                                    </div>
                                )}
                            </div>

                            {formData.role === 'student' && (
                                <div className="space-y-2">
                                    <Label htmlFor="group">Group</Label>
                                    <Input
                                        id="group"
                                        value={formData.group}
                                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                        placeholder="e.g., Group A, CS-101"
                                    />
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
                                                    <p className="text-sm text-muted-foreground">
                                                        Group: {user.group}
                                                    </p>
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
