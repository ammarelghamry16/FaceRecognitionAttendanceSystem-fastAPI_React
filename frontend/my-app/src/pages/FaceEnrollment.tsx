/**
 * Face Enrollment Page - iPhone-style face enrollment with visual feedback
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Camera, CheckCircle, AlertCircle, Trash, Video, X, Loader2, Lightbulb, Sparkles } from 'lucide-react';
import { useFaceEnrollment } from '@/hooks/useFaceEnrollment';

type FacePosition = 'no_face' | 'too_far' | 'too_close' | 'off_center' | 'good';

interface FaceDetectionResult {
  position: FacePosition;
  message: string;
  faceBox?: { x: number; y: number; width: number; height: number };
}

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
  const [cameraError, setCameraError] = useState('');

  // Face detection state
  const [facePosition, setFacePosition] = useState<FacePosition>('no_face');
  const [positionMessage, setPositionMessage] = useState('Position your face in the oval');
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const goodPositionStartRef = useRef<number | null>(null);

  const AUTO_CAPTURE_DELAY = 1500; // 1.5 seconds of good position before capture
  const MAX_CAPTURES = 5;

  // Check enrollment status on mount
  useEffect(() => {
    if (user?.id) {
      checkEnrollmentStatus(user.id);
    }
  }, [user?.id, checkEnrollmentStatus]);

  const isEnrolled = enrollmentStatus?.is_enrolled || false;

  // Simple face detection using canvas analysis
  const detectFace = useCallback((): FaceDetectionResult => {
    if (!videoRef.current || !canvasRef.current) {
      return { position: 'no_face', message: 'Camera not ready' };
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { position: 'no_face', message: 'Canvas not ready' };

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current frame
    ctx.drawImage(video, 0, 0);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple skin tone detection to find face region
    const skinPixels: { x: number; y: number }[] = [];

    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Simple skin tone detection (works for various skin tones)
        if (r > 60 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15 &&
          r - b > 15) {
          skinPixels.push({ x, y });
        }
      }
    }

    if (skinPixels.length < 100) {
      return { position: 'no_face', message: 'No face detected - look at the camera' };
    }

    // Calculate bounding box of skin pixels
    const xs = skinPixels.map(p => p.x);
    const ys = skinPixels.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const faceCenterX = minX + faceWidth / 2;
    const faceCenterY = minY + faceHeight / 2;

    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    // Calculate ideal face size (should be about 30-50% of frame width)
    const idealFaceWidth = canvas.width * 0.35;
    const idealFaceHeight = canvas.height * 0.45;

    const faceBox = { x: minX, y: minY, width: faceWidth, height: faceHeight };

    // Check face size
    if (faceWidth < idealFaceWidth * 0.6 || faceHeight < idealFaceHeight * 0.6) {
      return { position: 'too_far', message: 'Move closer to the camera', faceBox };
    }

    if (faceWidth > idealFaceWidth * 1.5 || faceHeight > idealFaceHeight * 1.5) {
      return { position: 'too_close', message: 'Move back from the camera', faceBox };
    }

    // Check face position (center)
    const xOffset = Math.abs(faceCenterX - canvasCenterX) / canvas.width;
    const yOffset = Math.abs(faceCenterY - canvasCenterY) / canvas.height;

    if (xOffset > 0.15 || yOffset > 0.15) {
      const direction = [];
      if (faceCenterX < canvasCenterX - canvas.width * 0.1) direction.push('right');
      if (faceCenterX > canvasCenterX + canvas.width * 0.1) direction.push('left');
      if (faceCenterY < canvasCenterY - canvas.height * 0.1) direction.push('down');
      if (faceCenterY > canvasCenterY + canvas.height * 0.1) direction.push('up');
      return {
        position: 'off_center',
        message: `Move ${direction.join(' and ')} to center your face`,
        faceBox
      };
    }

    return { position: 'good', message: 'Perfect! Hold still...', faceBox };
  }, []);

  // Run face detection loop
  useEffect(() => {
    if (!isCameraActive) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    detectionIntervalRef.current = window.setInterval(() => {
      const result = detectFace();
      setFacePosition(result.position);
      setPositionMessage(result.message);

      // Handle auto-capture logic
      if (result.position === 'good' && capturedImages.length < MAX_CAPTURES) {
        if (!goodPositionStartRef.current) {
          goodPositionStartRef.current = Date.now();
          setIsAutoCapturing(true);
        }

        const elapsed = Date.now() - goodPositionStartRef.current;
        setAutoCaptureProgress((elapsed / AUTO_CAPTURE_DELAY) * 100);

        if (elapsed >= AUTO_CAPTURE_DELAY) {
          // Auto-capture
          captureImage();
          goodPositionStartRef.current = null;
          setAutoCaptureProgress(0);
          setIsAutoCapturing(false);
        }
      } else {
        goodPositionStartRef.current = null;
        setAutoCaptureProgress(0);
        setIsAutoCapturing(false);
      }
    }, 100);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isCameraActive, detectFace, capturedImages.length]);

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
      setFacePosition('no_face');
      setPositionMessage('Position your face in the oval');
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
    goodPositionStartRef.current = null;
    setAutoCaptureProgress(0);
    setIsAutoCapturing(false);
  };

  const captureImage = useCallback(() => {
    if (!videoRef.current || capturedImages.length >= MAX_CAPTURES) return;

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
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0);
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImages(prev => [...prev, dataUrl]);

    // Show brief success feedback
    setShowSuccessAnimation(true);
    setTimeout(() => setShowSuccessAnimation(false), 500);
  }, [capturedImages.length]);

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitEnrollment = async () => {
    if (capturedImages.length === 0 || !user?.id) return;
    setIsSubmitting(true);
    clearMessages();

    try {
      for (const imageData of capturedImages) {
        await enrollFaceFromCamera(user.id, imageData);
      }
      setCapturedImages([]);
      stopCamera();
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

  // Get oval color based on face position
  const getOvalColor = () => {
    switch (facePosition) {
      case 'good': return 'border-green-500 shadow-green-500/50';
      case 'off_center': return 'border-yellow-500 shadow-yellow-500/50';
      case 'too_far':
      case 'too_close': return 'border-orange-500 shadow-orange-500/50';
      default: return 'border-red-500 shadow-red-500/50';
    }
  };

  const getStatusBgColor = () => {
    switch (facePosition) {
      case 'good': return 'bg-green-500/90';
      case 'off_center': return 'bg-yellow-500/90';
      case 'too_far':
      case 'too_close': return 'bg-orange-500/90';
      default: return 'bg-red-500/90';
    }
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

      {/* Camera Capture - iPhone Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Face Capture
          </CardTitle>
          <CardDescription>
            Position your face in the oval - images capture automatically when aligned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress indicator */}
          {isCameraActive && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Capture Progress</span>
                <span className="text-muted-foreground">{capturedImages.length}/{MAX_CAPTURES} images</span>
              </div>
              <Progress value={(capturedImages.length / MAX_CAPTURES) * 100} className="h-2" />
            </div>
          )}

          {/* Camera Preview */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {/* Hidden canvas for face detection */}
            <canvas ref={canvasRef} className="hidden" />

            {isCameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />

                {/* Face guide overlay with dynamic color */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`relative w-48 h-64 border-4 rounded-[50%] transition-all duration-300 shadow-lg ${getOvalColor()}`}>
                    {/* Auto-capture progress ring */}
                    {isAutoCapturing && (
                      <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]" viewBox="0 0 100 130">
                        <ellipse
                          cx="50"
                          cy="65"
                          rx="48"
                          ry="62"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${autoCaptureProgress * 3.5} 350`}
                          className="text-green-400 transition-all"
                          transform="rotate(-90 50 65)"
                        />
                      </svg>
                    )}

                    {/* Success checkmark animation */}
                    {showSuccessAnimation && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 rounded-[50%] animate-pulse">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* Dark overlay outside oval */}
                  <div className="absolute inset-0 bg-black/40" style={{
                    maskImage: 'radial-gradient(ellipse 96px 128px at center, transparent 100%, black 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 96px 128px at center, transparent 100%, black 100%)',
                  }} />
                </div>

                {/* Position feedback message */}
                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-medium transition-colors ${getStatusBgColor()}`}>
                  {positionMessage}
                </div>

                {/* Capture flash effect */}
                <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-100 capture-flash pointer-events-none" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Camera not active</p>
                <Button size="lg" onClick={startCamera}>
                  <Video className="h-5 w-5 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>

          {/* Captured Images */}
          {capturedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-500" />
                Captured Images
              </p>
              <div className="flex gap-2 flex-wrap">
                {capturedImages.map((img, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border-2 border-green-500/50 shadow-sm">
                    <img src={img} alt={`Capture ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-0 right-0 p-1 bg-destructive text-white rounded-bl hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                      #{i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isCameraActive && (
              <>
                <Button
                  variant="outline"
                  onClick={captureImage}
                  disabled={capturedImages.length >= MAX_CAPTURES}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Manual Capture
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  Stop Camera
                </Button>
              </>
            )}
            {capturedImages.length > 0 && (
              <Button
                className="ml-auto"
                onClick={submitEnrollment}
                disabled={isSubmitting || enrollmentLoading}
              >
                {(isSubmitting || enrollmentLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Enrollment ({capturedImages.length} images)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>Ensure good, even lighting on your face</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>Look directly at the camera and center your face in the oval</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>Images capture automatically when your face is properly positioned</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>Capture 3-5 images from slightly different angles for best accuracy</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
