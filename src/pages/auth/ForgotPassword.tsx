import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { apiClient } from '../../services/api/apiClient';

export const ForgotPassword = () => {
  const [studentId, setStudentId] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!studentId.trim() || !resetCode.trim() || !password || !confirmPassword) {
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
      await apiClient.post('/auth/reset-password', {
        student_id: studentId.trim(),
        reset_code: resetCode.trim(),
        new_password: password
      });
      
      setSuccess('Password reset successfully. You can now login with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred during password reset. Please try again.');
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
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-bold text-secondary">Reset Password</h1>
          <p className="text-text-muted mt-2">Enter your Student ID and Reset Code</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="p-4 rounded-md bg-success/10 text-success text-center border border-success/20">
                {success}
                <p className="mt-4 text-sm text-text-muted">Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Student ID"
                  placeholder="e.g., 1802456"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />

                <Input
                  label="8-Character Reset Code"
                  placeholder="e.g., K8P4X2M7"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="font-mono uppercase"
                />

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-text-muted hover:text-text focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-danger/10 text-danger text-sm border border-danger/20">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  isLoading={isLoading}
                >
                  Reset Password
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex-col border-t border-border pt-6 pb-6 space-y-4">
            <p className="text-sm text-center">
              Remember your password? <Link to="/login" className="text-primary font-medium hover:underline">Back to Login</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
