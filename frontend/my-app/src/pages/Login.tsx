/**
 * Login Page - Modern Sign-In with Face Scan Visual
 * Converted from Next.js sign-in page to React (Vite)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaceScanVisual } from "@/components/FaceScanVisual";
import { Scan, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Camera, Home, X, AlertCircle, CheckCircle } from "lucide-react";

// Face login types
type FaceLoginPhase = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Initialize rememberMe based on previous preference
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_me') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");

  // Face login state
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceLoginPhase, setFaceLoginPhase] = useState<FaceLoginPhase>('idle');
  const [faceLoginError, setFaceLoginError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { login, loginWithFace, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera for face login
  const startFaceLogin = useCallback(async () => {
    setShowFaceModal(true);
    setFaceLoginPhase('scanning');
    setFaceLoginError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not found');

      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error('[FaceLogin] Camera error:', err);
      setFaceLoginError(err instanceof Error ? err.message : 'Failed to access camera');
      setFaceLoginPhase('error');
    }
  }, []);

  // Capture and submit face for login
  const captureAndLogin = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setFaceLoginPhase('processing');

    try {
      // Capture frame
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      const ctx = captureCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas error');

      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);

      const imageData = captureCanvas.toDataURL('image/jpeg', 0.92);

      // Stop camera while processing
      stopCamera();

      // Call face login via AuthContext (updates user state properly)
      await loginWithFace(imageData);

      setFaceLoginPhase('success');
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Navigate after brief delay
      setTimeout(() => {
        setShowFaceModal(false);
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      console.error('[FaceLogin] Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Face not recognized';
      setFaceLoginError(errorMessage);
      setFaceLoginPhase('error');
      toast({
        title: "Face Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [stopCamera, loginWithFace, toast, navigate]);

  // Close face modal
  const closeFaceModal = useCallback(() => {
    stopCamera();
    setShowFaceModal(false);
    setFaceLoginPhase('idle');
    setFaceLoginError("");
  }, [stopCamera]);

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sign-in page theme (violet/cyan dark theme)
  const signInThemeStyles = {
    "--background": "oklch(0.07 0.01 280)",
    "--foreground": "oklch(0.98 0 0)",
    "--card": "oklch(0.12 0.015 280)",
    "--card-foreground": "oklch(0.98 0 0)",
    "--popover": "oklch(0.12 0.015 280)",
    "--popover-foreground": "oklch(0.98 0 0)",
    "--primary": "oklch(0.628 0.2 280)",
    "--primary-foreground": "oklch(0.98 0 0)",
    "--secondary": "oklch(0.18 0.02 280)",
    "--secondary-foreground": "oklch(0.98 0 0)",
    "--muted": "oklch(0.18 0.02 280)",
    "--muted-foreground": "oklch(0.6 0 0)",
    "--accent": "oklch(0.75 0.15 195)",
    "--accent-foreground": "oklch(0.07 0.01 280)",
    "--destructive": "oklch(0.577 0.245 27.325)",
    "--destructive-foreground": "oklch(0.98 0 0)",
    "--border": "oklch(0.25 0.02 280)",
    "--input": "oklch(0.18 0.02 280)",
    "--ring": "oklch(0.628 0.2 280)",
  } as React.CSSProperties;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email or Student ID is required";
    } else if (!email.includes("@") && !/^[A-Z0-9]+$/i.test(email)) {
      newErrors.email = "Please enter a valid email or student ID";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login({ email, password, rememberMe });
      navigate("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setFormError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={signInThemeStyles}>
      {/* Left Visual Panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-background overflow-hidden">
        <FaceScanVisual />
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="space-y-4 text-center pb-2">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/25">
                  <Scan className="w-7 h-7 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold text-foreground">AttendanceAI</span>
              </div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
              <CardDescription className="text-muted-foreground">Sign in to your account to continue</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Form Error */}
            {formError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email or Student ID
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your email or student ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${errors.email ? "border-destructive animate-shake" : ""}`}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${errors.password ? "border-destructive animate-shake" : ""}`}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Link to="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Alternative Sign-In Options */}
            <div className="space-y-3">
              {/* Face Recognition Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary transition-all bg-transparent"
                onClick={startFaceLogin}
              >
                <Camera className="w-4 h-4 mr-2 text-primary" />
                Sign in with Face Recognition
              </Button>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary transition-all bg-transparent"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary transition-all bg-transparent"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                  </svg>
                  Microsoft
                </Button>
              </div>
            </div>

            {/* Footer Links */}
            <div className="space-y-3 pt-2">
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <span className="text-primary">
                  Contact your administrator
                </span>
              </p>
              <div className="flex justify-center">
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Home className="w-3.5 h-3.5" />
                  Back to home
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Face Login Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 bg-card rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Face Recognition Login</h3>
              </div>
              <button
                onClick={closeFaceModal}
                className="p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Camera View */}
            <div className="relative bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${faceLoginPhase !== 'scanning' ? 'hidden' : ''}`}
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Face guide oval */}
              {faceLoginPhase === 'scanning' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 rounded-[50%] border-4 border-primary/70" />
                </div>
              )}

              {/* Processing state */}
              {faceLoginPhase === 'processing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                  <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                  <p className="text-lg">Recognizing face...</p>
                </div>
              )}

              {/* Success state */}
              {faceLoginPhase === 'success' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/90 text-white">
                  <CheckCircle className="w-16 h-16 mb-4 text-green-400" />
                  <p className="text-xl font-semibold">Login Successful!</p>
                  <p className="text-sm text-green-200 mt-2">Redirecting to dashboard...</p>
                </div>
              )}

              {/* Error state */}
              {faceLoginPhase === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 text-white p-6">
                  <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
                  <p className="text-xl font-semibold mb-2">Recognition Failed</p>
                  <p className="text-sm text-red-200 text-center">{faceLoginError}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border space-y-3">
              {faceLoginPhase === 'scanning' && (
                <>
                  <p className="text-sm text-center text-muted-foreground">
                    Position your face in the oval and click capture
                  </p>
                  <Button onClick={captureAndLogin} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Capture & Login
                  </Button>
                </>
              )}
              {faceLoginPhase === 'error' && (
                <div className="flex gap-3">
                  <Button onClick={closeFaceModal} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={startFaceLogin} className="flex-1">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
