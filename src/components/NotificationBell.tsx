import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import VitalNotifications from './VitalNotifications';
import { io } from 'socket.io-client';

interface VitalRecord {
  created_at: string;
  hr: number | null;
  pulse: number | null;
  spo2: number | null;
  etco2: number | null;
  abp: string | null;
  pap: string | null;
  awrr: number | null;
}

const NotificationBell = () => {
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAlertCountRef = useRef(0);

  useEffect(() => {
    // Initialize alarm sound - handle errors silently
    try {
      alarmAudioRef.current = new Audio('/alarm.wav');
      alarmAudioRef.current.volume = 0.7;
      // Preload the audio to avoid loading errors
      alarmAudioRef.current.load();
    } catch (error) {
      // Silently handle audio initialization errors
      alarmAudioRef.current = null;
    }

    // Fetch latest vitals
    fetchLatestVitals();

    // Connect to Socket.io server
    const socket = io('http://localhost:3000');

    socket.on('vital-update', () => {
      fetchLatestVitals();
    });

    // Poll for updates every 3 seconds (fallback)
    const pollInterval = setInterval(() => {
      fetchLatestVitals();
    }, 3000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  const fetchLatestVitals = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/vitals?limit=10');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setVitals(data.reverse());
          calculateAlertCount(data[data.length - 1]);
        }
      }
    } catch (error) {
      // Silently handle fetch errors
    }
  };

  const calculateAlertCount = (latestVital: VitalRecord) => {
    let count = 0;

    // Check HR
    if (latestVital.hr !== null) {
      if (latestVital.hr < 60 || latestVital.hr > 100) count++;
    }

    // Check Pulse
    if (latestVital.pulse !== null) {
      if (latestVital.pulse < 60 || latestVital.pulse > 100) count++;
    }

    // Check SpO2
    if (latestVital.spo2 !== null) {
      if (latestVital.spo2 < 90) count++;
    }

    // Check ABP Sys
    if (latestVital.abp) {
      const abpSys = parseInt(latestVital.abp.split('/')[0]);
      if (!isNaN(abpSys) && (abpSys < 90 || abpSys > 120)) count++;
    }

    // Check PAP Dia
    if (latestVital.pap) {
      const papDia = parseInt(latestVital.pap.split('/')[1]);
      if (!isNaN(papDia) && (papDia < 4 || papDia > 12)) count++;
    }

    // Check EtCO2
    if (latestVital.etco2 !== null) {
      if (latestVital.etco2 < 35 || latestVital.etco2 > 45) count++;
    }

    // Check awRR
    if (latestVital.awrr !== null) {
      if (latestVital.awrr < 12 || latestVital.awrr > 20) count++;
    }

    // Play alarm if new alerts appeared
    if (count > lastAlertCountRef.current && count > 0) {
      setHasNewAlert(true);
      playAlarm();
    }

    setAlertCount(count);
    lastAlertCountRef.current = count;
  };

  const playAlarm = () => {
    if (alarmAudioRef.current) {
      // Only play audio if user has interacted with the page
      // Silently handle errors to avoid console noise
      alarmAudioRef.current.play().catch(() => {
        // Silently ignore autoplay policy errors
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {alertCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-[600px] overflow-y-auto p-0" align="end">
        <VitalNotifications vitals={vitals} compact={true} />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
