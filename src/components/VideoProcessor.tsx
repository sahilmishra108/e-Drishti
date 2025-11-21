import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileVideo, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { io } from 'socket.io-client';
import { batchExtractVitals, OCRProgress } from '@/lib/ocr';
import { monitorROIs, VitalsData } from '@/types/vitals';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const VideoProcessor = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalsData | null>(null);
  const [allExtractedVitals, setAllExtractedVitals] = useState<Array<VitalsData & { timestamp: number; timeString: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Connect to Socket.io server
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('vital-update', (newVital: any) => {
      if (newVital.source === 'video') {
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
      socket.disconnect();
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));

    if (videoFile) {
      setVideoFile(videoFile);
      setAllExtractedVitals([]);
      setLatestVitals(null);
      toast({
        title: "Video loaded",
        description: videoFile.name,
      });
    } else {
      toast({
        title: "Invalid file",
        description: "Please drop a video file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setAllExtractedVitals([]);
      setLatestVitals(null);
      toast({
        title: "Video loaded",
        description: file.name,
      });
    }
  };

  const extractFrameFromVideo = async (video: HTMLVideoElement, time: number): Promise<string> => {
    return new Promise((resolve) => {
      video.currentTime = time;
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
    });
  };

  const processVideo = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const duration = video.duration;
      const frameInterval = 3; // Extract frame every 3 seconds
      const totalFrames = Math.floor(duration / frameInterval);
      const allVitals: Array<VitalsData & { timestamp: number }> = [];

      // Extract all frames first
      const frames: string[] = [];
      for (let i = 0; i < totalFrames; i++) {
        const time = i * frameInterval;
        const imageBase64 = await extractFrameFromVideo(video, time);
        frames.push(imageBase64);
        setProgress(Math.round(((i + 1) / totalFrames) * 50)); // First 50% for frame extraction
      }

      // Process all frames with Tesseract OCR
      const ocrResults = await batchExtractVitals(
        frames,
        monitorROIs,
        (current, total, imageProgress) => {
          if (imageProgress) {
            setOcrProgress(imageProgress);
            // Second 50% for OCR processing
            const baseProgress = 50;
            const ocrProgressPercent = (imageProgress.progress / 100) * 50;
            setProgress(Math.round(baseProgress + ocrProgressPercent));
          } else {
            setProgress(Math.round(50 + ((current / total) * 50)));
          }
        }
      );

      // Combine OCR results with timestamps and store in database
      const baseTimestamp = new Date();
      const vitalsToInsert: Array<{
        hr: number | null;
        pulse: number | null;
        spo2: number | null;
        abp: string | null;
        pap: string | null;
        etco2: number | null;
        awrr: number | null;
        source: string;
        created_at: string;
      }> = [];

      const extractedVitalsWithTime: Array<VitalsData & { timestamp: number; timeString: string }> = [];

      for (let i = 0; i < ocrResults.length; i++) {
        const time = i * frameInterval;
        if (ocrResults[i].vitals) {
          const vitals = ocrResults[i].vitals;
          const timeString = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

          allVitals.push({
            ...vitals,
            timestamp: time
          });

          extractedVitalsWithTime.push({
            ...vitals,
            timestamp: time,
            timeString
          });

          // Update latest vitals for display during processing
          setLatestVitals(vitals);

          // Prepare vitals for database insertion
          // Use the video timestamp to create a realistic created_at time
          const recordTimestamp = new Date(baseTimestamp.getTime() + time * 1000);
          vitalsToInsert.push({
            hr: vitals.HR,
            pulse: vitals.Pulse,
            spo2: vitals.SpO2,
            abp: vitals.ABP,
            pap: vitals.PAP,
            etco2: vitals.EtCO2,
            awrr: vitals.awRR,
            source: 'video',
            created_at: recordTimestamp.toISOString()
          });
        }
      }

      // Update all extracted vitals for table display
      setAllExtractedVitals(extractedVitalsWithTime);

      // Store all vitals in database via API
      if (vitalsToInsert.length > 0) {
        try {
          const response = await fetch('http://localhost:3000/api/vitals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(vitalsToInsert)
          });

          if (!response.ok) {
            throw new Error('Failed to save vitals');
          }

          toast({
            title: "Success",
            description: `Extracted and saved ${vitalsToInsert.length} vitals to dashboard`,
          });
        } catch (error) {
          console.error('Save error:', error);
          toast({
            title: "Warning",
            description: "Vitals extracted but failed to save to dashboard. CSV download available.",
            variant: "destructive",
          });
        }
      }

      // Generate CSV
      const csvContent = generateCSV(allVitals);
      downloadCSV(csvContent, `vitals-${Date.now()}.csv`);

      if (vitalsToInsert.length === 0) {
        toast({
          title: "Processing complete",
          description: `Extracted ${allVitals.length} data points`,
        });
      }

      URL.revokeObjectURL(video.src);
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const generateCSV = (data: Array<VitalsData & { timestamp: number; timeString?: string }>) => {
    const headers = ['Time', 'HR (bpm)', 'Pulse (bpm)', 'SpO2 (%)', 'ABP (mmHg)', 'PAP (mmHg)', 'EtCO2 (mmHg)', 'awRR (/min)'];
    const rows = data.map(row => [
      row.timeString || `${Math.floor(row.timestamp / 60)}:${String(Math.floor(row.timestamp % 60)).padStart(2, '0')}`,
      row.HR ?? 'N/A',
      row.Pulse ?? 'N/A',
      row.SpO2 ?? 'N/A',
      row.ABP ?? 'N/A',
      row.PAP ?? 'N/A',
      row.EtCO2 ?? 'N/A',
      row.awRR ?? 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
        <FileVideo className="w-6 h-6 text-primary" />
        Video Analysis
      </h2>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
          }`}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="video-upload"
        />

        <label htmlFor="video-upload" className="cursor-pointer">
          <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground mb-2">
            Drop video here or click to upload
          </p>
          <p className="text-sm text-muted-foreground">
            MP4, MOV, or AVI files
          </p>
        </label>
      </div>

      {videoFile && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <FileVideo className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">{videoFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <Button
              onClick={processVideo}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing with Tesseract OCR {progress}%
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Extract & Download CSV
                </>
              )}
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {ocrProgress && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{ocrProgress.message}</p>
                  <p className="text-xs mt-1">Tesseract OCR: {ocrProgress.status}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vitals Table */}
      {allExtractedVitals.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">All Extracted Vitals</h3>
            <Button
              onClick={() => {
                const csvContent = generateCSV(allExtractedVitals);
                downloadCSV(csvContent, `vitals-table-${Date.now()}.csv`);
                toast({
                  title: "Export successful",
                  description: "Vitals table exported to CSV",
                });
              }}
              variant="outline"
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Table to CSV
            </Button>
          </div>

          <Card className="border-border">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">HR (bpm)</TableHead>
                    <TableHead className="font-semibold">Pulse (bpm)</TableHead>
                    <TableHead className="font-semibold">SpO2 (%)</TableHead>
                    <TableHead className="font-semibold">ABP (mmHg)</TableHead>
                    <TableHead className="font-semibold">PAP (mmHg)</TableHead>
                    <TableHead className="font-semibold">EtCO2 (mmHg)</TableHead>
                    <TableHead className="font-semibold">awRR (/min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allExtractedVitals.map((vital, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{vital.timeString}</TableCell>
                      <TableCell>{vital.HR ?? 'N/A'}</TableCell>
                      <TableCell>{vital.Pulse ?? 'N/A'}</TableCell>
                      <TableCell>{vital.SpO2 ?? 'N/A'}</TableCell>
                      <TableCell>{vital.ABP ?? 'N/A'}</TableCell>
                      <TableCell>{vital.PAP ?? 'N/A'}</TableCell>
                      <TableCell>{vital.EtCO2 ?? 'N/A'}</TableCell>
                      <TableCell>{vital.awRR ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Total records: <span className="font-semibold text-foreground">{allExtractedVitals.length}</span>
              </p>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default VideoProcessor;