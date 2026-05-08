import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, Plus, User } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileModal from '../components/ProfileModal';

const SuperAdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [lounges, setLounges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchLounges();
  }, []);

  const fetchLounges = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/lounges', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setLounges(res.data);
    } catch (error) {
      toast.error('Failed to fetch lounges');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtend = async (userId, days) => {
    try {
      await axios.post(
        'http://localhost:5000/api/admin/extend-subscription',
        { userId, daysToAdd: days },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`Added ${days} days!`);
      fetchLounges();
    } catch (error) {
      toast.error('Failed to extend subscription');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gaming-darker text-white p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black flex items-center gap-3 text-red-500">
            <ShieldAlert className="w-8 h-8" /> SUPER ADMIN
          </h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors font-bold"
            >
              <User className="w-5 h-5" />
              Profile
            </button>
            <button onClick={logout} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-bold">
              Logout
            </button>
          </div>
        </header>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-gray-950 border-b border-gray-800">
              <tr>
                <th className="p-4 text-gray-400">Lounge Name</th>
                <th className="p-4 text-gray-400">Area</th>
                <th className="p-4 text-gray-400">Owner Email</th>
                <th className="p-4 text-gray-400">Expiry Date</th>
                <th className="p-4 text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lounges.map((lounge) => {
                const owner = lounge.ownerId;
                if (!owner) return null;
                const isExpired = new Date(owner.subscriptionEndsAt) < new Date();
                
                return (
                  <tr key={lounge._id} className="border-b border-gray-800/50 hover:bg-gray-800/50">
                    <td className="p-4 font-bold">{lounge.name}</td>
                    <td className="p-4 text-gray-400">{lounge.area}</td>
                    <td className="p-4 text-gray-400">{owner.email}</td>
                    <td className={`p-4 font-mono ${isExpired ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                      {owner.subscriptionEndsAt ? new Date(owner.subscriptionEndsAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleExtend(owner._id, 30)}
                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold transition-colors"
                      >
                        <Plus className="w-4 h-4" /> 30D
                      </button>
                      <button 
                        onClick={() => handleExtend(owner._id, 365)}
                        className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-bold transition-colors"
                      >
                        <Plus className="w-4 h-4" /> 1Y
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {lounges.length === 0 && <div className="p-8 text-center text-gray-500">No lounges registered yet.</div>}
        </div>
      </div>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

export default SuperAdminDashboard;
