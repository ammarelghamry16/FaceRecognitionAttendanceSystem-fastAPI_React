# v0 Prompt: Profile/Settings Page

Create a professional profile and settings page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Profile & Settings                                      │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ┌────┐                                              │ │
│ │ │ JS │  John Smith                                  │ │
│ │ └────┘  john.smith@university.edu                   │ │
│ │         🎓 Student • ID: STU001                     │ │
│ │         Member since: January 2024                  │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────┐ │
│ │ Edit Profile        │ │ Change Password             │ │
│ │ ─────────────────── │ │ ───────────────────────────│ │
│ │ Full Name: [____]   │ │ Current Password: [____]   │ │
│ │ Email: [________]   │ │ New Password: [________]   │ │
│ │                     │ │ Confirm: [____________]    │ │
│ │ [Save Changes]      │ │ [Update Password]          │ │
│ └─────────────────────┘ └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Face Enrollment Status (Students only)              │ │
│ │ ✅ Enrolled - 5 images registered                   │ │
│ │                              [Manage Enrollment →]  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Profile Header Card
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="flex items-start gap-6">
      {/* Avatar */}
      <Avatar className="h-20 w-20">
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
          {getInitials(user.full_name)}
        </AvatarFallback>
      </Avatar>
      
      {/* Info */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold">{user.full_name}</h2>
        <p className="text-muted-foreground">{user.email}</p>
        
        <div className="flex items-center gap-4 mt-3">
          <Badge variant="secondary" className="capitalize">
            {user.role === 'student' && <GraduationCap className="h-3 w-3 mr-1" />}
            {user.role === 'mentor' && <BookOpen className="h-3 w-3 mr-1" />}
            {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
            {user.role}
          </Badge>
          
          {user.student_id && (
            <span className="text-sm text-muted-foreground">
              ID: {user.student_id}
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          <Calendar className="h-3 w-3 inline mr-1" />
          Member since {formatDate(user.created_at)}
        </p>
      </div>
      
      {/* Status indicator */}
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
        Active
      </Badge>
    </div>
  </CardContent>
</Card>
```

#### 2. Edit Profile Form
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Edit Profile</CardTitle>
    <CardDescription>Update your personal information</CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleProfileSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          value={profileForm.full_name}
          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
          placeholder="Enter your full name"
        />
        {profileErrors.full_name && (
          <p className="text-sm text-destructive">{profileErrors.full_name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={profileForm.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed. Contact admin if needed.
        </p>
      </div>
      
      <Button type="submit" disabled={isProfileSaving}>
        {isProfileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Changes
      </Button>
    </form>
  </CardContent>
</Card>
```

#### 3. Change Password Form
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Change Password</CardTitle>
    <CardDescription>Update your account password</CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handlePasswordSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current_password">Current Password</Label>
        <div className="relative">
          <Input
            id="current_password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            placeholder="Enter current password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new_password">New Password</Label>
        <div className="relative">
          <Input
            id="new_password"
            type={showNewPassword ? 'text' : 'password'}
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            placeholder="Enter new password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Password strength indicator */}
        {passwordForm.new_password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className={cn("text-xs", strengthTextColors[passwordStrength - 1])}>
              {strengthLabels[passwordStrength - 1]}
            </p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm New Password</Label>
        <Input
          id="confirm_password"
          type="password"
          value={passwordForm.confirm_password}
          onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
          placeholder="Confirm new password"
        />
        {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
          <p className="text-sm text-destructive">Passwords do not match</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={isPasswordSaving || passwordForm.new_password !== passwordForm.confirm_password}
      >
        {isPasswordSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Update Password
      </Button>
    </form>
  </CardContent>
</Card>
```

#### 4. Face Enrollment Status Card (Students Only)
```tsx
{user.role === 'student' && (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Face Enrollment</CardTitle>
      <CardDescription>
        Your face recognition enrollment status
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {enrollmentStatus?.is_enrolled ? (
            <>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700">Enrolled</p>
                <p className="text-sm text-muted-foreground">
                  {enrollmentStatus.encodings_count} face image(s) registered
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-700">Not Enrolled</p>
                <p className="text-sm text-muted-foreground">
                  Enroll your face for automatic attendance
                </p>
              </div>
            </>
          )}
        </div>
        
        <Button variant="outline" asChild>
          <Link to="/face-enrollment">
            {enrollmentStatus?.is_enrolled ? 'Manage' : 'Enroll Now'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

#### 5. Danger Zone (Optional)
```tsx
<Card className="border-destructive/50">
  <CardHeader>
    <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
    <CardDescription>
      Irreversible actions for your account
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Delete Account</p>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data
        </p>
      </div>
      <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
        Delete Account
      </Button>
    </div>
  </CardContent>
</Card>
```

### Password Strength Logic
```tsx
const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
const strengthTextColors = ['text-red-600', 'text-yellow-600', 'text-blue-600', 'text-green-600'];
const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

function calculatePasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
}
```

### API Integration
```tsx
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services';
import { useFaceEnrollment } from '@/hooks';

const { user } = useAuth();
const { enrollmentStatus, checkEnrollmentStatus } = useFaceEnrollment();

// Update profile
await authApi.updateProfile({ full_name });

// Change password
await authApi.changePassword({
  current_password,
  new_password,
});
```

### States to Handle
1. **Loading**: Skeleton for profile card
2. **Editing**: Form with current values
3. **Saving**: Loading spinner on buttons
4. **Success**: Toast notification
5. **Error**: Inline error messages

### Toast Notifications
```tsx
// Success
toast({
  title: "Profile updated",
  description: "Your profile has been updated successfully.",
});

// Password changed
toast({
  title: "Password changed",
  description: "Your password has been updated. Please use your new password next time you log in.",
});

// Error
toast({
  variant: "destructive",
  title: "Error",
  description: error.message,
});
```

### Code Structure
```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useFaceEnrollment } from '@/hooks';
import { authApi } from '@/services';
import {
  User, Mail, Lock, Eye, EyeOff, Calendar, Shield,
  GraduationCap, BookOpen, CheckCircle, AlertCircle,
  ArrowRight, Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
```

### Responsive Design
- Two columns on desktop, stacked on mobile
- Profile header stacks on mobile
- Forms are full width on mobile

Generate a complete profile/settings page with edit profile, change password, and face enrollment status sections.
