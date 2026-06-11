import { useState, useEffect } from 'react'
import { Play, Settings2, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'

export default function CspPanel() {
  const [peas, setPeas] = useState(null)
  const [n, setN] = useState(8)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    pythonRunner.getPeas('CSP')
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  const handleSolve = async () => {
    setLoading(true)
    try {
      const data = await pythonRunner.runCsp(parseInt(n))
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Failed to solve CSP via Python solver.")
    }
    setLoading(false)
  }

  const renderBoard = () => {
    if (!result || !result.assignment) return null
    const board = []
    for (let r = 0; r < n; r++) {
      const row = []
      for (let c = 0; c < n; c++) {
        const colVal = result.assignment[r.toString()] || result.assignment[r]
        const isQueen = colVal === c
        row.push(
          <div key={`${r}-${c}`} className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl transition-colors duration-300 ${
            (r + c) % 2 === 0 ? 'bg-slate-700/50' : 'bg-slate-900/50'
          }`}>
            {isQueen && (
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10, delay: r * 0.1 }}
                className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
              >
                👑
              </motion.div>
            )}
          </div>
        )
      }
      board.push(<div key={r} className="flex">{row}</div>)
    }
    return <div className="border-4 border-slate-700/50 rounded-md overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">{board}</div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto flex flex-col gap-8"
    >
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="bg-amber-500/20 p-3 rounded-xl">
          <Settings2 size={32} className="text-amber-500" />
        </div>
        <div>
          <h1 className="m-0 text-3xl font-bold text-slate-200">CSP Engine: N-Queens</h1>
          <p className="m-0 text-slate-400 mt-1">Constraint Satisfaction Problem solver using Backtracking</p>
        </div>
      </div>
      
      {peas && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl"
        >
          <h3 className="m-0 mb-4 text-purple-400 font-semibold flex items-center gap-2">
            PEAS Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-300">
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-purple-300 block mb-1">Performance</strong> {peas.performance}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-purple-300 block mb-1">Environment</strong> {peas.environment}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-purple-300 block mb-1">Actuators</strong> {peas.actuators}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-purple-300 block mb-1">Sensors</strong> {peas.sensors}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5 col-span-full md:col-span-2 lg:col-span-4 flex items-center gap-2">
              <strong className="text-purple-300">Type:</strong> {peas.env_type}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-wrap gap-6 items-end border-indigo-500/20">
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-slate-400">Board Size (N)</label>
              <input 
                type="number" min="4" max="15" value={n} 
                onChange={e => setN(e.target.value)} 
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <button 
              onClick={handleSolve} 
              disabled={loading}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-bold transition-all shadow-lg
                ${loading 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 hover:shadow-orange-500/25 hover:-translate-y-0.5'
                }`}
            >
              <Play size={20} className={loading ? 'animate-pulse' : ''} /> 
              {loading ? 'Solving...' : 'Solve N-Queens'}
            </button>
          </div>
          
          <div className="glass-panel flex-1 min-h-[400px] flex flex-col items-center justify-center bg-black/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 to-transparent pointer-events-none" />
            {renderBoard() || (
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <Settings2 size={48} className="opacity-20" />
                <span>Configure board size and click Solve</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="glass-panel border-emerald-500/20">
                <h3 className="m-0 mb-4 text-emerald-400 font-semibold flex items-center gap-2">
                  <Activity size={20} /> Execution Results
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">Assignments Tried</span>
                    <strong className="block text-3xl text-emerald-300 mt-1">{result.assignments_tried}</strong>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">Backtracks</span>
                    <strong className="block text-3xl text-rose-300 mt-1">{result.backtracks}</strong>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 col-span-2 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Total Runtime</span>
                    <strong className="text-xl text-blue-300">{result.runtime.toFixed(4)}s</strong>
                  </div>
                </div>
              </div>

              <div className="glass-panel flex-1 flex flex-col min-h-[300px]">
                <h4 className="m-0 mb-4 text-slate-300 font-medium">Reasoning Trace Logs</h4>
                <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-emerald-400/70 overflow-y-auto flex-1 max-h-[400px] border border-white/5 shadow-inner">
                  {result.trace.map((t, i) => (
                    <div key={i} className="py-1 border-b border-emerald-500/10 last:border-0 hover:bg-white/5 hover:text-emerald-300 transition-colors cursor-default">
                      <span className="text-slate-600 mr-2">[{String(i).padStart(3, '0')}]</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
