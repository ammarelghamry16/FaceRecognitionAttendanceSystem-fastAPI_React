# v0 Prompt: Register Page

Create a professional registration page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### Layout
- Same style as login page (centered card, gradient background)
- Slightly taller card to accommodate more fields
- Progress indicator or step number (optional)

### Components to Use (shadcn/ui)
- Card, CardHeader, CardContent, CardFooter
- Input with icons
- Select dropdown for role
- Button (primary, full-width)
- Alert for errors/success
- Password strength indicator (custom)

### Form Fields
1. **Full Name**
   - Icon: User (lucide-react)
   - Placeholder: "Enter your full name"
   - Validation: Required, min 2 characters

2. **Email**
   - Icon: Mail
   - Placeholder: "Enter your email"
   - Validation: Required, valid email

3. **Password**
   - Icon: Lock
   - Show/hide toggle
   - Validation: Min 8 chars, 1 uppercase, 1 number
   - **Password strength indicator below** (weak/medium/strong with colors)

4. **Confirm Password**
   - Icon: Lock
   - Validation: Must match password

5. **Role Selector**
   - Type: Select dropdown
   - Options: Student, Mentor
   - Default: Student

6. **Student ID** (Conditional)
   - Only visible when role = "student"
   - Icon: IdCard or Hash
   - Placeholder: "Enter your student ID"
   - Validation: Required when visible

### Password Strength Indicator
```
Weak:   [████░░░░░░] Red bar, "Weak password"
Medium: [██████░░░░] Yellow bar, "Medium strength"  
Strong: [██████████] Green bar, "Strong password"
```

Criteria:
- Weak: < 8 characters
- Medium: 8+ chars but missing uppercase OR number
- Strong: 8+ chars, has uppercase, number, and special char

### States
1. **Default**: Empty form
2. **Validating**: Real-time validation with inline errors
3. **Submitting**: Loading spinner, disabled inputs
4. **Error**: Alert with API error message
5. **Success**: Success message, redirect to login

### Visual Design
- Consistent with login page
- Smooth field transitions when Student ID appears/disappears
- Clear visual hierarchy
- Inline validation errors (red text below field)

### Code Structure
```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, IdCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

// Types
interface RegisterForm {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: 'student' | 'mentor';
  student_id?: string;
}

// API integration (comment)
// import { authApi } from '@/services';
// await authApi.register(formData);
```

### Accessibility
- Labels for all inputs
- Error messages announced to screen readers
- Logical tab order
- Role selector keyboard accessible

### Responsive
- Stacks nicely on mobile
- Touch-friendly inputs

Generate a complete React component with TypeScript, form validation, password strength indicator, and conditional Student ID field.
