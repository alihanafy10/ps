import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, DollarSign, Clock, User, StopCircle, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const ShiftGuard = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [activeShift, setActiveShift] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [blockedByStaff, setBlockedByStaff] = useState(null);
  
  const fetchActiveShift = async () => {
    if (user.role === 'OWNER') return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5000/api/shifts/active', config);
      if (res.data) {
        const shift = res.data;
        if (user.role === 'STAFF' && shift.staffId?._id !== user._id) {
          setBlockedByStaff(shift.staffId?.name || 'Unknown Staff');
          setActiveShift(null);
        } else {
          setBlockedByStaff(null);
          setActiveShift(shift);
        }
      } else {
        setActiveShift(null);
        setBlockedByStaff(null);
      }
    } catch (error) {
      console.error('Failed to fetch active shift', error);
      toast.error('Failed to fetch shift status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user.role !== 'OWNER') {
      fetchActiveShift();

      const socket = io('http://localhost:5000');
      socket.on('connect', () => {
        socket.emit('joinLounge', user.loungeId);
      });

      socket.on('sessionStopped', fetchActiveShift);
      socket.on('orderCreated', fetchActiveShift);

      return () => socket.disconnect();
    }
  }, [user]);

  const handleStartShift = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5000/api/shifts/start', { startingCash: 0 }, config);
      toast.success('Shift started successfully!');
      fetchActiveShift();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start shift');
      setIsLoading(false);
    }
  };

  const handleEndShift = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5000/api/shifts/end', {}, config);
      toast.success('Shift ended successfully!');
      setActiveShift(null);
      setShowEndModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end shift');
    } finally {
      setIsLoading(false);
    }
  };

  if (user.role === 'OWNER') {
    return <>{children}</>;
  }

  if (isLoading && !activeShift && !blockedByStaff) {
    return (
      <div className="min-h-screen bg-gaming-darker flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-gaming-neon animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-gaming-card border-b border-gray-800 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          {activeShift ? (
            <>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4 text-gaming-neon" />
                  <span className="text-sm font-medium">Started: {new Date(activeShift.startTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4 text-gaming-accent" />
                  <span className="text-sm font-medium">Staff: {activeShift.staffId?.name || user.name}</span>
                </div>
                <div className="flex items-center gap-2 text-white bg-green-500/20 px-3 py-1 rounded-lg border border-green-500/30">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-bold tracking-wide">
                    Sales: ${activeShift.totalSales.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEndModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-colors"
              >
                <StopCircle className="w-4 h-4" /> Close Shift
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-400">
                <StopCircle className="w-5 h-5" />
                <span className="text-sm font-medium">No active shift</span>
              </div>
              {!blockedByStaff && (
                <button
                  onClick={handleStartShift}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />} Open Shift
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!activeShift && !blockedByStaff && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-gray-900/50 p-6 rounded-full mb-6 border border-gray-800">
            <Receipt className="w-16 h-16 text-gray-600" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Shift Closed</h2>
          <p className="text-gray-400 max-w-sm">Please open a shift from the top bar to manage devices and access the POS system.</p>
        </div>
      )}

      {/* Blocked by another staff's shift Modal */}
      {blockedByStaff && (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4">
          <div className="bg-gaming-card border border-red-500 rounded-2xl w-full max-w-sm p-8 text-center shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <StopCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">Shift Active</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Shift is already active by <span className="font-bold text-gaming-neon">{blockedByStaff}</span>.
              <br /><br />Please ask them to End their shift first.
            </p>
          </div>
        </div>
      )}

      {/* End Shift Confirmation Modal */}
      {showEndModal && activeShift && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-gaming-card border border-red-500 rounded-2xl w-full max-w-sm p-8 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <h2 className="text-2xl font-black text-white mb-6 text-center border-b border-gray-800 pb-4">End Shift Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-300">
                <span>Total Sales Recorded</span>
                <span className="font-mono text-green-400 font-bold text-xl">${activeShift.totalSales.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndShift}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render children only if active shift exists */}
      {activeShift && children}
    </>
  );
};

export default ShiftGuard;
