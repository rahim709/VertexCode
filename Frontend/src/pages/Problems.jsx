import { useState } from 'react';
import { NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, 
  Layers, Zap, Trophy, LayoutGrid, ChevronRight as ArrowIcon
} from 'lucide-react';

const loadProblemData = async (user) => {
  const [{ data: allProblems }, { data: leaderboard }] = await Promise.all([
    axiosClient.get('/problem/getAllProblem'),
    axiosClient.get('/problem/getLeaderboard'),
  ]);

  let solvedProblems = [];
  if (user) {
    const { data } = await axiosClient.get('/problem/correctSubmission');
    solvedProblems = data;
  }

  let userRank = "---";
  if (user && leaderboard.length > 0) {
    const position = leaderboard.findIndex(entry => entry._id === user._id);
    userRank = position !== -1 ? `#${position + 1}` : "1000+";
  }

  return { problems: allProblems, solvedProblems, userRank };
};

function Problems() {
  const { user } = useSelector((state) => state.auth);

  const [filters, setFilters] = useState(JSON.parse(localStorage.getItem("filters")) || { difficulty: 'all', tag: 'all', status: 'all' });
  const [currentPage, setCurrentPage] = useState(Number(localStorage.getItem("currentPage")) || 1);
  const [search, setSearch] = useState(localStorage.getItem("search") || "");

  const problemsPerPage = 6;
  const isVisible = true;

  const { data, isLoading: pageLoading } = useQuery({
    queryKey: ['problems', user?._id],
    queryFn: () => loadProblemData(user),
    enabled: true,
  });

  const problems = data?.problems || [];
  const solvedProblems = data?.solvedProblems || [];
  const userRank = data?.userRank || "---";

  const filtered = problems.filter(p => {
    const dMatch =
      filters.difficulty === 'all' || p.difficulty === filters.difficulty;

    const tMatch =
      filters.tag === 'all' || p.tags === filters.tag;

    const isSolved = solvedProblems.some(sp => sp._id === p._id);

    const sMatch =
      filters.status === 'all' ||
      (filters.status === 'solved' && isSolved) ||
      (filters.status === 'unsolved' && !isSolved);

    const searchMatch =
      p.title.toLowerCase().includes(search.toLowerCase());

    return dMatch && tMatch && sMatch && searchMatch;
  });


  const totalPages = Math.ceil(filtered.length / problemsPerPage);
  const currentProblems = filtered.slice((currentPage - 1) * problemsPerPage, currentPage * problemsPerPage);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-infinity loading-lg text-primary"></span>
          <p className="font-bold tracking-widest text-primary animate-pulse uppercase text-xs">Accessing Vertex Nodes</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-base-200 pt-24 pb-12 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* --- Stats Dashboard --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stats shadow bg-base-100 border border-base-300 md:col-span-3 overflow-hidden">
            <div className="stat">
              <div className="stat-figure text-primary"><Layers className="w-8 h-8 opacity-20" /></div>
              <div className="stat-title text-xs font-bold uppercase">Library Size</div>
              <div className="stat-value text-primary">{problems.length}</div>
              <div className="stat-desc">Active challenges</div>
            </div>
            
            <div className="stat">
              <div className="stat-figure text-success"><CheckCircle2 className="w-8 h-8 opacity-20" /></div>
              <div className="stat-title text-xs font-bold uppercase">Solved</div>
              <div className="stat-value text-success">{solvedProblems.length}</div>
              <div className="stat-desc">Completed nodes</div>
            </div>

            <div className="stat hidden sm:inline-grid">
              <div className="stat-figure text-warning"><Zap className="w-8 h-8 opacity-20" /></div>
              <div className="stat-title text-xs font-bold uppercase">Accuracy</div>
              <div className="stat-value text-warning">
                {user?.count > 0 ? Math.round((solvedProblems.length / user.count) * 100) : 0}%
              </div>
              <div className="stat-desc">Overall mastery</div>
            </div>
          </div>

          <div className="card bg-primary text-primary-content shadow-lg hidden md:flex items-center justify-center p-4 hover:scale-[1.02] transition-transform duration-300">
            <Trophy className="w-8 h-8 mb-1" />
            <div className="text-center">
               <p className="text-[10px] font-bold uppercase opacity-60">Global Rank</p>
               <p className="text-2xl font-black">{user ? userRank : '---'}</p>
            </div>
          </div>
        </div>

        {/* --- Control Bar --- */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center bg-base-100 p-4 rounded-2xl shadow-sm border border-base-300 transform transition-all duration-500 delay-100">
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
            <input
              type="text"
              className="input input-bordered w-full pl-12 bg-base-200/50 border-none focus:ring-2 focus:ring-primary transition-all duration-300"
              placeholder="Search by problem name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            {['status', 'difficulty', 'tag'].map((filterType) => {
              const labelMap = {
                status: 'Status',
                difficulty: 'Difficulty',
                tag: 'Tags'
              };

              return (
                <select
                  key={filterType}
                  className="select select-sm select-bordered bg-base-200/50 border-none font-medium hover:bg-base-200 transition-colors"
                  value={filters[filterType]}
                  onChange={(e) => {
                    setFilters({ ...filters, [filterType]: e.target.value });
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">{labelMap[filterType]}</option>

                  {filterType === 'status' && (
                    <>
                      <option value="solved">Solved</option>
                      <option value="unsolved">Unsolved</option>
                    </>
                  )}

                  {filterType === 'difficulty' && (
                    <>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </>
                  )}

                  {filterType === 'tag' && (
                    <>
                      <option value="array">Arrays</option>
                      <option value="linkedlist">Linked Lists</option>
                      <option value="graph">Graphs</option>
                      <option value="dp">DP</option>
                    </>
                  )}
                </select>
              );
            })}
          </div>

        </div>

        {/* --- Problems Display --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentProblems.map((problem, index) => (
            <NavLink 
              key={problem._id} 
              to={`/problem/${problem._id}`}
              style={{ transitionDelay: `${index * 50}ms` }} // Staggered delay
              className={`group card bg-base-100 border border-base-300 hover:border-primary transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div className="card-body p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${getDotColor(problem.difficulty)} animate-pulse`}></span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{problem.difficulty}</span>
                    </div>
                    <h2 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                      {problem.title}
                    </h2>
                  </div>
                  {solvedProblems.some(sp => sp._id === problem._id) && (
                    <div className="bg-success/10 p-2 rounded-full scale-110 animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                  )}
                </div>
                
                <div className="divider my-2 opacity-5"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="badge badge-sm badge-outline opacity-60 font-medium capitalize">#{problem.tags}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    SOLVE <ArrowIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </NavLink>
          ))}
        </div>

        {/* --- Empty State --- */}
        {!pageLoading && currentProblems.length === 0 && (
          <div className="text-center py-20 bg-base-100 rounded-3xl border-2 border-dashed border-base-300 animate-in fade-in zoom-in duration-500">
            <LayoutGrid className="w-16 h-16 mx-auto opacity-10 mb-4" />
            <h3 className="text-xl font-bold">No results found</h3>
            <p className="opacity-50 text-sm">Try broadening your search or filter parameters.</p>
          </div>
        )}

        {/* --- Modern Pagination --- */}
        {totalPages > 1 && (
          <div className={`flex justify-center mt-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="join bg-base-100 shadow-sm border border-base-300">
              <button className="join-item btn btn-ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} 
                  className={`join-item btn btn-ghost transition-colors duration-300 ${currentPage === i + 1 ? 'btn-active text-primary' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="join-item btn btn-ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const getDotColor = (diff) => {
  switch (diff?.toLowerCase()) {
    case 'easy': return 'bg-success';
    case 'medium': return 'bg-warning';
    case 'hard': return 'bg-error';
    default: return 'bg-base-300';
  }
};

export default Problems;