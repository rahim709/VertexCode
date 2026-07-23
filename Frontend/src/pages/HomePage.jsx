import { useSelector } from 'react-redux';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  PlayCircle,
  Zap,
  ChevronRight,
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

const fetchHomeData = async (user) => {
  const [leaderboardRes, solvedRes, allProblemsRes] = await Promise.all([
    axiosClient.get('/problem/getLeaderboard'),
    axiosClient.get('/problem/correctSubmission'),
    axiosClient.get('/problem/getAllProblem')
  ]);

  const myIndex = leaderboardRes.data.findIndex(entry => entry._id === user?._id);
  const globalRank = myIndex !== -1 ? `#${myIndex + 1}` : "Unranked";

  const solvedCounts = { easy: 0, medium: 0, hard: 0 };

  const solvedTodayIds = new Set();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (Array.isArray(solvedRes.data)) {
    solvedRes.data.forEach(prob => {
      const diff = prob.difficulty?.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(solvedCounts, diff)) solvedCounts[diff]++;

      const solveDate = new Date(prob.createdAt || new Date());
      if (solveDate >= startOfToday) {
        solvedTodayIds.add(prob._id || prob.problemId);
      }
    });
  }

  let potd = null;
  let isPotdSolved = false;
  if (allProblemsRes.data.length > 0) {
    const sortedProblems = [...allProblemsRes.data].sort((a, b) =>
      a._id.localeCompare(b._id)
    );

    const today = new Date();
    const dateSeed = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const index = dateSeed % sortedProblems.length;
    potd = sortedProblems[index];
    isPotdSolved = solvedTodayIds.has(potd._id);
  }

  const totals = { easy: 0, medium: 0, hard: 0 };
  allProblemsRes.data.forEach(p => {
    const d = p.difficulty?.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(totals, d)) totals[d]++;
  });

  return {
    rank: globalRank,
    solved: solvedCounts,
    totalInSystem: totals,
    potd,
    isPotdSolved,
  };
};


