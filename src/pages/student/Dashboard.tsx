import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MealCard } from '../../components/student/MealCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Activity, ArrowRight, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meals, setMeals] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [mealsRes, historyRes] = await Promise.all([
          apiClient.get('/student/meals/today'),
          apiClient.get('/student/history')
        ]);
        
        setMeals(mealsRes.data);
        setHistory(historyRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Convert API meals to the format MealCard expects, ensuring all 3 are shown
  const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER'];
  const displayMeals = mealTypes.map(mealName => {
    // Find if admin scheduled it
    const m = meals.find(apiMeal => apiMeal.meal_type === mealName);
    
    // Determine if student claimed it by looking at history for today
    const isClaimed = history.some(h => 
      h.meal_type === mealName && formatDate(h.date) === formatDate(new Date().toISOString())
    );
    
    let displayStatus = 'CLOSED';
    if (isClaimed) {
      displayStatus = 'USED';
    } else if (m && m.status === 'OPEN') {
      displayStatus = 'AVAILABLE';
    } else if (m && m.status === 'UPCOMING') {
      displayStatus = 'CLOSED';
    }

    return {
      id: m?.id || mealName,
      name: mealName,
      startTime: m ? formatTime(m.starts_at) : '--:--',
      endTime: m ? formatTime(m.ends_at) : '--:--',
      status: displayStatus
    };
  });

  // Calculate stats
  const todayClaims = history.filter(h => formatDate(h.date) === formatDate(new Date().toISOString())).length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary">Student: {user?.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-text-muted">ID: {user?.studentId || 'N/A'}</span>
                <span className="text-border">•</span>
                <Badge variant="success">Account Active</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          Today's Meal Status
        </h3>
        {loading ? (
          <p className="text-text-muted animate-pulse">Loading meals...</p>
        ) : displayMeals.length === 0 ? (
          <p className="text-text-muted">No meal sessions scheduled for today.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal as any}
                status={meal.status as 'AVAILABLE' | 'USED' | 'CLOSED'}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface p-4 rounded-lg border border-border">
                <p className="text-sm text-text-muted mb-1">Today's Meals</p>
                <p className="text-2xl font-bold text-secondary">{todayClaims} <span className="text-lg text-text-muted font-normal">/ {displayMeals.length}</span></p>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border">
                <p className="text-sm text-text-muted mb-1">Total Scans</p>
                <p className="text-2xl font-bold text-secondary">{history.length}</p>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border">
                <p className="text-sm text-text-muted mb-1">Account</p>
                <p className="text-lg font-bold text-secondary truncate text-green-600">Verified</p>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border">
                <p className="text-sm text-text-muted mb-1">Last Scan</p>
                <p className="text-lg font-bold text-secondary truncate">
                  {history.length > 0 ? formatTime(history[0].claimed_at) : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Activity className="text-text-muted" size={20} />
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
               <p className="text-text-muted animate-pulse">Loading activity...</p>
            ) : history.length === 0 ? (
               <p className="text-text-muted">No scan history available.</p>
            ) : history.slice(0, 3).map((activity, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-border last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-text">{activity.meal_type}</p>
                  <p className="text-xs text-text-muted">{formatDate(activity.date)}, {formatTime(activity.claimed_at)}</p>
                </div>
                <Badge variant="success">Claimed</Badge>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full mt-2" 
              onClick={() => navigate('/student/history')}
            >
              View Full History <ArrowRight size={16} className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
