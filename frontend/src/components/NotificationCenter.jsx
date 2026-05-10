import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bell, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const NotificationCenter = () => {
  const { user } = useContext(AuthContext);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Play sound logic
    audioRef.current = new Audio('/notification.mp3'); // We'll assume this exists in public folder
    
    fetchPendingOrders();

    // Socket Setup
    socketRef.current = io("/", {
      path: "/socket.io/",
      transports: ["websocket"],
      secure: true
    });
    
    const handleConnect = () => {
      if (user?.loungeId) {
        socketRef.current.emit('joinLounge', user.loungeId);
      }
    };
    socketRef.current.on('connect', handleConnect);
    if (socketRef.current.connected) {
      handleConnect();
    }

    socketRef.current.on('newOrderNotification', (order) => {
      setPendingOrders((prev) => [order, ...prev]);
      toast.success(`New order received from ${order.deviceId?.name || 'a device'}!`);
      
      // Play alert sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
      }
    });

    socketRef.current.on('orderHandled', (orderId) => {
      setPendingOrders((prev) => {
        const filtered = prev.filter(o => o._id !== orderId);
        if (filtered.length === 0) setIsOpen(false);
        return filtered;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const fetchPendingOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/orders/pending`, config);
      setPendingOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch pending orders', error);
    }
  };

  const handleConfirm = async (orderId) => {
    setProcessingId(orderId);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/orders/pending/${orderId}/confirm`, {}, config);
      toast.success('Order confirmed and added to session!');
      setPendingOrders((prev) => prev.filter(o => o._id !== orderId));
      if (pendingOrders.length === 1) setIsOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm order');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId) => {
    setProcessingId(orderId);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/orders/pending/${orderId}/cancel`, {}, config);
      toast.success('Order cancelled.');
      setPendingOrders((prev) => prev.filter(o => o._id !== orderId));
      if (pendingOrders.length === 1) setIsOpen(false);
    } catch (error) {
      toast.error('Failed to cancel order');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
      >
        <Bell className="w-6 h-6" />
        {pendingOrders.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]">
            {pendingOrders.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-24 left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-4 w-auto sm:w-80 max-w-sm mx-auto bg-gaming-card border border-gray-800 rounded-2xl shadow-2xl z-[100] overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gaming-dark flex justify-between items-center">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-gaming-accent" /> Pending Orders
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-1 rounded-full">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto p-2">
            {pendingOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-6 text-sm">No pending orders.</p>
            ) : (
              pendingOrders.map((order) => (
                <div key={order._id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 mb-2 animate-fade-in">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-gaming-neon font-bold text-sm bg-gaming-dark px-2 py-1 rounded">
                      {order.deviceId?.name || 'Unknown Device'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-300 flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-mono text-gray-500">${(item.quantity * item.priceAtOrder).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirm(order._id)}
                      disabled={processingId === order._id}
                      className="flex-1 bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white py-1.5 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-1"
                    >
                      {processingId === order._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Deliver
                    </button>
                    <button
                      onClick={() => handleCancel(order._id)}
                      disabled={processingId === order._id}
                      className="flex-1 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white py-1.5 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
