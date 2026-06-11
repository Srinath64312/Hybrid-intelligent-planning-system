import { Brain, Grid, CalendarDays, Gamepad2, Activity, Lightbulb, ChevronRight, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function HomePanel() {
  const navigate = useNavigate()
  const modules = [
    { id: 'search', title: 'Search Engine', icon: Grid, color: '#3b82f6', desc: 'Pathfinding in 2D grids using BFS, DFS, and A*.' },
    { id: 'csp', title: 'Constraint Satisfaction', icon: CalendarDays, color: '#f59e0b', desc: 'Solving the N-Queens problem using Backtracking.' },
    { id: 'schedule', title: 'University Scheduling', icon: Calendar, color: '#8b5cf6', desc: 'Constraint Satisfaction Problem (CSP) solver for resolving class and room conflicts.' },
    { id: 'game', title: 'Adversarial Game AI', icon: Gamepad2, color: '#ef4444', desc: 'Tic-Tac-Toe agent with Minimax & Alpha-Beta Pruning.' },
    { id: 'bayes', title: 'Probabilistic Reasoning', icon: Activity, color: '#10b981', desc: 'Medical diagnosis using Bayesian Networks.' },
    { id: 'advisor', title: 'Expert AI Advisor', icon: Lightbulb, color: '#ec4899', desc: 'Algorithmic recommendations based on graph traits.' }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      <div className="text-center mb-12 mt-8">
        <div className="flex justify-center mb-5">
          <motion.div 
            animate={{ boxShadow: ['0 0 20px rgba(168,85,247,0.4)', '0 0 40px rgba(168,85,247,0.8)', '0 0 20px rgba(168,85,247,0.4)'] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-purple-500/20 p-5 rounded-full"
          >
            <Brain size={64} className="text-purple-400" />
          </motion.div>
        </div>
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Hybrid Intelligent Problem Solver (HIPS)
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          A comprehensive artificial intelligence suite demonstrating core academic algorithms.
          Navigate through the modules below to interact with Graph Search, Constraint Satisfaction, Game Theory, and Probabilistic Models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {modules.map((mod, index) => (
          <motion.div 
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/${mod.id}`)}
            className="group glass-panel border border-white/10 rounded-2xl p-6 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
            whileHover={{ y: -5, borderColor: mod.color, boxShadow: `0 10px 30px -10px ${mod.color}` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${mod.color}22` }}>
                <mod.icon size={28} color={mod.color} />
              </div>
              <ChevronRight className="text-white/30 group-hover:text-white transition-colors" />
            </div>
            <div className="relative z-10">
              <h3 className="m-0 mb-2 text-slate-200 text-xl font-bold">{mod.title}</h3>
              <p className="m-0 text-slate-400 leading-relaxed">{mod.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-16 text-slate-500 text-sm">
        Built for Advanced AI Coursework • HIPS Architecture Version 1.0
      </div>
    </motion.div>
  )
}
