import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Shield, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as faceapi from 'face-api.js';
import.meta.env;

const faceDetectionOptions = new faceapi.TinyFaceDetectorOptions({ 
  inputSize: 320,
  scoreThreshold: 0.5
});

const FaceSetup = () => {
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [captureDone, setCaptureDone] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setModelsLoaded(true);
      } catch (error) {
        toast({
          title: "Model Loading Error",
          description: "Failed to load face recognition models. Please refresh and try again.",
          variant: "destructive"
        });
      }
    };

    loadModels();
  }, [toast]);

  useEffect(() => {
    if (capturing) {
      const startCamera = async () => {
        try {
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
        } catch (err) {
          toast({
            title: "Camera Error",
            description: "Unable to access your camera. Please check permissions.",
            variant: "destructive"
          });
          setCapturing(false);
        }
      };

      startCamera();

      return () => {
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          tracks.forEach(track => track.stop());
          streamRef.current = null;
        }
      };
    }
  }, [capturing, toast]);

  const handleCapture = () => {
    if (!modelsLoaded) {
      toast({
        title: "Models not ready",
        description: "Please wait for face recognition models to load.",
        variant: "destructive"
      });
      return;
    }
    setCapturing(true);
  };

  const handleProcess = async () => {
    if (!videoRef.current) return;
    
    setProcessing(true);

    try {
      let userId = null;
      
      userId = location.state?.userId;
      
      if (!userId) {
        userId = localStorage.getItem('userId');
      }
      
      if (!userId) {
        throw new Error('Please complete the signup process first before setting up face recognition.');
      }

      const detections = await faceapi.detectAllFaces(
        videoRef.current, 
        faceDetectionOptions
      ).withFaceLandmarks().withFaceDescriptors();

      if (!detections.length) {
        throw new Error('No face detected. Please ensure your face is clearly visible.');
      }

      const faceDescriptor = Array.from(detections[0].descriptor);
      
      const response = await fetch('http://localhost:5000/face-data/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId,
          descriptor: faceDescriptor
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to save face data: ${data.message || 'Unknown error'}`);
      }

      setCaptureDone(true);
      
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setCapturing(false);
      
      toast({
        title: "Face scan completed",
        description: "Your face has been registered successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to process face data. Please try again.",
        variant: "destructive"
      });
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = () => {
    navigate('/login');
  };

  return (
    <Layout>
      <div className="container max-w-xl mx-auto py-12 px-4">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="w-full flex justify-center mb-4">
              {captureDone ? (
                <div className="rounded-full bg-green-500/20 p-2">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
              ) : (
                <Camera className="h-10 w-10 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">Face Recognition Setup</CardTitle>
            <CardDescription>
              {captureDone 
                ? "Your face has been registered successfully." 
                : "Let's set up face recognition for your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!capturing && !captureDone ? (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-6 text-center border border-white/10">
                  <Camera className="h-24 w-24 mx-auto mb-6 text-primary/70" />
                  <p className="text-white/70 mb-4">
                    Your face will be used as an additional layer of security to access your passwords.
                  </p>
                  <Button onClick={handleCapture} className="w-full">
                    Begin Face Setup
                  </Button>
                </div>
              </div>
            ) : capturing ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg border border-primary/30">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    className="w-full h-60 object-cover"
                  />
                  <div className="scan-line"></div>
                  {processing && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-block rounded-full border-2 border-primary/30 border-t-primary h-8 w-8 animate-spin mb-2"></div>
                        <p className="text-white">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-white/70 mb-4">
                    Please look at the camera and keep your face within the frame.
                  </p>
                  <Button 
                    onClick={handleProcess} 
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? "Processing..." : "Capture Face Data"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <Check className="h-16 w-16 mx-auto mb-2 text-green-500" />
                  <p className="text-xl font-semibold mb-2">Setup Complete!</p>
                  <p className="text-white/70">
                    Your face has been registered successfully. You can now use it to access your vault.
                  </p>
                </div>
                <Button onClick={handleComplete} className="w-full">
                  Continue to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FaceSetup;