import { useState, useEffect } from 'react'
import { Play, RotateCcw, Users, Gamepad2, Activity, Coins, TrendingUp, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'

// Helper recursive layout for SVG tree
function layoutTree(node, depth = 0, context = { leafCount: 0 }) {
  const levelHeight = 110;
  const leafSpacing = 85;
  const topMargin = 40;
  const leftMargin = 50;
  
  if (!node) return null;
  
  const y = depth * levelHeight + topMargin;
  
  if (!node.children || node.children.length === 0) {
    const x = context.leafCount * leafSpacing + leftMargin;
    context.leafCount += 1;
    return { ...node, x, y, children: [] };
  }
  
  const children = node.children.map(c => layoutTree(c, depth + 1, context));
  const x = (children[0].x + children[children.length - 1].x) / 2;
  
  return { ...node, x, y, children };
}

function flattenTree(node, nodes = [], links = []) {
  if (!node) return { nodes, links };
  nodes.push(node);
  if (node.children) {
    node.children.forEach(child => {
      links.push({ source: { id: node.id, x: node.x, y: node.y }, target: child });
      flattenTree(child, nodes, links);
    });
  }
  return { nodes, links };
}

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
  const [depthLimit, setDepthLimit] = useState(3)
  const [hoveredNode, setHoveredNode] = useState(null)

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
      const data = await pythonRunner.runGame(algorithm, currentBoard, depthLimit)
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
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
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
                
                <div className="flex flex-col gap-2 w-48">
                  <label className="text-sm font-medium text-slate-400">Search Depth: {depthLimit}</label>
                  <input 
                    type="range" min="1" max="4" value={depthLimit} 
                    onChange={e => setDepthLimit(parseInt(e.target.value))}
                    className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                </div>
                
                <button 
                  onClick={() => makeAIMove(board)} 
                  disabled={loading || (result && result.is_terminal)}
                  className="bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <Play size={18} /> AI First
                </button>
                <button onClick={resetGame} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer">
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

          {/* Game Evaluation Tree Visualizer */}
          {result && result.evaluation_tree && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 border-rose-500/20 lg:col-span-2 flex flex-col gap-6 bg-gradient-to-br from-black/40 to-rose-950/5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-500/10 p-2 rounded-lg text-rose-400 border border-rose-500/20">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="m-0 text-lg font-bold text-slate-200">Adversarial Evaluation Tree</h3>
                    <p className="m-0 text-xs text-slate-400 mt-0.5">
                      Visualizing the explored states, utilities, and alpha/beta bounds during evaluation
                    </p>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-400" /> Max Node (AI)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" /> Min Node (User)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-red-500 border-dashed" /> Pruned Branch
                  </div>
                </div>
              </div>

              {/* Main Visualizer Area */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* SVG Visualizer Canvas */}
                <div className="xl:col-span-3 bg-black/40 rounded-xl p-4 border border-white/5 overflow-auto max-h-[500px] min-h-[350px] relative custom-scrollbar">
                  {(() => {
                    const context = { leafCount: 0 };
                    const laidOut = layoutTree(result.evaluation_tree, 0, context);
                    const { nodes, links } = flattenTree(laidOut);
                    const svgWidth = Math.max(800, context.leafCount * 85 + 100);
                    const svgHeight = 4 * 110 + 100; // depth * levelHeight + padding
                    
                    return (
                      <svg width={svgWidth} height={svgHeight} className="overflow-visible select-none">
                        <defs>
                          <filter id="glow-purple">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="glow-green">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Links */}
                        {links.map((link, idx) => (
                          <line
                            key={`link-${idx}`}
                            x1={link.source.x}
                            y1={link.source.y}
                            x2={link.target.x}
                            y2={link.target.y}
                            stroke={link.target.pruned ? '#ef4444' : '#475569'}
                            strokeWidth={link.target.pruned ? 2 : 1.5}
                            strokeDasharray={link.target.pruned ? '4,4' : '0'}
                            opacity={link.target.pruned ? 0.6 : 1}
                            className="transition-all duration-300"
                          />
                        ))}
                        
                        {/* Nodes */}
                        {nodes.map((node) => {
                          const isHovered = hoveredNode?.id === node.id;
                          const nodeColor = node.is_max ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)';
                          const nodeBorder = node.is_max ? '#a855f7' : '#10b981';
                          const glowFilter = node.is_max ? 'url(#glow-purple)' : 'url(#glow-green)';
                          
                          return (
                            <g 
                              key={node.id} 
                              transform={`translate(${node.x}, ${node.y})`}
                              className="cursor-pointer group"
                              onMouseEnter={() => setHoveredNode(node)}
                            >
                              {/* Glowing Background */}
                              {isHovered && (
                                <circle 
                                  r={30} 
                                  fill={nodeColor}
                                  stroke={nodeBorder}
                                  strokeWidth={1}
                                  filter={glowFilter}
                                  opacity={0.8}
                                />
                              )}
                              
                              {/* Primary Node Shape */}
                              {node.is_max ? (
                                // Triangle for Max
                                <polygon
                                  points="0,-22 20,12 -20,12"
                                  fill={node.pruned ? '#1e293b' : nodeColor}
                                  stroke={node.pruned ? '#ef4444' : nodeBorder}
                                  strokeWidth={isHovered ? 2.5 : 1.5}
                                  strokeDasharray={node.pruned ? '3,3' : '0'}
                                  opacity={node.pruned ? 0.5 : 1}
                                  className="transition-all duration-300"
                                />
                              ) : (
                                // Circle for Min
                                <circle
                                  r={18}
                                  fill={node.pruned ? '#1e293b' : nodeColor}
                                  stroke={node.pruned ? '#ef4444' : nodeBorder}
                                  strokeWidth={isHovered ? 2.5 : 1.5}
                                  strokeDasharray={node.pruned ? '3,3' : '0'}
                                  opacity={node.pruned ? 0.5 : 1}
                                  className="transition-all duration-300"
                                />
                              )}
                              
                              {/* Miniature Board inside node */}
                              <foreignObject 
                                x={-10} 
                                y={node.is_max ? -4 : -10} 
                                width={20} 
                                height={20}
                                opacity={node.pruned ? 0.3 : 0.8}
                                className="pointer-events-none"
                              >
                                <div className="w-5 h-5 grid grid-cols-3 gap-[1px] bg-slate-700/60 p-[0.5px] rounded-[2px] overflow-hidden">
                                  {node.board ? node.board.flat().map((cell, idx) => (
                                    <div 
                                      key={idx} 
                                      className={`w-[6px] h-[6px] flex items-center justify-center text-[4px] font-bold bg-slate-900 
                                        ${cell === 'X' ? 'text-purple-400' : cell === 'O' ? 'text-emerald-400' : 'text-slate-600'}
                                      `}
                                    >
                                      {cell !== ' ' ? cell : ''}
                                    </div>
                                  )) : (
                                    Array(9).fill(0).map((_, idx) => <div key={idx} className="w-[6px] h-[6px] bg-slate-900" />)
                                  )}
                                </div>
                              </foreignObject>

                              {/* Value text bubble */}
                              {node.value !== null && !node.pruned && (
                                <g transform="translate(0, 28)">
                                  <rect 
                                    x={-15} 
                                    y={-8} 
                                    width={30} 
                                    height={14} 
                                    rx={3} 
                                    fill="#0f172a" 
                                    stroke="rgba(255,255,255,0.1)" 
                                    strokeWidth={1}
                                  />
                                  <text 
                                    textAnchor="middle" 
                                    alignmentBaseline="middle" 
                                    className="text-[8px] font-mono font-bold fill-rose-300"
                                    y={-1}
                                  >
                                    {node.value}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>

                {/* Info Panel / Details on Hover */}
                <div className="xl:col-span-1 flex flex-col gap-4">
                  <div className="glass-panel p-4 border-rose-500/10 bg-black/20 flex-1 flex flex-col justify-between min-h-[300px]">
                    {hoveredNode ? (
                      <div className="flex flex-col gap-4 h-full justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Node Info</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hoveredNode.pruned ? 'bg-red-500/20 text-red-400 border border-red-500/30' : hoveredNode.is_max ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                              {hoveredNode.pruned ? 'PRUNED' : hoveredNode.is_max ? 'MAX TURN' : 'MIN TURN'}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 font-mono text-xs text-slate-300 mt-4 bg-black/40 p-3 rounded-lg border border-white/5">
                            <div>Depth: <strong className="text-slate-200">{hoveredNode.depth}</strong></div>
                            <div>Value: <strong className="text-rose-400">{hoveredNode.value !== null ? hoveredNode.value : 'None (Pruned)'}</strong></div>
                            <div>Alpha: <strong className="text-purple-400">{hoveredNode.alpha !== null ? hoveredNode.alpha : 'N/A'}</strong></div>
                            <div>Beta: <strong className="text-emerald-400">{hoveredNode.beta !== null ? hoveredNode.beta : 'N/A'}</strong></div>
                          </div>
                        </div>

                        {/* Zoomed Board Preview */}
                        <div className="flex flex-col items-center mt-4">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-3 align-self-start">State Snapshot</span>
                          <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1.5 rounded-lg shadow-xl">
                            {hoveredNode.board ? hoveredNode.board.flat().map((cell, idx) => (
                              <div 
                                key={idx} 
                                className={`w-8 h-8 flex items-center justify-center text-sm font-bold bg-slate-950 rounded
                                  ${cell === 'X' ? 'text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.6)]' : cell === 'O' ? 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]' : ''}
                                `}
                              >
                                {cell !== ' ' ? cell : ''}
                              </div>
                            )) : (
                              Array(9).fill(0).map((_, idx) => <div key={idx} className="w-8 h-8 bg-slate-950 rounded" />)
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 gap-3 py-10">
                        <Info size={32} className="stroke-slate-600" />
                        <p className="text-sm m-0">Hover over any node in the tree diagram to view details and board zoom</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
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
