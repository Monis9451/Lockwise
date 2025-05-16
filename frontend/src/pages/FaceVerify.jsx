import * as faceapi from 'face-api.js';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Camera, UserRound, Key } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const FaceVerify = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null); 
  const intervalRef = useRef(null); 
  const descriptorRef = useRef(null); 
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      } catch (error) {
        setError("Failed to load face detection models");
        toast({
          title: "Model Load Error",
          description: "Failed to load face detection models. Please try again.",
          variant: "destructive",
        });
        setScanning(false);
      }
    };

    const verifyFace = async () => {
      try {
        let userId = location.state?.userId;
        if (!userId) {
          userId = localStorage.getItem('userId');
        }
        
        if (!userId) {
          setError("User ID not found");
          toast({
            title: "User ID Missing",
            description: "User ID not found. Please log in again.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640,
            height: 480,
            facingMode: "user"
          } 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        descriptorRef.current = null;
        
        intervalRef.current = setInterval(async () => {
          if (videoRef.current) {
            try {
              const detections = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
              ).withFaceLandmarks().withFaceDescriptor();

              if (detections) {
                const newDescriptor = Array.from(detections.descriptor);
                
                const timestamp = Date.now();
                
                if (descriptorRef.current) {
                  let same = true;
                  for (let i = 0; i < 5; i++) {
                    if (newDescriptor[i] !== descriptorRef.current[i]) {
                      same = false;
                      break;
                    }
                  }
                  
                  if (same) {
                    return;
                  }
                }
                
                descriptorRef.current = newDescriptor;
                
                setProgress((prev) => Math.min(prev + 10, 90));

                const response = await fetch('http://localhost:5000/face-data/verify', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store'
                  },
                  credentials: 'include',
                  body: JSON.stringify({ 
                    userId, 
                    descriptor: newDescriptor
                  }),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                  setProgress(100);
                  
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  
                  toast({
                    title: "Verification Successful",
                    description: "Your identity has been verified.",
                    variant: "default",
                  });
                  
                  setTimeout(() => {
                    if (streamRef.current) {
                      const tracks = streamRef.current.getTracks();
                      tracks.forEach(track => track.stop());
                      streamRef.current = null;
                    }
                    navigate('/dashboard');
                  }, 1000);
                } else {
                  setError(result.message || "Face verification failed");
                  
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  
                  toast({
                    title: "Face Mismatch",
                    description: result.message || "Face verification failed. Please try again.",
                    variant: "destructive",
                  });
                  
                  setProgress(0);
                  setScanning(false);
                  
                  if (streamRef.current) {
                    const tracks = streamRef.current.getTracks();
                    tracks.forEach(track => track.stop());
                    streamRef.current = null;
                  }
                }
              }
            } catch (error) {
              setError("Error during face detection");
              
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              
              toast({
                title: "Detection Error",
                description: "Error during face detection. Please try again.",
                variant: "destructive",
              });
              
              setScanning(false);
              
              if (streamRef.current) {
                const tracks = streamRef.current.getTracks();
                tracks.forEach(track => track.stop());
                streamRef.current = null;
              }
            }
          }
        }, 1000);
      } catch (err) {
        setError("Camera access error");
        toast({
          title: "Verification Error",
          description: "Camera access error. Please check your camera permissions and try again.",
          variant: "destructive",
        });
        setScanning(false);
      }
    };

    if (scanning) {
      loadModels().then(() => {
        setProgress(10);
        verifyFace();
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [scanning, toast, navigate, location.state]);

  const handleVerify = () => {
    setError(null);
    setProgress(0);
    setScanning(true);
  };

  const handleCancel = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setScanning(false);
    setProgress(0);
  };

  return (
    <Layout hideNav>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass-card max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="w-full flex justify-center mb-4">
              <div className="rounded-full bg-primary/20 p-3">
                <UserRound className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Face Verification</CardTitle>
            <CardDescription>
              Verify your identity to access your password vault
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!scanning ? (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-6 text-center border border-white/10">
                  <Camera className="h-24 w-24 mx-auto mb-6 text-primary/70" />
                  <p className="text-white/70 mb-4">
                    Look at the camera to verify your identity and access your password vault.
                  </p>
                  {error && (
                    <p className="text-red-400 mb-4">
                      {error}
                    </p>
                  )}
                  <Button onClick={handleVerify} className="w-full">
                    Begin Verification
                  </Button>
                </div>
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    className="border-white/20 hover:bg-white/10 mt-2"
                    onClick={() => navigate('/login')}
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg border border-primary/30">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    className="w-full h-60 object-cover"
                  />
                  <div className="scan-line"></div>
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-black/50">
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/70">
                    {progress < 50 ? "Scanning face..." : "Verifying identity..."}
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-white/20 hover:bg-white/10 mt-4"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FaceVerify;