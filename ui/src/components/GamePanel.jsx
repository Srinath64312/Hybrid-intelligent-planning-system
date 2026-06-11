import { useState, useEffect } from 'react'
import { Play, RotateCcw, Users, Gamepad2, Activity, Coins, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'

export default function GamePanel() {
  const [peas, setPeas] = useState(null)
  const [mode, setMode] = useState('Tic-Tac-Toe') // 'Tic-Tac-Toe' or 'Negotiation'
  
  // Tic-Tac-Toe State
  const [algorithm, setAlgorithm] = useState('Auto-Select Best')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ])

  // Negotiation State
  const [negResult, setNegResult] = useState(null)

  useEffect(() => {
    pythonRunner.getPeas('Game')
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  // -----------------------------------------
  // Tic-Tac-Toe Logic
  // -----------------------------------------
  const resetGame = () => {
    setBoard([[null, null, null], [null, null, null], [null, null, null]])
    setResult(null)
  }

  const makeAIMove = async (currentBoard) => {
    setLoading(true)
    try {
      const data = await pythonRunner.runGame(algorithm, currentBoard)
      setResult(data)
      if (data.best_action && !data.is_terminal && data.expected_utility !== undefined) {
        const [r, c] = data.best_action
        setBoard(prev => {
          const newBoard = [...prev]
          newBoard[r] = [...prev[r]]
          newBoard[r][c] = "X"
          return newBoard
        })
      }
    } catch (err) {
      console.error(err)
      alert("Failed to compute AI move via Python solver.")
    }
    setLoading(false)
  }

  const handleCellClick = (r, c) => {
    if (board[r][c] !== null || loading || (result && result.is_terminal)) return
    const newBoard = [...board]
    newBoard[r] = [...board[r]]
    newBoard[r][c] = "O"
    setBoard(newBoard)
    makeAIMove(newBoard)
  }

  // -----------------------------------------
  // Negotiation Logic
  // -----------------------------------------
  const runNegotiation = async () => {
    setLoading(true)
    setNegResult(null)
    try {
      const data = await pythonRunner.runNegotiation()
      setNegResult(data)
    } catch (err) {
      console.error(err)
      alert("Failed to run negotiation via Python solver.")
    }
    setLoading(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto flex flex-col gap-8"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="bg-rose-500/20 p-3 rounded-xl">
            <Gamepad2 size={32} className="text-rose-500" />
          </div>
          <div>
            <h1 className="m-0 text-3xl font-bold text-slate-200">Game & Negotiation AI</h1>
            <p className="m-0 text-slate-400 mt-1">Zero-Sum Games and Multi-Agent Auctions</p>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="bg-black/40 p-1 rounded-xl flex gap-1 border border-white/5">
          <button 
            onClick={() => setMode('Tic-Tac-Toe')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'Tic-Tac-Toe' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Gamepad2 size={16} /> Tic-Tac-Toe (Zero-Sum)
          </button>
          <button 
            onClick={() => setMode('Negotiation')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'Negotiation' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Users size={16} /> Multi-Agent Negotiation
          </button>
        </div>
      </div>

      {mode === 'Tic-Tac-Toe' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="glass-panel p-6 border-rose-500/20">
              <div className="flex flex-wrap gap-4 items-end mb-6">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-medium text-slate-400">AI Algorithm (Plays X)</label>
                  <select 
                    value={algorithm} onChange={e => setAlgorithm(e.target.value)}
                    className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-rose-500 outline-none"
                  >
                    <option value="Auto-Select Best">Auto-Select Best Algorithm</option>
                    <option value="Minimax">Standard Minimax</option>
                    <option value="Alpha-Beta Pruning">Alpha-Beta Pruning</option>
                  </select>
                </div>
                <button 
                  onClick={() => makeAIMove(board)} 
                  disabled={loading || (result && result.is_terminal)}
                  className="bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg"
                >
                  <Play size={18} /> AI First
                </button>
                <button onClick={resetGame} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
                  <RotateCcw size={18} />
                </button>
              </div>
              
              <div className="bg-black/30 p-8 rounded-xl flex flex-col items-center border border-white/5">
                <div className="grid grid-cols-3 gap-2 bg-slate-800 p-2 rounded-xl shadow-2xl">
                  {board.map((row, r) => row.map((cell, c) => {
                    const isWinningCell = result?.winning_line?.some(([wr, wc]) => wr === r && wc === c)
                    return (
                      <motion.div 
                        key={`${r}-${c}`} onClick={() => handleCellClick(r, c)}
                        animate={{
                          backgroundColor: isWinningCell ? 'rgba(74, 222, 128, 0.2)' : '#0f172a',
                          borderColor: isWinningCell ? '#4ade80' : 'transparent',
                          scale: isWinningCell ? 1.05 : 1
                        }}
                        className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-5xl font-bold border-2 rounded-lg transition-colors
                          ${cell === null && !loading && !(result && result.is_terminal) ? 'cursor-pointer hover:bg-slate-900' : 'cursor-default'}
                          ${cell === 'X' ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' : cell === 'O' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : ''}
                        `}
                      >
                        {cell}
                      </motion.div>
                    )
                  }))}
                </div>
                <p className="text-sm text-slate-500 mt-6 text-center">
                  You play as <strong className="text-emerald-400">O</strong>. AI plays as <strong className="text-purple-400">X</strong>.
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                {result.is_terminal && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`p-6 rounded-xl text-2xl font-black text-center shadow-2xl border-2
                      ${result.utility === 1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : result.utility === -1 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-500/20 text-slate-400 border-slate-500/50'}
                    `}
                  >
                    GAME OVER! {result.utility === 1 ? 'AI (X) WINS!' : result.utility === -1 ? 'YOU (O) WIN!' : 'IT\'S A DRAW!'}
                  </motion.div>
                )}
                
                <div className="glass-panel border-rose-500/20">
                  <h3 className="m-0 mb-4 text-rose-400 font-semibold flex items-center gap-2"><Activity size={20} /> Execution Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                      <span className="text-slate-400 text-xs uppercase tracking-wider">Nodes Evaluated</span>
                      <strong className="block text-2xl text-rose-300 mt-1">{result.nodes_evaluated}</strong>
                    </div>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                      <span className="text-slate-400 text-xs uppercase tracking-wider">Expected Utility</span>
                      <strong className="block text-2xl text-blue-300 mt-1">{result.expected_utility}</strong>
                    </div>
                    {algorithm !== 'Minimax' && (
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 col-span-2 flex items-center justify-between">
                        <span className="text-slate-400 text-sm font-medium">Branches Pruned (Alpha-Beta)</span>
                        <strong className="text-xl text-emerald-400">{result.pruned_branches}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {!result.is_terminal && (
                  <div className="glass-panel flex-1 flex flex-col min-h-[250px]">
                    <h4 className="m-0 mb-3 text-slate-400 font-medium text-sm">Reasoning Trace Logs</h4>
                    <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-slate-400 overflow-y-auto flex-1 max-h-[300px] border border-white/5 custom-scrollbar">
                      {result.trace.map((t, i) => <div key={i} className="py-1 border-b border-white/5 last:border-0 hover:bg-white/5">[{i}] {t}</div>)}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // Negotiation Mode
        <div className="flex flex-col gap-8">
          <div className="glass-panel p-8 border-amber-500/20 flex flex-col md:flex-row gap-8 items-center justify-between bg-gradient-to-br from-black/40 to-amber-900/10">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-amber-400 mb-2">Vickrey-Clarke-Groves (VCG) Auction Simulator</h2>
              <p className="text-slate-300 leading-relaxed text-sm">
                In this non-zero-sum environment, multiple agents (Professors) bid for shared resources (Timeslots). 
                The system uses a second-price sealed-bid auction to simulate a Nash Bargaining Equilibrium, ensuring truthfulness is the dominant strategy.
              </p>
            </div>
            <button 
              onClick={runNegotiation} disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] whitespace-nowrap"
            >
              <Play size={24} className={loading ? 'animate-pulse' : ''} />
              {loading ? 'Running Auction...' : 'Run Negotiation Epoch'}
            </button>
          </div>

          <AnimatePresence>
            {negResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Allocations & Budgets */}
                <div className="flex flex-col gap-6">
                  <div className="glass-panel border-amber-500/20">
                    <h3 className="m-0 mb-6 text-amber-400 font-semibold flex items-center gap-2"><TrendingUp size={20} /> Final Allocations</h3>
                    <div className="flex flex-col gap-3">
                      {Object.entries(negResult.allocations).map(([item, winner]) => (
                        <div key={item} className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                          <span className="font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-md">{item}</span>
                          {winner === "Unallocated" ? (
                            <span className="text-slate-500 italic">Unallocated</span>
                          ) : (
                            <span className="font-bold text-emerald-400">{winner}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel border-blue-500/20">
                    <h3 className="m-0 mb-6 text-blue-400 font-semibold flex items-center gap-2"><Coins size={20} /> Agent Budgets (Post-Auction)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {Object.entries(negResult.final_budgets).map(([agent, budget]) => (
                        <div key={agent} className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center">
                          <span className="block text-xs text-slate-400 mb-1">{agent.split(' ')[0]}</span>
                          <strong className="text-xl text-blue-300">${budget.toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Auction Trace */}
                <div className="glass-panel flex flex-col h-full">
                  <h3 className="m-0 mb-4 text-slate-300 font-semibold flex items-center gap-2"><Activity size={20} /> Bidding & Clearing Trace</h3>
                  <div className="bg-black/50 p-5 rounded-xl font-mono text-sm leading-relaxed text-slate-300 overflow-y-auto flex-1 border border-white/5 shadow-inner">
                    {negResult.trace.map((line, idx) => {
                      let color = 'text-slate-400'
                      if (line.includes('===') || line.includes('---')) color = 'text-amber-500 font-bold mt-4 first:mt-0'
                      if (line.includes('✅')) color = 'text-emerald-400'
                      if (line.includes('❌')) color = 'text-red-400'
                      if (line.includes('submitted')) color = 'text-blue-300'
                      
                      return (
                        <div key={idx} className={`${color} py-1`}>
                          {line.replace(/\\n/g, '')}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
