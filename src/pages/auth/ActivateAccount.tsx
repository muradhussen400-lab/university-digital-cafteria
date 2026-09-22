import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Utensils } from 'lucide-react';
import { apiClient } from '../../services/api/apiClient';

export const ActivateAccount = () => {
  const [studentId, setStudentId] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!studentId.trim() || !activationCode.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/activate', {
        student_id: studentId,
        activation_code: activationCode,
        password: password
      });
      
      setSuccess('Account activated successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred during activation. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Utensils size={32} />
          </div>
          <h1 className="text-2xl font-bold text-secondary">Activate Account</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Setup Student Access</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="p-4 rounded-md bg-green-50 text-green-700 text-center border border-green-200">
                {success}
              </div>
            ) : (
              <form onSubmit={handleActivate} className="space-y-4">
                <Input
                  label="Student ID"
                  placeholder="e.g. 1802629"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
                <Input
                  label="Activation Code"
                  placeholder="Enter the 8-character code"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                />
                
                <div className="border-t border-border my-4 pt-4">
                  <h3 className="text-sm font-medium mb-3">Create Password</h3>
                  <div className="space-y-4">
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-danger/10 text-danger text-sm border border-danger/20">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
                  Activate Account
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-border pt-6 pb-6">
            <Link to="/login" className="text-sm text-primary font-medium hover:underline">
              ← Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
