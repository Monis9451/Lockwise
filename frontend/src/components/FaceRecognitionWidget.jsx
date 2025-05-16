import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const FaceRecognitionWidget = ({ userId }) => {
  const [isActive, setIsActive] = useState(false);
  const [isRecognized, setIsRecognized] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
      } catch (error) {
      }
    };

    loadModels();

    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const toggleCamera = async () => {
    if (isActive) {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsActive(false);
      setIsRecognized(null);
    } else {
      setLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 300,
            height: 225,
            facingMode: 'user'
          }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setIsActive(true);
        checkFace();
      } catch (err) {
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const checkFace = async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      setLoading(true);
      
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setIsRecognized(false);
        toast({
          title: "Face Not Detected",
          description: "No face detected in frame. Please adjust your position.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      
      const timestamp = Date.now();
      const response = await fetch(`http://localhost:5000/face-data/face-verify?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId,
          descriptor,
          timestamp
        })
      });

      const result = await response.json();
      
      setIsRecognized(result.success);
      setLastChecked(new Date().toLocaleTimeString());
      
      if (result.success) {
        toast({
          title: "Identity Confirmed",
          description: `Face recognized with confidence ${result.distance}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.message || "Face not recognized. Security alert triggered.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "An error occurred during verification.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          Face Recognition Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-col items-center">
          {isActive ? (
            <div className="relative mb-3 overflow-hidden rounded-md border border-primary/30">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-auto"
                style={{ maxHeight: '225px' }}
              />
              <div className={`absolute top-2 right-2 p-1 rounded-full ${
                isRecognized === null ? 'bg-yellow-400/80' : 
                isRecognized ? 'bg-green-500/80' : 'bg-red-500/80'
              }`}>
                {isRecognized === null ? <RefreshCw size={16} /> : 
                 isRecognized ? <Smile size={16} /> : <AlertTriangle size={16} />}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-md w-full h-[160px] mb-3 flex items-center justify-center">
              <Shield className="h-12 w-12 text-white/30" />
            </div>
          )}
          
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Status:</span>
              <span className={`font-medium ${
                !isActive ? 'text-white/60' :
                isRecognized === null ? 'text-yellow-400' :
                isRecognized ? 'text-green-500' : 'text-red-500'
              }`}>
                {!isActive ? 'Inactive' : 
                 isRecognized === null ? 'Checking...' : 
                 isRecognized ? 'Recognized' : 'Not Recognized'}
              </span>
            </div>
            
            {lastChecked ? (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Last checked:</span>
                <span className="text-white/80">{lastChecked}</span>
              </div>
            ) : null}
            
            <div className="pt-2 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-white/20"
                onClick={toggleCamera}
                disabled={loading}
              >
                {isActive ? 'Deactivate' : 'Activate'} Camera
              </Button>
              
              {isActive ? (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={checkFace}
                  disabled={loading}
                >
                  Verify Now
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceRecognitionWidget;