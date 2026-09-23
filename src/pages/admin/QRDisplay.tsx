import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/api/apiClient';
import QRCode from 'react-qr-code';
import { RefreshCw, AlertTriangle, Clock, CheckCircle, Play } from 'lucide-react';

export const QRDisplay = () => {
  const [qrData, setQrData] = useState<{ token: string, meal: string, expiresAt: Date, mealEndsAt: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingMeal, setStartingMeal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  
  // We'll use AudioContext for a reliable beep without needing an external file.
  const playAlarm = () => {
    if (!alarmEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 600; // Hz
      
      // Beep pattern
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };
  
  // Live Scans
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [recentScan, setRecentScan] = useState<any>(null);

  const handleQuickStart = async () => {
    setStartingMeal(true);
    try {
      await apiClient.post('/admin/meals/quick-start');
      await fetchCurrentQR();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start meal session');
    } finally {
      setStartingMeal(false);
    }
  };

  const fetchLiveScans = async () => {
    try {
      const now = new Date();
      const res = await apiClient.get(`/admin/scans/live?since=${lastCheck.toISOString()}`);
      if (res.data && res.data.length > 0) {
        // Show the most recent scan
        const latest = res.data[res.data.length - 1];
        setRecentScan(latest);
        
        if (latest.result === 'DUPLICATE') {
          playAlarm();
        } else {
          setTimeout(() => setRecentScan(null), 5000); // Clear after 5 seconds if success
        }
      }
      setLastCheck(now);
    } catch (err) {
      // fail silently for polling
    }
  };

  useEffect(() => {
    const liveInterval = setInterval(fetchLiveScans, 3000);
    return () => clearInterval(liveInterval);
  }, [lastCheck]);

  const fetchCurrentQR = async () => {
    try {
      const res = await apiClient.get('/admin/qr/current');
      if (res.data.status === 'no_active_meal') {
        setError('NO ACTIVE MEAL');
        setQrData(null);
        return;
      }
      setError(null);
      setQrData({
        token: res.data.qr_token,
        meal: res.data.meal,
        expiresAt: new Date(res.data.expires_at),
        mealEndsAt: new Date(res.data.meal_ends_at)
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch QR');
      setQrData(null);
    }
  };

  useEffect(() => {
    fetchCurrentQR();
    const interval = setInterval(fetchCurrentQR, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!qrData) return;
    
    const updateCountdown = () => {
      const now = new Date();
      if (now > qrData.mealEndsAt) {
        setError('MEAL SESSION ENDED');
        setQrData(null);
        setTimeLeft(0);
        return;
      }
      
      const secondsLeft = Math.floor((qrData.expiresAt.getTime() - now.getTime()) / 1000);
      if (secondsLeft <= 0) {
        // Force immediate refresh if it expired between polls
        fetchCurrentQR();
      } else {
        setTimeLeft(secondsLeft);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [qrData]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-lg text-center mb-8">
        <h1 className="text-4xl font-bold text-secondary mb-2">University Cafeteria</h1>
        <p className="text-xl text-text-muted">Meal Verification Station</p>
      </div>

      <Card className={`w-full max-w-lg shadow-xl border-2 relative overflow-hidden ${qrData ? 'border-primary/50' : 'border-border'}`}>
        {recentScan && (
          <div className={`absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between text-white animate-in slide-in-from-top-full duration-300 ${recentScan.result === 'SUCCESS' ? 'bg-green-500' : 'bg-red-600'}`}>
            <div className="flex items-center gap-3">
              {recentScan.result === 'SUCCESS' ? <CheckCircle size={24} /> : <AlertTriangle size={24} className="animate-pulse" />}
              <div>
                <p className="font-bold text-lg">{recentScan.student_name} ({recentScan.student_id})</p>
                <p className="text-sm opacity-90">{recentScan.result === 'SUCCESS' ? 'Meal claimed successfully' : `🚨 DUPLICATE / INVALID SCAN: ${recentScan.reason}`}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs opacity-75 font-mono">
                {new Date(recentScan.time).toLocaleTimeString()}
              </div>
              {recentScan.result !== 'SUCCESS' && (
                <div className="flex gap-2 mt-1">
                  <button onClick={() => { setRecentScan(null); }} className="text-xs bg-black/20 hover:bg-black/40 px-2 py-1 rounded">Dismiss Alert</button>
                </div>
              )}
            </div>
          </div>
        )}
        <CardHeader className="text-center pb-4 border-b border-border mt-2">
          {qrData ? (
            <>
              <Badge variant="success" className="mx-auto mb-2 text-lg px-4 py-1">{qrData.meal} - OPEN</Badge>
              <p className="text-sm text-text-muted">
                Ends at {qrData.mealEndsAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </>
          ) : (
            <CardTitle className="text-2xl">Station Closed</CardTitle>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8">
          {error ? (
            <div className="flex flex-col items-center justify-center text-danger p-8 bg-danger/5 rounded-xl w-full border border-danger/20">
              <AlertTriangle size={64} className="mb-4 opacity-80" />
              <h2 className="text-2xl font-bold text-center tracking-wide">{error}</h2>
              <p className="text-text-muted mt-2">Scanning is currently unavailable.</p>
            </div>
          ) : qrData ? (
            <div className="flex flex-col items-center w-full">
              <div className="bg-white p-6 rounded-2xl shadow-inner border-4 border-primary/20 transition-all transform hover:scale-105 duration-300">
                <QRCode value={qrData.token} size={320} level="H" />
              </div>
              <div className="mt-8 bg-surface px-6 py-3 rounded-full border border-border flex items-center gap-3">
                <Clock className="text-primary" size={24} />
                <span className="text-xl font-mono font-bold text-secondary">
                  VALID FOR {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-text-muted animate-pulse text-lg">Initializing securely...</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-surface-hover rounded-b-lg border-t border-border p-4">
          <Button 
            onClick={() => setAlarmEnabled(!alarmEnabled)} 
            variant={alarmEnabled ? "primary" : "outline"} 
            className="flex items-center gap-2"
          >
            {alarmEnabled ? "🔊 Alarm Enabled" : "🔈 Enable Alarm Sound"}
          </Button>
          <Button onClick={() => { setLoading(true); fetchCurrentQR().then(()=>setLoading(false)); }} disabled={loading} variant="outline" className="flex items-center gap-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Force Refresh
          </Button>
          {!qrData && (
            <Button 
              onClick={handleQuickStart} 
              isLoading={startingMeal}
              variant="primary" 
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play size={16} />
              Open Meal Session Now
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <p className="mt-8 text-text-muted max-w-md text-center">
        Please open the <strong>Student Portal</strong> on your mobile device, navigate to the Scan page, and point your camera at this screen.
      </p>
    </div>
  );
};

const Badge = ({ children, variant, className }: any) => {
  const variants: Record<string, string> = {
    default: 'bg-surface text-text-muted border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-600 border-green-500/20 text-green-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};
