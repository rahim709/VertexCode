import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { 
  Trophy, 
  PlayCircle, 
  Zap, 
  ChevronRight, 
  Target, 
  Code2, 
  Flame,
  CheckCircle2,
  Calendar,
  Share2
} from 'lucide-react';



const DAILY_INSIGHTS = [
    "The best way to predict the future is to implement it.", // Sunday
    "Optimization is the bridge between a solution that works and a solution that lasts.", // Monday
    "Code is like humor. When you have to explain it, it’s bad.", // Tuesday
    "Clean code always looks like it was written by someone who cares.", // Wednesday
    "First, solve the problem. Then, write the code.", // Thursday
    "Small steady steps in logic lead to great leaps in performance.", // Friday
    "Don't comment bad code—rewrite it." // Saturday
];

  // Pick the insight based on the current day of the week (0-6)
const todayInsight = DAILY_INSIGHTS[new Date().getDay()];




function HomePage() {
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    rank: "---",
    solved: { easy: 0, medium: 0, hard: 0 },
    totalInSystem: { easy: 0, medium: 0, hard: 0 }
  });
  
  const [potd, setPotd] = useState(null); // Problem of the Day
  const [isPotdSolved, setIsPotdSolved] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [leaderboardRes, solvedRes, allProblemsRes] = await Promise.all([
          axiosClient.get('problem/getLeaderboard'),
          axiosClient.get('/problem/correctSubmission'),
          axiosClient.get('/problem/getAllProblem')
        ]);

        const myIndex = leaderboardRes.data.findIndex(entry => entry._id === user?._id);
        const globalRank = myIndex !== -1 ? `#${myIndex + 1}` : "Unranked";

        const solvedCounts = { easy: 0, medium: 0, hard: 0 };
        
        // --- NEW LOGIC: SOLVED TODAY CHECK ---
        const solvedTodayIds = new Set();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // Get 12:00 AM of the current day

        if (Array.isArray(solvedRes.data)) {
          solvedRes.data.forEach(prob => {
            // 1. Traditional counting for mastery stats
            const diff = prob.difficulty?.toLowerCase();
            if (solvedCounts.hasOwnProperty(diff)) solvedCounts[diff]++;

            // 2. Check if the problem was solved specifically TODAY
            // We assume the submission object has a 'createdAt' or 'updatedAt' field
            const solveDate = new Date(prob.createdAt || new Date()); 
            if (solveDate >= startOfToday) {
                solvedTodayIds.add(prob._id || prob.problemId);
            }
          });
        }

        if (allProblemsRes.data.length > 0) {
            // Sort problems by ID to ensure they are ALWAYS in the same order
            const sortedProblems = [...allProblemsRes.data].sort((a, b) => 
                a._id.localeCompare(b._id)
            );

            const today = new Date();
            const dateSeed = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
            
            // Pick the index from the SORTED list
            const index = dateSeed % sortedProblems.length;
            const selectedPotd = sortedProblems[index];
            
            setPotd(selectedPotd);
            
            // Update UI based on if it was solved TODAY specifically
            setIsPotdSolved(solvedTodayIds.has(selectedPotd._id));
        }

        const totals = { easy: 0, medium: 0, hard: 0 };
        allProblemsRes.data.forEach(p => {
            const d = p.difficulty?.toLowerCase();
            if (totals.hasOwnProperty(d)) totals[d]++;
        });

        setStats({
          rank: globalRank,
          solved: solvedCounts,
          totalInSystem: totals
        });

        setIsDataLoaded(true);
      } catch (err) {
        console.error("Error loading Vertex data:", err);
        setIsDataLoaded(true); 
      }
    };

    if (user) fetchHomeData();
  }, [user]);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <Code2 className="w-8 h-8 text-primary" />
             </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black tracking-widest uppercase italic">Vertex<span className="text-primary">Code</span></h2>
            <p className="text-sm text-base-content/50 font-bold animate-pulse mt-2 uppercase tracking-tighter">Synchronizing Node Data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <div className="container mx-auto px-4 md:px-8 pt-20 pb-12 animate-in fade-in duration-700 grow">
        
        {/* Welcome Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight ">
                Welcome back, <span className="text-primary">{user?.firstName || 'GUEST'}</span>!
              </h1>
              <p className="text-base-content/60 mt-2 text-lg">
                Your journey to the <span className="font-bold text-base-content">Vertex</span> continues.
              </p>
            </div>
            <div className="stats shadow bg-base-100 border border-base-300">
              <div className="stat px-6">
                <div className="stat-figure text-orange-500">
                  <Flame className="w-8 h-8 fill-current" />
                </div>
                <div className="stat-title text-xs font-bold uppercase tracking-tighter">Total Solved</div>
                <div className="stat-value text-2xl">
                    {stats.solved.easy + stats.solved.medium + stats.solved.hard}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Start Hero */}
            <div className="card bg-primary text-primary-content shadow-xl overflow-hidden relative border-none">
              <div className="card-body p-8 md:p-12 z-10">
                <h2 className="text-3xl font-black mb-4 uppercase italic tracking-tighter">Level Up Your Logic</h2>
                <p className="text-primary-content/80 mb-8 max-w-md leading-relaxed font-medium">
                  Consistent practice is the fastest path to the top of the leaderboard. Pick a problem and start coding.
                </p>
                <div className="card-actions">
                  <NavLink to="/problems" className="btn btn-neutral px-8 shadow-lg">
                    Resume Practice <PlayCircle className="w-5 h-5 ml-2" />
                  </NavLink>
                </div>
              </div>
              <div className="absolute top-[-20%] right-[-10%] opacity-10">
                <Target className="w-64 h-64" />
              </div>
            </div>

            {/* Problem of the Day Section */}
            <div className="card bg-base-100 border border-base-300 shadow-xl">
              <div className="card-body p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 uppercase italic tracking-tight">
                    <Calendar className="text-primary w-5 h-5" /> Daily Challenge
                  </h3>
                  {isPotdSolved && (
                    <div className="badge badge-success gap-1 py-3 px-4 text-xs font-bold text-success-content uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> SOLVED
                    </div>
                  )}
                </div>

                {potd ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          potd.difficulty === 'easy' ? 'bg-success/20 text-success' : 
                          potd.difficulty === 'medium' ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'
                        }`}>
                          {potd.difficulty}
                        </span>
                        <span className="text-[10px] font-bold text-base-content/40 uppercase">#{potd.tags}</span>
                      </div>
                      <h2 className="text-2xl font-black italic tracking-tight uppercase">{potd.title}</h2>
                    </div>
                    
                    <div className="card-actions">
                      <NavLink 
                        to={`/problem/${potd._id}`} 
                        className={`btn ${isPotdSolved ? 'btn-outline btn-success' : 'btn-primary'} px-10 shadow-lg`}
                      >
                        {isPotdSolved ? 'View Solution' : 'Solve Challenge'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </NavLink>
                    </div>
                  </div>
                ) : (
                  <p className="text-base-content/50 italic">Synchronizing daily nodes...</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-4 mb-8 bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <div className="bg-primary p-3 rounded-lg text-primary-content shadow-md shadow-primary/20">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-base-content/40 font-black uppercase tracking-widest">Global Rank</p>
                    <p className="font-black text-3xl text-primary">{stats.rank}</p>
                  </div>
                </div>

                <h3 className="text-[10px] font-black uppercase text-base-content/40 mb-4 tracking-widest">Mastery Progress</h3>
                <div className="space-y-6">
                  <DifficultyBar label="Easy" solved={stats.solved.easy} total={stats.totalInSystem.easy} color="progress-success" />
                  <DifficultyBar label="Medium" solved={stats.solved.medium} total={stats.totalInSystem.medium} color="progress-warning" />
                  <DifficultyBar label="Hard" solved={stats.solved.hard} total={stats.totalInSystem.hard} color="progress-error" />
                </div>
              </div>
            </div>

            <div className="card bg-base-300/50 border border-base-300">
              <div className="card-body p-6 text-sm">
                <h3 className="font-bold flex items-center gap-2 mb-2 uppercase text-xs tracking-tighter text-base-content/60">
                  <Zap className="w-4 h-4 text-yellow-500 fill-current" /> Daily Insight
                </h3>
                <p className="text-base-content/70 leading-relaxed italic font-medium">
                  {todayInsight}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-base-100 py-10 border-t border-base-300 w-full">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-primary rotate-90" />
            <span className="font-bold text-lg tracking-tighter ">Vertex<span className="text-primary">Code</span></span>
          </div>
          <p className="text-base-content/50 text-sm">
            Copyright © 2025 VertexCode
          </p>
        </div>
      </footer>
    </div>
  );
}

function DifficultyBar({ label, solved, total, color }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1.5 font-black uppercase tracking-tighter opacity-70">
        <span>{label}</span>
        <span>{solved} / {total}</span>
      </div>
      <progress className={`progress ${color} h-2 shadow-inner`} value={solved} max={total}></progress>
    </div>
  );
}

export default HomePage;