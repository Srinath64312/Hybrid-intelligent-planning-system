import { useState, useEffect } from 'react'
import { Play, Pause, Square, FastForward, Settings2, Activity, Shuffle, MousePointer2, Mountain, Flag, MapPin, Scale, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'
import { anthropicClient } from '../anthropicClient'

export default function SearchPanel() {
  const [searchMode, setSearchMode] = useState('maze') // maze, graph
  const [graphJson, setGraphJson] = useState(JSON.stringify({
    adjacency_list: {
      "A": [["B", 1.0], ["C", 4.0]],
      "B": [["C", 2.0], ["D", 6.0]],
      "C": [["D", 3.0]],
      "D": []
    },
    heuristics: {
      "A": 4.0,
      "B": 3.0,
      "C": 1.0,
      "D": 0.0
    },
    start: "A",
    goal: "D"
  }, null, 2))
  const [graphError, setGraphError] = useState(null)

  const [peas, setPeas] = useState(null)
  const [algorithm, setAlgorithm] = useState('Auto-Select Best')
  const [result, setResult] = useState(null)
  const [heuristicAnalysis, setHeuristicAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showProfiler, setShowProfiler] = useState(false)
  const [profilerAlgorithm, setProfilerAlgorithm] = useState('BFS')
  const [profilerResult, setProfilerResult] = useState(null)
  const [profilerLLMReport, setProfilerLLMReport] = useState('')
  const [isProfiling, setIsProfiling] = useState(false)
  
  const [grid, setGrid] = useState([
    [0, 0, 0, 1, 0],
    [1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0]
  ])
  const [mazeSize, setMazeSize] = useState(5)
  const [mazeDensity, setMazeDensity] = useState(0.2)
  const [startNode, setStartNode] = useState([0, 0])
  const [goalNode, setGoalNode] = useState([4, 4])
  const [drawMode, setDrawMode] = useState('wall') // wall, weight, start, goal
  const [isDrawing, setIsDrawing] = useState(false)
  const [heuristic, setHeuristic] = useState('manhattan')

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(200) // ms per step

  useEffect(() => {
    pythonRunner.getPeas('Search')
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  // Animation Loop
  useEffect(() => {
    let timer;
    if (isPlaying && result && result.visited_sequence && playbackIndex < result.visited_sequence.length) {
      timer = setTimeout(() => {
        setPlaybackIndex(prev => prev + 1)
      }, playbackSpeed);
    } else if (isPlaying && result && playbackIndex >= result.visited_sequence.length) {
      setIsPlaying(false)
    }
    return () => clearTimeout(timer)
  }, [isPlaying, playbackIndex, result, playbackSpeed])

  const handleSolve = async () => {
    setLoading(true)
    setIsPlaying(false)
    setPlaybackIndex(0)
    try {
      if (searchMode === 'graph') {
        let parsed;
        try {
          parsed = JSON.parse(graphJson)
          setGraphError(null)
        } catch (err) {
          setGraphError("Invalid JSON structure: " + err.message)
          setLoading(false)
          return
        }
        if (!parsed.adjacency_list || !parsed.start || !parsed.goal) {
          setGraphError("Graph JSON must contain 'adjacency_list', 'start', and 'goal' keys.")
          setLoading(false)
          return
        }
        const data = await pythonRunner.runGraphSearch(
          algorithm === "Auto-Select Best" ? "A*" : algorithm,
          parsed.adjacency_list,
          parsed.start,
          parsed.goal,
          parsed.heuristics || {}
        )
        setResult(data)
        setIsPlaying(true)
      } else {
        const data = await pythonRunner.runSearch(algorithm, grid, startNode, goalNode, heuristic)
        setResult(data)
        
        if (['A*', 'Greedy', 'Bi-directional A*'].includes(algorithm) || algorithm === 'Auto-Select Best') {
          const analysis = await pythonRunner.analyzeHeuristic(grid, goalNode, heuristic)
          setHeuristicAnalysis(analysis)
        } else {
          setHeuristicAnalysis(null)
        }
        
        // Auto-play the tracer
        setIsPlaying(true)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to solve search problem.")
    }
    setLoading(false)
  }

  const interactCell = (r, c) => {
    if (result && isPlaying) return // disable drawing while playing
    const newGrid = [...grid]
    newGrid[r] = [...grid[r]]

    if (drawMode === 'start') {
      if (r !== goalNode[0] || c !== goalNode[1]) {
        setStartNode([r, c])
        newGrid[r][c] = 0 // clear walls/weights under start
      }
    } else if (drawMode === 'goal') {
      if (r !== startNode[0] || c !== startNode[1]) {
        setGoalNode([r, c])
        newGrid[r][c] = 0 // clear walls/weights under goal
      }
    } else if (drawMode === 'wall') {
      if (!(r === startNode[0] && c === startNode[1]) && !(r === goalNode[0] && c === goalNode[1])) {
        newGrid[r][c] = newGrid[r][c] === 1 ? 0 : 1
      }
    } else if (drawMode === 'weight') {
      if (!(r === startNode[0] && c === startNode[1]) && !(r === goalNode[0] && c === goalNode[1])) {
        newGrid[r][c] = newGrid[r][c] === 5 ? 0 : 5 // Weight of 5
      }
    }
    
    setGrid(newGrid)
    setResult(null)
    setIsPlaying(false)
    setPlaybackIndex(0)
  }

  const handlePointerDown = (r, c) => {
    setIsDrawing(true)
    interactCell(r, c)
  }

  const handlePointerEnter = (r, c) => {
    if (isDrawing && drawMode !== 'start' && drawMode !== 'goal') {
      interactCell(r, c)
    }
  }

  const handlePointerUp = () => {
    setIsDrawing(false)
  }

  const runProfiler = async () => {
    setIsProfiling(true)
    setProfilerResult(null)
    setProfilerLLMReport('')
    try {
      // Run both primary and secondary algorithms silently
      const dataPrimary = await pythonRunner.runSearch(algorithm === 'Auto-Select Best' ? 'A*' : algorithm, grid, startNode, goalNode, heuristic)
      const dataSecondary = await pythonRunner.runSearch(profilerAlgorithm, grid, startNode, goalNode, heuristic)
      
      const comparison = {
        algo1: { name: algorithm, nodes: dataPrimary.nodes_expanded, runtime: dataPrimary.runtime, cost: dataPrimary.cost },
        algo2: { name: profilerAlgorithm, nodes: dataSecondary.nodes_expanded, runtime: dataSecondary.runtime, cost: dataSecondary.cost }
      }
      setProfilerResult(comparison)

      // Auto-generate LLM report
      if (anthropicClient.hasKey()) {
        const prompt = `I ran two search algorithms on a ${grid.length}x${grid[0].length} maze.
Algorithm 1 (${comparison.algo1.name}): ${comparison.algo1.nodes} nodes expanded, ${comparison.algo1.cost} path cost, ${comparison.algo1.runtime}s runtime.
Algorithm 2 (${comparison.algo2.name}): ${comparison.algo2.nodes} nodes expanded, ${comparison.algo2.cost} path cost, ${comparison.algo2.runtime}s runtime.
Explain briefly in 2 short paragraphs why these differences occurred based on the theoretical properties of these algorithms.`
        
        const response = await anthropicClient.sendMessage(prompt)
        setProfilerLLMReport(response)
      } else {
        setProfilerLLMReport("Anthropic API key not configured. Enter it in the Scheduling CSP panel to enable LLM analysis.")
      }
    } catch (err) {
      console.error(err)
      alert("Profiler failed.")
    }
    setIsProfiling(false)
  }

  const resetTracer = () => {
    setIsPlaying(false)
    setPlaybackIndex(0)
    setHeuristicAnalysis(null)
  }

  const handleGenerateMaze = async () => {
    setLoading(true)
    setResult(null)
    resetTracer()
    try {
      const data = await pythonRunner.generateMaze(mazeSize, mazeDensity)
      setGrid(data.grid)
      setStartNode(data.start)
      setGoalNode(data.goal)
    } catch (err) {
      console.error(err)
      alert("Failed to generate maze.")
    }
    setLoading(false)
  }

  const stepForward = () => {
    setIsPlaying(false)
    if (result && playbackIndex < result.visited_sequence.length) {
      setPlaybackIndex(prev => prev + 1)
    }
  }

  const isPlaybackComplete = result && playbackIndex >= result.visited_sequence.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto flex flex-col gap-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <Settings2 size={32} className="text-blue-500" />
          </div>
          <div>
            <h1 className="m-0 text-3xl font-bold text-slate-200">Search Engine: Visual Tracer</h1>
            <p className="m-0 text-slate-400 mt-1">Interactive Pathfinding and Graph Search with Animated Playback</p>
          </div>
        </div>
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-white/5 self-start md:self-auto">
          <button
            onClick={() => {
              setSearchMode('maze')
              setResult(null)
              resetTracer()
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              searchMode === 'maze'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Maze Pathfinding
          </button>
          <button
            onClick={() => {
              setSearchMode('graph')
              setResult(null)
              resetTracer()
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              searchMode === 'graph'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom Graph Search
          </button>
        </div>
      </div>
      
      {peas && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl"
        >
          <h3 className="m-0 mb-4 text-blue-400 font-semibold flex items-center gap-2">PEAS Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-300">
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-blue-300 block mb-1">Performance</strong> {peas.performance}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-blue-300 block mb-1">Environment</strong> {peas.environment}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-blue-300 block mb-1">Actuators</strong> {peas.actuators}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5"><strong className="text-blue-300 block mb-1">Sensors</strong> {peas.sensors}</div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5 col-span-full md:col-span-2 lg:col-span-4 flex items-center gap-2">
              <strong className="text-blue-300">Type:</strong> {peas.env_type}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-wrap gap-6 items-end border-blue-500/20">
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-slate-400">Algorithm Selection</label>
              <select 
                value={algorithm} 
                onChange={e => {
                  setAlgorithm(e.target.value)
                  setResult(null)
                  resetTracer()
                }} 
                className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
              >
                <option value="Auto-Select Best">Auto-Select Best Algorithm</option>
                <option value="A*">A* Search</option>
                <option value="Bi-directional A*">Bi-directional A*</option>
                <option value="UCS">Uniform Cost Search (Dijkstra)</option>
                <option value="Greedy">Greedy Best-First Search</option>
                <option value="BFS">Breadth First Search (BFS)</option>
                <option value="DFS">Depth First Search (DFS)</option>
              </select>
            </div>
            
            {searchMode === 'maze' ? (
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-slate-400">Heuristic (For A* / Greedy)</label>
                <select 
                  value={heuristic} 
                  onChange={e => {
                    setHeuristic(e.target.value)
                    setResult(null)
                    resetTracer()
                  }} 
                  className="bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                >
                  <option value="manhattan">Manhattan Distance (Grid)</option>
                  <option value="euclidean">Heuristic: Euclidean Distance</option>
                  <option value="zero">Zero Heuristic (Fallback to UCS)</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-2 flex-1 min-w-[200px] text-xs text-slate-400">
                <span className="font-semibold text-slate-400">Node Heuristics</span>
                <p className="m-0 leading-normal">
                  Heuristics are specified dynamically inside the JSON object graph definition below.
                </p>
              </div>
            )}
            <div className="flex gap-2 mt-4 w-full">
              <button 
                onClick={handleSolve} 
                disabled={loading}
                className={`flex-grow flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-bold transition-all shadow-lg
                  ${loading 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 hover:shadow-indigo-500/25 hover:-translate-y-0.5'
                  }`}
              >
                <Play size={20} className={loading ? 'animate-pulse' : ''} /> 
                {loading ? 'Solving...' : searchMode === 'graph' ? 'Solve Graph' : 'Solve Maze'}
              </button>

              {searchMode === 'maze' && (
                <button 
                  onClick={() => setShowProfiler(true)} 
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all bg-slate-800 text-purple-400 hover:bg-slate-700 border border-purple-500/30 hover:border-purple-500/60 font-semibold"
                >
                  <Scale size={20} /> Compare
                </button>
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="glass-panel p-4 flex flex-col gap-4 border-indigo-500/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-300">
                    Tracer Progress: {playbackIndex} / {result.visited_sequence.length} Nodes
                  </span>
                  <div className="flex gap-2">
                    <button onClick={resetTracer} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"><Square size={16} /></button>
                    {isPlaying ? (
                      <button onClick={() => setIsPlaying(false)} className="p-2 bg-amber-600 hover:bg-amber-500 rounded text-white transition-colors"><Pause size={16} /></button>
                    ) : (
                      <button onClick={() => setIsPlaying(true)} className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-colors"><Play size={16} /></button>
                    )}
                    <button onClick={stepForward} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"><FastForward size={16} /></button>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-indigo-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(playbackIndex / result.visited_sequence.length) * 100}%` }}
                  />
                </div>
                {/* Playback Speed Control */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-slate-500 shrink-0">Speed:</span>
                  <div className="flex gap-1 flex-1">
                    {[['Slow', 500], ['Normal', 200], ['Fast', 60]].map(([label, ms]) => (
                      <button
                        key={label}
                        onClick={() => setPlaybackSpeed(ms)}
                        className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
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
                
                {/* Live Telemetry Dashboard */}
                {playbackIndex > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5 text-center">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Frontier Size</span>
                      <strong className="text-lg text-indigo-300">{result.visited_sequence[playbackIndex - 1].frontier_size}</strong>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5 text-center">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Closed Set</span>
                      <strong className="text-lg text-slate-300">{result.visited_sequence[playbackIndex - 1].closed_size}</strong>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5 text-center">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Path Cost (g)</span>
                      <strong className="text-lg text-emerald-300">{result.visited_sequence[playbackIndex - 1].g}</strong>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5 text-center">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Heuristic (h)</span>
                      <strong className="text-lg text-amber-300">{result.visited_sequence[playbackIndex - 1].h.toFixed(1)}</strong>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Maze Grid Controls */}
          <div className="glass-panel p-6 border-emerald-500/20">
            <h3 className="m-0 mb-4 text-emerald-400 font-semibold flex items-center gap-2">Pathfinding Arena Controls</h3>
            
            <div className="flex flex-wrap gap-2 mb-6 p-1 bg-black/30 rounded-xl border border-white/5 w-fit">
              <button onClick={() => setDrawMode('wall')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${drawMode === 'wall' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <MousePointer2 size={16} /> Draw Wall
              </button>
              <button onClick={() => setDrawMode('weight')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${drawMode === 'weight' ? 'bg-amber-600/30 text-amber-400 border border-amber-500/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Mountain size={16} /> Draw Mud (Cost: 5)
              </button>
              <button onClick={() => setDrawMode('start')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${drawMode === 'start' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <MapPin size={16} /> Move Start
              </button>
              <button onClick={() => setDrawMode('goal')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${drawMode === 'goal' ? 'bg-rose-600/30 text-rose-400 border border-rose-500/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Flag size={16} /> Move Goal
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-400">Grid Size</label>
                    <span className="text-sm text-emerald-300 font-bold">{mazeSize}x{mazeSize}</span>
                  </div>
                  <input type="range" min="3" max="15" value={mazeSize} onChange={e => setMazeSize(parseInt(e.target.value))} className="w-full accent-emerald-500" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-400">Obstacle Density</label>
                    <span className="text-sm text-emerald-300 font-bold">{Math.round(mazeDensity * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="0.5" step="0.05" value={mazeDensity} onChange={e => setMazeDensity(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
                </div>
              </div>
              <button 
                onClick={handleGenerateMaze} 
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border border-emerald-500/30 hover:border-emerald-500/60"
              >
                <Shuffle size={18} /> Generate New Maze
              </button>
            </div>
          </div>

          {searchMode === 'maze' ? (
            /* Maze Grid */
            <div 
              className="glass-panel flex-grow flex flex-col items-center justify-center bg-black/20 p-8 min-h-[400px]"
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div 
                className="grid gap-1 sm:gap-2 max-w-full overflow-auto touch-none" 
                style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 5}, minmax(1.5rem, 4rem))` }}
              >
                {grid.map((row, r) => row.map((cell, c) => {
                  const isStart = r === startNode[0] && c === startNode[1]
                  const isGoal = r === goalNode[0] && c === goalNode[1]
                  
                  // Determine Tracer State
                  let isVisited = false;
                  let isCurrentExpanding = false;
                  
                  if (result && result.visited_sequence) {
                    const seq = result.visited_sequence.slice(0, playbackIndex)
                    isVisited = seq.some(pt => pt.state[0] === r && pt.state[1] === c)
                    
                    if (playbackIndex > 0 && playbackIndex <= result.visited_sequence.length) {
                      const currentPt = result.visited_sequence[playbackIndex - 1]
                      isCurrentExpanding = currentPt.state[0] === r && currentPt.state[1] === c
                    }
                  }

                  // Path construction
                  const inPath = isPlaybackComplete && result && result.path && !isStart && !isGoal && (() => {
                    let currR = 0, currC = 0
                    for (let move of result.path) {
                      if (move === 'UP') currR--
                      else if (move === 'DOWN') currR++
                      else if (move === 'LEFT') currC--
                      else if (move === 'RIGHT') currC++
                      if (currR === r && currC === c) return true
                    }
                    return false
                  })()

                  // Color assignments based on tracer state
                  let bgColor = 'bg-slate-800/60 border-slate-700' // Default unvisited
                  let textColor = 'text-transparent'
                  let shadow = ''
                  let zIndex = 1

                  if (cell === 1) {
                    bgColor = 'bg-slate-950 border-slate-900' // Wall
                  } else if (cell > 1) {
                    bgColor = 'bg-amber-900/60 border-amber-800/80' // Weighted mud
                    textColor = 'text-amber-500/50'
                  }

                  if (isStart) {
                    bgColor = 'bg-emerald-500 border-emerald-400'
                    textColor = 'text-white'
                  } else if (isGoal) {
                    bgColor = 'bg-rose-500 border-rose-400'
                    textColor = 'text-white'
                  } else if (inPath) {
                    bgColor = 'bg-amber-400 border-amber-300'
                    shadow = 'shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                    zIndex = 10
                    textColor = 'text-transparent'
                  } else if (isCurrentExpanding) {
                    bgColor = 'bg-purple-500 border-purple-400'
                    shadow = 'shadow-[0_0_20px_rgba(168,85,247,0.8)]'
                    zIndex = 20
                    textColor = 'text-transparent'
                  } else if (isVisited) {
                    bgColor = 'bg-indigo-500/30 border-indigo-500/50'
                    textColor = 'text-transparent'
                  }

                  return (
                    <motion.div 
                      key={`${r}-${c}`}
                      onPointerDown={() => handlePointerDown(r, c)}
                      onPointerEnter={() => handlePointerEnter(r, c)}
                      animate={{ backgroundColor: bgColor, boxShadow: shadow }}
                      transition={{ duration: 0.2 }}
                      className={`
                        aspect-square rounded-md sm:rounded-xl flex items-center justify-center font-bold text-xs sm:text-lg border-2
                        cursor-crosshair hover:border-slate-400 select-none
                        ${bgColor} ${textColor}
                      `}
                      style={{ zIndex }}
                    >
                      {isStart ? 'S' : isGoal ? 'G' : (cell > 1 && !inPath && !isVisited && !isCurrentExpanding ? cell : '')}
                    </motion.div>
                  )
                }))}
              </div>
              <p className="text-sm text-slate-500 mt-4 text-center">
                Use the draw tools above and click/drag on the grid.<br/>S = Start | G = Goal | Numbers = Travel Cost
              </p>
              {/* Color Legend */}
              <div className="flex flex-wrap gap-3 justify-center mt-4 text-[10px] text-slate-400 font-medium font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-500 inline-block" />Start (S)</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-rose-500 inline-block" />Goal (G)</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-purple-500 inline-block" />Expanding</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-indigo-500/30 border border-indigo-500/50 inline-block" />Visited</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-400 inline-block" />Optimal Path</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-950 inline-block border border-slate-800" />Wall</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-900/60 inline-block border border-amber-800/80" />Mud (Cost 5)</span>
              </div>
            </div>
          ) : (() => {
            let parsed = null;
            try {
              parsed = JSON.parse(graphJson);
            } catch (e) {}
            const nodes = parsed && parsed.adjacency_list ? Object.keys(parsed.adjacency_list) : [];
            const startNodeName = parsed ? parsed.start : '';
            const goalNodeName = parsed ? parsed.goal : '';
            
            // Reconstruct path nodes from actions like "GO_TO_B"
            const pathNodes = [];
            if (result && result.path && parsed) {
              pathNodes.push(startNodeName);
              for (let action of result.path) {
                if (action.startsWith("GO_TO_")) {
                  pathNodes.push(action.substring(6));
                } else {
                  pathNodes.push(action);
                }
              }
            }

            return (
              <div className="glass-panel flex-grow flex flex-col bg-black/20 p-6 min-h-[400px]">
                <h3 className="m-0 mb-4 text-blue-400 font-semibold">Graph Visualization (States & Adjacency)</h3>
                
                {nodes.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                    Enter a valid JSON graph to view the nodes list.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {nodes.map(node => {
                      const isStart = node === startNodeName;
                      const isGoal = node === goalNodeName;
                      
                      // Check visited status
                      const isVisited = result && result.visited_sequence && 
                        result.visited_sequence.slice(0, playbackIndex).some(pt => pt.state === node);
                      
                      // Check active expanding status
                      const isCurrentExpanding = result && result.visited_sequence && 
                        playbackIndex > 0 && playbackIndex <= result.visited_sequence.length && 
                        result.visited_sequence[playbackIndex - 1].state === node;
                      
                      // Check path status
                      const inPath = isPlaybackComplete && pathNodes.includes(node);

                      // Determine styling
                      let cardStyle = 'border-slate-800 bg-slate-900/40 text-slate-300';
                      let statusBadge = null;

                      if (isStart) {
                        cardStyle = 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
                        statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Start</span>;
                      } else if (isGoal) {
                        cardStyle = 'border-rose-500 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
                        statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Goal</span>;
                      }

                      if (inPath) {
                        cardStyle = 'border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.25)]';
                        statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Path</span>;
                      } else if (isCurrentExpanding) {
                        cardStyle = 'border-purple-500 bg-purple-500/25 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse';
                        statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Expanding</span>;
                      } else if (isVisited) {
                        cardStyle = 'border-indigo-500/50 bg-indigo-500/10';
                        statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Visited</span>;
                      }

                      const heuristicVal = parsed.heuristics && parsed.heuristics[node] !== undefined 
                        ? parsed.heuristics[node] 
                        : 0.0;
                      
                      const neighbors = parsed.adjacency_list[node] || [];

                      return (
                        <div key={node} className={`p-4 rounded-xl border-2 transition-all duration-300 ${cardStyle}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-white">Node {node}</span>
                            {statusBadge}
                          </div>
                          
                          <div className="text-xs space-y-2 mt-3">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-slate-500">Heuristic (h)</span>
                              <strong className="text-amber-400">{heuristicVal.toFixed(1)}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-1">Outbound Edges:</span>
                              {neighbors.length === 0 ? (
                                <span className="text-slate-600 italic">None</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {neighbors.map(([neighbor, cost], i) => (
                                    <span key={i} className="px-2 py-1 rounded bg-black/40 text-[10px] text-slate-300 border border-white/5">
                                      {neighbor} <span className="text-indigo-400">({cost})</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Path display breadcrumbs */}
                {result && result.path && isPlaybackComplete && (
                  <div className="mt-6 p-4 bg-slate-950/40 border border-white/5 rounded-xl">
                    <span className="text-xs text-slate-500 block mb-2">Optimal Reconstructed Path:</span>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
                      {pathNodes.map((n, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                            {n}
                          </span>
                          {i < pathNodes.length - 1 && <span className="text-slate-600">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Visual Legend */}
                <div className="flex flex-wrap gap-3 justify-center mt-6 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-emerald-500/50 bg-emerald-500/10 inline-block" />Start</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-rose-500/50 bg-rose-500/10 inline-block" />Goal</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-purple-500 bg-purple-500/20 inline-block" />Expanding</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-indigo-500/50 bg-indigo-500/10 inline-block" />Visited</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-amber-400 bg-amber-400/10 inline-block" />Optimal Path</span>
                </div>
              </div>
            );
          })()}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >
              {result.auto_selected && (
                <div className="glass-panel border-indigo-500/30 bg-indigo-500/10">
                  <h3 className="m-0 mb-4 text-indigo-400 font-semibold flex items-center gap-2">
                    ✨ Expert AI Advisor
                  </h3>
                  <div className="text-slate-200 mb-4">
                    Optimal Algorithm Selected: <strong className="text-emerald-400">{result.auto_selected}</strong>
                  </div>
                  {result.advisor_report && result.advisor_report.map((item, idx) => (
                    <div key={idx} className="mb-3 text-sm leading-relaxed">
                      <strong className="text-slate-300">{idx + 1}. {item.title}:</strong> <span className="text-slate-400">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="glass-panel border-blue-500/20">
                <h3 className="m-0 mb-4 text-blue-400 font-semibold flex items-center gap-2">
                  <Activity size={20} /> Execution Results
                </h3>
                
                {heuristicAnalysis && (
                  <div className="mb-4 flex gap-4">
                    <div className={`flex-1 p-2 rounded-lg text-center font-bold text-sm border ${heuristicAnalysis.admissible ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
                      Admissible: {heuristicAnalysis.admissible ? 'Yes' : 'No'}
                    </div>
                    <div className={`flex-1 p-2 rounded-lg text-center font-bold text-sm border ${heuristicAnalysis.consistent ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
                      Consistent: {heuristicAnalysis.consistent ? 'Yes' : 'No'}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">Nodes Expanded</span>
                    <strong className="block text-3xl text-blue-300 mt-1">{result.nodes_expanded}</strong>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">Path Cost</span>
                    <strong className="block text-3xl text-amber-300 mt-1">{result.cost}</strong>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">Path Length</span>
                    <strong className="block text-3xl text-purple-300 mt-1">{result.path ? result.path.length : '—'} steps</strong>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">Total Runtime</span>
                    <strong className="block text-2xl text-emerald-300 mt-1">{result.runtime.toFixed(4)}s</strong>
                  </div>
                </div>
              </div>

              <div className="glass-panel flex-1 flex flex-col min-h-[300px]">
                <h4 className="m-0 mb-4 text-slate-300 font-medium">Reasoning Trace Logs</h4>
                <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-blue-400/70 overflow-y-auto flex-1 max-h-[400px] border border-white/5 shadow-inner">
                  {result.trace.map((t, i) => (
                    <div key={i} className="py-1 border-b border-blue-500/10 last:border-0 hover:bg-white/5 hover:text-blue-300 transition-colors cursor-default">
                      <span className="text-slate-600 mr-2">[{String(i).padStart(3, '0')}]</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profiler Modal */}
      <AnimatePresence>
        {showProfiler && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-2xl w-full shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="m-0 text-2xl font-bold flex items-center gap-2 text-purple-400">
                  <Scale size={28} /> Algorithm Profiler
                </h2>
                <button onClick={() => setShowProfiler(false)} className="text-slate-400 hover:text-white transition-colors">
                  <Square size={24} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-center">
                  <span className="block text-sm text-slate-400 mb-1">Primary Algorithm</span>
                  <strong className="text-blue-400 text-lg">{algorithm}</strong>
                </div>
                <span className="font-bold text-slate-500">VS</span>
                <div className="flex-1">
                  <span className="block text-sm text-slate-400 mb-1 ml-1">Secondary Algorithm</span>
                  <select 
                    value={profilerAlgorithm} 
                    onChange={e => setProfilerAlgorithm(e.target.value)} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  >
                    <option value="A*">A* Search</option>
                    <option value="UCS">Uniform Cost Search</option>
                    <option value="Greedy">Greedy Best-First Search</option>
                    <option value="BFS">Breadth First Search (BFS)</option>
                    <option value="DFS">Depth First Search (DFS)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={runProfiler} 
                disabled={isProfiling}
                className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isProfiling ? <span className="animate-pulse">Profiling...</span> : 'Run Comparison'}
              </button>

              {profilerResult && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                      <h4 className="text-blue-400 m-0 mb-3">{profilerResult.algo1.name}</h4>
                      <div className="text-sm text-slate-300">Nodes: <strong className="text-white">{profilerResult.algo1.nodes}</strong></div>
                      <div className="text-sm text-slate-300">Cost: <strong className="text-white">{profilerResult.algo1.cost}</strong></div>
                      <div className="text-sm text-slate-300">Time: <strong className="text-white">{profilerResult.algo1.runtime.toFixed(4)}s</strong></div>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                      <h4 className="text-purple-400 m-0 mb-3">{profilerResult.algo2.name}</h4>
                      <div className="text-sm text-slate-300">Nodes: <strong className="text-white">{profilerResult.algo2.nodes}</strong></div>
                      <div className="text-sm text-slate-300">Cost: <strong className="text-white">{profilerResult.algo2.cost}</strong></div>
                      <div className="text-sm text-slate-300">Time: <strong className="text-white">{profilerResult.algo2.runtime.toFixed(4)}s</strong></div>
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-xl">
                    <h3 className="m-0 mb-3 text-indigo-400 flex items-center gap-2">
                      <Sparkles size={20} /> Claude's Analysis
                    </h3>
                    {profilerLLMReport ? (
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap m-0">
                        {profilerLLMReport}
                      </p>
                    ) : (
                      <div className="animate-pulse flex gap-2 items-center text-indigo-300/50">
                        <Activity size={16} /> Generating AI Report...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
