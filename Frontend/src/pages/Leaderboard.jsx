import { useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  Medal,
  Search,
  Crown,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const fetchLeaderboard = async () => {
  const { data } = await axiosClient.get('/problem/getLeaderboard');
  return data;
};

const PODIUM_STYLE = {
  1: { ring: 'border-warning', badge: 'bg-warning text-warning-content', size: 'w-16 h-16 text-lg', crown: true },
  2: { ring: 'border-slate-400', badge: 'bg-slate-400 text-white', size: 'w-12 h-12 text-sm', crown: false },
  3: { ring: 'border-orange-600', badge: 'bg-orange-600 text-white', size: 'w-12 h-12 text-sm', crown: false },
};

function Avatar({ name, avatarUrl, size = 'w-9 h-9' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initial}
        className={`rounded-full object-cover border border-base-300 ${size}`}
      />
    );
  }
  return (
    <div className={`rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xs shrink-0 ${size}`}>
      {initial}
    </div>
  );
}

function PodiumCard({ leader, place }) {
  if (!leader) return null;
  const style = PODIUM_STYLE[place];
  const avatarSize = place === 1 ? 'w-20 h-20' : 'w-16 h-16';
  return (
    <div className={`card bg-base-100 border ${place === 1 ? 'border-warning' : place === 2 ? 'border-slate-400/40' : 'border-orange-600/40'} ${place === 1 ? 'md:scale-105' : ''}`}>
      <div className="card-body items-center text-center p-4 relative">
        {style.crown && <Crown className="w-6 h-6 text-warning absolute -top-4 left-1/2 -translate-x-1/2" />}
        <div className="relative mb-3">
          <Avatar name={leader.firstName} avatarUrl={leader.avatarUrl} size={avatarSize} />
          <div className={`absolute -bottom-2 -right-2 rounded-full flex items-center justify-center font-display font-bold ${style.badge} ${place === 1 ? 'w-7 h-7 text-sm' : 'w-6 h-6 text-xs'}`}>
            {place}
          </div>
        </div>
        <h3 className="font-display font-bold text-base text-base-content">{leader.firstName}</h3>
        <p className={`font-display font-bold text-primary ${place === 1 ? 'text-2xl' : 'text-lg'}`}>
          {leader.vertexScore || 0}
        </p>
        <p className="font-mono text-[9px] text-base-content uppercase tracking-wide">vertex score</p>
        <span className="font-mono text-[11px] text-base-content/60">{leader.solvedCount} solved</span>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data: leaders = [], isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredLeaders = leaders.filter(leader =>
    leader.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredLeaders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTableItems = filteredLeaders.slice(startIndex, startIndex + itemsPerPage);

  const topThree = leaders.slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 pt-32 text-center font-sans">
        <BrandFont />
        <span className="loading loading-ring loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/50 font-mono text-xs">syncing leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 pt-32 text-center px-4 font-sans">
        <BrandFont />
        <div className="alert max-w-md mx-auto bg-error/10 border border-error/20">
          <AlertCircle className="w-5 h-5 text-error" />
          <span className="text-error font-mono text-sm">Couldn't load the leaderboard. Try again in a moment.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pt-24 pb-12 font-sans">
      <BrandFont />
      <div className="container mx-auto px-4 max-w-5xl">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-warning/10 text-warning rounded-full mb-4">
            <Trophy className="w-4 h-4" />
            <span className="font-mono text-xs font-semibold">global standings</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight text-base-content">
            The vertex <span className="text-primary">elite</span>
          </h1>
          <p className="text-base-content/60 max-w-xl mx-auto font-mono text-sm">
            weights: <span className="text-success">easy · 10</span> · <span className="text-warning">med · 30</span> · <span className="text-error">hard · 50</span>
          </p>
        </div>

        {!searchTerm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end px-4">
            <div className="order-2 md:order-1"><PodiumCard leader={topThree[1]} place={2} /></div>
            <div className="order-1 md:order-2"><PodiumCard leader={topThree[0]} place={1} /></div>
            <div className="order-3"><PodiumCard leader={topThree[2]} place={3} /></div>
          </div>
        )}

        <div className="card bg-base-100 border border-base-300 overflow-hidden">
          <div className="p-5 border-b border-base-300 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="font-display font-bold text-xl flex items-center gap-2 tracking-tight text-base-content">
              <TrendingUp className="text-success w-5 h-5" /> All rankings
            </h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Find a coder..."
                className="input input-bordered input-sm w-full pl-10 font-mono"
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
                <tr className="text-base-content/40 font-mono text-[10px] uppercase tracking-wide border-b border-base-300">
                  <th className="py-5">rank</th>
                  <th className="py-5 pl-10">coder</th>
                  <th className="py-5 text-center">solved</th>
                  <th className="py-5 text-right">vertex score</th>
                </tr>
              </thead>
              <tbody>
                {currentTableItems.map((leader) => {
                  const absoluteRank = leaders.findIndex(l => l._id === leader._id) + 1;

                  return (
                    <tr key={leader._id} className="hover:bg-base-200/50">
                      <td className="font-mono font-semibold">
                        {absoluteRank <= 3 ? (
                          <div className="flex items-center gap-2">
                            <Medal className={`w-4 h-4 ${
                              absoluteRank === 1 ? 'text-warning' :
                              absoluteRank === 2 ? 'text-base-content/40' : 'text-warning/50'
                            }`} />
                            <span className="text-primary">#{absoluteRank}</span>
                          </div>
                        ) : <span className="text-base-content/40 text-xs">#{absoluteRank}</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={leader.firstName} avatarUrl={leader.avatarUrl} />
                          <div>
                            <p className="font-medium text-base-content text-sm">{leader.firstName}</p>
                            {leader?.solvedCount === 0 && (
                              <span className="font-mono text-[10px] text-primary">new member</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center font-mono text-base-content/50">
                        {leader.solvedCount || 0}
                      </td>
                      <td className="text-right">
                        <span className="font-display font-bold text-lg text-primary">{leader.vertexScore || 0}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-6 flex flex-col md:flex-row items-center justify-between border-t border-base-300 gap-4">
              <span className="font-mono text-[11px] text-base-content/40">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}
              </span>

              <div className="join">
                <button className="join-item btn btn-xs btn-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button
                        key={pageNum}
                        className={`join-item btn btn-xs font-mono ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
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

// Loads the same Space Grotesk / IBM Plex Mono pairing used across the
// VertexCode marketing pages, so this page reads as the same product.
function BrandFont() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      .font-display { font-family: 'Space Grotesk', sans-serif; }
      .font-mono { font-family: 'IBM Plex Mono', monospace; }
    `}</style>
  );
}