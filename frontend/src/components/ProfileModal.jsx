import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { X, Loader2, Save, User, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, login } = useContext(AuthContext); // We'll use login to update the context state
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  const [isLoading, setIsLoading] = useState(false);

  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put('http://localhost:5000/api/auth/profile', { name, email }, config);
      toast.success('Profile updated successfully!');
      
      // Update local context
      login(res.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put('http://localhost:5000/api/auth/password', { password }, config);
      toast.success('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4">
      <div className="bg-gaming-card border border-gaming-neon rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(139,92,246,0.3)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gaming-darker">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <User className="text-gaming-neon w-6 h-6" /> Profile Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'profile' ? 'text-gaming-neon border-b-2 border-gaming-neon bg-gaming-dark' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'}`}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'password' ? 'text-gaming-neon border-b-2 border-gaming-neon bg-gaming-dark' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'}`}
          >
            Security
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm font-bold mb-2">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gaming-dark border-2 border-gray-700 focus:border-gaming-neon rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm font-bold mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gaming-dark border-2 border-gray-700 focus:border-gaming-neon rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || (name === user?.name && email === user?.email)}
                className="w-full py-3 bg-gaming-neon hover:bg-violet-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword}>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm font-bold mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gaming-dark border-2 border-gray-700 focus:border-gaming-neon rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm font-bold mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gaming-dark border-2 border-gray-700 focus:border-gaming-neon rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
