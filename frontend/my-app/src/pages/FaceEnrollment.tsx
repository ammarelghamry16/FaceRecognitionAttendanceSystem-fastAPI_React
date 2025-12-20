/**
 * Face Enrollment Page - Real backend integration
 */
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CheckCircle, AlertCircle, Trash, Video, X, Loader2, Lightbulb } from 'lucide-react';
import { useFaceEnrollment } from '@/hooks/useFaceEnrollment';

export default function FaceEnrollment() {
  const { user } = useAuth();
  const {
    enrollmentStatus,
    isLoading: enrollmentLoading,
    error: enrollmentError,
    success: enrollmentSuccess,
    checkEnrollmentStatus,
    enrollFaceFromCamera,
    deleteEnrollment,
    clearMessages,
  } = useFaceEnrollment();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check enrollment status on mount
  useEffect(() => {
    if (user?.id) {
      checkEnrollmentStatus(user.id);
    }
  }, [user?.id, checkEnrollmentStatus]);

  const isEnrolled = enrollmentStatus?.is_enrolled || false;

  const [cameraError, setCameraError] = useState('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraError('');
    } catch {
      setCameraError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current || capturedImages.length >= 5) return;

    // Trigger flash effect
    const flashEl = document.querySelector('.capture-flash');
    if (flashEl) {
      flashEl.classList.add('capture-flash-active');
      setTimeout(() => flashEl.classList.remove('capture-flash-active'), 300);
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip horizontally to match mirror view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0);
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImages(prev => [...prev, dataUrl]);
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitEnrollment = async () => {
    if (capturedImages.length === 0 || !user?.id) return;
    setIsSubmitting(true);
    clearMessages();

    try {
      // Enroll each captured image
      for (const imageData of capturedImages) {
        await enrollFaceFromCamera(user.id, imageData);
      }
      setCapturedImages([]);
      stopCamera();
      // Refresh enrollment status
      await checkEnrollmentStatus(user.id);
    } catch (err) {
      console.error('Enrollment failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!user?.id) return;
    if (!confirm('Are you sure you want to delete your face enrollment?')) return;

    await deleteEnrollment(user.id);
    await checkEnrollmentStatus(user.id);
  };

  // Only students and admins can access
  if (user?.role === 'mentor') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Face enrollment is only available for students and administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Face Enrollment</h1>
        <p className="text-muted-foreground">Register your face for automatic attendance recognition</p>
      </div>

      {/* Alerts */}
      {enrollmentSuccess && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{enrollmentSuccess}</AlertDescription>
        </Alert>
      )}
      {(enrollmentError || cameraError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{enrollmentError || cameraError}</AlertDescription>
        </Alert>
      )}

      {/* Enrollment Status */}
      <Card className={isEnrolled ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Enrollment Status</CardTitle>
            {isEnrolled && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={handleDeleteEnrollment}
                disabled={enrollmentLoading}
              >
                {enrollmentLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4 mr-1" />
                )}
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEnrolled ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Enrolled</p>
                <p className="text-sm text-muted-foreground">
                  {enrollmentStatus?.encodings_count || 0} face encoding(s) registered
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">Not Enrolled</p>
                <p className="text-sm text-muted-foreground">Please capture face images below</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Capture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Capture
          </CardTitle>
          <CardDescription>Capture face images directly from your camera</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Preview */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isCameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-64 border-2 border-primary/70 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-background/90 px-3 py-1 rounded text-xs font-medium">
                      Position your face here
                    </div>
                  </div>
                </div>
                {/* Capture flash effect */}
                <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-100 capture-flash pointer-events-none" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Camera not active</p>
                <Button className="mt-4" onClick={startCamera}>
                  <Video className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>

          {/* Captured Images */}
          {capturedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Captured: {capturedImages.length}/5 images</p>
              <div className="flex gap-2">
                {capturedImages.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border">
                    <img src={img} alt={`Capture ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-0 right-0 p-0.5 bg-destructive text-white rounded-bl"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isCameraActive && (
              <>
                <Button onClick={captureImage} disabled={capturedImages.length >= 5}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture ({capturedImages.length}/5)
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  Stop Camera
                </Button>
              </>
            )}
            {capturedImages.length > 0 && (
              <Button className="ml-auto" onClick={submitEnrollment} disabled={isSubmitting || enrollmentLoading}>
                {(isSubmitting || enrollmentLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit {capturedImages.length} Image(s)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Ensure good, even lighting on your face</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Look directly at the camera</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Remove glasses if possible</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Capture from slightly different angles (3-5 images recommended)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
