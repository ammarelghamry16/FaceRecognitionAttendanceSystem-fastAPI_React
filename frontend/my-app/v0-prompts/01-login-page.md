# v0 Prompt: Login Page

Create a professional login page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### Layout
- Full-page centered layout with subtle gradient background (slate-50 to slate-100)
- Card container (max-w-md) with shadow-lg and rounded-xl
- Logo/brand at top of card
- Clean, minimal design with plenty of whitespace

### Components to Use (shadcn/ui)
- Card, CardHeader, CardContent, CardFooter
- Input with icons (Mail, Lock icons from lucide-react)
- Button (primary, full-width)
- Checkbox for "Remember me"
- Alert for error messages

### Form Fields
1. **Email Input**
   - Icon: Mail (lucide-react)
   - Placeholder: "Enter your email"
   - Type: email
   - Validation: Required, valid email format

2. **Password Input**
   - Icon: Lock (lucide-react)
   - Placeholder: "Enter your password"
   - Type: password with show/hide toggle (Eye/EyeOff icons)
   - Validation: Required, min 8 characters

3. **Remember Me Checkbox**

4. **Submit Button**
   - Text: "Sign In"
   - Full width
   - Loading state with spinner

### States to Handle
1. **Default**: Empty form ready for input
2. **Validating**: Real-time validation as user types
3. **Submitting**: Button shows spinner, inputs disabled
4. **Error**: Red alert banner with error message, subtle shake animation
5. **Success**: Redirect (handled by parent)

### Visual Design
- Brand colors: Primary blue (#2563eb), clean whites
- Typography: Inter or system font
- Input focus states with ring
- Smooth transitions (150ms)
- Error states in red (destructive color)

### Additional Elements
- "Forgot password?" link (optional, can be placeholder)
- "Don't have an account? Register" link at bottom
- Subtle footer with copyright

### Code Structure
```tsx
// Expected imports
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// API integration (add as comment)
// import { authApi } from '@/services';
// const response = await authApi.login({ email, password });
```

### Accessibility
- All inputs have associated labels
- Error messages linked to inputs via aria-describedby
- Focus management after error
- Keyboard navigation works
- Color contrast meets WCAG AA

### Responsive
- Works on mobile (padding adjusts)
- Card doesn't exceed viewport on small screens

Generate a complete, production-ready React component with TypeScript types, form validation, and all states handled.
