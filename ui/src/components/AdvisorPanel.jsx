import { useState, useEffect } from 'react'
import { Sparkles, Lightbulb, Brain, Zap, Database, ChevronDown, ChevronUp, HelpCircle, CheckCircle, AlertTriangle, Network } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'

const ALGO_COLORS = {
  'A* Search': { color: '#6366f1', bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-300' },
  'IDA* (Iterative Deepening A*)': { color: '#8b5cf6', bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-300' },
  'Breadth-First Search (BFS)': { color: '#3b82f6', bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300' },
  'Iterative Deepening DFS (IDDFS)': { color: '#06b6d4', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-300' },
  "Dijkstra's Algorithm (Uniform Cost Search)": { color: '#f59e0b', bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300' },
  'Bellman-Ford / Negative Cycle Check': { color: '#ef4444', bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-300' },
}

const REPORT_ICONS = {
  'Validation': CheckCircle,
  'Edge Cases': AlertTriangle,
  'Clarifying Question': HelpCircle,
}

export default function AdvisorPanel() {
  const [peas, setPeas] = useState(null)
  const [size, setSize] = useState('Medium')
  const [costs, setCosts] = useState('Uniform')
  const [heuristic, setHeuristic] = useState(false)
  const [memoryLimited, setMemoryLimited] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState(null)

  useEffect(() => {
    pythonRunner.getPeas('Search')
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  const handleConsult = async () => {
    setLoading(true)
    setExpandedIdx(null)
    try {
      const data = await pythonRunner.runAdvisor({ size, costs, heuristic, memory_limited: memoryLimited })
      setResult(data)
    } catch (err) {
      console.error(err)
      alert('Failed to analyze graph features via Python advisor.')
    }
    setLoading(false)
  }

  const algoStyle = result ? (ALGO_COLORS[result.algorithm] || { color: '#a855f7', bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300' }) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="bg-pink-500/20 p-3 rounded-xl">
          <Lightbulb size={32} className="text-pink-400" />
        </div>
        <div>
          <h1 className="m-0 text-3xl font-bold text-slate-200">Expert AI Advisor</h1>
          <p className="m-0 text-slate-400 mt-1">Algorithmic Recommendation Engine based on State-Space Analysis</p>
        </div>
      </div>

      {/* PEAS Analysis */}
      {peas && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="glass-panel p-5 border-pink-500/20 bg-pink-500/5"
        >
          <h3 className="m-0 mb-3 text-pink-400 font-bold flex items-center gap-2">
            <Database size={20} /> PEAS Model Description (Search Agent)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-300">
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong className="text-pink-300 block mb-1">Performance</strong>{peas.performance}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong className="text-pink-300 block mb-1">Environment</strong>{peas.environment}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong className="text-pink-300 block mb-1">Actuators</strong>{peas.actuators}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong className="text-pink-300 block mb-1">Sensors</strong>{peas.sensors}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5 col-span-full flex items-center gap-2">
              <strong className="text-pink-300">Env Type:</strong>{peas.env_type}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Feature Input Panel */}
        <div className="glass-panel p-6 flex flex-col gap-6 border-pink-500/20">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <Network size={20} className="text-pink-400" />
            <h3 className="m-0 text-slate-200 font-bold">Problem Graph Features</h3>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed -mt-2">
            Describe the structural properties of your state-space graph. The advisor will mathematically evaluate complexity and recommend the optimal search algorithm.
          </p>

          {/* State Space Size */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">Graph State Space Size</label>
            <div className="grid grid-cols-3 gap-2">
              {['Small', 'Medium', 'Massive'].map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                    size === s
                      ? 'bg-pink-500/20 border-pink-500/60 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.2)]'
                      : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200'
                  }`}
                >
                  {s === 'Small' ? '📦 Small' : s === 'Medium' ? '🗺️ Medium' : '🌌 Massive'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {size === 'Small' ? 'Fits entirely in RAM — full expansion is feasible.' : size === 'Medium' ? 'Moderate depth/branching — standard algorithms apply.' : 'Infinite or near-infinite (Chess, 15-Puzzle) — memory is critical.'}
            </p>
          </div>

          {/* Edge Costs */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">Edge Step Costs</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'Uniform', label: '= 1 each', icon: '⚖️' },
                { val: 'Positive', label: 'Variable', icon: '📊' },
                { val: 'Negative', label: 'Negative', icon: '⚡' },
              ].map(({ val, label, icon }) => (
                <button
                  key={val}
                  onClick={() => setCosts(val)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all border cursor-pointer flex flex-col items-center gap-0.5 ${
                    costs === val
                      ? 'bg-pink-500/20 border-pink-500/60 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.2)]'
                      : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200'
                  }`}
                >
                  <span>{icon}</span>
                  <span className="text-[11px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Checkboxes */}
          <div className="flex flex-col gap-3">
            {[
              {
                state: heuristic, setter: setHeuristic,
                label: 'Admissible Heuristic Available',
                desc: 'You can estimate cost-to-goal without overestimating (e.g., Manhattan Distance)',
                color: 'indigo'
              },
              {
                state: memoryLimited, setter: setMemoryLimited,
                label: 'Strict Memory Constraint',
                desc: 'Must avoid O(b^d) memory usage — use linear-memory algorithms only',
                color: 'rose'
              }
            ].map(({ state, setter, label, desc, color }) => (
              <label
                key={label}
                onClick={() => setter(!state)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  state
                    ? `bg-${color}-500/10 border-${color}-500/40`
                    : 'bg-black/20 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  state ? `bg-${color}-500 border-${color}-500` : 'border-slate-600 bg-black/40'
                }`}>
                  {state && <CheckCircle size={12} className="text-white" />}
                </div>
                <div>
                  <strong className="text-slate-200 text-sm">{label}</strong>
                  <p className="text-xs text-slate-500 m-0 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleConsult}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all text-base ${
              loading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-400 hover:to-purple-500 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <><Brain size={20} className="animate-pulse" /> Analyzing State Space...</>
            ) : (
              <><Sparkles size={20} /> Consult Expert Advisor</>
            )}
          </button>
        </div>

        {/* Right: Results Panel */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-6"
            >
              {/* Algorithm Badge */}
              <div className={`glass-panel p-6 ${algoStyle.bg} ${algoStyle.border} border relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: algoStyle.color }} />
                <div className="flex items-center gap-3 mb-3">
                  <Zap size={20} style={{ color: algoStyle.color }} />
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recommended Algorithm</span>
                </div>
                <h2 className={`m-0 text-2xl font-black ${algoStyle.text} leading-tight`}>
                  {result.algorithm}
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Based on: Size={size} · Costs={costs} · Heuristic={heuristic ? 'Yes' : 'No'} · Memory={memoryLimited ? 'Limited' : 'Ample'}
                </p>
              </div>

              {/* Report Cards */}
              <div className="flex flex-col gap-3">
                {result.report.map((item, idx) => {
                  const Icon = REPORT_ICONS[item.title] || Lightbulb
                  const isExpanded = expandedIdx === idx
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      className="glass-panel border-white/5 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                        className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: algoStyle.color }}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon size={15} style={{ color: algoStyle.color }} className="shrink-0" />
                            <strong className="text-slate-200 text-sm">{item.title}</strong>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3"
                          >
                            {item.text}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel flex-1 flex flex-col items-center justify-center text-slate-500 text-center p-12 border-dashed border-2 border-slate-700 min-h-[400px]"
            >
              <Brain size={48} className="mb-4 opacity-20" />
              <h3 className="text-xl text-slate-400 mb-2">Awaiting Graph Description</h3>
              <p className="max-w-xs text-sm">
                Configure your problem graph features on the left and click "Consult Expert Advisor" to receive a full algorithmic breakdown.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
