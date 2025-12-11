# v0 Prompt: Courses Management Page

Create a professional courses management page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components. This page is for Admin users only.

## Design Requirements

### Layout
- Page header with title and "Add Course" button
- Search and filter bar
- Data table with courses
- Add/Edit modal dialog
- Delete confirmation dialog

### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│ Courses                              [+ Add Course]     │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search courses...                                    │
├─────────────────────────────────────────────────────────┤
│ Code    │ Name              │ Description │ Classes │ ⋮ │
│─────────┼───────────────────┼─────────────┼─────────┼───│
│ CS101   │ Intro to Prog...  │ Basic prog..│ 3       │ ⋮ │
│ MATH201 │ Calculus II       │ Advanced... │ 2       │ ⋮ │
│ PHY101  │ Physics I         │ Mechanics...│ 4       │ ⋮ │
├─────────────────────────────────────────────────────────┤
│ Showing 1-10 of 25                    [< 1 2 3 4 5 >]   │
└─────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Page Header
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold">Courses</h1>
    <p className="text-muted-foreground">Manage your institution's courses</p>
  </div>
  <Button onClick={() => setIsAddDialogOpen(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Add Course
  </Button>
</div>
```

#### 2. Search Bar
- Input with search icon
- Debounced search (300ms)
- Clear button when has value

#### 3. Data Table
Using shadcn/ui Table component:

| Column | Width | Sortable | Content |
|--------|-------|----------|---------|
| Code | 120px | Yes | Course code (bold, monospace) |
| Name | 200px | Yes | Course name |
| Description | flex | No | Truncated to 50 chars with tooltip |
| Classes | 80px | Yes | Number badge |
| Actions | 80px | No | Dropdown menu |

Actions dropdown:
- Edit (Pencil icon)
- View Classes (ExternalLink icon)
- Delete (Trash icon, red)

#### 4. Add/Edit Course Dialog
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>{isEdit ? 'Edit Course' : 'Add New Course'}</DialogTitle>
      <DialogDescription>
        {isEdit ? 'Update course details' : 'Create a new course for your institution'}
      </DialogDescription>
    </DialogHeader>
    
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Code field - disabled if editing */}
      <div className="space-y-2">
        <Label htmlFor="code">Course Code</Label>
        <Input 
          id="code"
          placeholder="e.g., CS101"
          disabled={isEdit}
          className="uppercase"
        />
        <p className="text-xs text-muted-foreground">
          Unique identifier for the course
        </p>
      </div>
      
      {/* Name field */}
      <div className="space-y-2">
        <Label htmlFor="name">Course Name</Label>
        <Input id="name" placeholder="e.g., Introduction to Programming" />
      </div>
      
      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Brief description of the course..."
          rows={3}
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Course'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

#### 5. Delete Confirmation Dialog
```tsx
<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Course</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{courseToDelete?.name}"? 
        This will also delete all associated classes and cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 6. Empty State
When no courses exist:
```tsx
<div className="flex flex-col items-center justify-center py-12">
  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-medium">No courses yet</h3>
  <p className="text-muted-foreground mb-4">
    Get started by creating your first course
  </p>
  <Button onClick={() => setIsAddDialogOpen(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Add Course
  </Button>
</div>
```

#### 7. Loading State
- Skeleton rows in table (5 rows)
- Disabled search input

### States to Handle
1. **Loading**: Skeleton table
2. **Empty**: Empty state with CTA
3. **Loaded**: Full table with data
4. **Searching**: Filtered results
5. **Adding**: Dialog open, form submitting
6. **Editing**: Dialog open with data, form submitting
7. **Deleting**: Confirmation dialog, delete in progress
8. **Error**: Toast notification for errors

### Code Structure
```tsx
import { useState, useEffect } from 'react';
import { 
  Plus, Search, Pencil, Trash, ExternalLink, 
  MoreHorizontal, Loader2, BookOpen 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

// Types
interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  classCount?: number;
  created_at: string;
}

// API integration (comments)
// import { courseApi } from '@/services';
// const { data } = await courseApi.getAll();
// await courseApi.create({ code, name, description });
// await courseApi.update(id, { name, description });
// await courseApi.delete(id);
```

### Responsive Design
- Table scrolls horizontally on mobile
- Dialog is full-width on mobile
- Search bar full width on mobile

### Validation
- Code: Required, 3-10 chars, uppercase, alphanumeric
- Name: Required, 3-100 chars
- Description: Optional, max 500 chars

### Toast Notifications
- Success: "Course created successfully"
- Success: "Course updated successfully"
- Success: "Course deleted successfully"
- Error: "Failed to create course: {error}"

Generate a complete, production-ready courses management page with all CRUD operations, search, and proper state handling.
