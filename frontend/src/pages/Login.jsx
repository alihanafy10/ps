import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Gamepad2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/auth/login`, {
        email,
        password,
      });

      login(data);
      toast.success('Login successful!', {
        style: {
          background: '#1e293b',
          color: '#fff',
        },
        iconTheme: {
          primary: '#8b5cf6',
          secondary: '#fff',
        },
      });

      if (data.role === 'SUPER_ADMIN') {
        navigate('/super-secret-admin');
      } else if (data.role === 'OWNER') {
        navigate('/admin');
      } else {
        navigate('/staff');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to login', {
        style: {
          background: '#1e293b',
          color: '#ef4444',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gaming-card rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gaming-dark p-3 rounded-full border border-gaming-neon/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Gamepad2 className="w-10 h-10 text-gaming-neon" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h2>
          <p className="text-center text-gray-400 mb-8">Sign in to your lounge account</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-neon focus:ring-1 focus:ring-gaming-neon text-white transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-neon focus:ring-1 focus:ring-gaming-neon text-white transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gaming-neon hover:bg-violet-600 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-gaming-accent hover:text-cyan-400 font-medium transition-colors">
              Register Lounge
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
