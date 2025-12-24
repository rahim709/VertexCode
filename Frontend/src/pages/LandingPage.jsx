import { NavLink } from 'react-router';
import { Code2, Trophy, Users, Zap, ArrowRight, CheckCircle, Share2, BarChart3, Target } from 'lucide-react';

function LandingPage() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation */}
      <nav className="bg-base-100 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {/* Share2 icon looks like nodes/vertices connected */}
              <Share2 className="w-8 h-8 text-primary rotate-90" />
              <span className="text-2xl font-bold text-base-content tracking-tight">
                Vertex<span className="text-primary">Code</span>
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <NavLink to="/login" className="btn btn-ghost btn-sm">Login</NavLink>
              <NavLink to="/signup" className="btn btn-primary btn-sm px-6">Join Now</NavLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Reach the Peak of Logic</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold text-base-content mb-6 tracking-tighter">
            Master the <span className="text-primary underline decoration-4 underline-offset-8">Algorithms</span>
          </h1>
          
          <p className="text-xl text-base-content/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect your logic and scale the leaderboards. VertexCode is the premier destination for mastering Data Structures and acing your next technical interview.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NavLink to="/signup" className="btn btn-primary btn-lg px-8 gap-2 shadow-lg shadow-primary/20">
              Start Solving
              <ArrowRight className="w-5 h-5" />
            </NavLink>
            <NavLink to="/problems" className="btn btn-outline btn-lg px-8">
              Browse Challenges
            </NavLink>
          </div>
        </div>
      </section>

      {/* Stats/Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1: The Code */}
          <div className="card bg-base-100 shadow-sm border border-base-300 hover:border-primary/50 transition-colors">
            <div className="card-body">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="card-title text-xl font-bold">Curated DSA Path</h3>
              <p className="text-base-content/60">
                Over 1,000+ hand-picked problems ranging from Arrays to Advanced Graph Theory.
              </p>
            </div>
          </div>

          {/* Feature 2: The Rank (Vertex/Peak) */}
          <div className="card bg-base-100 shadow-sm border border-base-300 hover:border-success/50 transition-colors">
            <div className="card-body">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <h3 className="card-title text-xl font-bold">Real-time Ranking</h3>
              <p className="text-base-content/60">
                Climb the Vertex leaderboard. Track your global percentile and see how you stack up against the best.
              </p>
            </div>
          </div>

          {/* Feature 3: Progress Tracking */}
          <div className="card bg-base-100 shadow-sm border border-base-300 hover:border-warning/50 transition-colors">
            <div className="card-body">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-warning" />
              </div>
              <h3 className="card-title text-xl font-bold">Skill Breakdown</h3>
              <p className="text-base-content/60">
                Visual progress tracking shows your strengths in Dynamic Programming, Trees, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section (Focused on Interview Success) */}
      <section className="bg-base-100 py-20 border-y border-base-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center max-w-6xl mx-auto">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-base-content mb-6">
                Engineered for <br /><span className="text-primary">Technical Excellence</span>
              </h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-success shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-lg">Interview-Ready Solutions</h4>
                    <p className="text-base-content/70">Our problems mimic real questions from Google, Meta, and Amazon.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Zap className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-lg">Blazing Fast Compiler</h4>
                    <p className="text-base-content/70">Execute and test your code against hundreds of test cases in milliseconds.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Users className="w-6 h-6 text-info shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-lg">Collaborative Learning</h4>
                    <p className="text-base-content/70">Read optimal solutions and discuss complexities with our global community.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Mockup UI Placeholder */}
            <div className="lg:w-1/2 w-full aspect-video bg-base-200 rounded-2xl border-4 border-base-300 shadow-2xl flex items-center justify-center">
              <div className="text-center p-8">
                <Share2 className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                <p className="text-base-content/40 font-mono text-sm">Interactive Editor & Rank Visualization</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center bg-primary rounded-3xl p-12 shadow-xl shadow-primary/30">
          <h2 className="text-4xl font-bold text-primary-content mb-4">
            Ready to reach the Vertex?
          </h2>
          <p className="text-primary-content/80 text-lg mb-8">
            Create your account today and start solving the world's most challenging problems.
          </p>
          <NavLink to="/signup" className="btn btn-neutral btn-lg px-10">
            Sign Up for Free
          </NavLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-base-100 py-12 border-t border-base-300">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-primary rotate-90" />
            <span className="font-bold text-lg">VertexCode</span>
          </div>
          <p className="text-base-content/50 text-sm">
            Copyright © 2025 VertexCode
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;