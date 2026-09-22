import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Eye, EyeOff, Utensils } from 'lucide-react';
import { apiClient } from '../../services/api/apiClient';

export const Login = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentId.trim()) {
      setError('Student ID or Username is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', studentId);
      formData.append('password', password);

      const response = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const { access_token } = response.data;
      
      // Fetch user data with the new token
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      const userRes = await apiClient.get('/auth/me');
      
      login(access_token, { 
        id: userRes.data.id, 
        name: userRes.data.username, 
        role: userRes.data.role.toLowerCase(), 
        studentId: userRes.data.student_id 
      });
      
      if (userRes.data.role.toLowerCase() === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred during login. Please try again.');
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
          <h1 className="text-2xl font-bold text-secondary">Digital Cafeteria</h1>
          <p className="text-text-muted mt-2">University Meal Verification System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Student ID or Username"
                placeholder="Enter your ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                autoComplete="username"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-text-muted hover:text-text focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col border-t border-border pt-6 pb-6 space-y-4">
            <p className="text-xs text-text-muted text-center max-w-xs">
              Only university-approved students and staff can access this system.
            </p>
            <div className="flex flex-col space-y-2 text-sm text-center">
              <p>
                New Student? <Link to="/activate" className="text-primary font-medium hover:underline">Activate your account here</Link>
              </p>
              <p>
                <Link to="/forgot-password" className="text-primary font-medium hover:underline">Forgot your password?</Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
