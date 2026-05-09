import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Loader2, Monitor, Timer, Receipt, Coffee, AlertCircle, ShoppingBag } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';

const ClientTracking = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { timeString, isTimeUp } = useTimer(
    data?.session?.startTime,
    data?.session?.isLimit,
    data?.session?.limitMinutes
  );

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/sessions/public/device/${deviceId}`);
        setData(res.data);
        setIsLoading(false);

        // If there's an active session, connect to its lounge's socket room
        if (res.data.active) {
          const socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000'), {
            path: "/socket.io/",
            transports: ["websocket", "polling"],
            secure: true,
          });
          socket.on('connect', () => {
            socket.emit('joinLounge', res.data.loungeId);
          });

          // Listen for updates on THIS session
          socket.on('sessionUpdated', (updatedSession) => {
            if (updatedSession._id === res.data.session._id) {
              setData((prev) => ({
                ...prev,
                session: {
                  ...prev.session,
                  orders: updatedSession.orders,
                },
              }));
            }
          });

          // Listen for session stop
          socket.on('sessionStopped', (stoppedSession) => {
            if (stoppedSession._id === res.data.session._id) {
              // Refresh to show device available
              window.location.reload();
            }
          });

          return () => {
            socket.off();
            socket.disconnect();
          };
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tracking data');
        setIsLoading(false);
      }
    };

    fetchSessionData();
    
    // In case the device was inactive and someone starts it, we should occasionally poll 
    // or rely on a global lounge socket. Since we only have loungeId if active, we poll if inactive.
    let pollInterval;
    if (data && !data.active) {
      pollInterval = setInterval(fetchSessionData, 5000); // Check every 5 seconds if someone started playing
    }

    return () => clearInterval(pollInterval);
  }, [deviceId, data?.active]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-darker flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-gaming-neon" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gaming-darker flex items-center justify-center p-4">
        <div className="bg-gaming-card border border-red-500/50 p-8 rounded-2xl text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Current costs calculation
  let playCost = 0;
  let ordersCost = 0;
  let totalCost = 0;

  if (data.active && data.session) {
    if (data.session.modeHistory && data.session.modeHistory.length > 0) {
      data.session.modeHistory.forEach((mode) => {
        const start = new Date(mode.startTime).getTime();
        const end = mode.endTime ? new Date(mode.endTime).getTime() : Date.now();
        const durationMins = (end - start) / (1000 * 60);
        const rate = mode.type === 'Single' ? data.session.device.priceSingle : data.session.device.priceMulti;
        playCost += durationMins * (rate / 60);
      });
    } else {
      const durationMinutes = (Date.now() - new Date(data.session.startTime).getTime()) / (1000 * 60);
      const hourlyRate = data.session.type === 'Single' ? data.session.device.priceSingle : data.session.device.priceMulti;
      playCost = durationMinutes * (hourlyRate / 60);
    }

    data.session.orders?.forEach(o => {
      ordersCost += (o.quantity * o.priceAtOrder);
    });

    totalCost = Math.ceil(playCost + ordersCost) || 0;
  }

  return (
    <div className="min-h-screen bg-gaming-darker flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gaming-card border-b border-gray-800 p-6 text-center shadow-lg sticky top-0 z-10">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gaming-neon to-cyan-400 mb-1">
          Welcome to {data.loungeName}
        </h1>
        <div className="inline-flex items-center gap-2 bg-gaming-dark px-4 py-1.5 rounded-full border border-gray-700">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-bold text-sm tracking-wide">{data.deviceName || data.session?.device?.name}</span>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col max-w-md mx-auto w-full gap-4 mt-4">
        {!data.active ? (
          <div className="bg-gaming-card border border-green-500/30 p-8 rounded-3xl flex flex-col items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.1)] mt-10">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <Monitor className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Available</h2>
            <p className="text-gray-400 text-center text-sm">This table is currently free. Contact staff to start playing!</p>
          </div>
        ) : (
          <>
            {/* Timer Card */}
            <div className="bg-red-950/20 border border-red-500/30 p-8 rounded-3xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 animate-pulse"></div>
              
              <div className={`flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border ${isTimeUp ? 'bg-yellow-900/50 border-yellow-500/50 text-yellow-400 animate-pulse' : 'bg-red-950/50 border-red-500/20 text-red-300'}`}>
                <Timer className={`w-4 h-4 ${isTimeUp ? '' : 'animate-spin-slow'}`} />
                <span className="font-bold text-sm uppercase tracking-widest">
                  {data.session.type} Mode {data.session.isLimit && (isTimeUp ? '(TIME UP)' : `(Limit: ${data.session.limitMinutes}m)`)}
                </span>
              </div>
              
              <div className={`text-6xl sm:text-7xl font-mono tracking-tighter font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-2 ${isTimeUp ? 'text-yellow-400' : 'text-white'}`}>
                {timeString}
              </div>
              <p className="text-gray-400 font-medium tracking-wide text-sm">ELAPSED TIME</p>
            </div>

            {/* Total Cost Highlight */}
            <div className="bg-gaming-card border border-gaming-neon/50 p-6 rounded-3xl shadow-[0_0_20px_rgba(139,92,246,0.15)] flex justify-between items-center mt-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gaming-neon/20 rounded-xl">
                  <Receipt className="w-6 h-6 text-gaming-neon" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Current Total</p>
                  <p className="text-white text-sm font-medium opacity-70">Playing + Orders</p>
                </div>
              </div>
              <div className="text-3xl font-black text-white">${totalCost.toFixed(2)}</div>
            </div>

            {/* Orders Section */}
            {data.session.orders && data.session.orders.length > 0 && (
              <div className="bg-gaming-card border border-gray-800 p-6 rounded-3xl mt-2">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
                  <Coffee className="w-5 h-5 text-gaming-accent" /> Your Orders
                </h3>
                <div className="space-y-3">
                  {data.session.orders.map((o, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gaming-dark p-3 rounded-xl border border-gray-800/50">
                      <div className="flex items-center gap-3">
                        <span className="bg-gray-800 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                          {o.quantity}
                        </span>
                        <span className="text-gray-300 font-medium">{o.name}</span>
                      </div>
                      <span className="text-white font-mono font-bold">${(o.quantity * o.priceAtOrder).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => navigate(`/order/${data.loungeId}/${deviceId}`)}
              className="mt-2 w-full bg-gaming-neon hover:bg-violet-600 text-white py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-colors"
            >
              <ShoppingBag className="w-6 h-6" /> Order from Cafe
            </button>
            
            <div className="text-center mt-6 pb-8">
              <p className="text-gray-500 text-xs font-medium">Page updates automatically in real-time.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ClientTracking;
