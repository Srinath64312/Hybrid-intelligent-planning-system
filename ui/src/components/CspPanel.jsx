import { useState, useEffect } from 'react'
import { Play, Pause, Square, FastForward, Settings2, Activity, Eye, EyeOff, Crown, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'

// Validate n-queens solution: no row/col/diagonal conflicts
function validateSolution(assignment, n) {
  const conflicts = []
  const entries = Object.entries(assignment).map(([r, c]) => [parseInt(r), parseInt(c)])

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [r1, c1] = entries[i]
      const [r2, c2] = entries[j]
      if (c1 === c2) conflicts.push([r1, c1, r2, c2, 'col'])
      if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) conflicts.push([r1, c1, r2, c2, 'diag'])
    }
  }
  return conflicts
}

export default function CspPanel() {
  const [peas, setPeas] = useState(null)
  const [n, setN] = useState(8)
  const [algorithm, setAlgorithm] = useState('Backtracking (MRV+FC)')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(200) // ms per step
  const [showDomains, setShowDomains] = useState(true)
  const [showFinalBoard, setShowFinalBoard] = useState(false)
  const [hoveredCell, setHoveredCell] = useState(null)

  useEffect(() => {
    let interval
    if (isPlaying && result && result.visited_sequence && playbackIndex < result.visited_sequence.length) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => prev + 1)
      }, playbackSpeed)
    } else if (playbackIndex >= (result?.visited_sequence?.length || 0)) {
      setIsPlaying(false)
      if (result?.assignment) setShowFinalBoard(true)
    }
    return () => clearInterval(interval)
  }, [isPlaying, playbackIndex, result, playbackSpeed])

  useEffect(() => {
    pythonRunner.getPeas('CSP')
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  const handleSolve = async () => {
    setLoading(true)
    setIsPlaying(false)
    setPlaybackIndex(0)
    setShowFinalBoard(false)
    try {
      const data = await pythonRunner.runCsp(parseInt(n), algorithm)
      setResult(data)
      setIsPlaying(true)
    } catch (err) {
      console.error(err)
      alert('Failed to solve CSP via Python solver.')
    }
    setLoading(false)
  }

  const resetTracer = () => {
    setIsPlaying(false)
    setPlaybackIndex(0)
    setShowFinalBoard(false)
  }

  const stepForward = () => {
    if (result && playbackIndex < result.visited_sequence.length) {
      setIsPlaying(false)
      setPlaybackIndex(prev => prev + 1)
    }
  }

  // Get current board state for tracer
  const getBoardState = () => {
    if (!result) return { assignment: {}, domains: {} }
    if (result.visited_sequence && playbackIndex > 0) {
      const step = result.visited_sequence[playbackIndex - 1]
      return { assignment: step.assignment || {}, domains: step.domains || {} }
    }
    if (playbackIndex === 0) return { assignment: {}, domains: {} }
    return { assignment: result.assignment || {}, domains: {} }
  }

  // Compute which cells are "attacked" by a hovered queen
  const getAttackedCells = (queenRow, queenCol, boardSize) => {
    const attacked = new Set()
    for (let i = 0; i < boardSize; i++) {
      if (i !== queenCol) attacked.add(`${queenRow},${i}`)
      if (i !== queenRow) attacked.add(`${i},${queenCol}`)
      const dr = i - queenRow
      if (dr !== 0) {
        if (queenCol + dr >= 0 && queenCol + dr < boardSize) attacked.add(`${i},${queenCol + dr}`)
        if (queenCol - dr >= 0 && queenCol - dr < boardSize) attacked.add(`${i},${queenCol - dr}`)
      }
    }
    return attacked
  }

  const renderBoard = () => {
    if (!result) return null

    const boardData = showFinalBoard
      ? { assignment: result.assignment || {}, domains: {} }
      : getBoardState()

    const { assignment, domains } = boardData
    const conflicts = showFinalBoard && result.assignment
      ? validateSolution(result.assignment, n)
      : []

    const conflictSet = new Set()
    conflicts.forEach(([r1, c1, r2, c2]) => {
      conflictSet.add(`${r1},${c1}`)
      conflictSet.add(`${r2},${c2}`)
    })

    // Attacked cells from hovered queen
    let attackedCells = new Set()
    if (hoveredCell) {
      const rStr = hoveredCell[0].toString()
      const queenCol = assignment[rStr] !== undefined ? assignment[rStr] : assignment[hoveredCell[0]]
      if (queenCol !== undefined && queenCol === hoveredCell[1]) {
        attackedCells = getAttackedCells(hoveredCell[0], queenCol, n)
      }
    }

    const board = []
    for (let r = 0; r < n; r++) {
      const row = []
      for (let c = 0; c < n; c++) {
        const rStr = r.toString()
        const isQueen = assignment[rStr] === c || assignment[r] === c
        const isConflict = isQueen && conflictSet.has(`${r},${c}`)
        const isAttacked = attackedCells.has(`${r},${c}`)
        const isLight = (r + c) % 2 === 0

        let isPruned = false
        if (!isQueen && assignment[rStr] === undefined && assignment[r] === undefined) {
          const doms = domains[rStr] || domains[r]
          if (doms && !doms.includes(c)) isPruned = true
        }

        const cellSize = n <= 6 ? 'w-12 h-12 sm:w-14 sm:h-14' : n <= 10 ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-6 h-6 sm:w-8 sm:h-8'
        const queenSize = n <= 6 ? 'text-3xl' : n <= 10 ? 'text-xl' : 'text-sm'

        row.push(
          <div
            key={`${r}-${c}`}
            onMouseEnter={() => setHoveredCell([r, c])}
            onMouseLeave={() => setHoveredCell(null)}
            className={`${cellSize} flex items-center justify-center relative transition-all duration-200 ${
              isConflict
                ? 'bg-red-500/40'
                : isAttacked && !isQueen
                ? 'bg-amber-500/20'
                : isQueen
                ? isLight ? 'bg-purple-600/40' : 'bg-purple-700/40'
                : isLight
                ? 'bg-slate-600/50'
                : 'bg-slate-800/60'
            }`}
          >
            {/* Pruned marker */}
            {showDomains && !showFinalBoard && isPruned && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30 text-rose-400 font-bold text-xs">✕</div>
            )}
            {/* Available dot */}
            {showDomains && !showFinalBoard && !isQueen && !isPruned && assignment[rStr] === undefined && assignment[r] === undefined && (
              <div className="w-2 h-2 rounded-full bg-emerald-500/40 absolute" />
            )}

            {/* Queen */}
            {isQueen && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`${queenSize} relative z-10 ${isConflict ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]' : 'drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]'}`}
              >
                {isConflict ? '🔴' : '♛'}
              </motion.div>
            )}

            {/* Attack range highlight overlay */}
            {isAttacked && !isQueen && (
              <div className="absolute inset-0 bg-amber-400/10 border border-amber-500/20 pointer-events-none" />
            )}
          </div>
        )
      }
      board.push(
        <div key={r} className="flex">
          {/* Row number */}
          <div className={`flex items-center justify-center text-[9px] font-mono text-slate-600 ${n <= 6 ? 'w-5' : n <= 10 ? 'w-4' : 'w-3'}`}>
            {r}
          </div>
          {row}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-1">
        {/* Column headers */}
        <div className="flex">
          <div className={`${n <= 6 ? 'w-5' : n <= 10 ? 'w-4' : 'w-3'}`} />
          {Array.from({ length: n }).map((_, c) => (
            <div
              key={c}
              className={`flex items-center justify-center text-[9px] font-mono text-slate-600 ${n <= 6 ? 'w-12 sm:w-14' : n <= 10 ? 'w-8 sm:w-10' : 'w-6 sm:w-8'}`}
            >
              {c}
            </div>
          ))}
        </div>
        <div className="border-2 border-slate-600/60 rounded-md overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          {board}
        </div>
        {/* Legend */}
        <div className="flex gap-3 flex-wrap justify-center mt-2 text-[10px] text-slate-500 font-medium">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-600/40 inline-block border border-purple-500/30" />Queen Placed</span>
          {showDomains && !showFinalBoard && (
            <>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-500/20 inline-block" />Pruned</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500/40 inline-block" />Available</span>
            </>
          )}
          {hoveredCell && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400/20 inline-block border border-amber-500/20" />Attack Range</span>}
        </div>
      </div>
    )
  }

  const queenCount = result?.assignment ? Object.keys(result.assignment).length : 0
  const conflicts = result?.assignment ? validateSolution(result.assignment, n) : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto flex flex-col gap-8"
    >
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="bg-amber-500/20 p-3 rounded-xl">
          <Crown size={32} className="text-amber-500" />
        </div>
        <div>
          <h1 className="m-0 text-3xl font-bold text-slate-200">CSP Engine: N-Queens</h1>
          <p className="m-0 text-slate-400 mt-1">Constraint Satisfaction Problem solver with animated backtracking visualization</p>
        </div>
      </div>

      {peas && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl"
        >
          <h3 className="m-0 mb-4 text-amber-400 font-semibold flex items-center gap-2">
            <Settings2 size={16} /> PEAS Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-300">
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-amber-300 block mb-1">Performance</strong>{peas.performance}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-amber-300 block mb-1">Environment</strong>{peas.environment}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-amber-300 block mb-1">Actuators</strong>{peas.actuators}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-amber-300 block mb-1">Sensors</strong>{peas.sensors}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5 col-span-full flex items-center gap-2">
              <strong className="text-amber-300">Type:</strong>{peas.env_type}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          {/* Controls */}
          <div className="glass-panel p-6 flex flex-wrap gap-6 items-end border-amber-500/20">
            <div className="flex flex-col gap-2 flex-1 min-w-[160px]">
              <label className="text-sm font-medium text-slate-400">Board Size (N)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="4" max="12" value={n}
                  onChange={e => { setN(parseInt(e.target.value)); setResult(null); resetTracer() }}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-amber-400 font-black text-lg w-8 text-center">{n}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-slate-400">Solver Algorithm</label>
              <select
                value={algorithm}
                onChange={e => setAlgorithm(e.target.value)}
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              >
                <option value="Backtracking (MRV+FC)">Backtracking (MRV + Forward Checking)</option>
                <option value="Min-Conflicts">Min-Conflicts (Local Search)</option>
                <option value="Hill Climbing (Restarts)">Hill Climbing (with Random Restarts)</option>
              </select>
            </div>
            <button
              onClick={handleSolve}
              disabled={loading}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-bold transition-all shadow-lg ${
                loading
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 hover:shadow-orange-500/25 hover:-translate-y-0.5'
              }`}
            >
              <Crown size={20} className={loading ? 'animate-pulse' : ''} />
              {loading ? 'Solving...' : `Solve ${n}-Queens`}
            </button>
          </div>

          {/* Board Canvas */}
          <div className="glass-panel flex-1 min-h-[420px] flex flex-col items-center justify-center bg-black/20 relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 to-transparent pointer-events-none" />

            {/* Tracer HUD */}
            {result && result.visited_sequence && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg z-20 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">
                        {showFinalBoard ? '✅ Solution Found' : 'Step-by-Step Backtracking'}
                      </span>
                      {showFinalBoard && (
                        <button
                          onClick={resetTracer}
                          className="text-xs text-slate-400 hover:text-white transition-colors underline"
                        >
                          Replay
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!showFinalBoard && (
                        <span className="text-slate-400 text-xs">
                          {playbackIndex} / {result.visited_sequence.length}
                        </span>
                      )}
                      {showFinalBoard && (
                        <button
                          onClick={() => setShowFinalBoard(!showFinalBoard)}
                          className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                        >
                          {showFinalBoard ? 'Show Tracer' : 'Show Solution'}
                        </button>
                      )}
                    </div>
                  </div>

                  {!showFinalBoard && (
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setShowDomains(!showDomains)}
                        className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                      >
                        {showDomains ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showDomains ? 'Hide Domain Pruning' : 'Show Domain Pruning'}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={resetTracer} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"><Square size={14} /></button>
                        {isPlaying ? (
                          <button onClick={() => setIsPlaying(false)} className="p-1.5 bg-amber-600 hover:bg-amber-500 rounded text-white transition-colors"><Pause size={14} /></button>
                        ) : (
                          <button onClick={() => setIsPlaying(true)} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-colors"><Play size={14} /></button>
                        )}
                        <button onClick={stepForward} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"><FastForward size={14} /></button>
                      </div>
                    </div>
                  )}

                  {!showFinalBoard && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-amber-500 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(playbackIndex / result.visited_sequence.length) * 100}%` }}
                      />
                    </div>
                  )}

                  {!showFinalBoard && (
                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">Speed:</span>
                      <div className="flex gap-1 flex-1">
                        {[['1x', 200], ['2x', 100], ['2.5x', 80], ['10x', 20]].map(([label, ms]) => (
                          <button
                            key={label}
                            onClick={() => setPlaybackSpeed(ms)}
                            className={`flex-1 py-0.5 rounded text-[10px] font-bold transition-all ${
                              playbackSpeed === ms
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            <div className={result ? 'mt-24' : ''}>
              {renderBoard() || (
                <div className="flex flex-col items-center gap-4 text-slate-500">
                  <Crown size={48} className="opacity-20" />
                  <span>Configure board size and click Solve</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >
              {/* Solution Summary Card */}
              {result.assignment && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="glass-panel p-5 border-emerald-500/30 bg-emerald-500/5"
                >
                  <h3 className="m-0 mb-4 text-emerald-400 font-bold flex items-center gap-2">
                    <Crown size={18} /> Solution Found — {n}-Queens Placement
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(result.assignment).map(([row, col]) => (
                      <div key={row} className="bg-black/30 border border-white/5 rounded-lg p-2 text-center">
                        <span className="text-[10px] text-slate-500 block">Row {row}</span>
                        <span className="text-purple-300 font-mono font-bold">Col {col}</span>
                      </div>
                    ))}
                  </div>
                  {conflicts.length === 0 ? (
                    <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                      <span>✅</span> No conflicts — all {queenCount} queens are safe!
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-red-400 text-sm font-bold">
                      <AlertTriangle size={16} /> {conflicts.length} conflicts detected
                    </div>
                  )}
                </motion.div>
              )}

              {/* Execution Stats */}
              <div className="glass-panel border-amber-500/20">
                <h3 className="m-0 mb-4 text-amber-400 font-semibold flex items-center gap-2">
                  <Activity size={20} /> Execution Results
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">Assignments / Steps</span>
                    <strong className="block text-3xl text-emerald-300 mt-1">{result.assignments_tried}</strong>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">{algorithm.includes('Backtrack') ? 'Backtracks' : 'Restarts'}</span>
                    <strong className="block text-3xl text-rose-300 mt-1">{result.backtracks}</strong>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 col-span-2 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Total Runtime</span>
                    <strong className="text-xl text-blue-300">{result.runtime.toFixed(4)}s</strong>
                  </div>
                </div>
              </div>

              {/* Trace Logs */}
              <div className="glass-panel flex-1 flex flex-col min-h-[250px]">
                <h4 className="m-0 mb-4 text-slate-300 font-medium">Reasoning Trace Logs</h4>
                <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-emerald-400/70 overflow-y-auto flex-1 max-h-[350px] border border-white/5 shadow-inner custom-scrollbar">
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
