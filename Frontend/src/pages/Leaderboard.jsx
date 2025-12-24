import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { 
  Trophy, 
  Medal, 
  Search, 
  Crown, 
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- Animation State ---
  const [isVisible, setIsVisible] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get('problem/getLeaderboard');
        setLeaders(data);
        setTimeout(() => setIsVisible(true), 100);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setError("Failed to load rankings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Filter logic
  const filteredLeaders = leaders.filter(leader => 
    leader.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Calculations
  const totalItems = filteredLeaders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTableItems = filteredLeaders.slice(startIndex, startIndex + itemsPerPage);
  
  // Top 3 for the Podium - Static from original array
  const topThree = leaders.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 pt-32 text-center">
        <span className="loading loading-ring loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/50 animate-pulse uppercase tracking-widest text-xs font-bold">Syncing Leaderboard</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-base-200 pt-24 pb-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-full mb-4">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Global Standings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter italic">THE VERTEX <span className="text-primary">ELITE</span></h1>
          <p className="text-base-content/60 max-w-xl mx-auto font-medium">
             Difficulty Weights: <span className="text-success font-bold">Easy (10)</span> • <span className="text-warning font-bold">Med (30)</span> • <span className="text-error font-bold">Hard (50)</span>
          </p>
        </div>

        {/* Podium Section (Top 3) */}
        {!searchTerm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end px-4">
            {/* Rank 2 */}
            {topThree[1] && (
              <div className={`order-2 md:order-1 card bg-base-100 shadow-xl border-b-4 border-slate-400 transition-all duration-700 delay-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="card-body items-center text-center p-6 hover:bg-base-200/30 transition-colors rounded-2xl">
                  <div className="avatar placeholder mb-2">
                    <div className="bg-slate-400 text-white rounded-full w-16 flex items-center justify-center font-bold text-xl">2</div>
                  </div>
                  <h3 className="font-bold text-lg">{topThree[1].firstName}</h3>
                  <p className="text-3xl font-black text-primary">{topThree[1].vertexScore || 0}</p>
                  <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Vertex Score</p>
                  <span className="text-[10px] opacity-30 mt-1">{topThree[1].solvedCount} Solved</span>
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {topThree[0] && (
              <div className={`order-1 md:order-2 card bg-base-100 shadow-2xl border-t-4 border-warning z-10 scale-105 transition-all duration-700 delay-150 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="card-body items-center text-center p-8 relative hover:bg-base-200/30 transition-colors rounded-2xl">
                  <Crown className="w-10 h-10 text-warning absolute -top-5 left-1/2 -translate-x-1/2" />
                  <div className="avatar placeholder mb-2">
                    <div className="bg-warning text-warning-content rounded-full w-24 ring ring-warning ring-offset-base-100 ring-offset-2 flex items-center justify-center font-bold text-2xl">1</div>
                  </div>
                  <h3 className="font-black text-2xl">{topThree[0].firstName}</h3>
                  <p className="text-5xl font-black text-primary">{topThree[0].vertexScore || 0}</p>
                  <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Vertex Score</p>
                  <span className="text-[10px] opacity-30 mt-1">{topThree[0].solvedCount} Solved</span>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {topThree[2] && (
              <div className={`order-3 card bg-base-100 shadow-xl border-b-4 border-orange-600 transition-all duration-700 delay-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="card-body items-center text-center p-6 hover:bg-base-200/30 transition-colors rounded-2xl">
                  <div className="avatar placeholder mb-2">
                    <div className="bg-orange-600 text-white rounded-full w-16 flex items-center justify-center font-bold text-xl">3</div>
                  </div>
                  <h3 className="font-bold text-lg">{topThree[2].firstName}</h3>
                  <p className="text-3xl font-black text-primary">{topThree[2].vertexScore || 0}</p>
                  <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Vertex Score</p>
                  <span className="text-[10px] opacity-30 mt-1">{topThree[2].solvedCount} Solved</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Rankings Table Section */}
        <div className={`card bg-base-100 shadow-sm border border-base-300 overflow-hidden transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="p-5 border-b border-base-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-base-200/20">
            <h2 className="font-bold text-xl flex items-center gap-2 italic tracking-tighter">
              <TrendingUp className="text-success w-5 h-5" /> All Ranking
            </h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input 
                type="text" 
                placeholder="Find a coder..." 
                className="input input-bordered input-sm w-full pl-10 bg-base-100 focus:ring-2 focus:ring-primary transition-all duration-300"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="text-base-content/50 uppercase text-[10px] font-black tracking-[0.2em] border-b border-base-200">
                  <th className="py-5">Rank</th>
                  <th className="py-5 pl-10">Coder</th>
                  <th className="py-5 text-center">Solved</th>
                  <th className="py-5 text-right">Vertex Score</th>
                </tr>
              </thead>
              <tbody>
                {currentTableItems.map((leader, index) => {
                  const absoluteRank = leaders.findIndex(l => l._id === leader._id) + 1;
                  
                  return (
                    <tr 
                      key={leader._id} 
                      className={`hover:bg-base-200/50 transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                      style={{ transitionDelay: `${800 + (index * 100)}ms` }}
                    >
                      <td className="font-bold">
                        {absoluteRank <= 3 ? (
                          <div className="flex items-center gap-2">
                            <Medal className={`w-4 h-4 ${
                              absoluteRank === 1 ? 'text-warning' : 
                              absoluteRank === 2 ? 'text-slate-400' : 'text-orange-600'
                            }`} />
                            <span className="text-primary font-black">#{absoluteRank}</span>
                          </div>
                        ) : <span className="opacity-40 font-mono text-xs">#{absoluteRank}</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-9 flex items-center justify-center border border-base-300 font-bold text-xs">
                              {leader.firstName?.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-base-content text-sm">{leader.firstName} </p>
                            {leader.solvedCount === 0 && <span className="text-[9px] text-primary font-black uppercase tracking-widest">New Entry</span>}
                          </div>
                        </div>
                      </td>
                      <td className="text-center opacity-40 font-bold">
                        {leader.solvedCount || 0}
                      </td>
                      <td className="text-right">
                        <span className="font-black text-lg text-primary">{leader.vertexScore || 0}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-6 flex flex-col md:flex-row items-center justify-between border-t border-base-200 gap-4 bg-base-200/10">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                Nodes <span className="text-base-content">{startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)}</span> of {totalItems}
              </span>
              
              <div className="join shadow-sm">
                <button className="join-item btn btn-xs btn-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button 
                        key={pageNum}
                        className={`join-item btn btn-xs ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <button key={pageNum} className="join-item btn btn-xs btn-disabled opacity-30">...</button>;
                  }
                  return null;
                })}
                <button className="join-item btn btn-xs btn-outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}