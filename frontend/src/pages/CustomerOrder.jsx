import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Plus, Minus, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerOrder = () => {
  const { loungeId, deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [loungeId, deviceId]);

  const fetchData = async () => {
    try {
      // 1. Fetch Device Info
      const deviceRes = await axios.get(`http://localhost:5000/api/public/device/${deviceId}`);
      setDevice(deviceRes.data);

      // 2. Fetch Menu
      const menuRes = await axios.get(`http://localhost:5000/api/public/menu/${loungeId}`);
      setProducts(menuRes.data);
    } catch (error) {
      toast.error('Failed to load menu. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error(`Sorry, only ${product.stockQuantity} available.`);
          return prev;
        }
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === productId);
      if (existing.quantity === 1) {
        return prev.filter((item) => item._id !== productId);
      }
      return prev.map((item) =>
        item._id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const payload = {
        loungeId,
        deviceId,
        items: cart.map(item => ({ productId: item._id, quantity: item.quantity }))
      };
      await axios.post('http://localhost:5000/api/public/order', payload);
      setOrderSuccess(true);
      setCart([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-darker flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-gaming-neon animate-spin" />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gaming-darker flex flex-col justify-center items-center p-6 text-center">
        <div className="bg-gaming-card p-8 rounded-3xl border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)] max-w-sm w-full">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-2">Order Sent!</h2>
          <p className="text-gray-400 mb-8">
            Your order has been sent to the staff. It will be delivered to you at {device?.name} shortly.
          </p>
          <button
            onClick={() => setOrderSuccess(false)}
            className="w-full py-4 bg-gaming-dark border border-gray-700 hover:border-gaming-neon text-white font-bold rounded-xl transition-all"
          >
            Order More Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-darker flex flex-col font-sans pb-24">
      {/* Header */}
      <div className="bg-gaming-card p-6 border-b border-gray-800 sticky top-0 z-10 shadow-lg">
        <h1 className="text-center text-2xl font-black text-white tracking-wider">
          PLAYSTATION <span className="text-gaming-neon">MENU</span>
        </h1>
        {device && (
          <p className="text-center text-gray-400 text-sm mt-1">
            Ordering for: <span className="text-gaming-accent font-bold">{device.name}</span>
          </p>
        )}
      </div>

      {/* Menu Grid */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {products.length === 0 ? (
          <div className="text-center text-gray-500 py-12 flex flex-col items-center">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p>No items available right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const cartItem = cart.find(c => c._id === product._id);
              const qty = cartItem ? cartItem.quantity : 0;

              return (
                <div key={product._id} className="bg-gaming-card border border-gray-800 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                    <div className="text-gaming-neon font-mono font-bold">${product.price.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gaming-dark p-1 rounded-xl border border-gray-700">
                    <button 
                      onClick={() => removeFromCart(product._id)}
                      disabled={qty === 0}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-white font-bold w-6 text-center">{qty}</span>
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={qty >= product.stockQuantity}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full bg-gaming-neon hover:bg-violet-600 text-white p-4 rounded-2xl font-black text-lg flex justify-between items-center shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all"
            >
              <div className="flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
                <span>Send Order</span>
              </div>
              <span className="font-mono bg-black/30 px-3 py-1 rounded-lg">${totalCost.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrder;
