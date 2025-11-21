import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { io } from 'socket.io-client';
import { extractVitalsWithOCR, OCRProgress } from '@/lib/ocr';
import { monitorROIs, VitalsData } from '@/types/vitals';
import VitalCard from './VitalCard';

const CameraFeed = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalsData | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Connect to Socket.io server
    const socket = io('http://localhost:3000');

    socket.on('vital-update', (newVital: any) => {
      if (newVital.source === 'camera') {
        setLatestVitals({
          HR: newVital.hr,
          Pulse: newVital.pulse,
          SpO2: newVital.spo2,
          ABP: newVital.abp,
          PAP: newVital.pap,
          EtCO2: newVital.etco2,
          awRR: newVital.awrr
        });
      }
    });

    return () => {
      stopCapture();
      socket.disconnect();
    };
  }, []);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);

        // Capture frame every 3 seconds
        intervalRef.current = setInterval(() => {
          captureAndProcess();
        }, 3000);

        toast({
          title: "Camera started",
          description: "Capturing frames every 3 seconds",
        });
      }
    } catch (error) {
      toast({
        title: "Camera error",
        description: "Failed to access camera",
        variant: "destructive",
      });
    }
  };

  const stopCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
    setPreviewUrl(null);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image as base64
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
    setPreviewUrl(imageBase64);

    // Use Tesseract OCR to extract vitals (no longer throws errors)
    const ocrResult = await extractVitalsWithOCR(
      imageBase64,
      monitorROIs,
      (progress) => {
        setOcrProgress(progress);
      }
    );

    // Store in database if vitals were extracted
    if (ocrResult.vitals && Object.values(ocrResult.vitals).some(v => v !== null)) {
      try {
        const response = await fetch('http://localhost:3000/api/vitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hr: ocrResult.vitals.HR,
            pulse: ocrResult.vitals.Pulse,
            spo2: ocrResult.vitals.SpO2,
            abp: ocrResult.vitals.ABP,
            pap: ocrResult.vitals.PAP,
            etco2: ocrResult.vitals.EtCO2,
            awrr: ocrResult.vitals.awRR,
            source: 'camera'
          })
        });

        if (response.ok) {
          // Update latest vitals for display
          setLatestVitals(ocrResult.vitals);
        }
      } catch (error) {
        console.error('Failed to save vitals:', error);
      }
    }

    setIsProcessing(false);
    setOcrProgress(null);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Camera className="w-6 h-6 text-primary" />
          Live Camera
        </h2>

        <div className="flex gap-2">
          {!isCapturing ? (
            <Button onClick={startCapture} className="bg-primary hover:bg-primary/90">
              <Camera className="w-4 h-4 mr-2" />
              Start Capture
            </Button>
          ) : (
            <Button onClick={stopCapture} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Stop Capture
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative bg-[hsl(var(--monitor-bg))] rounded-lg overflow-hidden border-2 border-[hsl(var(--monitor-border))]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          <canvas ref={canvasRef} className="hidden" />

          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              {ocrProgress && (
                <div className="text-white text-center px-4">
                  <p className="text-sm font-medium">{ocrProgress.message}</p>
                  <div className="w-48 h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${ocrProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-white/80">{ocrProgress.progress}%</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-[hsl(var(--monitor-bg))] rounded-lg p-4 border-2 border-[hsl(var(--monitor-border))]">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Last Frame</h3>
          {previewUrl ? (
            <img src={previewUrl} alt="Last frame" className="w-full h-auto rounded" />
          ) : (
            <div className="w-full aspect-video flex items-center justify-center text-muted-foreground">
              No frame captured yet
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        {isCapturing && (
          <p className="text-sm text-muted-foreground">Capturing every 3 seconds</p>
        )}
      </div>

      {/* Live KPIs */}
      <div className="mt-6 space-y-4">
        <h3 className="text-xl font-bold text-foreground">Live Vitals</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <VitalCard
            label="HR"
            value={latestVitals?.HR ?? null}
            unit="bpm"
          />
          <VitalCard
            label="Pulse"
            value={latestVitals?.Pulse ?? null}
            unit="bpm"
          />
          <VitalCard
            label="SpO2"
            value={latestVitals?.SpO2 ?? null}
            unit="%"
          />
          <VitalCard
            label="EtCO2"
            value={latestVitals?.EtCO2 ?? null}
            unit="mmHg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VitalCard
            label="ABP"
            value={latestVitals?.ABP ?? null}
            unit="mmHg"
          />
          <VitalCard
            label="PAP"
            value={latestVitals?.PAP ?? null}
            unit="mmHg"
          />
          <VitalCard
            label="awRR"
            value={latestVitals?.awRR ?? null}
            unit="/min"
          />
        </div>
      </div>
    </Card>
  );
};

export default CameraFeed;