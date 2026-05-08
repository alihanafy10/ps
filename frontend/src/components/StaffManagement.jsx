import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Plus, Edit, Trash2, X, Users, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffManagement = () => {
  const { user } = useContext(AuthContext);
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentStaff, setCurrentStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5000/api/staff', config);
      setStaffList(res.data);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', email: '', password: '' });
    setCurrentStaff(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff) => {
    setModalMode('edit');
    setFormData({ name: staff.name, email: staff.email, password: '' });
    setCurrentStaff(staff);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/api/staff', formData, config);
        toast.success('Staff added successfully!');
      } else {
        await axios.put(`http://localhost:5000/api/staff/${currentStaff._id}`, formData, config);
        toast.success('Staff updated successfully!');
      }

      setIsModalOpen(false);
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`http://localhost:5000/api/staff/${id}`, config);
      toast.success('Staff deleted successfully!');
      setStaffList(staffList.filter(s => s._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete staff');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="bg-gaming-card border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gaming-dark">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="text-green-500 w-6 h-6" /> Staff Management
        </h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
        >
          <UserPlus className="w-5 h-5" /> Add Staff
        </button>
      </div>

      <div className="p-6">
        {staffList.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No staff members found. Add one to get started!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {staffList.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 text-white font-bold">{staff.name}</td>
                    <td className="py-4 text-gray-400">{staff.email}</td>
                    <td className="py-4 flex justify-end gap-3">
                      <button
                        onClick={() => openEditModal(staff)}
                        className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(staff._id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-gaming-card border border-green-500/30 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(34,197,94,0.2)] flex flex-col">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {modalMode === 'add' ? <UserPlus className="text-green-500" /> : <Edit className="text-blue-500" />}
                {modalMode === 'add' ? 'Create New Staff' : 'Edit Staff'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Staff Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password {modalMode === 'edit' && <span className="text-gray-500 text-xs">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gaming-dark border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white transition-colors"
                  placeholder="••••••••"
                  required={modalMode === 'add'}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 mt-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (modalMode === 'add' ? 'Create Account' : 'Save Changes')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
