import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../services/api/apiClient';

export const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get('/student/history');
        setHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="p-2 hover:bg-surface rounded-full transition-colors text-text-muted hover:text-text"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-secondary">Meal History</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <Input 
            className="pl-10" 
            placeholder="Search meals..." 
          />
        </div>
        <button className="p-2 border border-border rounded-lg hover:bg-surface text-text-muted transition-colors flex items-center gap-2">
          <Filter size={20} />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-text-muted animate-pulse">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No meal history found.</div>
            ) : (
              history.map((record, index) => (
                <div key={index} className="p-4 sm:p-6 flex items-center justify-between hover:bg-surface/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold hidden sm:flex">
                      {record.meal_type.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{record.meal_type}</h3>
                      <p className="text-sm text-text-muted mt-1">{formatDate(record.date)}</p>
                      <p className="text-xs text-text-muted mt-0.5">{formatTime(record.claimed_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">Claimed</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
