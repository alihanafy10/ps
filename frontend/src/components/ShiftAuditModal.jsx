import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, X, Printer, Clock, MonitorPlay, Coffee, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const ShiftAuditModal = ({ isOpen, onClose, shiftId }) => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    if (isOpen && shiftId) {
      fetchDetails();
    }
  }, [isOpen, shiftId]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/reports/shift-details/${shiftId}`, config);
      setData(res.data);
    } catch (error) {
      toast.error('Failed to fetch shift details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=900,height=650');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Shift Audit Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            h1, h2, h3 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 5px; }
            .section { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .badge { background: #e0e0e0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
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

  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading || !data) {
      return (
        <div className="flex justify-center p-20">
          <Loader2 className="w-12 h-12 text-gaming-neon animate-spin" />
        </div>
      );
    }

    const { shift, sessions, orders } = data;
    const start = new Date(shift.startTime);
    const end = shift.endTime ? new Date(shift.endTime) : new Date();
    const durationHours = ((end - start) / (1000 * 60 * 60)).toFixed(2);

    let psTotal = 0;
    let cafeTotal = 0;

    return (
      <div className="p-6 overflow-y-auto flex-1 bg-gaming-dark">
        {/* Printable Area */}
        <div ref={printRef} className="space-y-8 bg-white text-black p-8 rounded-xl shadow-inner min-h-full">
          
          <div className="text-center border-b-2 border-gray-200 pb-6">
            <h1 className="text-3xl font-black uppercase tracking-wider mb-2">Shift Audit Report</h1>
            <p className="text-gray-500">ID: {shift._id}</p>
          </div>

          {/* Section 1: Time Log */}
          <div className="section">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
              <Clock className="w-5 h-5 text-gray-500" /> Time Log & Staff
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded border">
                <span className="block text-xs text-gray-500 uppercase">Staff Member</span>
                <strong className="text-lg">{shift.staffId?.name || 'Unknown'}</strong>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="block text-xs text-gray-500 uppercase">Status</span>
                <span className="badge text-sm font-bold uppercase">{shift.status}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="block text-xs text-gray-500 uppercase">Started At</span>
                <strong>{start.toLocaleString()}</strong>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="block text-xs text-gray-500 uppercase">Ended At</span>
                <strong>{shift.endTime ? end.toLocaleString() : 'Live'} ({durationHours} Hrs)</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Gaming Sessions */}
          <div className="section">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
              <MonitorPlay className="w-5 h-5 text-gray-500" /> Gaming Sessions
            </h2>
            {sessions.length === 0 ? (
              <p className="text-gray-500 italic">No gaming sessions recorded during this shift.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                  <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-2">Device</th>
                    <th className="p-2">Time (Start - End)</th>
                    <th className="p-2">Staff</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Cost Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const isFinished = s.status === 'Finished';
                    const sessionCost = s.totalCost || 0;
                    
                    // Orders cost
                    const sessionOrdersCost = s.orders.reduce((sum, o) => sum + (o.quantity * o.priceAtOrder), 0);
                    const purePsCost = Math.max(0, sessionCost - sessionOrdersCost);
                    
                    if (isFinished) {
                      psTotal += purePsCost;
                      cafeTotal += sessionOrdersCost;
                    }

                    const startTime = new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    const endTime = s.endTime ? new Date(s.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Live';

                    return (
                      <tr key={s._id} className="border-b border-gray-200">
                        <td className="p-2 font-medium">{s.deviceId?.name || 'Unknown Device'}</td>
                        <td className="p-2 text-gray-600">{startTime} - {endTime}</td>
                        <td className="p-2 text-gray-600 font-medium">{s.staffId?.name || shift.staffId?.name || 'Unknown'}</td>
                        <td className="p-2">{s.type}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {isFinished ? `$${purePsCost.toFixed(2)}` : <span className="text-gray-400">Live (Unpaid)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Section 3: Cafe Orders */}
          <div className="section">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
              <Coffee className="w-5 h-5 text-gray-500" /> Cafe & Standalone POS
            </h2>
            {orders.length === 0 && sessions.every(s => s.orders.length === 0) ? (
              <p className="text-gray-500 italic">No cafe items sold during this shift.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                  <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-2">Source</th>
                    <th className="p-2">Items</th>
                    <th className="p-2">Staff</th>
                    <th className="p-2 text-right">Cost Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Standalone Orders */}
                  {orders.map(o => {
                    cafeTotal += o.totalCost;
                    return (
                      <tr key={o._id} className="border-b border-gray-200">
                        <td className="p-2"><span className="badge">Direct POS</span></td>
                        <td className="p-2 text-gray-600">
                          {o.products.map(p => `${p.quantity}x ${p.name}`).join(', ')}
                        </td>
                        <td className="p-2 text-gray-600 font-medium">{o.staffId?.name || shift.staffId?.name || 'Unknown'}</td>
                        <td className="p-2 text-right font-mono font-bold">${o.totalCost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {/* Embedded Session Orders */}
                  {sessions.filter(s => s.orders.length > 0).map(s => {
                    const isFinished = s.status === 'Finished';
                    const sessionOrdersCost = s.orders.reduce((sum, o) => sum + (o.quantity * o.priceAtOrder), 0);
                    
                    return (
                      <tr key={s._id} className="border-b border-gray-200">
                        <td className="p-2"><span className="badge">Session: {s.deviceId?.name}</span></td>
                        <td className="p-2 text-gray-600">
                          {s.orders.map(o => `${o.quantity}x ${o.name}`).join(', ')}
                        </td>
                        <td className="p-2 text-gray-600 font-medium">{s.staffId?.name || shift.staffId?.name || 'Unknown'}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {isFinished ? `$${sessionOrdersCost.toFixed(2)}` : <span className="text-gray-400">Live (Unpaid)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Section 4: Final Reconciliation */}
          <div className="section pt-6 mt-6 border-t-2 border-black">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-gray-700" /> Final Reconciliation
            </h2>
            <div className="bg-gray-100 p-6 rounded-lg border border-gray-300">
              <div className="flex justify-between text-lg mb-2">
                <span className="text-gray-600">PlayStation Revenue</span>
                <span className="font-mono font-bold text-blue-600">${psTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg mb-2">
                <span className="text-gray-600">Cafe & POS Revenue</span>
                <span className="font-mono font-bold text-orange-600">${cafeTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl mt-4 pt-4 border-t-2 border-gray-300 font-black">
                <span>Total Shift Sales</span>
                <span className="font-mono text-green-600">${(psTotal + cafeTotal).toFixed(2)}</span>
              </div>
            </div>
            {shift.totalSales !== (psTotal + cafeTotal) && (
               <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded text-sm">
                 <strong>Audit Warning:</strong> Database records shift total as $${shift.totalSales.toFixed(2)}, but calculated itemized total is $${(psTotal + cafeTotal).toFixed(2)}. This could happen if a session was manually adjusted or deleted.
               </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[60] p-4">
      <div className="bg-gaming-card border border-gaming-neon rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(139,92,246,0.3)]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gaming-darker rounded-t-2xl">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
            <FileText className="text-cyan-400" /> Shift Audit Details
          </h2>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <button 
              onClick={handlePrint}
              disabled={isLoading || !data}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
        
      </div>
    </div>
  );
};

export default ShiftAuditModal;
