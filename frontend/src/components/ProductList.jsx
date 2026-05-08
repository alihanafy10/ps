import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Package, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

const ProductList = ({ isAdmin }) => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stockQuantity: '',
  });

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/products`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/products`,
        formData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setProducts([...products, data]);
      setFormData({ name: '', price: '', stockQuantity: '' });
      toast.success('Product added successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setProducts(products.filter((p) => p._id !== id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const startEditing = (product) => {
    setEditingId(product._id);
    setEditFormData({
      name: product.name,
      price: product.price,
      stockQuantity: product.stockQuantity,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleUpdate = async (id) => {
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/products/${id}`,
        editFormData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setProducts(products.map((p) => (p._id === id ? data : p)));
      toast.success('Product updated successfully!');
      setEditingId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="bg-gaming-card p-6 rounded-2xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-gaming-neon w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Add New Product</h2>
          </div>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Product Name (e.g. Cola)"
              required
              className="px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-neon text-white"
            />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Price"
              required
              className="px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-neon text-white"
            />
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              placeholder="Stock Quantity"
              required
              className="px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-gaming-neon text-white"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-gaming-neon hover:bg-violet-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Add Product
            </button>
          </form>
        </div>
      )}

      <div className="bg-gaming-card rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Inventory & Menu</h2>
        </div>
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gaming-neon" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {products.map((product) => (
              <div key={product._id} className="bg-gaming-darker rounded-xl border border-gray-800 shadow-md p-5 flex flex-col justify-between group hover:border-gaming-neon transition-colors">
                
                {editingId === product._id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className="w-full px-2 py-1 bg-gaming-dark border border-gray-700 rounded focus:border-gaming-neon text-white text-sm"
                      placeholder="Name"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="price"
                        value={editFormData.price}
                        onChange={handleEditChange}
                        className="w-1/2 px-2 py-1 bg-gaming-dark border border-gray-700 rounded focus:border-gaming-neon text-white text-sm"
                        placeholder="Price"
                      />
                      <input
                        type="number"
                        name="stockQuantity"
                        value={editFormData.stockQuantity}
                        onChange={handleEditChange}
                        className="w-1/2 px-2 py-1 bg-gaming-dark border border-gray-700 rounded focus:border-gaming-neon text-white text-sm"
                        placeholder="Stock"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleUpdate(product._id)}
                        className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 p-2 rounded-lg transition-colors flex justify-center items-center"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 p-2 rounded-lg transition-colors flex justify-center items-center"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white">{product.name}</h3>
                      <div className="bg-gaming-neon/20 text-gaming-neon px-3 py-1 rounded-full font-bold shadow-lg border border-gaming-neon/30">
                        ${product.price}
                      </div>
                    </div>
                    
                    <div className="mt-auto flex justify-between items-center">
                      <span className={`font-medium ${product.stockQuantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                      </span>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(product)}
                            className="text-violet-400 hover:text-violet-300 p-2 hover:bg-violet-400/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
