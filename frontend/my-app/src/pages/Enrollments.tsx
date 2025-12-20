/**
 * Enrollments Page - Manage student enrollments in classes
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Plus, Trash2, Users, BookOpen, Search, ChevronsUpDown, Check } from 'lucide-react';
import { classApi, enrollmentApi } from '@/services/scheduleService';
import type { Class, Enrollment } from '@/services/scheduleService';
import { authApi, type User } from '@/services/authService';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export default function Enrollments() {
    const { user } = useAuth();
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [enrollmentCount, setEnrollmentCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Student search state
    const [studentSearchOpen, setStudentSearchOpen] = useState(false);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState<User[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Debounced student search
    const searchStudents = useCallback(async (query: string) => {
        if (query.length < 2) {
            setStudentSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await authApi.searchUsers(query, 'student', 10);
            setStudentSearchResults(results);
        } catch (err) {
            console.error('Failed to search students:', err);
            setStudentSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchStudents(studentSearchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [studentSearchQuery, searchStudents]);

    // Fetch classes
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await classApi.getAll();
                setClasses(response.data || []);
            } catch (err) {
                console.error('Failed to fetch classes:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []);

    // Fetch enrollments when class is selected
    useEffect(() => {
        const fetchEnrollments = async () => {
            if (!selectedClass) {
                setEnrollments([]);
                setEnrollmentCount(0);
                return;
            }

            try {
                const [enrollmentsRes, countRes] = await Promise.all([
                    enrollmentApi.getByClass(selectedClass),
                    enrollmentApi.getClassCount(selectedClass),
                ]);
                setEnrollments(enrollmentsRes.data || []);
                setEnrollmentCount(countRes.data || 0);
            } catch (err) {
                console.error('Failed to fetch enrollments:', err);
                setEnrollments([]);
            }
        };
        fetchEnrollments();
    }, [selectedClass]);

    // Enroll student
    const handleEnroll = async () => {
        if (!selectedClass || !selectedStudent) return;

        setIsEnrolling(true);
        try {
            await enrollmentApi.enroll({
                student_id: selectedStudent.id,
                class_id: selectedClass,
            });

            // Refresh enrollments
            const [enrollmentsRes, countRes] = await Promise.all([
                enrollmentApi.getByClass(selectedClass),
                enrollmentApi.getClassCount(selectedClass),
            ]);
            setEnrollments(enrollmentsRes.data || []);
            setEnrollmentCount(countRes.data || 0);

            // Clear selection
            setSelectedStudent(null);
            setStudentSearchQuery('');
            setStudentSearchResults([]);

            toast({
                title: 'Student Enrolled',
                description: `Successfully enrolled ${selectedStudent.full_name}`,
                variant: 'success',
            });
        } catch (err) {
            toast({
                title: 'Enrollment Failed',
                description: 'Could not enroll student. They may already be enrolled.',
                variant: 'destructive',
            });
            console.error('Failed to enroll:', err);
        } finally {
            setIsEnrolling(false);
        }
    };

    // Unenroll student
    const handleUnenroll = async (enrollment: Enrollment) => {
        const studentName = enrollment.student_name || enrollment.student_readable_id || enrollment.student_id;
        if (!confirm(`Remove ${studentName} from this class?`)) return;

        try {
            await enrollmentApi.unenroll(enrollment.student_id, enrollment.class_id);

            // Refresh enrollments
            const [enrollmentsRes, countRes] = await Promise.all([
                enrollmentApi.getByClass(selectedClass),
                enrollmentApi.getClassCount(selectedClass),
            ]);
            setEnrollments(enrollmentsRes.data || []);
            setEnrollmentCount(countRes.data || 0);

            toast({
                title: 'Student Removed',
                description: `Successfully removed ${studentName}`,
            });
        } catch (err) {
            toast({
                title: 'Removal Failed',
                description: 'Could not remove student from class.',
                variant: 'destructive',
            });
            console.error('Failed to unenroll:', err);
        }
    };

    // Filter enrollments by search (name or ID)
    const filteredEnrollments = enrollments.filter((e) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            e.student_id.toLowerCase().includes(searchLower) ||
            (e.student_name && e.student_name.toLowerCase().includes(searchLower)) ||
            (e.student_readable_id && e.student_readable_id.toLowerCase().includes(searchLower))
        );
    });

    // Get selected class details
    const selectedClassDetails = classes.find((c) => c.id === selectedClass);

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                        <p className="text-muted-foreground">
                            Only administrators can manage enrollments.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                <h1 className="text-3xl font-bold">Enrollments</h1>
                <p className="text-muted-foreground">Manage student enrollments in classes</p>
            </div>

            {/* Class Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Select Class
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-full md:w-96">
                            <SelectValue placeholder="Choose a class to manage enrollments" />
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

            {selectedClass && (
                <>
                    {/* Class Info & Enroll Form */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Class Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Class Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="font-medium">{selectedClassDetails?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Schedule:</span>
                                        <span className="font-medium capitalize">
                                            {selectedClassDetails?.day_of_week} {selectedClassDetails?.schedule_time}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Room:</span>
                                        <span className="font-medium">{selectedClassDetails?.room_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Enrolled:</span>
                                        <Badge variant="secondary">{enrollmentCount} students</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enroll Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Enroll Student
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Search Student</Label>
                                        <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={studentSearchOpen}
                                                    className="w-full justify-between"
                                                >
                                                    {selectedStudent
                                                        ? `${selectedStudent.full_name} (${selectedStudent.student_id || 'No ID'})`
                                                        : "Search by name or ID..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <Command shouldFilter={false}>
                                                    <CommandInput
                                                        placeholder="Type student name or ID..."
                                                        value={studentSearchQuery}
                                                        onValueChange={setStudentSearchQuery}
                                                    />
                                                    <CommandList>
                                                        {isSearching && (
                                                            <div className="flex items-center justify-center py-4">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            </div>
                                                        )}
                                                        {!isSearching && studentSearchQuery.length >= 2 && studentSearchResults.length === 0 && (
                                                            <CommandEmpty>No students found.</CommandEmpty>
                                                        )}
                                                        {!isSearching && studentSearchQuery.length < 2 && (
                                                            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
                                                        )}
                                                        <CommandGroup>
                                                            {studentSearchResults.map((student) => (
                                                                <CommandItem
                                                                    key={student.id}
                                                                    value={student.id}
                                                                    onSelect={() => {
                                                                        setSelectedStudent(student);
                                                                        setStudentSearchOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedStudent?.id === student.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span>{student.full_name}</span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {student.student_id || student.email}
                                                                        </span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <Button
                                        onClick={handleEnroll}
                                        disabled={!selectedStudent || isEnrolling}
                                        className="w-full"
                                    >
                                        {isEnrolling ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        Enroll Student
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Enrollments List */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Enrolled Students ({enrollmentCount})
                                </CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredEnrollments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>
                                        {searchTerm
                                            ? 'No students match your search'
                                            : 'No students enrolled in this class yet'}
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Student ID</TableHead>
                                            <TableHead>Enrolled At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEnrollments.map((enrollment) => (
                                            <TableRow key={enrollment.student_id}>
                                                <TableCell className="font-medium">
                                                    {enrollment.student_name || 'Unknown'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {enrollment.student_readable_id || enrollment.student_id}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleUnenroll(enrollment)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
