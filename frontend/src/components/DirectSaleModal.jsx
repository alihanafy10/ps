import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Plus, Minus, ShoppingCart, X, Receipt, Printer, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRef } from 'react';

const DirectSaleModal = ({ isOpen, onClose, onSaleComplete }) => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCart([]);
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5000/api/products', config);
      setProducts(res.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error(`Only ${product.stockQuantity} in stock`);
          return prev;
        }
        return prev.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.stockQuantity < 1) {
        toast.error('Out of stock');
        return prev;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === productId);
      if (existing.quantity === 1) {
        return prev.filter(item => item._id !== productId);
      }
      return prev.map(item => 
        item._id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const orderData = {
        products: cart.map(item => ({
          productId: item._id,
          quantity: item.quantity
        }))
      };

      const res = await axios.post('http://localhost:5000/api/orders', orderData, config);
      toast.success('Sale completed successfully!');
      if (onSaleComplete) onSaleComplete();
      
      setCompletedOrder({
        _id: res.data._id,
        items: cart,
        totalCost,
        date: new Date(res.data.createdAt || Date.now())
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalCost = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePrintReceipt = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=400,height=600');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { display: flex; justify-content: space-between; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const resetModal = () => {
    setCompletedOrder(null);
    setCart([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
      <div className="bg-gaming-card border border-gaming-neon rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(139,92,246,0.3)]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            {completedOrder ? <CheckCircle className="text-green-500" /> : <ShoppingCart className="text-gaming-neon" />} 
            {completedOrder ? 'Sale Successful' : 'Direct POS Sale'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {completedOrder ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gaming-dark">
            
            {/* Printable Receipt Area */}
            <div className="bg-white text-black p-6 w-full max-w-sm rounded shadow-lg mb-8" ref={printRef}>
              <div className="header">
                <h2 style={{ margin: '0 0 5px 0' }}>PlayStation Lounge</h2>
                <div style={{ fontSize: '12px' }}>Order #${completedOrder._id.slice(-6).toUpperCase()}</div>
                <div style={{ fontSize: '12px' }}>{completedOrder.date.toLocaleString()}</div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                {completedOrder.items.map(item => (
                  <div className="item" key={item._id}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="total">
                <span>TOTAL</span>
                <span>$${completedOrder.totalCost.toFixed(2)}</span>
              </div>
              
              <div className="footer">
                Thank you for your visit!
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)]"
              >
                <Printer className="w-5 h-5" /> Print Receipt
              </button>
              <button
                onClick={resetModal}
                className="flex items-center gap-2 px-6 py-3 bg-gaming-neon hover:bg-violet-600 text-white font-bold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" /> New Sale
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Products Grid */}
          <div className="w-full md:w-2/3 p-6 overflow-y-auto border-r border-gray-800">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-10 h-10 text-gaming-neon animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <button
                    key={product._id}
                    onClick={() => addToCart(product)}
                    disabled={product.stockQuantity === 0}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      product.stockQuantity === 0 
                        ? 'opacity-50 cursor-not-allowed border-gray-800 bg-gray-900/50' 
                        : 'border-gray-700 bg-gaming-dark hover:border-gaming-neon hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                    }`}
                  >
                    <h4 className="text-white font-bold mb-1 truncate">{product.name}</h4>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gaming-neon font-mono font-bold">${product.price}</span>
                      <span className={`${product.stockQuantity > 5 ? 'text-green-500' : 'text-red-500'}`}>
                        {product.stockQuantity} in stock
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="w-full md:w-1/3 flex flex-col bg-black/20">
            <div className="p-4 border-b border-gray-800 bg-black/40">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gaming-accent" /> Current Order
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">Cart is empty</div>
              ) : (
                cart.map(item => (
                  <div key={item._id} className="bg-gaming-dark p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                    <div className="flex-1 truncate pr-2">
                      <div className="text-white font-medium truncate">{item.name}</div>
                      <div className="text-gaming-neon font-mono text-sm">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-900 rounded-lg p-1 border border-gray-700">
                      <button onClick={() => removeFromCart(item._id)} className="text-gray-400 hover:text-white p-1">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="text-gray-400 hover:text-white p-1">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-800 bg-black/60">
              <div className="flex justify-between items-center mb-6 text-xl">
                <span className="text-gray-300 font-bold">Total:</span>
                <span className="text-white font-black font-mono text-3xl">${totalCost.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full py-4 bg-gaming-neon hover:bg-violet-600 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-lg"
              >
                {isCheckingOut ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Complete Sale'}
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectSaleModal;
