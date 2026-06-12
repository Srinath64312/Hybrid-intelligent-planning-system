import { Brain, Grid, CalendarDays, Gamepad2, Activity, Lightbulb, ChevronRight, Calendar, CheckCircle, Cpu, Layers, FlaskConical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const stats = [
  { label: 'AI Modules', value: '7', icon: Layers, color: '#6366f1' },
  { label: 'Core Engines', value: '5', icon: Cpu, color: '#a855f7' },
  { label: 'Algorithms', value: '14+', icon: FlaskConical, color: '#10b981' },
  { label: 'Tests Passing', value: '104', icon: CheckCircle, color: '#f59e0b' },
]

export default function HomePanel() {
  const navigate = useNavigate()

  const modules = [
    {
      id: 'search',
      title: 'Search Engine',
      icon: Grid,
      color: '#3b82f6',
      desc: 'Pathfinding in 2D grids using BFS, DFS, A*, UCS, and Greedy algorithms with animated step-by-step tracer.',
      badge: 'BFS · DFS · A* · UCS',
    },
    {
      id: 'csp',
      title: 'Constraint Satisfaction',
      icon: CalendarDays,
      color: '#f59e0b',
      desc: 'Solve the N-Queens problem via Backtracking with MRV + Forward Checking, Min-Conflicts, and Hill Climbing.',
      badge: 'Backtracking · Local Search',
    },
    {
      id: 'schedule',
      title: 'University Scheduling',
      icon: Calendar,
      color: '#8b5cf6',
      desc: 'CSP solver for course-room-timeslot conflict resolution with explainability and Bayesian probability.',
      badge: 'CSP · Explainability',
    },
    {
      id: 'game',
      title: 'Adversarial Game AI',
      icon: Gamepad2,
      color: '#ef4444',
      desc: 'Tic-Tac-Toe agent with Minimax & Alpha-Beta Pruning plus a multi-agent VCG auction simulator.',
      badge: 'Minimax · Alpha-Beta · VCG',
    },
    {
      id: 'bayes',
      title: 'Probabilistic Reasoning',
      icon: Activity,
      color: '#10b981',
      desc: 'Medical diagnosis using editable Bayesian Networks with Exact Enumeration and Rejection Sampling.',
      badge: 'Exact · Rejection Sampling',
    },
    {
      id: 'advisor',
      title: 'Expert AI Advisor',
      icon: Lightbulb,
      color: '#ec4899',
      desc: 'Algorithmic recommendation engine that evaluates state-space complexity to prescribe the optimal algorithm.',
      badge: 'Decision Engine',
    },
    {
      id: 'timetable',
      title: 'Timetable Generator',
      icon: Calendar,
      color: '#6366f1',
      desc: 'Automated campus weekly scheduler enforcing cohort, room capacity, teacher loading and lab constraints.',
      badge: 'Backtracking · Annealing',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 max-w-6xl mx-auto"
    >
      {/* Hero Header */}
      <div className="text-center mb-12 mt-6">
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(168,85,247,0.3)', '0 0 50px rgba(168,85,247,0.7)', '0 0 20px rgba(168,85,247,0.3)'] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 p-5 rounded-full border border-purple-500/20"
          >
            <Brain size={64} className="text-purple-400 drop-shadow-[0_0_16px_rgba(168,85,247,0.8)]" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 bg-clip-text text-transparent"
        >
          Hybrid Intelligent Problem Solver
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed"
        >
          A comprehensive AI suite demonstrating core academic algorithms — from pathfinding and constraint satisfaction to game theory and probabilistic inference. All powered by a live Python engine running in your browser via Pyodide.
        </motion.p>
      </div>

      {/* Stats Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            className="glass-panel p-5 flex flex-col items-center justify-center text-center gap-2 border-white/10 group"
            whileHover={{ y: -4, borderColor: stat.color }}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}22` }}>
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <span className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</span>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, index) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.08 }}
            onClick={() => navigate(`/${mod.id}`)}
            className="group glass-panel border border-white/10 rounded-2xl p-6 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
            whileHover={{ y: -6, borderColor: mod.color, boxShadow: `0 15px 40px -15px ${mod.color}66` }}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at top right, ${mod.color}12, transparent 70%)` }}
            />

            <div className="flex items-center justify-between relative z-10">
              <div className="p-3 rounded-xl transition-all" style={{ backgroundColor: `${mod.color}22` }}>
                <mod.icon size={28} color={mod.color} />
              </div>
              <ChevronRight
                className="text-white/20 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300"
                size={20}
              />
            </div>

            <div className="relative z-10 flex-1">
              <h3 className="m-0 mb-2 text-slate-200 text-lg font-bold group-hover:text-white transition-colors">
                {mod.title}
              </h3>
              <p className="m-0 text-slate-400 text-sm leading-relaxed">{mod.desc}</p>
            </div>

            {/* Badge */}
            <div className="relative z-10">
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full tracking-wide"
                style={{ backgroundColor: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}40` }}
              >
                {mod.badge}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-14 text-slate-600 text-xs tracking-widest uppercase">
        HIPS Architecture v2.0 · All 102 tests passing · Pyodide WebAssembly Runtime
      </div>
    </motion.div>
  )
}
