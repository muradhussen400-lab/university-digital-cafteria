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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-text-muted mb-1 flex items-center justify-between">
                  Total Students <Users size={16} />
                </p>
                <p className="text-3xl font-bold text-secondary">{stats?.total_students || 0}</p>
                <div className="flex gap-2 mt-2 text-xs text-text-muted">
                  <span className="text-success">{stats?.activated_students || 0} active</span>
                  <span>•</span>
                  <span className="text-danger">{stats?.unactivated_students || 0} unactivated</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-text-muted mb-1 flex items-center justify-between">
                  Today's Claims <UtensilsCrossed size={16} />
                </p>
                <p className="text-3xl font-bold text-secondary">
                  {(stats?.breakfast_claims || 0) + (stats?.lunch_claims || 0) + (stats?.dinner_claims || 0)}
                </p>
                <div className="flex gap-2 mt-2 text-xs text-text-muted">
                  <span>B: {stats?.breakfast_claims || 0}</span>
                  <span>•</span>
                  <span>L: {stats?.lunch_claims || 0}</span>
                  <span>•</span>
                  <span>D: {stats?.dinner_claims || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-text-muted mb-1 flex items-center justify-between">
                  Failed Scans <AlertTriangle size={16} />
                </p>
                <p className="text-3xl font-bold text-secondary text-danger">
                  {(stats?.duplicate_attempts || 0) + (stats?.invalid_scans || 0)}
                </p>
                <div className="flex gap-2 mt-2 text-xs text-text-muted">
                  <span className="text-warning">{stats?.duplicate_attempts || 0} duplicate</span>
                  <span>•</span>
                  <span className="text-danger">{stats?.invalid_scans || 0} invalid</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-text-muted mb-1 flex items-center justify-between">
                  Active Alerts <AlertTriangle size={16} />
                </p>
                <p className="text-3xl font-bold text-secondary">{stats?.active_alerts || 0}</p>
                <div className="mt-2 text-xs text-text-muted">Requires admin review</div>
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
                  <h3 className="text-2xl font-bold text-secondary">Control Station</h3>
                  <p className="text-text-muted mb-6">Open meal sessions and manage active connections.</p>
                  
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
