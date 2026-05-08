import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Monitor, MapPin, Loader2, X, CheckCircle2, XCircle } from 'lucide-react';

const StatusModal = ({ isOpen, onClose, data, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gaming-card border border-gaming-accent rounded-2xl w-full max-w-2xl shadow-[0_0_40px_rgba(6,182,212,0.2)] flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/20 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Monitor className="text-gaming-accent" /> {data?.loungeName || 'Lounge Status'}
            </h2>
            {data?.area && (
              <p className="text-gray-400 flex items-center gap-1 text-sm mt-1">
                <MapPin className="w-4 h-4" /> {data.area}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 bg-gray-800/50 rounded-full transition-colors"><X /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-12 h-12 animate-spin text-gaming-accent" />
            </div>
          ) : data?.devices?.length === 0 ? (
            <div className="text-center p-8 bg-gaming-dark rounded-xl border border-gray-800">
              <p className="text-gray-400">No devices found in this lounge.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.devices?.map(device => (
                <div 
                  key={device._id} 
                  className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                    device.isAvailable 
                      ? 'bg-green-950/20 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                      : 'bg-red-950/20 border-red-500/30'
                  }`}
                >
                  <div>
                    <h4 className="text-white font-bold text-lg">{device.name}</h4>
                    <span className="text-xs text-gray-400 bg-black/30 px-2 py-0.5 rounded">{device.type}</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 font-bold text-sm ${device.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    {device.isAvailable ? (
                      <><CheckCircle2 className="w-5 h-5" /> Available</>
                    ) : (
                      <><XCircle className="w-5 h-5" /> In Use</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Landing = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [statusData, setStatusData] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const navigate = useNavigate();

  const handleViewStatus = async (loungeId) => {
    setIsStatusModalOpen(true);
    setIsLoadingStatus(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/lounges/${loungeId}/status`);
      setStatusData(res.data);
    } catch (error) {
      console.error(error);
      setStatusData({ devices: [] });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/lounges/search?query=${query}`);
      setResults(res.data);
      setHasSearched(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gaming-darker font-sans text-white">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-6xl mx-auto border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Monitor className="w-8 h-8 text-gaming-neon" />
          <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gaming-neon to-cyan-400">
            PS-SaaS
          </h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/login')} className="px-4 py-2 text-gray-300 hover:text-white font-bold transition-colors">
            Log In
          </button>
          <button onClick={() => navigate('/register')} className="px-4 py-2 bg-gaming-accent hover:bg-cyan-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-colors">
            Register Lounge
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto mt-20 px-4 text-center">
        <h2 className="text-5xl md:text-7xl font-black mb-6">
          Find Your Perfect <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">
            Gaming Lounge
          </span>
        </h2>
        <p className="text-xl text-gray-400 mb-12">Search for top-rated PlayStation lounges in your area.</p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Lounge Name or Area..."
            className="w-full px-6 py-4 bg-gaming-card border-2 border-gray-800 rounded-2xl text-lg focus:outline-none focus:border-gaming-neon transition-colors shadow-2xl pl-14"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <button 
            type="submit" 
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gaming-neon hover:bg-violet-600 px-6 py-2 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Results */}
        {hasSearched && (
          <div className="mt-12 text-left max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-300">Results ({results.length})</h3>
            {results.length === 0 ? (
              <div className="bg-gaming-card p-8 rounded-2xl border border-gray-800 text-center">
                <p className="text-gray-400">No active lounges found matching your search.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((lounge) => (
                  <div key={lounge._id} className="bg-gaming-card p-6 rounded-2xl border border-gray-800 hover:border-gaming-accent transition-colors flex justify-between items-center group">
                    <div>
                      <h4 className="text-2xl font-bold text-white mb-2">{lounge.name}</h4>
                      <p className="text-gray-400 flex items-center gap-1 text-sm">
                        <MapPin className="w-4 h-4" /> {lounge.area}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleViewStatus(lounge._id)}
                      className="px-4 py-2 bg-gray-800 group-hover:bg-gaming-accent text-white font-bold rounded-lg transition-colors"
                    >
                      View Status
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <StatusModal 
        isOpen={isStatusModalOpen} 
        onClose={() => {
          setIsStatusModalOpen(false);
          setTimeout(() => setStatusData(null), 300);
        }} 
        data={statusData}
        isLoading={isLoadingStatus}
      />
    </div>
  );
};

export default Landing;
