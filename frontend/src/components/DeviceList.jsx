import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Monitor, Plus, Minus, Trash2, Edit2, X, Check, Play, Timer, ShoppingCart, Coffee, Receipt } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';

import { QRCodeSVG } from 'qrcode.react';

// QR Code Modal Component
const QRModal = ({ isOpen, onClose, deviceId, deviceName }) => {
  if (!isOpen) return null;

  const trackingUrl = `${window.location.protocol}//${window.location.host}/client/device/${deviceId}`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gaming-card border border-gaming-accent rounded-2xl w-full max-w-sm shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col p-8 text-center">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Scan to Track</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4">
          <QRCodeSVG value={trackingUrl} size={200} />
        </div>
        <p className="text-gray-400 text-sm mb-2">{deviceName}</p>
        <p className="text-cyan-400 text-xs break-all">{trackingUrl}</p>
      </div>
    </div>
  );
};

// Add Order Modal Component
const OrderModal = ({ isOpen, onClose, products, onAddOrder, session }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gaming-card border border-gaming-neon rounded-2xl w-full max-w-lg shadow-[0_0_30px_rgba(139,92,246,0.3)] flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Coffee className="text-gaming-neon" /> Add to Order
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow space-y-4">
          {products.length === 0 ? (
            <p className="text-gray-400 text-center">No products available in inventory.</p>
          ) : (
            products.map((p) => {
              const currentOrder = session?.orders?.find(o => o.product === p._id || o.product._id === p._id);
              const orderedQty = currentOrder ? currentOrder.quantity : 0;
              return (
                <div key={p._id} className="flex justify-between items-center bg-gaming-dark p-4 rounded-xl border border-gray-800">
                  <div>
                    <h4 className="text-white font-bold">{p.name}</h4>
                    <p className="text-sm text-gray-400">${p.price} | Stock: {p.stockQuantity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onAddOrder(session._id, p._id, -1)}
                      disabled={orderedQty <= 0}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-white font-bold w-4 text-center">{orderedQty}</span>
                    <button
                      onClick={() => onAddOrder(session._id, p._id, 1)}
                      disabled={p.stockQuantity <= 0}
                      className="bg-gaming-neon hover:bg-violet-600 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Checkout Modal Component
const CheckoutModal = ({ isOpen, onClose, session, device, onConfirm }) => {
  if (!isOpen || !session) return null;

  let playCost = 0;
  let historyDisplay = [];

  const formatArabicTime = (hours, mins) => {
    let hStr = '';
    if (hours === 1) hStr = 'ساعة';
    else if (hours === 2) hStr = 'ساعتين';
    else if (hours > 2 && hours <= 10) hStr = `${hours} ساعات`;
    else if (hours > 10) hStr = `${hours} ساعة`;
    
    let mStr = '';
    if (mins === 1) mStr = 'دقيقة';
    else if (mins === 2) mStr = 'دقيقتين';
    else if (mins > 2 && mins <= 10) mStr = `${mins} دقائق`;
    else if (mins > 10) mStr = `${mins} دقيقة`;
    
    if (hStr && mStr) return `${hStr} و ${mStr}`;
    if (hStr) return hStr;
    if (mStr) return mStr;
    return 'أقل من دقيقة';
  };

  if (session.modeHistory && session.modeHistory.length > 0) {
    session.modeHistory.forEach((mode) => {
      const start = new Date(mode.startTime).getTime();
      const end = mode.endTime ? new Date(mode.endTime).getTime() : Date.now();
      const durationMins = (end - start) / (1000 * 60);
      const rate = mode.type === 'Single' ? device.priceSingle : device.priceMulti;
      const cost = durationMins * (rate / 60);
      playCost += cost;
      
      const hours = Math.floor(durationMins / 60);
      const mins = Math.floor(durationMins % 60);
      historyDisplay.push({
        type: mode.type,
        timeStr: formatArabicTime(hours, mins),
        cost: cost
      });
    });
  } else {
    const durationMinutes = (Date.now() - new Date(session.startTime).getTime()) / (1000 * 60);
    const hourlyRate = session.type === 'Single' ? device.priceSingle : device.priceMulti;
    playCost = durationMinutes * (hourlyRate / 60);
    const hours = Math.floor(durationMinutes / 60);
    const mins = Math.floor(durationMinutes % 60);
    historyDisplay.push({
      type: session.type,
      timeStr: formatArabicTime(hours, mins),
      cost: playCost
    });
  }

  let ordersCost = 0;
  session.orders?.forEach(o => {
    ordersCost += (o.quantity * o.priceAtOrder);
  });
  
  const totalCost = Math.ceil(playCost + ordersCost) || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="receipt-print bg-gaming-card border border-red-500 rounded-2xl w-full max-w-md shadow-[0_0_30px_rgba(239,68,68,0.3)] flex flex-col">
        <div className="no-print p-6 border-b border-gray-800 flex justify-between items-center bg-red-950/30 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="text-red-400" /> Checkout Invoice
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        
        {/* Print Header */}
        <div className="hidden text-center border-b border-black pb-4 mb-4 receipt-print:block" style={{display: 'none'}}>
          <h2 className="text-2xl font-bold mb-1">PS-SaaS Receipt</h2>
          <p className="text-sm">{new Date().toLocaleString()}</p>
        </div>
        
        <div className="p-6 space-y-6 text-gray-300">
          <div>
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2 mb-2 receipt-print:text-black receipt-print:border-black">Play Time</h3>
            <div className="space-y-2 receipt-print:text-black">
              {historyDisplay.map((h, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{device.name} ({h.type}) - {h.timeStr}</span>
                  <span className="font-mono text-white receipt-print:text-black">${h.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {session.orders && session.orders.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2 mb-2 receipt-print:text-black receipt-print:border-black">Orders</h3>
              <div className="space-y-2 receipt-print:text-black">
                {session.orders.map((o, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{o.quantity}x {o.name}</span>
                    <span className="font-mono text-white receipt-print:text-black">${(o.quantity * o.priceAtOrder).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-800 pt-4 flex justify-between items-center text-xl font-bold text-white receipt-print:text-black receipt-print:border-black">
            <span>Grand Total:</span>
            <span className="text-red-400 receipt-print:text-black">${totalCost.toFixed(2)}</span>
          </div>
        </div>

        <div className="no-print p-6 bg-black/20 rounded-b-2xl flex gap-3">
          <button
            onClick={handlePrint}
            className="w-1/3 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2"
          >
            Print
          </button>
          <button
            onClick={onConfirm}
            className="w-2/3 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2"
          >
            Confirm & End
          </button>
        </div>
      </div>
    </div>
  );
};


const DeviceCard = ({ device, isAdmin, activeSession, products, onStart, onStop, onDelete, onUpdate, onAddOrder, onConvertToOpen, onSwitchMode }) => {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...device });
  const [sessionType, setSessionType] = useState('Single');
  const [timeMode, setTimeMode] = useState('Open');
  const [limitMinutes, setLimitMinutes] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [hasBeeped, setHasBeeped] = useState(false);
  
  const { timeString, isTimeUp } = useTimer(
    activeSession?.startTime, 
    activeSession?.isLimit, 
    activeSession?.limitMinutes
  );

  // Play beep when time is up
  useEffect(() => {
    if (isTimeUp && !hasBeeped) {
      setHasBeeped(true);
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      
      // Beep twice
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gainNode2 = ctx.createGain();
        osc2.connect(gainNode2);
        gainNode2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);
        gainNode2.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.3);
      }, 400);
      
      toast.error(`Time is Up for ${device.name}!`, {
        icon: '⏳',
        style: { background: '#ef4444', color: '#fff' }
      });
    }
  }, [isTimeUp, hasBeeped, device.name]);

  // Reset beep state when session stops
  useEffect(() => {
    if (!activeSession) {
      setHasBeeped(false);
    }
  }, [activeSession]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    await onUpdate(device._id, editForm);
    setEditing(false);
  };

  const handleStart = async () => {
    setIsProcessing(true);
    await onStart(device._id, sessionType, timeMode === 'Limit', limitMinutes);
    setIsProcessing(false);
  };

  const handleCheckoutConfirm = async () => {
    setIsProcessing(true);
    await onStop(device._id);
    setIsCheckoutModalOpen(false);
    setIsProcessing(false);
  };

  const handleConvertToOpen = async () => {
    setIsProcessing(true);
    await onConvertToOpen(activeSession._id);
    setHasBeeped(false);
    setIsProcessing(false);
  };

  const handleSwitch = async () => {
    setIsProcessing(true);
    await onSwitchMode(activeSession._id);
    setIsProcessing(false);
  };

  const isActive = !!activeSession;
  
  // Calculate total items ordered
  let totalItems = 0;
  if (isActive && activeSession.orders) {
    activeSession.orders.forEach(o => totalItems += o.quantity);
  }

  return (
    <>
      <div className={`rounded-2xl border transition-all duration-300 shadow-md flex flex-col justify-between overflow-hidden
        ${isActive ? (isTimeUp ? 'bg-red-900 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]') : 'bg-gaming-card border-gray-800 hover:border-gaming-accent'}
      `}>
        <div className={`p-4 border-b relative ${isActive ? 'border-red-500/30 bg-red-900/20' : 'border-gray-800'}`}>
          {/* Total Items Badge */}
          {isActive && totalItems > 0 && (
            <div className="absolute top-2 right-2 bg-gaming-neon text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1 z-10 animate-pulse">
              <ShoppingCart className="w-3 h-3" /> {totalItems} Items
            </div>
          )}

          {editing ? (
            <div className="space-y-2">
              <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className="w-full px-2 py-1 bg-gaming-dark border border-gray-700 rounded focus:border-gaming-accent text-white text-sm" placeholder="Name" />
              <select name="type" value={editForm.type} onChange={handleEditChange} className="w-full px-2 py-1 bg-gaming-dark border border-gray-700 rounded focus:border-gaming-accent text-white text-sm">
                <option value="PS4">PS4</option>
                <option value="PS5">PS5</option>
                <option value="PC">PC</option>
              </select>
              <div className="flex gap-2">
                <input type="number" name="priceSingle" value={editForm.priceSingle} onChange={handleEditChange} className="w-1/2 px-2 py-1 bg-gaming-dark border border-gray-700 rounded focus:border-gaming-accent text-white text-sm" placeholder="Single $" />
                <input type="number" name="priceMulti" value={editForm.priceMulti} onChange={handleEditChange} className="w-1/2 px-2 py-1 bg-gaming-dark border border-gray-700 rounded focus:border-gaming-accent text-white text-sm" placeholder="Multi $" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={saveEdit} className="text-green-400 p-1 hover:bg-green-400/10 rounded"><Check className="w-5 h-5" /></button>
                <button onClick={() => setEditing(false)} className="text-gray-400 p-1 hover:bg-gray-400/10 rounded"><X className="w-5 h-5" /></button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start mt-2">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Monitor className={`w-5 h-5 ${isActive ? 'text-red-400' : 'text-gaming-accent'}`} />
                  {device.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${isActive ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-gaming-dark border border-gray-700 text-gray-400'}`}>
                  {device.type}
                </span>
              </div>
              
              <div className="flex gap-1">
                <button onClick={() => setIsQRModalOpen(true)} className="text-gaming-accent hover:bg-gaming-accent/10 p-1.5 rounded-lg transition-colors" title="Show QR Code">
                  <div className="w-4 h-4 border-2 border-current border-dashed rounded-sm"></div>
                </button>
                {isAdmin && !isActive && (
                  <>
                    <button onClick={() => setEditing(true)} className="text-cyan-400 hover:bg-cyan-400/10 p-1.5 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(device._id)} className="text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col items-center justify-center flex-grow">
          <div className={`text-5xl font-mono tracking-wider font-bold mb-2 ${isActive ? (isTimeUp ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]') : 'text-gray-600'}`}>
            {isActive ? timeString : '00:00:00'}
          </div>
          {isActive ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-red-300/80 text-sm flex items-center gap-1 font-medium bg-red-950/50 px-3 py-1 rounded-full border border-red-500/20">
                <Timer className="w-4 h-4" /> {activeSession.type} {activeSession.isLimit ? `(Limit: ${activeSession.limitMinutes}m)` : 'Playing'}
              </div>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSwitch}
                  disabled={isProcessing}
                  className="text-xs font-bold bg-gaming-accent hover:bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" /> SWITCH TO {activeSession.type === 'Single' ? 'MULTI' : 'SINGLE'}
                </button>

                {isTimeUp && (
                  <button
                    onClick={handleConvertToOpen}
                    disabled={isProcessing}
                    className="text-xs font-bold bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-1 animate-bounce"
                  >
                    <Play className="w-3 h-3 fill-current" /> OPEN TIME
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm flex items-center gap-4">
              <span>Single: ${device.priceSingle}/h</span>
              <span>Multi: ${device.priceMulti}/h</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800/50 bg-black/20">
          {isActive ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="w-14 bg-gaming-neon hover:bg-violet-600 text-white rounded-lg flex justify-center items-center transition-colors shadow-[0_0_10px_rgba(139,92,246,0.3)]"
              >
                <Plus className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsCheckoutModalOpen(true)}
                disabled={isProcessing}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                CHECKOUT
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="px-3 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent text-white w-1/2"
                >
                  <option value="Single">Single</option>
                  <option value="Multi">Multi</option>
                </select>
                <select
                  value={timeMode}
                  onChange={(e) => setTimeMode(e.target.value)}
                  className="px-3 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent text-white w-1/2"
                >
                  <option value="Open">Open Time</option>
                  <option value="Limit">Limit Time</option>
                </select>
              </div>
              
              {timeMode === 'Limit' && (
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={limitMinutes}
                    onChange={(e) => setLimitMinutes(Number(e.target.value))}
                    min="1"
                    className="flex-1 px-3 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent text-white"
                    placeholder="Limit in Minutes"
                  />
                  <span className="text-gray-400 text-sm font-bold w-12">MINS</span>
                </div>
              )}
              
              <button
                onClick={handleStart}
                disabled={isProcessing}
                className="w-full py-2 bg-gaming-accent hover:bg-cyan-600 text-white font-bold rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                START
              </button>
            </div>
          )}
        </div>
      </div>

      <OrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        products={products} 
        session={activeSession}
        onAddOrder={onAddOrder}
      />
      
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        session={activeSession}
        device={device}
        onConfirm={handleCheckoutConfirm}
      />
      
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        deviceId={device._id}
        deviceName={device.name}
      />
    </>
  );
};


const DeviceList = ({ isAdmin }) => {
  const { user } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'PS5',
    priceSingle: '',
    priceMulti: '',
  });

  useEffect(() => {
    // Connect Socket.io
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      socket.emit('joinLounge', user.loungeId);
    });

    socket.on('sessionStarted', (session) => {
      setActiveSessions((prev) => [...prev, session]);
    });

    socket.on('sessionUpdated', (session) => {
      setActiveSessions((prev) => prev.map(s => s._id === session._id ? session : s));
    });

    socket.on('sessionStopped', (session) => {
      setActiveSessions((prev) => prev.filter((s) => s._id !== session._id));
      if (session.totalCost !== undefined) {
        toast(`Checkout Complete!\nGrand Total: $${session.totalCost}`, {
          icon: '🧾',
          style: { background: '#1e293b', color: '#fff', border: '1px solid #10b981' },
          duration: 6000,
        });
      }
    });

    const fetchData = async () => {
      try {
        const [devicesRes, sessionsRes, productsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/devices', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/api/sessions/active', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        setDevices(devicesRes.data);
        setActiveSessions(sessionsRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/devices',
        formData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setDevices([...devices, data]);
      setFormData({ name: '', type: 'PS5', priceSingle: '', priceMulti: '' });
      toast.success('Device added successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add device');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/devices/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setDevices(devices.filter((d) => d._id !== id));
      toast.success('Device deleted');
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  const handleUpdate = async (id, editData) => {
    try {
      const { data } = await axios.put(
        `http://localhost:5000/api/devices/${id}`,
        editData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setDevices(devices.map((d) => (d._id === id ? data : d)));
      toast.success('Device updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update device');
    }
  };

  const handleStartSession = async (deviceId, type, isLimit, limitMinutes) => {
    try {
      await axios.post(
        'http://localhost:5000/api/sessions/start',
        { deviceId, type, isLimit, limitMinutes },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start session');
    }
  };

  const handleConvertToOpenSession = async (sessionId) => {
    try {
      await axios.post(
        'http://localhost:5000/api/sessions/convert-to-open',
        { sessionId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Converted to Open Time');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to convert session');
    }
  };

  const handleSwitchModeSession = async (sessionId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/sessions/switch/${sessionId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Mode switched!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to switch mode');
    }
  };

  const handleAddOrder = async (sessionId, productId, quantity) => {
    try {
      await axios.post(
        'http://localhost:5000/api/sessions/order',
        { sessionId, productId, quantity },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Added to order!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add order');
    }
  };

  const handleStopSession = async (deviceId) => {
    try {
      await axios.post(
        'http://localhost:5000/api/sessions/stop',
        { deviceId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // Update local product stock since checkout deducts it
      const productsRes = await axios.get('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${user.token}` } });
      setProducts(productsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to stop session');
    }
  };

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="bg-gaming-card p-6 rounded-2xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="text-gaming-accent w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Add New Device</h2>
          </div>
          <form onSubmit={handleAddDevice} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Device Name (e.g. Room 1)"
              required
              className="px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent text-white"
            />
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent text-white"
            >
              <option value="PS4">PS4</option>
              <option value="PS5">PS5</option>
              <option value="PC">PC</option>
            </select>
            <input
              type="number"
              name="priceSingle"
              value={formData.priceSingle}
              onChange={handleChange}
              placeholder="Single Price/hr"
              required
              className="px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent text-white"
            />
            <input
              type="number"
              name="priceMulti"
              value={formData.priceMulti}
              onChange={handleChange}
              placeholder="Multi Price/hr"
              required
              className="px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-accent text-white"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-gaming-accent hover:bg-cyan-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Add
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Live Stations</h2>
        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-12 h-12 animate-spin text-gaming-accent" />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center p-20 bg-gaming-card rounded-2xl border border-gray-800 text-gray-400">
            No devices configured yet. Add some to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {devices.map((device) => {
              const activeSession = activeSessions.find(
                (s) => s.deviceId._id === device._id || s.deviceId === device._id
              );
              
              return (
                <DeviceCard
                  key={device._id}
                  device={device}
                  isAdmin={isAdmin}
                  products={products}
                  activeSession={activeSession}
                  onStart={handleStartSession}
                  onStop={handleStopSession}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onAddOrder={handleAddOrder}
                  onConvertToOpen={handleConvertToOpenSession}
                  onSwitchMode={handleSwitchModeSession}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceList;