function HomePage() {
  const { user, isNewlyRegistered } = useSelector((state) => state.auth);

  const { data: homeData, isLoading } = useQuery({
    queryKey: ['homeData', user?._id],
    queryFn: () => fetchHomeData(user),
    enabled: !!user,
  });

  const stats = homeData || {
    rank: "---",
    solved: { easy: 0, medium: 0, hard: 0 },
    totalInSystem: { easy: 0, medium: 0, hard: 0 }
  };
  const potd = homeData?.potd || null;
  const isPotdSolved = homeData?.isPotdSolved || false;
  const totalSolved = stats.solved.easy + stats.solved.medium + stats.solved.hard;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center font-sans">
        <BrandFont />
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <Code2 className="w-8 h-8 text-primary" />
             </div>
          </div>
          <div className="text-center">
            <h2 className="font-display text-xl font-bold tracking-tight">Vertex<span className="text-primary">Code</span></h2>
            <p className="text-sm text-base-content/50 font-mono mt-2">connecting to graph...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col font-sans">
      <BrandFont />
      <div className="container mx-auto px-4 md:px-8 pt-20 pb-12 animate-in fade-in duration-700 grow">

        {/* Welcome Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs text-primary mb-2">
                node &gt; {user?.firstName?.toLowerCase() || 'guest'}
              </p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-base-content">
                {isNewlyRegistered ? 'Welcome' : 'Welcome back'}, <span className="text-primary">{user?.firstName || 'Guest'}</span>
              </h1>
              <p className="text-base-content/60 mt-2 text-lg">
                Your path to the vertex continues.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-base-100 border border-base-300 rounded-xl px-6 py-4">
              <Flame className="w-7 h-7 text-warning" />
              <div>
                <p className="font-mono text-xs text-base-content/40 uppercase tracking-wide">total solved</p>
                <p className="font-display text-2xl font-bold text-base-content">{totalSolved}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-8">
            {/* Quick Start Hero */}
            <div className="rounded-2xl bg-primary text-primary-content p-8 md:p-12">
              <p className="font-mono text-xs text-primary-content/60 mb-3">$ vertex resume</p>
              <h2 className="font-display text-3xl font-bold mb-4 tracking-tight">Level up your logic</h2>
              <p className="text-primary-content/80 mb-8 max-w-md leading-relaxed">
                Consistent practice is the fastest path to the top of the leaderboard. Pick a problem and start coding.
              </p>
              <NavLink to="/problems" className="btn btn-neutral px-8 gap-2">
                Resume practice <PlayCircle className="w-5 h-5" />
              </NavLink>
            </div>

            {/* Problem of the Day Section */}
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold flex items-center gap-2 tracking-tight">
                    <Calendar className="text-primary w-5 h-5" /> POTD
                  </h3>
                  {isPotdSolved && (
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold px-3 py-1.5 rounded-full bg-success/10 text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" /> solved
                    </div>
                  )}
                </div>

                {potd ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded ${
                          potd.difficulty === 'easy' ? 'bg-success/10 text-success' :
                          potd.difficulty === 'medium' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                        }`}>
                          {potd.difficulty}
                        </span>
                        <span className="text-base-content/40">#{potd.tags}</span>
                      </div>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-base-content">{potd.title}</h2>
                    </div>

                    <NavLink
                      to={`/problem/${potd._id}`}
                      className={`btn ${isPotdSolved ? 'btn-outline btn-success' : 'btn-primary'} px-10 gap-1 shrink-0`}
                    >
                      {isPotdSolved ? 'View solution' : 'Solve challenge'}
                      <ChevronRight className="w-4 h-4" />
                    </NavLink>
                  </div>
                ) : (
                  <p className="text-base-content/50 font-mono text-sm">syncing today's node...</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] text-base-content/40 uppercase tracking-wide">global rank</p>
                    <p className="font-display text-3xl font-bold text-primary">{stats.rank}</p>
                  </div>
                </div>

                <h3 className="font-mono text-[11px] uppercase text-base-content/40 mb-4 tracking-wide">mastery progress</h3>
                <div className="space-y-6">
                  <DifficultyBar label="Easy" solved={stats.solved.easy} total={stats.totalInSystem.easy} color="progress-success" />
                  <DifficultyBar label="Medium" solved={stats.solved.medium} total={stats.totalInSystem.medium} color="progress-warning" />
                  <DifficultyBar label="Hard" solved={stats.solved.hard} total={stats.totalInSystem.hard} color="progress-error" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-base-100 border border-base-300 p-6">
              <p className="font-mono text-xs text-base-content/40 mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-warning" /> // daily_insight
              </p>
              <p className="text-base-content/70 leading-relaxed">
                {todayInsight}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-base-100 py-10 border-t border-base-300 w-full">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 text-primary">
            <Share2 className="w-5 h-5 rotate-90" />
            <span className="font-display font-bold text-lg text-base-content">Vertex<span className="text-primary">Code</span></span>
          </div>
          <p className="text-base-content/50 text-sm font-mono">
            © 2026 VertexCode
          </p>
        </div>
      </footer>
    </div>
  );
}

function DifficultyBar({ label, solved, total, color }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5 font-mono uppercase tracking-wide text-base-content/60">
        <span>{label}</span>
        <span>{solved} / {total}</span>
      </div>
      <progress className={`progress ${color} h-1.5`} value={solved} max={total}></progress>
    </div>
  );
}

// Loads the same Space Grotesk / IBM Plex Mono pairing used across the
// VertexCode marketing pages, so the dashboard reads as the same product.
function BrandFont() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      .font-display { font-family: 'Space Grotesk', sans-serif; }
      .font-mono { font-family: 'IBM Plex Mono', monospace; }
    `}</style>
  );
}

export default HomePage;