import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, DollarSign, TrendingUp, Users, FileText, Activity, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import ShiftAuditModal from './ShiftAuditModal';

const FinancialReports = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [shiftsLog, setShiftsLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const handleOpenAudit = (shiftId) => {
    setSelectedShiftId(shiftId);
    setIsAuditModalOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        
        const [summaryRes, shiftsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/reports/owner-summary`, config),
          axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/reports/shifts-log`, config)
        ]);

        setSummary(summaryRes.data);
        setShiftsLog(shiftsRes.data);
      } catch (error) {
        toast.error('Failed to load financial reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading || !summary) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-10 h-10 text-gaming-neon animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gaming-card border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-green-500" />
          </div>
          <p className="text-gray-400 font-bold tracking-wider text-sm mb-2 uppercase">Today's Revenue</p>
          <h3 className="text-4xl font-black text-white">${summary.todayTotal.toFixed(2)}</h3>
        </div>

        <div className="bg-gaming-card border border-gaming-neon/50 p-6 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.15)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-gaming-neon" />
          </div>
          <p className="text-gaming-neon font-bold tracking-wider text-sm mb-2 uppercase">Monthly Revenue</p>
          <h3 className="text-4xl font-black text-white">${summary.monthlyTotal.toFixed(2)}</h3>
        </div>

        <div className="bg-gaming-card border border-gray-800 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 font-bold tracking-wider text-sm uppercase">Revenue Breakdown</p>
            <Activity className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-400 font-medium">PS Sessions</span>
                <span className="text-white">${summary.revenueBreakdown.playstation.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (summary.revenueBreakdown.playstation / (summary.monthlyTotal || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-orange-400 font-medium">Cafe & POS</span>
                <span className="text-white">${summary.revenueBreakdown.cafe.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (summary.revenueBreakdown.cafe / (summary.monthlyTotal || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Performance & Shifts Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Performance */}
        <div className="lg:col-span-1 bg-gaming-card border border-gray-800 p-6 rounded-2xl shadow-lg h-fit">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
            <Users className="text-gaming-accent w-5 h-5" /> Staff Performance
          </h3>
          <div className="space-y-4">
            {summary.staffPerformance.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales data recorded yet.</p>
            ) : (
              summary.staffPerformance.map((staff, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gaming-dark rounded-xl border border-gray-800/50">
                  <span className="text-gray-300 font-medium">{staff.name}</span>
                  <span className="text-gaming-neon font-bold font-mono">${staff.totalCollected.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shifts Log Table */}
        <div className="lg:col-span-2 bg-gaming-card border border-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
            <FileText className="text-cyan-400 w-5 h-5" /> Past Shifts Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Staff Name</th>
                  <th className="pb-3 pr-4">Duration</th>
                  <th className="pb-3 text-right">Collected</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {shiftsLog.map(shift => {
                  const start = new Date(shift.startTime);
                  const end = shift.endTime ? new Date(shift.endTime) : new Date();
                  const durationHours = ((end - start) / (1000 * 60 * 60)).toFixed(1);
                  
                  return (
                    <tr key={shift._id} className="hover:bg-gaming-dark/50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="text-white font-medium">{start.toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{start.toLocaleTimeString()}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs font-bold">
                          {shift.staffId?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-gray-400 text-sm">{durationHours}h {shift.status === 'Open' ? '(Live)' : ''}</td>
                      <td className="py-4 text-right">
                        <span className="text-green-400 font-bold font-mono">+${shift.totalSales.toFixed(2)}</span>
                      </td>
                      <td className="py-4 text-center">
                        <button 
                          onClick={() => handleOpenAudit(shift._id)}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Search className="w-3 h-3" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {shiftsLog.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">No past shifts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ShiftAuditModal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)} 
        shiftId={selectedShiftId} 
      />
    </div>
  );
};

export default FinancialReports;
