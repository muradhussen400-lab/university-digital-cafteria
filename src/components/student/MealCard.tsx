import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Clock, CheckCircle2, Lock } from 'lucide-react';
import { MealSession } from '../../types';

interface MealCardProps {
  meal: MealSession;
  status: 'AVAILABLE' | 'USED' | 'CLOSED';
}

export const MealCard = ({ meal, status }: MealCardProps) => {
  const navigate = useNavigate();

  const getStatusConfig = () => {
    switch (status) {
      case 'AVAILABLE':
        return {
          color: 'border-primary shadow-sm bg-white',
          badgeVariant: 'info' as const,
          icon: <Clock size={18} className="text-primary" />,
          action: (
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/student/scan')}
            >
              Scan QR
            </Button>
          ),
        };
      case 'USED':
        return {
          color: 'border-success/30 bg-success/5 opacity-80',
          badgeVariant: 'success' as const,
          icon: <CheckCircle2 size={18} className="text-success" />,
          action: (
            <div className="w-full mt-4 h-10 flex items-center justify-center text-success font-medium rounded bg-success/10">
              <CheckCircle2 size={18} className="mr-2" /> Used
            </div>
          ),
        };
      case 'CLOSED':
      default:
        return {
          color: 'border-border bg-gray-50 opacity-60',
          badgeVariant: 'neutral' as const,
          icon: <Lock size={18} className="text-text-muted" />,
          action: (
            <div className="w-full mt-4 h-10 flex items-center justify-center text-text-muted font-medium rounded bg-gray-200">
              Closed
            </div>
          ),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${config.color}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {config.icon}
            <h3 className="font-semibold text-lg">{meal.name}</h3>
          </div>
          <Badge variant={config.badgeVariant}>{status}</Badge>
        </div>
        <p className="text-sm text-text-muted mb-1">
          {meal.startTime} - {meal.endTime}
        </p>
        {config.action}
      </CardContent>
    </Card>
  );
};
