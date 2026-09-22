import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/api/apiClient';

export const ScansPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scans, setScans] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterMeal, setFilterMeal] = useState('ALL');
  const [filterResult, setFilterResult] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchScans = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterDate) params.append('date', filterDate);
      if (filterMeal && filterMeal !== 'ALL') params.append('meal', filterMeal);
      if (filterResult && filterResult !== 'ALL') params.append('result', filterResult);
      
      const response = await apiClient.get(`/admin/scans?${params.toString()}`);
      setScans(response.data || []);
    } catch (err) {
      console.error("Failed to load scans:", err);
    }
  };

  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 10000); // Auto-refresh every 10 seconds for "Live Scans"
    return () => clearInterval(interval);
  }, [searchTerm, filterDate, filterMeal, filterResult]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterDate) params.append('date', filterDate);
      if (filterMeal && filterMeal !== 'ALL') params.append('meal', filterMeal);
      if (filterResult && filterResult !== 'ALL') params.append('result', filterResult);
      
      const response = await apiClient.get(`/admin/reports/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filenameDate = filterDate || new Date().toISOString().split('T')[0];
      link.setAttribute('download', `live-scans-${filenameDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'SUCCESS': return <CheckCircle2 className="text-success" size={18} />;
      case 'DUPLICATE': return <AlertTriangle className="text-warning" size={18} />;
      case 'INVALID': return <XCircle className="text-danger" size={18} />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'SUCCESS': return <Badge variant="success">Success</Badge>;
      case 'DUPLICATE': return <Badge variant="warning">Duplicate</Badge>;
      case 'INVALID': return <Badge variant="danger">Invalid</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Live Scan Logs</h2>
          <p className="text-text-muted">Real-time monitoring of cafeteria QR scans.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            Live Updates
          </span>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <Input 
                placeholder="Search by student name or ID..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant={isFilterOpen ? "primary" : "outline"}
                className="flex items-center gap-2 w-full sm:w-auto"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} />
                Filter
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleExport}>
                Export
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
                <label className="text-xs font-medium text-text-muted">Meal</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={filterMeal}
                  onChange={(e) => setFilterMeal(e.target.value)}
                >
                  <option value="ALL">All Meals</option>
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>
              <div className="w-full sm:w-auto space-y-1">
                <label className="text-xs font-medium text-text-muted">Result</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                >
                  <option value="ALL">All Results</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="DUPLICATE">DUPLICATE</option>
                  <option value="INVALID">INVALID</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </div>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => {
                  setFilterDate('');
                  setFilterMeal('ALL');
                  setFilterResult('ALL');
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
                  <th className="px-6 py-4 font-medium">Scan ID</th>
                  <th className="px-6 py-4 font-medium">Student Info</th>
                  <th className="px-6 py-4 font-medium">Meal Session</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-text-muted">{scan.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-secondary">{scan.student}</p>
                        <p className="text-sm text-text-muted">{scan.studentId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text">{scan.meal}</td>
                    <td className="px-6 py-4 text-text">{scan.time}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(scan.status)}
                        {getStatusBadge(scan.status)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
