import { NavLink } from 'react-router';
import { ArrowRight, ArrowUpRight, Share2 } from 'lucide-react';

function MasteryGraph() {
  const you = { x: 220, y: 210 };
  const nodes = [
    { label: 'Arrays', x: 78, y: 74, ramp: 'text-base-content/50' },
    { label: 'Graphs', x: 344, y: 66, ramp: 'text-primary' },
    { label: 'Trees', x: 372, y: 232, ramp: 'text-base-content/50' },
    { label: 'DP', x: 300, y: 366, ramp: 'text-success' },
    { label: 'Heaps', x: 108, y: 350, ramp: 'text-base-content/50' },
    { label: 'LinkedList', x: 52, y: 208, ramp: 'text-warning' },
  ];
  const crossEdges = [
    [0, 5], [1, 2], [3, 4],
  ];

  return (
    <svg viewBox="0 0 420 420" className="w-full h-auto" role="img" aria-label="Graph of DSA topics converging on the learner">
      {crossEdges.map(([a, b], i) => (
        <line
          key={`cross-${i}`}
          x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="currentColor" className="text-base-content/10" strokeWidth="1.5"
        />
      ))}
      {nodes.map((n, i) => (
        <line
          key={`spoke-${i}`}
          x1={you.x} y1={you.y} x2={n.x} y2={n.y}
          stroke="currentColor" className="text-base-content/20" strokeWidth="1.5"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i} className={n.ramp}>
          <circle cx={n.x} cy={n.y} r="7" fill="currentColor" />
          <text
            x={n.x} y={n.y - 16} textAnchor="middle"
            className="fill-base-content font-mono text-[11px] font-medium"
          >
            {n.label}
          </text>
        </g>
      ))}
      <circle cx={you.x} cy={you.y} r="20" className="fill-primary/15" />
      <circle cx={you.x} cy={you.y} r="20" className="text-primary motion-safe:animate-ping [animation-duration:2.5s]" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx={you.x} cy={you.y} r="11" className="fill-primary" />
      <text x={you.x} y={you.y + 38} textAnchor="middle" className="fill-primary font-mono text-xs font-bold tracking-wide">
        you
      </text>
    </svg>
  );
}

