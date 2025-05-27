import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import {jwtDecode} from 'jwt-decode';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  console.log(import.meta.env.FRONTED_URL);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(import.meta.env.FRONTED_URL+'/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      let userId = data.userId || data.id;
      
      if (!userId && data.token) {
        try {
          const decoded = jwtDecode(data.token);
          userId = decoded.id || decoded.userId || decoded.sub;
        } catch (err) {
          // Error handling remains but without logging
        }
      }
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      if (userId) {
        localStorage.setItem('userId', userId);
      }
      
      setLoading(false);
      
      navigate('/face-verify', { state: { userId } });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="w-full flex justify-center mb-4">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Login to access your secure vault</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-input"
                />
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/90">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account? <Link to="/signup" className="text-primary hover:text-primary/90">Sign up</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;