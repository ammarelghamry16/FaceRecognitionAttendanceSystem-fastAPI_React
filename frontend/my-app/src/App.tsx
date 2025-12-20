/**
 * Main App Component with Router
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Layout } from '@/components/layout';
import { Toaster } from '@/components/ui/toaster';
import {
  Landing,
  Login,
  Register,
  Dashboard,
  Courses,
  Classes,
  Schedule,
  Notifications,
  Attendance,
  FaceEnrollment,
  Profile,
  Enrollments,
} from '@/pages';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes - wrapped in Layout */}
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/classes" element={<Classes />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/face-enrollment" element={<FaceEnrollment />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/enrollments" element={<Enrollments />} />
              </Route>

              {/* 404 - Redirect to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
