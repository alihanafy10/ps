import { useState, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { Loader2, UserPlus, LogOut, ShieldCheck, MonitorPlay, Package, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeviceList from '../components/DeviceList';
import ProductList from '../components/ProductList';
import ShiftGuard from '../components/ShiftGuard';
import FinancialReports from '../components/FinancialReports';
import DirectSaleModal from '../components/DirectSaleModal';
import ProfileModal from '../components/ProfileModal';
import StaffManagement from '../components/StaffManagement';
import NotificationCenter from '../components/NotificationCenter';
import { ShoppingCart, BarChart3, User } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('devices'); // 'devices', 'products', 'staff'
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const subscriptionEndsAt = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
  const isExpired = subscriptionEndsAt && subscriptionEndsAt < new Date();
  
  const daysRemaining = subscriptionEndsAt ? Math.ceil((subscriptionEndsAt - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const showWarning = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gaming-darker flex flex-col items-center justify-center p-8">
        <div className="bg-red-950/20 border border-red-500/50 p-8 rounded-3xl text-center max-w-lg shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">Subscription Expired</h2>
          <p className="text-gray-400 mb-8">Your subscription has ended. Please contact support via WhatsApp to reactivate your lounge.</p>
          <a
            href={`https://wa.me/201061830937?text=Hello,%20I%20want%20to%20renew%20my%20subscription%20for%20%5BLounge%20Name%5D%20via%20Vodafone%20Cash`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-colors"
          >
            Renew via WhatsApp
          </a>
          <button onClick={handleLogout} className="mt-6 text-gray-500 hover:text-white underline">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-darker p-8">
      {showWarning && (
        <div className="max-w-6xl mx-auto mb-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 p-4 rounded-xl flex justify-between items-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
          <div>
            <strong className="font-bold">Warning:</strong> Your subscription expires in {daysRemaining} days.
          </div>
          <a
            href={`https://wa.me/201061830937?text=Hello,%20I%20want%20to%20renew%20my%20subscription%20for%20%5BLounge%20Name%5D%20via%20Vodafone%20Cash`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors text-sm"
          >
            Renew Now
          </a>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-gaming-card p-6 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-gaming-dark p-3 rounded-xl border border-gaming-neon/30">
              <ShieldCheck className="text-gaming-neon w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <NotificationCenter />
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
            >
              <User className="w-5 h-5" />
              Profile
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-800 pb-4 justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'devices' 
                  ? 'bg-gaming-accent text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gaming-card'
              }`}
            >
              <MonitorPlay className="w-5 h-5" /> Devices
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'products' 
                  ? 'bg-gaming-neon text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gaming-card'
              }`}
            >
              <Package className="w-5 h-5" /> Inventory
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'staff' 
                  ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gaming-card'
              }`}
            >
              <Users className="w-5 h-5" /> Staff
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'reports' 
                  ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gaming-card'
              }`}
            >
              <BarChart3 className="w-5 h-5" /> Financial Reports
            </button>
          </div>

          <button
            onClick={() => setIsPosModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-colors"
          >
            <ShoppingCart className="w-5 h-5" /> Direct POS
          </button>
        </div>

        <ShiftGuard>
          <main>
            {activeTab === 'devices' && <DeviceList isAdmin={true} />}
            {activeTab === 'products' && <ProductList isAdmin={true} />}
            {activeTab === 'reports' && <FinancialReports />}
            {activeTab === 'staff' && <StaffManagement />}
          </main>
        </ShiftGuard>
      </div>

      <DirectSaleModal 
        isOpen={isPosModalOpen} 
        onClose={() => setIsPosModalOpen(false)} 
      />

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;
