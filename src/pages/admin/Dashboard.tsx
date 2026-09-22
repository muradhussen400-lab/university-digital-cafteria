import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Users, UtensilsCrossed, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          apiClient.get('/admin/dashboard'),
          apiClient.get('/admin/alerts')
        ]);
        setStats(statsRes.data);
        setAlerts(alertsRes.data.slice(0, 5)); // Show top 5 recent alerts
      } catch (err) {
        console.error("Failed to load admin dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary">Dashboard Overview</h2>
        <p className="text-text-muted">Welcome back. Here's what's happening today.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center animate-pulse text-text-muted">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-secondary">{stats?.total_students || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted mb-1">Meals Served Today</p>
                  <p className="text-3xl font-bold text-secondary">{stats?.meals_claimed_today || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <UtensilsCrossed size={24} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted mb-1">Active Alerts</p>
                  <p className="text-3xl font-bold text-secondary">{stats?.active_alerts || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle size={24} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle>System Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-surface border border-border rounded-xl p-6 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-2">
                    <UtensilsCrossed size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary">Active Meals: {stats?.active_meals}</h3>
                  <p className="text-text-muted mb-6">Open meal sessions currently accepting claims.</p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                    <Button onClick={() => navigate('/admin/qr-display')} className="w-full">
                      Launch QR Station
                    </Button>
                    <Button onClick={() => navigate('/admin/meals')} variant="outline" className="w-full">
                      Manage Sessions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Alerts</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/alerts')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center p-4 text-text-muted">No recent alerts.</div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        {alert.severity === 'MEDIUM' || alert.severity === 'HIGH' ? (
                          <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text">{alert.message}</p>
                          <p className="text-sm text-text-muted">{formatTime(alert.created_at)}</p>
                        </div>
                      </div>
                      {alert.status === 'RESOLVED' ? (
                        <CheckCircle2 className="text-success" size={20} />
                      ) : (
                        <Badge variant="warning">New</Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
