import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Rocket } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    loungeName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/auth/register`, formData);

      login(data);
      toast.success('Lounge registered successfully!', {
        style: {
          background: '#1e293b',
          color: '#fff',
        },
        iconTheme: {
          primary: '#8b5cf6',
          secondary: '#fff',
        },
      });

      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed', {
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
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gaming-dark p-3 rounded-full border border-gaming-accent/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Rocket className="w-10 h-10 text-gaming-accent" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-white mb-2">Create Lounge</h2>
          <p className="text-center text-gray-400 mb-8">Set up your new gaming lounge</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Owner Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent focus:ring-1 focus:ring-gaming-accent text-white transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Lounge Name</label>
              <input
                type="text"
                name="loungeName"
                value={formData.loungeName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent focus:ring-1 focus:ring-gaming-accent text-white transition-colors"
                placeholder="Level Up Gaming"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent focus:ring-1 focus:ring-gaming-accent text-white transition-colors"
                placeholder="owner@lounge.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent focus:ring-1 focus:ring-gaming-accent text-white transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-4 bg-gaming-accent hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Register Lounge'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-gaming-neon hover:text-violet-400 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
