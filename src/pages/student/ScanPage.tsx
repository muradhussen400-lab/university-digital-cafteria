import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, QrCode } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiClient } from '../../services/api/apiClient';

type ScanState = 'IDLE' | 'VERIFYING' | 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'CLOSED' | 'ERROR';

export const ScanPage = () => {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('IDLE');

  useEffect(() => {
    // Only initialize scanner if we are in IDLE state
    if (scanState !== 'IDLE') return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = async (decodedText: string) => {
      // Pause scanner immediately
      scanner.pause();
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

    scanner.render(onScanSuccess, () => {});

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanState]);

  const renderStateContent = () => {
    switch (scanState) {
      case 'IDLE':
        return (
          <div className="text-center space-y-4">
            <p className="text-text-muted">Point your camera at the QR code displayed at the cafeteria entrance.</p>
            <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-primary/20 bg-black"></div>
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
            <Button className="w-full mt-4" variant="secondary" size="lg" onClick={() => setScanState('IDLE')}>
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

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="p-2 hover:bg-surface rounded-full transition-colors text-text-muted hover:text-text"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-secondary">Scan Meal QR</h1>
      </div>

      <Card className="border-0 shadow-none sm:border sm:shadow-sm sm:bg-white bg-transparent">
        <CardContent className="p-0 sm:p-6">
          {renderStateContent()}
        </CardContent>
      </Card>
    </div>
  );
};
