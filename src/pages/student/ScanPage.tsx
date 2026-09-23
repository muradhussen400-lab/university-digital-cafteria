import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, QrCode, Camera, Image as ImageIcon, RefreshCcw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '../../services/api/apiClient';

type ScanState = 'IDLE' | 'VERIFYING' | 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'CLOSED' | 'ERROR';

export const ScanPage = () => {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('IDLE');
  
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermissionError, setHasPermissionError] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clean up scanner on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop().catch(console.error);
      setIsScanning(false);
    }
    
    setScanState('VERIFYING');

    try {
      const response = await apiClient.post('/student/scan', { qr_token: decodedText });
      const { status } = response.data;
      
      if (status === 'ACCESS_GRANTED') {
        setScanState('SUCCESS');
      } else if (status === 'DUPLICATE') {
        setScanState('DUPLICATE');
      } else if (status === 'INVALID' || status === 'EXPIRED') {
        setScanState('INVALID');
      } else if (status === 'CLOSED') {
        setScanState('CLOSED');
      } else {
        setScanState('ERROR');
      }
    } catch (err) {
      console.error("Scan verification failed:", err);
      setScanState('ERROR');
    }
  };

  const startScanner = async (cameraConfig: any) => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        cameraConfig,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {} // ignore scan failures (happens every frame it doesn't see a QR)
      );
      
      setIsScanning(true);
      setHasPermissionError(false);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setHasPermissionError(true);
      setIsScanning(false);
    }
  };

  const handleStartCamera = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to the first camera (usually back camera on phones)
        setActiveCameraId(devices[0].id);
        startScanner({ deviceId: { exact: devices[0].id } });
      } else {
        // Fallback to facingMode if devices enumeration fails but camera exists
        startScanner({ facingMode });
      }
    } catch (err) {
      console.error("Camera permission error:", err);
      setHasPermissionError(true);
    }
  };

  const handleSwitchCamera = () => {
    if (cameras.length > 1 && activeCameraId) {
      const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      setActiveCameraId(nextCamera.id);
      startScanner({ deviceId: { exact: nextCamera.id } });
    } else {
      // Fallback: toggle facing mode
      const newMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(newMode);
      startScanner({ facingMode: newMode });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
          setIsScanning(false);
        }
        
        const decodedText = await scannerRef.current.scanFile(file, true);
        onScanSuccess(decodedText);
      } catch (err) {
        console.error("Error scanning file:", err);
        alert("Could not find a valid QR code in the selected image.");
      }
    }
  };

  // We remove the automatic start on IDLE so they have to click 'Open Scanner'
  useEffect(() => {
    // Only run cleanups or logic if needed
  }, [scanState]);

  const resetScan = () => {
    setScanState('IDLE');
  };

  const renderStateContent = () => {
    switch (scanState) {
      case 'IDLE':
        return (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-secondary">Scan attendance QR</h1>
            <p className="text-text-muted pb-2">
              The mentor's code refreshes every 15 seconds — just keep your camera pointed at it until it checks you in.
            </p>
            
            <div className="relative bg-black rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center shadow-lg">
              <div id="qr-reader" className="w-full"></div>
              
              {!isScanning && !hasPermissionError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <Camera size={80} className="text-white/30" />
                </div>
              )}

              {hasPermissionError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 space-y-4 text-center">
                  <AlertTriangle size={48} className="text-red-400" />
                  <p>Camera access denied or unavailable.</p>
                  <Button variant="primary" onClick={handleStartCamera}>Retry Camera Access</Button>
                </div>
              )}
            </div>

            {/* Custom Controls for Camera / Image */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 bg-white"
                onClick={handleStartCamera}
                disabled={isScanning}
              >
                <Camera size={18} />
                Open Scanner
              </Button>

              {isScanning && (
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2 bg-white"
                  onClick={handleSwitchCamera}
                >
                  <RefreshCcw size={18} />
                  Switch
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 bg-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={18} />
                Choose Image
              </Button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </div>
          </div>
        );
      
      case 'VERIFYING':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <QrCode size={64} className="text-primary/30 animate-pulse" />
              <div className="absolute inset-0 border-t-2 border-primary animate-spin rounded-full"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-secondary">Verifying...</h3>
              <p className="text-text-muted mt-1">Please wait while we check your access</p>
            </div>
          </div>
        );

      case 'SUCCESS':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 size={48} className="text-success" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-success mb-2">Access Granted</h2>
              <p className="text-text">Your lunch has been recorded successfully.</p>
              <div className="mt-6 p-4 bg-surface rounded-lg border border-border inline-block">
                <p className="font-semibold text-secondary">Lunch Today</p>
                <p className="text-sm text-text-muted">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <Button className="w-full mt-4" size="lg" onClick={() => navigate('/student/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        );

      case 'DUPLICATE':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center">
              <AlertTriangle size={48} className="text-warning" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-warning mb-2">Meal Already Used</h2>
              <p className="text-text">Your lunch has already been recorded for this meal session.</p>
            </div>
            <Button className="w-full mt-4" variant="secondary" size="lg" onClick={() => navigate('/student/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        );

      case 'INVALID':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center">
              <XCircle size={48} className="text-danger" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-danger mb-2">Invalid QR Code</h2>
              <p className="text-text">Please scan the QR code currently displayed at the cafeteria entrance.</p>
            </div>
            <Button className="w-full mt-4" variant="secondary" size="lg" onClick={resetScan}>
              Try Again
            </Button>
          </div>
        );

      case 'CLOSED':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <XCircle size={48} className="text-text-muted" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-secondary mb-2">Meal Session Closed</h2>
              <p className="text-text">This meal is not currently available.</p>
            </div>
            <Button className="w-full mt-4" variant="secondary" size="lg" onClick={() => navigate('/student/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        );

      case 'ERROR':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center">
              <AlertTriangle size={48} className="text-danger" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-danger mb-2">System Error</h2>
              <p className="text-text">There was a problem communicating with the server. Please try again.</p>
            </div>
            <Button className="w-full mt-4" variant="secondary" size="lg" onClick={resetScan}>
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 pt-4">
      {scanState !== 'IDLE' && (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="p-2 hover:bg-surface rounded-full transition-colors text-text-muted hover:text-text"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-secondary">Scan Meal QR</h1>
        </div>
      )}

      <Card className="border-0 shadow-none sm:border sm:shadow-sm sm:bg-white bg-transparent">
        <CardContent className="p-0 sm:p-6">
          {renderStateContent()}
        </CardContent>
      </Card>
    </div>
  );
};
