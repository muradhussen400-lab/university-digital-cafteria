import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../services/api/apiClient';

export const AlertsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterDate) params.append('date', filterDate);
      if (filterSeverity && filterSeverity !== 'ALL') params.append('severity', filterSeverity);
      if (filterStatus && filterStatus !== 'ALL') params.append('status', filterStatus);
      
      const response = await apiClient.get(`/admin/alerts?${params.toString()}`);
      setAlerts(response.data || []);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [searchTerm, filterDate, filterSeverity, filterStatus]);

  const resolveAlert = async (id: string) => {
    try {
      await apiClient.post(`/admin/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };



  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Security Alerts</h2>
          <p className="text-text-muted">Monitor and resolve system security alerts.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Alerts</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <Input 
                  placeholder="Search alerts..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant={isFilterOpen ? "primary" : "outline"}
                className="flex items-center gap-2"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </div>
          </div>
          
          {isFilterOpen && (
            <div className="mt-4 p-4 bg-surface rounded-lg border border-border flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-auto space-y-1">
                <label className="text-xs font-medium text-text-muted">Date</label>
                <Input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full sm:w-auto space-y-1">
                <label className="text-xs font-medium text-text-muted">Severity</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="w-full sm:w-auto space-y-1">
                <label className="text-xs font-medium text-text-muted">Status</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => {
                  setFilterDate('');
                  setFilterSeverity('ALL');
                  setFilterStatus('ALL');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border text-text-muted text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Alert Details</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted animate-pulse">Loading alerts...</td></tr>
                ) : alerts.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">No alerts found.</td></tr>
                ) : (
                  alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                          }`}>
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-secondary">{alert.message}</p>
                            {alert.student_id && <p className="text-sm text-text-muted">Student ID: {alert.student_id}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={
                            alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 'warning'
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={alert.status === 'RESOLVED' ? 'success' : 'default'}
                        >
                          {alert.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-sm">
                        {formatTime(alert.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {alert.status !== 'RESOLVED' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle2 size={16} className="mr-2" />
                            Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