function EditorPreview() {
  const lines = [
    { n: 1, t: <span className="text-base-content/40">function</span> },
    { n: 2, t: <><span className="text-primary">shortestPath</span><span className="text-base-content/40">(graph, start) {'{'}</span></> },
    { n: 3, t: <span className="pl-4 text-base-content/40">const dist = new Map();</span> },
    { n: 4, t: <span className="pl-4 text-base-content/40">const queue = [start];</span> },
    { n: 5, t: <span className="pl-4 text-warning">// relax each edge</span> },
    { n: 6, t: <span className="pl-4 text-base-content/40">while (queue.length) {'{'}</span> },
    { n: 7, t: <span className="pl-8 text-success">return dist;</span> },
    { n: 8, t: <span className="text-base-content/40">{'}'}</span> },
  ];
  return (
    <div className="w-full rounded-xl border border-base-300 bg-base-100 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-300 bg-base-200/60">
        <span className="font-mono text-xs text-base-content/50">graph.js</span>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-success/10 text-success">accepted</span>
      </div>
      <div className="p-4 font-mono text-[13px] leading-7">
        {lines.map((l) => (
          <div key={l.n} className="flex gap-4">
            <span className="text-base-content/25 select-none w-4 text-right">{l.n}</span>
            <span>{l.t}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-base-300 text-[11px] font-mono text-base-content/50">
        <span>runtime: 42ms</span>
        <span>O(V + E)</span>
      </div>
    </div>
  );
}

const path = [
  {
    id: 'v1',
    badgeClass: 'bg-primary/10 text-primary',
    title: 'A curriculum, not a pile of problems',
    body: "1,000+ problems ordered so each one leans on the last — arrays before graphs, graphs before dynamic programming.",
  },
  {
    id: 'v2',
    badgeClass: 'bg-success/10 text-success',
    title: 'A rank that moves while you solve',
    body: "Every accepted solution updates your position on the leaderboard and your percentile against everyone solving today.",
  },
  {
    id: 'v3',
    badgeClass: 'bg-warning/10 text-warning',
    title: 'A map of what you actually know',
    body: "Your solved history rolls up into a per-topic breakdown, so weak spots in trees or DP show up before an interview does.",
  },
];

const reasons = [
  {
    id: 'v1',
    title: 'Written from real interviews',
    body: 'Problems are modeled on questions reported from recent loops at large tech companies, not generic textbook exercises.',
  },
  {
    id: 'v2',
    title: 'A compiler that keeps up with you',
    body: 'Submissions run against hundreds of hidden cases and return in milliseconds, so you iterate at the speed you think.',
  },
  {
    id: 'v3',
    title: 'Solutions worth reading',
    body: "Unlock annotated optimal solutions and the trade-off discussion for every problem — not just a pass/fail.",
    price: '₹299/mo',
    priceNote: '₹1,499 billed yearly · save 58%',
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-base-200 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-ping { animation: none !important; }
        }
      `}</style>

      <nav className="bg-base-100/90 backdrop-blur border-b border-base-300 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-primary">
              <Share2 className="w-6 h-6 lg:w-8 lg:h-8 rotate-90" />
              <span className="font-display text-xl md:text-2xl font-bold text-base-content tracking-tight">
                Vertex<span className="text-primary">Code</span>
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <NavLink to="/login" className="btn btn-ghost btn-md text-[12px] md:text-base font-mono font-normal">login</NavLink>
              <NavLink to="/signup" className="btn btn-primary btn-md px-1 md:px-6 text-[12px] md:text-base font-mono font-normal">join_now()</NavLink>
            </div>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 pt-10 md:pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="text-center md:text-left">
            <div className="inline-flex  items-center gap-2 mb-6 font-mono text-xs text-base-content/60">
              <span className=" text-primary">traverse</span>
              <span>(you) </span>
              <ArrowRight className="w-3 h-3" />
              <span> optimal_solution</span>
            </div>

            <h1 className="font-display text-center md:text-left text-4xl md:text-5xl md:text-6xl font-bold text-base-content mb-6 tracking-tight leading-[1.05]">
              Master the algorithms,
              <br />
              <span className="text-primary">not just the syntax.</span>
            </h1>

            <p className=" text-[16px] md:text-lg text-center md:text-left text-base-content/70 mb-10 max-w-xl leading-relaxed">
              VertexCode is a graph of every data structure and algorithm you need for a technical interview — and a
              live leaderboard showing exactly where you sit on it.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <NavLink to="/signup" className="btn btn-primary btn-lg px-8 gap-2">
                Start solving
                <ArrowRight className="w-5 h-5" />
              </NavLink>
              <NavLink to="/problems" className="btn btn-outline btn-lg px-8">
                Browse problems
              </NavLink>
            </div>
          </div>

          <MasteryGraph />
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {path.map((step, i) => (
            <div key={step.id} className="flex gap-6">
              <div className="flex flex-col items-center">
                <span className={`shrink-0 w-11 h-11 rounded-full font-mono text-sm font-semibold flex items-center justify-center ${step.badgeClass}`}>
                  {step.id}
                </span>
                {i < path.length - 1 && <span className="w-px flex-1 bg-base-300 my-1" />}
              </div>
              <div className={i < path.length - 1 ? 'pb-12' : ''}>
                <h3 className="font-display text-xl font-bold text-base-content mb-2">{step.title}</h3>
                <p className="text-base-content/70 leading-relaxed max-w-lg">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-base-100 py-20 border-y border-base-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center max-w-6xl mx-auto">
            <div className="lg:w-1/2">
              <h2 className="font-display text-center md:text-left text-3xl md:text-4xl font-bold text-base-content mb-10 tracking-tight">
                Built for the room where
                <br />
                the whiteboard is.
              </h2>
              <div className="space-y-8">
                {reasons.map((r) => (
                  <div key={r.id} className="flex gap-4">
                    <span className="font-mono text-sm font-semibold text-primary/60 shrink-0 pt-1 w-6">{r.id}</span>
                    <div>
                      <h4 className="font-bold text-base text-base-content mb-1 flex items-center gap-2">
                        {r.title}
                        {r.price && (
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {r.price}
                          </span>
                        )}
                      </h4>
                      <p className="text-base-content/70 leading-relaxed">{r.body}</p>
                      {r.priceNote && (
                        <p className="text-base-content/50 text-xs font-mono mt-1">{r.priceNote}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 w-full">
              <EditorPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center bg-primary rounded-2xl p-12 relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
            <line x1="0%" y1="20%" x2="100%" y2="80%" stroke="white" strokeWidth="1" strokeDasharray="4 6" />
            <line x1="0%" y1="80%" x2="100%" y2="20%" stroke="white" strokeWidth="1" strokeDasharray="4 6" />
          </svg>
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-content mb-4 tracking-tight">
              Your next node is one problem away.
            </h2>
            <p className="text-primary-content/80 text-lg mb-8 max-w-xl mx-auto">
              Create an account and get your first ranked problem in under a minute.
            </p>
            <NavLink to="/signup" className="btn btn-neutral btn-lg px-10 gap-2">
              Sign up for free
              <ArrowUpRight className="w-5 h-5" />
            </NavLink>
          </div>
        </div>
      </section>

      <footer className="bg-base-100 py-10 border-t border-base-300">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Share2 className="w-5 h-5 rotate-90" />
            <span className="font-display font-bold text-base-content">VertexCode</span>
          </div>
          <p className="text-base-content/50 text-sm font-mono">© 2026 VertexCode</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;