# v0 Prompt: Face Enrollment Page

Create a professional face enrollment page for a Face Recognition Attendance System using React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Requirements

### Purpose
Allow students to register their face for automatic attendance recognition.

### User Roles
- **Admin**: Can enroll any student's face
- **Student**: Can enroll their own face

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Face Enrollment                                         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Enrollment Status                                   │ │
│ │ ✅ Enrolled | 5 face images registered              │ │
│ │ Last updated: Dec 11, 2024                          │ │
│ │                                    [Delete All]     │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────┐ │
│ │ 📷 Camera Capture   │ │ 📁 Upload Images            │ │
│ │ ┌─────────────────┐ │ │ ┌─────────────────────────┐ │ │
│ │ │                 │ │ │ │                         │ │ │
│ │ │  Camera Feed    │ │ │ │   Drag & Drop Zone      │ │ │
│ │ │                 │ │ │ │   or click to browse    │ │ │
│ │ └─────────────────┘ │ │ └─────────────────────────┘ │ │
│ │ Captured: 3/5       │ │ Selected: 2 files          │ │
│ │ [📸 Capture]        │ │ [Upload Selected]          │ │
│ └─────────────────────┘ └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 💡 Tips for best results:                               │
│ • Good lighting on your face                            │
│ • Look directly at the camera                           │
│ • Capture from slightly different angles                │
└─────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Student Selector (Admin Only)
```tsx
{user.role === 'admin' && (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-lg">Select Student</CardTitle>
    </CardHeader>
    <CardContent>
      <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedStudent ? (
              <span>{selectedStudent.full_name} ({selectedStudent.student_id})</span>
            ) : (
              <span className="text-muted-foreground">Search for a student...</span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search by name or ID..." />
            <CommandList>
              <CommandEmpty>No students found.</CommandEmpty>
              {students.map(student => (
                <CommandItem
                  key={student.id}
                  onSelect={() => {
                    setSelectedStudent(student);
                    setStudentSearchOpen(false);
                    checkEnrollmentStatus(student.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(student.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.student_id}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </CardContent>
  </Card>
)}
```

#### 2. Enrollment Status Card
```tsx
<Card className={enrollmentStatus?.is_enrolled ? 'border-green-200 bg-green-50/50' : ''}>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-lg">Enrollment Status</CardTitle>
      {enrollmentStatus?.is_enrolled && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash className="h-4 w-4 mr-1" />
          Delete All
        </Button>
      )}
    </div>
  </CardHeader>
  <CardContent>
    {enrollmentStatus?.is_enrolled ? (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-green-700">Enrolled</p>
          <p className="text-sm text-muted-foreground">
            {enrollmentStatus.encodings_count} face image(s) registered
          </p>
        </div>
      </div>
    ) : (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <p className="font-medium text-yellow-700">Not Enrolled</p>
          <p className="text-sm text-muted-foreground">
            Please capture or upload face images below
          </p>
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

#### 3. Camera Capture Section
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg flex items-center gap-2">
      <Camera className="h-5 w-5" />
      Camera Capture
    </CardTitle>
    <CardDescription>
      Capture face images directly from your camera
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Camera Preview */}
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      {isCameraActive ? (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          {/* Face detection overlay (optional) */}
          <div className="absolute inset-0 border-2 border-dashed border-primary/50 m-8 rounded-lg" />
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
    
    {/* Captured Images Preview */}
    {capturedImages.length > 0 && (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Captured: {capturedImages.length}/5 images
          </p>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCapturedImages([])}
          >
            Clear All
          </Button>
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden",
                capturedImages[i] ? "border-solid border-primary" : "border-muted"
              )}
            >
              {capturedImages[i] ? (
                <img 
                  src={capturedImages[i]} 
                  alt={`Capture ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground">{i + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Actions */}
    <div className="flex gap-2">
      {isCameraActive && (
        <>
          <Button 
            onClick={captureImage}
            disabled={capturedImages.length >= 5}
          >
            <Camera className="h-4 w-4 mr-2" />
            Capture ({capturedImages.length}/5)
          </Button>
          <Button variant="outline" onClick={stopCamera}>
            Stop Camera
          </Button>
        </>
      )}
      {capturedImages.length > 0 && (
        <Button 
          className="ml-auto"
          onClick={submitCapturedImages}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit {capturedImages.length} Image(s)
        </Button>
      )}
    </div>
  </CardContent>
</Card>
```

#### 4. File Upload Section
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg flex items-center gap-2">
      <Upload className="h-5 w-5" />
      Upload Images
    </CardTitle>
    <CardDescription>
      Upload existing photos (JPG, PNG, max 5MB each)
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Drag & Drop Zone */}
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-muted",
        "hover:border-primary hover:bg-primary/5 cursor-pointer"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
      <p className="font-medium">Drag & drop images here</p>
      <p className="text-sm text-muted-foreground">or click to browse</p>
    </div>
    
    {/* Selected Files Preview */}
    {selectedFiles.length > 0 && (
      <div className="space-y-2">
        <p className="text-sm font-medium">Selected Files:</p>
        <div className="space-y-2">
          {selectedFiles.map((file, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 p-2 bg-muted rounded-lg"
            >
              <img 
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-10 w-10 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => removeFile(i)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button 
          className="w-full"
          onClick={uploadFiles}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Upload {selectedFiles.length} Image(s)
        </Button>
      </div>
    )}
  </CardContent>
</Card>
```

#### 5. Tips Card
```tsx
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
      <li className="flex items-start gap-2">
        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
        <span>Use a neutral expression</span>
      </li>
    </ul>
  </CardContent>
</Card>
```

#### 6. Success/Error Alerts
```tsx
{success && (
  <Alert className="bg-green-50 border-green-200">
    <CheckCircle className="h-4 w-4 text-green-600" />
    <AlertTitle>Success</AlertTitle>
    <AlertDescription>{success}</AlertDescription>
  </Alert>
)}

{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### API Integration
```tsx
import { useFaceEnrollment } from '@/hooks';
import { useAuth } from '@/context/AuthContext';

const {
  enrollmentStatus,
  isLoading,
  error,
  success,
  checkEnrollmentStatus,
  enrollFace,
  enrollMultipleFaces,
  enrollFaceFromCamera,
  deleteEnrollment,
  clearMessages,
} = useFaceEnrollment();
```

### Camera Implementation Notes
```tsx
// Start camera
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user', width: 640, height: 480 } 
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    setIsCameraActive(true);
  } catch (err) {
    setError('Could not access camera. Please check permissions.');
  }
};

// Capture image
const captureImage = () => {
  if (!videoRef.current) return;
  const canvas = document.createElement('canvas');
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;
  canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  setCapturedImages(prev => [...prev, dataUrl]);
};
```

### Responsive Design
- Two columns on desktop, stacked on mobile
- Camera preview maintains aspect ratio
- File list scrolls if many files

Generate a complete face enrollment page with camera capture, file upload, and proper state management.
