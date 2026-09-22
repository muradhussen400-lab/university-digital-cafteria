import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ArrowLeft, User, Activity, Clock } from 'lucide-react';

export const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data for the specific student
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/students')} className="px-3">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-secondary">Student Details</h2>
          <p className="text-text-muted">ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <User size={48} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text">Abebe Kebede</h3>
              <p className="text-text-muted">{id}</p>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-muted mb-1">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary" /> Recent Activity
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md text-primary">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-text text-sm">Lunch Scan</p>
                      <p className="text-xs text-text-muted">Today, 12:45 PM</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-success">Successful</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
