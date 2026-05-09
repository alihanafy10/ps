import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, MonitorPlay, Package, Monitor, ShoppingCart } from 'lucide-react';
import DeviceList from '../components/DeviceList';
import ProductList from '../components/ProductList';
import ShiftGuard from '../components/ShiftGuard';
import DirectSaleModal from '../components/DirectSaleModal';
import NotificationCenter from '../components/NotificationCenter';

const StaffDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('devices'); // 'devices', 'products'
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const subscriptionEndsAt = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
  const isExpired = subscriptionEndsAt && subscriptionEndsAt < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gaming-darker flex flex-col items-center justify-center p-8">
        <div className="bg-red-950/20 border border-red-500/50 p-8 rounded-3xl text-center max-w-lg shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <LogOut className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">Lounge Suspended</h2>
          <p className="text-gray-400 mb-8">The owner's subscription has ended. Please ask the owner to contact support via WhatsApp to reactivate.</p>
          <button onClick={handleLogout} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-darker p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 md:mb-8 bg-gaming-card p-4 md:p-6 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-gaming-dark p-3 rounded-xl border border-gaming-neon/30">
              <MonitorPlay className="text-gaming-neon w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome, {user?.name}</p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4 items-center w-full md:w-auto justify-end">
            <NotificationCenter />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 md:mb-8 border-b border-gray-800 pb-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2 md:gap-4 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'devices' 
                  ? 'bg-gaming-accent text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gaming-card'
              }`}
            >
              <Monitor className="w-5 h-5" /> Devices View
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'products' 
                  ? 'bg-gaming-neon text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gaming-card'
              }`}
            >
              <Package className="w-5 h-5" /> Inventory View
            </button>
          </div>

          <button
            onClick={() => setIsPosModalOpen(true)}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-colors"
          >
            <ShoppingCart className="w-5 h-5" /> Direct POS
          </button>
        </div>

        <ShiftGuard>
          <main>
            {activeTab === 'devices' && <DeviceList isAdmin={false} />}
            {activeTab === 'products' && <ProductList isAdmin={false} />}
          </main>
        </ShiftGuard>
      </div>

      <DirectSaleModal 
        isOpen={isPosModalOpen} 
        onClose={() => setIsPosModalOpen(false)} 
      />
    </div>
  );
};

export default StaffDashboard;
