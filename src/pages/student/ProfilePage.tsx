import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserCircle, Key, LogOut, CheckCircle } from 'lucide-react';
import { apiClient } from '../../services/api/apiClient';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/student/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccess("Password updated successfully.");
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-secondary">Student Profile</h2>
        <p className="text-text-muted">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserCircle size={80} />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h3 className="text-3xl font-bold text-secondary">{user?.name || 'Student Name'}</h3>
              <p className="text-lg text-text-muted">ID: {user?.studentId || 'N/A'}</p>
              <div className="pt-2">
                <Badge variant="success" className="px-3 py-1">Account Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 rounded-lg flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {!isEditing ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-surface rounded-lg border border-border gap-4">
              <div>
                <p className="font-semibold text-text">Change Password</p>
                <p className="text-sm text-text-muted">Update your account password for security.</p>
              </div>
              <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                <Key size={18} />
                Update Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="p-4 bg-surface rounded-lg border border-border space-y-4">
              <h4 className="font-semibold text-text border-b border-border pb-2 mb-4">Update Password</h4>
              
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input 
                type="password" 
                label="Current Password" 
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <Input 
                type="password" 
                label="New Password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Input 
                type="password" 
                label="Confirm New Password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditing(false);
                  setError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Password'}
                </Button>
              </div>
            </form>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-danger/5 rounded-lg border border-danger/20 gap-4 mt-4">
            <div>
              <p className="font-semibold text-danger">Sign Out</p>
              <p className="text-sm text-danger/70">Securely log out of this device.</p>
            </div>
            <Button variant="danger" className="flex items-center gap-2 w-full sm:w-auto" onClick={logout}>
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
