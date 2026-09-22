import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileBarChart, Download, Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { apiClient } from '../../services/api/apiClient';

export const ReportsPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await apiClient.get('/admin/reports');
      setStats(response.data);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.get('/admin/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cafeteria_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export CSV:", err);
      alert("Failed to export CSV.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary">System Reports</h2>
          <p className="text-text-muted">Analyze cafeteria usage and consumption metrics.</p>
        </div>
        <Button onClick={handleExportCSV} className="flex items-center gap-2">
          <Download size={20} />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="text-text-muted animate-pulse">Loading report data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-secondary mt-1">{stats?.total_students || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Users size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm font-medium">Successful Scans</p>
                    <p className="text-3xl font-bold text-success mt-1">{stats?.successful_claims || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <CheckCircle size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm font-medium">Duplicate Attempts</p>
                    <p className="text-3xl font-bold text-warning mt-1">{stats?.duplicate_attempts || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm font-medium">Invalid Scans</p>
                    <p className="text-3xl font-bold text-danger mt-1">{stats?.invalid_scans || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                    <XCircle size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Consumption (Placeholder)</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center bg-surface m-6 rounded-lg border border-border">
                <div className="text-center text-text-muted">
                  <FileBarChart size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Chart Visualization Placeholder</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours (Placeholder)</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center bg-surface m-6 rounded-lg border border-border">
                <div className="text-center text-text-muted">
                  <FileBarChart size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Heatmap Visualization Placeholder</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
