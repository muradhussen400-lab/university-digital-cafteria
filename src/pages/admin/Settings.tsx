import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, KeyRound } from 'lucide-react';
import { apiClient } from '../../services/api/apiClient';

export const SettingsPage = () => {
  const [strictScanning, setStrictScanning] = useState(true);
  const [autoArchive, setAutoArchive] = useState(false);
  const [academicYear, setAcademicYear] = useState('2023 - 2024');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/admin/settings');
      setStrictScanning(res.data.strict_scanning);
      setAutoArchive(res.data.auto_archive_alerts);
      setAcademicYear(res.data.academic_year);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await apiClient.put('/admin/settings', {
        academic_year: academicYear,
        strict_scanning: strictScanning,
        auto_archive_alerts: autoArchive
      });
      setSuccessMsg('Settings saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    
    if (!currentPassword || !newPassword) {
      setPwdError('Both fields are required.');
      return;
    }
    
    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters.');
      return;
    }

    setIsChangingPwd(true);
    try {
      await apiClient.post('/auth/change-admin-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setPwdSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  if (isLoading) {
    return <div className="text-text-muted">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-secondary">System Settings</h2>
        <p className="text-text-muted">Configure global application preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Configuration</CardTitle>
          <p className="text-sm text-text-muted">Manage basic system rules and parameters.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="font-semibold text-text">Strict Scanning Mode</p>
              <p className="text-sm text-text-muted">Reject any scan not matching current meal session time strictly.</p>
            </div>
            <div 
              onClick={() => setStrictScanning(!strictScanning)}
              className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${strictScanning ? 'bg-primary' : 'bg-surface border border-border'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${strictScanning ? 'bg-white left-7' : 'bg-border left-1'}`}></span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="font-semibold text-text">Auto-Archive Alerts</p>
              <p className="text-sm text-text-muted">Automatically archive low-severity alerts after 48 hours.</p>
            </div>
            <div 
              onClick={() => setAutoArchive(!autoArchive)}
              className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${autoArchive ? 'bg-primary' : 'bg-surface border border-border'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${autoArchive ? 'bg-white left-7' : 'bg-border left-1'}`}></span>
            </div>
          </div>

          <div className="pt-4">
            <p className="font-semibold text-text mb-2">Academic Year</p>
            <select 
              value={academicYear} 
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full sm:w-64 p-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="2024 - 2025">2024 - 2025</option>
              <option value="2023 - 2024">2023 - 2024</option>
              <option value="2022 - 2023">2022 - 2023</option>
            </select>
          </div>
          
          {successMsg && (
            <div className="p-3 bg-success/10 text-success rounded border border-success/20">
              {successMsg}
            </div>
          )}

          <div className="pt-6 flex justify-end">
            <Button onClick={handleSaveSettings} isLoading={isSaving} className="flex items-center gap-2">
              <Save size={18} />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <p className="text-sm text-text-muted">Update your administrator password.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <Input 
              label="Current Password" 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input 
              label="New Password" 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
            
            {pwdError && <div className="text-sm text-danger">{pwdError}</div>}
            {pwdSuccess && <div className="text-sm text-success">{pwdSuccess}</div>}
            
            <Button type="submit" isLoading={isChangingPwd} className="flex items-center gap-2">
              <KeyRound size={18} />
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
