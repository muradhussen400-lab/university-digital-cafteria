import { useState, useEffect, useCallback } from 'react';

export type ScanResultStatus = 'DEFAULT' | 'PROCESSING' | 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'EXPIRED' | 'CLOSED' | 'OFFLINE';

export const useCafeteriaSocket = () => {
  const [status, setStatus] = useState<ScanResultStatus>('DEFAULT');
  const [isConnected, setIsConnected] = useState(true); // Mock connected
  
  // Mock WebSocket connection logic
  useEffect(() => {
    // In a real app, this would be new WebSocket('ws://...')
    setIsConnected(true);
    
    return () => {
      setIsConnected(false);
    };
  }, []);

  // Simulates an incoming scan result from the server
  const simulateScanResult = useCallback((newStatus: ScanResultStatus) => {
    setStatus(newStatus);
    
    // Automatically revert to DEFAULT after 3 seconds if not an error or default
    if (newStatus !== 'DEFAULT' && newStatus !== 'OFFLINE' && newStatus !== 'CLOSED') {
      setTimeout(() => {
        setStatus('DEFAULT');
      }, 3000);
    }
  }, []);

  return {
    status,
    isConnected,
    simulateScanResult, // Exporting this for demo/testing purposes
  };
};
