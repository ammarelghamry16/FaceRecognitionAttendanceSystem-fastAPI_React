/**
 * Face Enrollment Page - Smart enrollment with real-time quality guidance
 * Only captures when face quality meets requirements
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Camera, CheckCircle, AlertCircle, Trash, Loader2, Sparkles, RefreshCw, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle } from 'lucide-react';
import { useFaceEnrollment } from '@/hooks/useFaceEnrollment';
import { aiApi } from '@/services';

// Types
type EnrollmentPhase = 'idle' | 'scanning' | 'processing' | 'complete' | 'error';
type QualityStatus = 'poor' | 'fair' | 'good' | 'excellent';

interface QualityFeedback {
  status: QualityStatus;
  faceDetected: boolean;
  faceSize: number; // percentage
  brightness: number; // 0-100
  centered: boolean;
  issues: string[];
  suggestions: string[];
  readyToCapture: boolean;
}

interface PoseGuide {
  id: string;
  name: string;
  instruction: string;
  icon: React.ReactNode;
  captured: boolean;
  imageCount: number;
}

// Configuration - relaxed for better usability while maintaining accuracy
const CONFIG = {
  IMAGES_PER_POSE: 2,
  MIN_QUALITY_HOLD_MS: 800, // Must hold good quality for 800ms before capture
  MIN_FACE_SIZE_PERCENT: 5, // Lowered from 15% - allows faces at normal webcam distance
  IDEAL_FACE_SIZE_PERCENT: 15, // Lowered from 25% - ideal but not required
  MAX_FACE_SIZE_PERCENT: 95, // Allow larger faces, skin detection can be generous
  MIN_BRIGHTNESS: 40, // Lowered from 50 - more tolerant of dim lighting
  MAX_BRIGHTNESS: 230, // Raised from 220 - more tolerant of bright lighting
  CENTER_TOLERANCE: 0.35, // Increased from 0.25 - more tolerant of off-center faces
  TOTAL_POSES: 5,
};

// Pose definitions
const INITIAL_POSES: PoseGuide[] = [
  { id: 'front', name: 'Front', instruction: 'Look straight at the camera', icon: <Circle className="h-5 w-5" />, captured: false, imageCount: 0 },
  { id: 'left', name: 'Left', instruction: 'Turn your head slightly LEFT', icon: <ArrowLeft className="h-5 w-5" />, captured: false, imageCount: 0 },
  { id: 'right', name: 'Right', instruction: 'Turn your head slightly RIGHT', icon: <ArrowRight className="h-5 w-5" />, captured: false, imageCount: 0 },
  { id: 'up', name: 'Up', instruction: 'Tilt your chin UP slightly', icon: <ArrowUp className="h-5 w-5" />, captured: false, imageCount: 0 },
  { id: 'down', name: 'Down', instruction: 'Tilt your chin DOWN slightly', icon: <ArrowDown className="h-5 w-5" />, captured: false, imageCount: 0 },
];

export default function FaceEnrollment() {
  const { user } = useAuth();
  const {
    enrollmentStatus,
    isLoading: enrollmentLoading,
    error: enrollmentError,
    success: enrollmentSuccess,
    checkEnrollmentStatus,
    deleteEnrollment,
    clearMessages,
  } = useFaceEnrollment();

  // Core state
  const [phase, setPhase] = useState<EnrollmentPhase>('idle');
  const [poses, setPoses] = useState<PoseGuide[]>(INITIAL_POSES);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState('');

  // Quality feedback state
  const [quality, setQuality] = useState<QualityFeedback>({
    status: 'poor',
    faceDetected: false,
    faceSize: 0,
    brightness: 0,
    centered: false,
    issues: [],
    suggestions: ['Position your face in the frame'],
    readyToCapture: false,
  });
  const [qualityHoldProgress, setQualityHoldProgress] = useState(0);
  const [captureFlash, setCaptureFlash] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const qualityHoldStartRef = useRef<number | null>(null);
  const capturedImagesRef = useRef<string[]>([]);
  const phaseRef = useRef<EnrollmentPhase>('idle');
  const currentPoseIndexRef = useRef<number>(0);
  const posesRef = useRef<PoseGuide[]>(INITIAL_POSES);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { currentPoseIndexRef.current = currentPoseIndex; }, [currentPoseIndex]);
  useEffect(() => { posesRef.current = poses; }, [poses]);

  // Check enrollment status on mount
  useEffect(() => {
    if (user?.id) {
      checkEnrollmentStatus(user.id);
    }
  }, [user?.id, checkEnrollmentStatus]);

  const isEnrolled = enrollmentStatus?.is_enrolled || false;
  const currentPose = poses[currentPoseIndex];
  const totalImages = CONFIG.TOTAL_POSES * CONFIG.IMAGES_PER_POSE;

  // Analyze face quality from video frame
  const analyzeQuality = useCallback((): QualityFeedback => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      return {
        status: 'poor',
        faceDetected: false,
        faceSize: 0,
        brightness: 0,
        centered: false,
        issues: ['Camera not ready'],
        suggestions: ['Wait for camera to initialize'],
        readyToCapture: false,
      };
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return { status: 'poor', faceDetected: false, faceSize: 0, brightness: 0, centered: false, issues: ['Canvas error'], suggestions: [], readyToCapture: false };

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0);

    // Analyze center region
    const regionSize = Math.min(width, height) * 0.7;
    const regionX = Math.floor((width - regionSize) / 2);
    const regionY = Math.floor((height - regionSize) / 2);
    const imageData = ctx.getImageData(regionX, regionY, Math.floor(regionSize), Math.floor(regionSize));
    const data = imageData.data;

    // Detect skin pixels using YCbCr
    let skinPixelCount = 0;
    let totalBrightness = 0;
    let minSkinX = regionSize, maxSkinX = 0;
    let minSkinY = regionSize, maxSkinY = 0;
    const regionW = Math.floor(regionSize);
    const regionH = Math.floor(regionSize);

    for (let y = 0; y < regionH; y += 2) {
      for (let x = 0; x < regionW; x += 2) {
        const i = (y * regionW + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        totalBrightness += (r + g + b) / 3;

        // YCbCr skin detection
        const y_val = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        const isSkin = y_val > 80 && cb > 77 && cb < 127 && cr > 133 && cr < 173;

        if (isSkin) {
          skinPixelCount++;
          minSkinX = Math.min(minSkinX, x);
          maxSkinX = Math.max(maxSkinX, x);
          minSkinY = Math.min(minSkinY, y);
          maxSkinY = Math.max(maxSkinY, y);
        }
      }
    }

    const totalPixels = (regionW * regionH) / 4;
    const skinRatio = skinPixelCount / totalPixels;
    const avgBrightness = totalBrightness / totalPixels;
    const hasSkinPixels = skinPixelCount > 50;

    // Calculate metrics
    const faceWidth = hasSkinPixels ? maxSkinX - minSkinX : 0;
    const faceHeight = hasSkinPixels ? maxSkinY - minSkinY : 0;
    const faceSizeRatio = hasSkinPixels ? Math.max(faceWidth / regionW, faceHeight / regionH) : 0;
    const faceSizePercent = faceSizeRatio * 100;
    const faceCenterX = hasSkinPixels ? (minSkinX + maxSkinX) / 2 : regionW / 2;
    const faceCenterY = hasSkinPixels ? (minSkinY + maxSkinY) / 2 : regionH / 2;
    const centerOffsetX = Math.abs(faceCenterX - regionW / 2) / (regionW / 2);
    const centerOffsetY = Math.abs(faceCenterY - regionH / 2) / (regionH / 2);
    const isCentered = centerOffsetX < CONFIG.CENTER_TOLERANCE && centerOffsetY < CONFIG.CENTER_TOLERANCE;

    // Build feedback
    const issues: string[] = [];
    const suggestions: string[] = [];
    let faceDetected = false;

    if (!hasSkinPixels || skinRatio < 0.02) {
      issues.push('No face detected');
      suggestions.push('Position your face in the oval guide');
    } else {
      faceDetected = true;

      if (faceSizePercent < CONFIG.MIN_FACE_SIZE_PERCENT) {
        issues.push('Face too far');
        suggestions.push(`Move closer (${faceSizePercent.toFixed(0)}% → ${CONFIG.MIN_FACE_SIZE_PERCENT}% needed)`);
      } else if (faceSizePercent > CONFIG.MAX_FACE_SIZE_PERCENT) {
        issues.push('Face too close');
        suggestions.push('Move back slightly');
      }

      if (!isCentered) {
        issues.push('Face not centered');
        if (centerOffsetX > CONFIG.CENTER_TOLERANCE) {
          suggestions.push(faceCenterX < regionW / 2 ? 'Move right' : 'Move left');
        }
        if (centerOffsetY > CONFIG.CENTER_TOLERANCE) {
          suggestions.push(faceCenterY < regionH / 2 ? 'Move down' : 'Move up');
        }
      }

      if (avgBrightness < CONFIG.MIN_BRIGHTNESS) {
        issues.push('Too dark');
        suggestions.push('Improve lighting or face a light source');
      } else if (avgBrightness > CONFIG.MAX_BRIGHTNESS) {
        issues.push('Too bright');
        suggestions.push('Reduce lighting or move away from direct light');
      }
    }

    // Determine quality status
    let status: QualityStatus = 'poor';
    const readyToCapture = faceDetected &&
      faceSizePercent >= CONFIG.MIN_FACE_SIZE_PERCENT &&
      faceSizePercent <= CONFIG.MAX_FACE_SIZE_PERCENT &&
      isCentered &&
      avgBrightness >= CONFIG.MIN_BRIGHTNESS &&
      avgBrightness <= CONFIG.MAX_BRIGHTNESS;

    if (readyToCapture) {
      status = faceSizePercent >= CONFIG.IDEAL_FACE_SIZE_PERCENT ? 'excellent' : 'good';
    } else if (faceDetected && issues.length <= 2) {
      status = 'fair';
    }

    return {
      status,
      faceDetected,
      faceSize: faceSizePercent,
      brightness: avgBrightness,
      centered: isCentered,
      issues,
      suggestions: suggestions.length > 0 ? suggestions : ['Hold still...'],
      readyToCapture,
    };
  }, []);

  // Capture frame
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video) return null;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.translate(captureCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    return captureCanvas.toDataURL('image/jpeg', 0.92);
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Submit enrollment
  const submitEnrollment = useCallback(async () => {
    setPhase('processing');
    stopCamera();

    try {
      if (!user?.id) throw new Error('User not found');

      const files = await Promise.all(
        capturedImagesRef.current.map(async (dataUrl, index) => {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          return new File([blob], `face_${index}.jpg`, { type: 'image/jpeg' });
        })
      );

      const result = await aiApi.enrollMultiple(user.id, files);

      if (result.success) {
        setPhase('complete');
        checkEnrollmentStatus(user.id);
      } else {
        let errorMessage = result.message || 'Enrollment failed';
        if (errorMessage.includes('Image 0:') && errorMessage.includes('Image 1:')) {
          const match = errorMessage.match(/Image \d+: ([^;]+)/);
          if (match) {
            errorMessage = `${match[1].trim()}\n\nPlease try again with better positioning.`;
          }
        }
        setCameraError(errorMessage);
        setPhase('error');
      }
    } catch (err: unknown) {
      console.error('[FaceEnrollment] Enrollment error:', err);
      let errorMessage = 'Enrollment failed. Please try again.';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: string; message?: string } } };
        if (axiosErr.response?.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (axiosErr.response?.data?.detail) {
          errorMessage = axiosErr.response.data.detail;
        }
      }
      setCameraError(errorMessage);
      setPhase('error');
    }
  }, [user?.id, stopCamera, checkEnrollmentStatus]);

  // Main analysis loop
  const runAnalysisLoop = useCallback(() => {
    const loop = () => {
      if (phaseRef.current !== 'scanning') return;

      const qualityResult = analyzeQuality();
      setQuality(qualityResult);

      if (qualityResult.readyToCapture) {
        // Start or continue quality hold timer
        if (!qualityHoldStartRef.current) {
          qualityHoldStartRef.current = Date.now();
        }

        const holdDuration = Date.now() - qualityHoldStartRef.current;
        const progress = Math.min(100, (holdDuration / CONFIG.MIN_QUALITY_HOLD_MS) * 100);
        setQualityHoldProgress(progress);

        // Capture when hold time reached
        if (holdDuration >= CONFIG.MIN_QUALITY_HOLD_MS) {
          const image = captureFrame();
          if (image) {
            // Flash effect
            setCaptureFlash(true);
            setTimeout(() => setCaptureFlash(false), 150);

            capturedImagesRef.current.push(image);
            setCapturedImages([...capturedImagesRef.current]);

            // Update pose
            const poseIdx = currentPoseIndexRef.current;
            const updatedPoses = [...posesRef.current];
            updatedPoses[poseIdx] = {
              ...updatedPoses[poseIdx],
              imageCount: updatedPoses[poseIdx].imageCount + 1,
              captured: updatedPoses[poseIdx].imageCount + 1 >= CONFIG.IMAGES_PER_POSE,
            };
            setPoses(updatedPoses);

            // Reset hold timer
            qualityHoldStartRef.current = null;
            setQualityHoldProgress(0);

            // Check if pose complete
            if (updatedPoses[poseIdx].imageCount >= CONFIG.IMAGES_PER_POSE) {
              const nextPoseIndex = poseIdx + 1;
              if (nextPoseIndex < CONFIG.TOTAL_POSES) {
                setCurrentPoseIndex(nextPoseIndex);
              } else {
                // All poses captured
                submitEnrollment();
                return;
              }
            }
          }
        }
      } else {
        // Reset hold timer if quality drops
        qualityHoldStartRef.current = null;
        setQualityHoldProgress(0);
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
  }, [analyzeQuality, captureFrame, submitEnrollment]);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError('');
    phaseRef.current = 'scanning';
    setPhase('scanning');
    currentPoseIndexRef.current = 0;
    setCurrentPoseIndex(0);
    setPoses(INITIAL_POSES);
    posesRef.current = INITIAL_POSES;
    setCapturedImages([]);
    capturedImagesRef.current = [];
    setQualityHoldProgress(0);
    qualityHoldStartRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not found');

      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Camera timeout')), 5000);
        const onReady = () => {
          clearTimeout(timeout);
          video.removeEventListener('canplay', onReady);
          resolve();
        };
        if (video.readyState >= 3) {
          clearTimeout(timeout);
          resolve();
        } else {
          video.addEventListener('canplay', onReady);
        }
      });

      await video.play();
      runAnalysisLoop();
    } catch (err) {
      console.error('[FaceEnrollment] Camera error:', err);
      setCameraError(err instanceof Error ? err.message : 'Failed to start camera');
      phaseRef.current = 'error';
      setPhase('error');
      stopCamera();
    }
  }, [stopCamera, runAnalysisLoop]);

  // Cleanup
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Get quality color
  const getQualityColor = () => {
    switch (quality.status) {
      case 'excellent': return 'rgb(34, 197, 94)'; // green
      case 'good': return 'rgb(132, 204, 22)'; // lime
      case 'fair': return 'rgb(234, 179, 8)'; // yellow
      default: return 'rgb(239, 68, 68)'; // red
    }
  };

  const handleDelete = async () => {
    if (!user?.id) return;
    await deleteEnrollment(user.id);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Face Enrollment
          </CardTitle>
          <CardDescription>
            {isEnrolled
              ? 'Your face is enrolled. You can re-enroll for better accuracy.'
              : 'Enroll your face for automatic attendance tracking.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alerts */}
          {enrollmentError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{enrollmentError}</AlertDescription>
            </Alert>
          )}
          {enrollmentSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success</AlertTitle>
              <AlertDescription className="text-green-600">{enrollmentSuccess}</AlertDescription>
            </Alert>
          )}

          {/* Enrollment status */}
          {isEnrolled && phase === 'idle' && (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 dark:text-green-400">
                Face enrolled ({enrollmentStatus?.encodings_count || 0} encodings)
              </span>
            </div>
          )}

          {/* Camera view - larger on mobile */}
          <div className="relative bg-black rounded-xl overflow-hidden h-[65vh] sm:h-[400px] md:h-[450px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover mirror ${phase !== 'scanning' ? 'hidden' : ''}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Capture flash */}
            {captureFlash && (
              <div className="absolute inset-0 bg-white/50 z-20 animate-pulse" />
            )}

            {/* Idle state */}
            {phase === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-b from-gray-800 to-gray-900">
                <Camera className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg opacity-70 mb-2">Ready to enroll</p>
                <p className="text-sm opacity-50">Click Start to begin face enrollment</p>
              </div>
            )}

            {/* Scanning overlay */}
            {phase === 'scanning' && (
              <>
                {/* Face guide oval - larger on mobile */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-60 sm:w-52 sm:h-64 md:w-56 md:h-72">
                    {/* Oval guide */}
                    <div
                      className="absolute inset-0 rounded-[50%] border-4 transition-colors duration-300"
                      style={{ borderColor: getQualityColor() }}
                    />
                    {/* Progress ring overlay */}
                    {qualityHoldProgress > 0 && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <ellipse
                          cx="50%"
                          cy="50%"
                          rx="48%"
                          ry="48%"
                          fill="none"
                          stroke={getQualityColor()}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${qualityHoldProgress * 3.14} 314`}
                          className="transition-all duration-100"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Pose progress indicators */}
                <div className="absolute top-4 left-0 right-0 flex justify-center gap-2">
                  {poses.map((pose, idx) => (
                    <div
                      key={pose.id}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${pose.captured
                        ? 'bg-green-500 text-white'
                        : idx === currentPoseIndex
                          ? 'bg-white text-black scale-110 shadow-lg'
                          : 'bg-white/30 text-white/70'
                        }`}
                      title={pose.name}
                    >
                      {pose.captured ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        pose.icon
                      )}
                    </div>
                  ))}
                </div>

                {/* Quality feedback panel */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                  {/* Current pose instruction */}
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center gap-2 text-white mb-1">
                      {currentPose?.icon}
                      <span className="text-lg font-medium">{currentPose?.instruction}</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      {capturedImages.length} / {totalImages} captured • Pose {currentPoseIndex + 1}/{CONFIG.TOTAL_POSES}
                    </p>
                  </div>

                  {/* Quality status */}
                  <div className="bg-black/50 rounded-lg p-3 space-y-2">
                    {/* Status bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Quality:</span>
                      <span
                        className="text-sm font-medium px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: getQualityColor(),
                          color: quality.status === 'poor' ? 'white' : 'black'
                        }}
                      >
                        {quality.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Face size indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Face Size</span>
                        <span>{quality.faceSize.toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={Math.min(100, (quality.faceSize / CONFIG.IDEAL_FACE_SIZE_PERCENT) * 100)}
                        className="h-1.5"
                      />
                    </div>

                    {/* Issues and suggestions */}
                    {quality.issues.length > 0 && (
                      <div className="text-yellow-400 text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{quality.suggestions[0]}</span>
                      </div>
                    )}

                    {/* Ready indicator */}
                    {quality.readyToCapture && (
                      <div className="text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Hold still... {Math.round(qualityHoldProgress)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Processing */}
            {phase === 'processing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="text-lg">Processing your enrollment...</p>
                <p className="text-sm text-white/60 mt-2">This may take a moment</p>
              </div>
            )}

            {/* Complete */}
            {phase === 'complete' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-green-800 to-green-900 text-white">
                <Sparkles className="h-16 w-16 mb-4 text-green-300" />
                <p className="text-xl font-semibold">Enrollment Complete!</p>
                <p className="text-sm text-green-200 mt-2">Your face has been registered successfully</p>
              </div>
            )}

            {/* Error */}
            {phase === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-red-800 to-red-900 text-white p-6">
                <AlertCircle className="h-16 w-16 mb-4 text-red-300" />
                <p className="text-xl font-semibold mb-2">Enrollment Failed</p>
                <p className="text-sm text-red-200 text-center max-w-md whitespace-pre-line">{cameraError}</p>
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => {
                      setCameraError('');
                      setPhase('idle');
                      clearMessages();
                    }}
                    variant="outline"
                    className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setCameraError('');
                      clearMessages();
                      startCamera();
                    }}
                    className="bg-white text-red-900 hover:bg-white/90"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {phase === 'idle' && (
              <Button onClick={startCamera} className="flex-1" disabled={enrollmentLoading}>
                <Camera className="h-4 w-4 mr-2" />
                {isEnrolled ? 'Re-enroll Face' : 'Start Enrollment'}
              </Button>
            )}
            {phase === 'scanning' && (
              <Button onClick={() => { stopCamera(); setPhase('idle'); }} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            {phase === 'complete' && (
              <Button onClick={() => { setPhase('idle'); clearMessages(); }} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}
            {isEnrolled && phase === 'idle' && (
              <Button onClick={handleDelete} variant="destructive" disabled={enrollmentLoading}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          {/* Instructions */}
          {phase === 'idle' && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">Tips for best results:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Position your face to fill the oval guide (15-25% of frame)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Ensure good, even lighting on your face</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Hold still when the guide turns green</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Follow the pose prompts for each angle</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                The system will automatically capture when quality is good enough.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
