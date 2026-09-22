import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AlertCircle } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger/10 text-danger mb-6">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-4xl font-black text-secondary tracking-tight mb-2">404</h1>
        <h2 className="text-2xl font-bold text-secondary mb-4">Page Not Found</h2>
        <p className="text-text-muted mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button 
          onClick={() => navigate(-1)} 
          className="w-full sm:w-auto"
          size="lg"
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};
