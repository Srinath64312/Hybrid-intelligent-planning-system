import { useState, useEffect } from 'react'
import { Play, Sliders, Activity, Percent, Database, HelpCircle, Eye, RefreshCw, Info, Edit3, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'

const PRESETS = {
  medical: {
    name: 'Medical Diagnosis',
    description: 'A network demonstrating diagnostic reasoning: smokes/flu causing coughing and sore throat.',
    queryVar: 'Flu',
    selectedNode: 'Flu',
    evidence: {
      Cough: true,
      SoreThroat: true
    },
    cpts: {
      Flu: {
        parents: [],
        table: { '': 0.05 }
      },
      Smokes: {
        parents: [],
        table: { '': 0.20 }
      },
      SoreThroat: {
        parents: ['Flu'],
        table: { 'true': 0.60, 'false': 0.05 }
      },
      Cough: {
        parents: ['Flu', 'Smokes'],
        table: {
          'true,true': 0.90,
          'true,false': 0.70,
          'false,true': 0.40,
          'false,false': 0.10
        }
      }
    },
    nodeLayout: {
      Smokes: { x: 150, y: 80, label: 'Smokes', color: '#f59e0b' },
      Flu: { x: 380, y: 80, label: 'Flu', color: '#c084fc' },
      Cough: { x: 265, y: 230, label: 'Cough', color: '#38bdf8' },
      SoreThroat: { x: 490, y: 230, label: 'Sore Throat', color: '#10b981' }
    },
    edges: [
      { from: 'Smokes', to: 'Cough' },
      { from: 'Flu', to: 'Cough' },
      { from: 'Flu', to: 'SoreThroat' }
    ]
  },
  sprinkler: {
    name: 'Grass Wetness (Sprinkler)',
    description: 'A network analyzing rain and sprinkler settings: cloudy sky causing rain and sprinkler use, both leading to wet grass.',
    queryVar: 'Cloudy',
    selectedNode: 'Cloudy',
    evidence: {
      WetGrass: true
    },
    cpts: {
      Cloudy: {
        parents: [],
        table: { '': 0.50 }
      },
      Sprinkler: {
        parents: ['Cloudy'],
        table: { 'true': 0.10, 'false': 0.50 }
      },
      Rain: {
        parents: ['Cloudy'],
        table: { 'true': 0.80, 'false': 0.20 }
      },
      WetGrass: {
        parents: ['Sprinkler', 'Rain'],
        table: {
          'true,true': 0.99,
          'true,false': 0.90,
          'false,true': 0.90,
          'false,false': 0.01
        }
      }
    },
    nodeLayout: {
      Cloudy: { x: 320, y: 60, label: 'Cloudy', color: '#c084fc' },
      Sprinkler: { x: 180, y: 165, label: 'Sprinkler', color: '#f59e0b' },
      Rain: { x: 460, y: 165, label: 'Rain', color: '#38bdf8' },
      WetGrass: { x: 320, y: 270, label: 'Wet Grass', color: '#10b981' }
    },
    edges: [
      { from: 'Cloudy', to: 'Sprinkler' },
      { from: 'Cloudy', to: 'Rain' },
      { from: 'Sprinkler', to: 'WetGrass' },
      { from: 'Rain', to: 'WetGrass' }
    ]
  },
  alarm: {
    name: 'Burglary Alarm',
    description: 'A classic network about a burglary/earthquake alarm: John or Mary calling when the alarm rings.',
    queryVar: 'Burglary',
    selectedNode: 'Burglary',
    evidence: {
      Alarm: true
    },
    cpts: {
      Burglary: {
        parents: [],
        table: { '': 0.02 }
      },
      Earthquake: {
        parents: [],
        table: { '': 0.05 }
      },
      Alarm: {
        parents: ['Burglary', 'Earthquake'],
        table: {
          'true,true': 0.95,
          'true,false': 0.94,
          'false,true': 0.29,
          'false,false': 0.001
        }
      },
      JohnCalls: {
        parents: ['Alarm'],
        table: { 'true': 0.90, 'false': 0.05 }
      },
      MaryCalls: {
        parents: ['Alarm'],
        table: { 'true': 0.70, 'false': 0.01 }
      }
    },
    nodeLayout: {
      Burglary: { x: 180, y: 60, label: 'Burglary', color: '#f59e0b' },
      Earthquake: { x: 420, y: 60, label: 'Earthquake', color: '#c084fc' },
      Alarm: { x: 300, y: 155, label: 'Alarm', color: '#38bdf8' },
      JohnCalls: { x: 180, y: 260, label: 'John Calls', color: '#10b981' },
      MaryCalls: { x: 420, y: 260, label: 'Mary Calls', color: '#ec4899' }
    },
    edges: [
      { from: 'Burglary', to: 'Alarm' },
      { from: 'Earthquake', to: 'Alarm' },
      { from: 'Alarm', to: 'JohnCalls' },
      { from: 'Alarm', to: 'MaryCalls' }
    ]
  }
}

export default function BayesPanel() {
  const [peas, setPeas] = useState(null)
  const [activePresetKey, setActivePresetKey] = useState('medical')

  const activePreset = PRESETS[activePresetKey]

  const [cpts, setCpts] = useState(activePreset.cpts)
  const [selectedNode, setSelectedNode] = useState(activePreset.selectedNode)
  const [evidence, setEvidence] = useState(activePreset.evidence)
  const [queryVar, setQueryVar] = useState(activePreset.queryVar)

  // CPT editing temporary states
  const [editValues, setEditValues] = useState({})

  // Results
  const [exactResult, setExactResult] = useState(null)
  const [samplingResult, setSamplingResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Sample size for Rejection Sampling
  const [numSamples, setNumSamples] = useState(5000)

  useEffect(() => {
    pythonRunner.getPeas('Bayes')
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  // Sync temporary edit state with active node CPT
  useEffect(() => {
    if (selectedNode && cpts[selectedNode]) {
      setEditValues({ ...cpts[selectedNode].table })
    }
  }, [selectedNode, cpts])

  // Coordinate mapping for nodes in visual SVG network
  const nodeLayout = activePreset.nodeLayout

  const handlePresetChange = (presetKey) => {
    setActivePresetKey(presetKey)
    const preset = PRESETS[presetKey]
    setCpts(preset.cpts)
    setSelectedNode(preset.selectedNode)
    setEvidence(preset.evidence)
    setQueryVar(preset.queryVar)
    setExactResult(null)
    setSamplingResult(null)
  }


  // Handle evidence toggling
  const handleToggleEvidence = (nodeName, val) => {
    // Cannot set evidence on query variable
    if (nodeName === queryVar) return;
    
    setEvidence(prev => {
      const copy = { ...prev }
      if (val === null) {
        delete copy[nodeName]
      } else {
        copy[nodeName] = val
      }
      return copy
    })
  }

  // Handle query variable setting
  const handleSetQuery = (nodeName) => {
    // Remove query node from evidence
    setEvidence(prev => {
      const copy = { ...prev }
      delete copy[nodeName]
      return copy
    })
    setQueryVar(nodeName)
  }

  // Handle CPT value changes
  const handleEditValChange = (key, val) => {
    const floatVal = parseFloat(val)
    if (isNaN(floatVal) || floatVal < 0 || floatVal > 1) return;
    setEditValues(prev => ({
      ...prev,
      [key]: floatVal
    }))
  }

  // Save edits back to CPT state
  const handleSaveCpt = () => {
    setCpts(prev => ({
      ...prev,
      [selectedNode]: {
        ...prev[selectedNode],
        table: { ...editValues }
      }
    }))
  }

  // Run Exact and Rejection Sampling side-by-side
  const handleSolve = async () => {
    setLoading(true)
    setExactResult(null)
    setSamplingResult(null)
    try {
      // 1. Run Exact Inference
      const exactData = await pythonRunner.runBayes("Exact Enumeration", queryVar, evidence, cpts)
      if (exactData.error) {
        console.error("Exact inference failed in Python:", exactData.error, exactData.traceback)
        alert("Python Exact Inference Error: " + exactData.error)
        setLoading(false)
        return
      }
      setExactResult(exactData)
      
      // 2. Run Rejection Sampling
      const samplingData = await pythonRunner.runBayes("Rejection Sampling", queryVar, evidence, cpts, numSamples)
      if (samplingData.error) {
        console.error("Sampling inference failed in Python:", samplingData.error, samplingData.traceback)
        alert("Python Sampling Inference Error: " + samplingData.error)
        setLoading(false)
        return
      }
      setSamplingResult(samplingData)
    } catch (err) {
      console.error(err)
      alert("Failed to compute Bayesian inference via Python.")
    }
    setLoading(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/20 p-3 rounded-xl">
            <Activity size={32} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="m-0 text-3xl font-bold text-slate-200">Bayesian Network Suite</h1>
            <p className="m-0 text-slate-400 mt-1">Belief Propagation & Diagnostic Inference Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs text-slate-500 font-bold uppercase whitespace-nowrap">Network Preset:</label>
          <select 
            value={activePresetKey} 
            onChange={e => handlePresetChange(e.target.value)}
            className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-all"
          >
            <option value="medical">Medical Diagnosis</option>
            <option value="sprinkler">Grass Wetness (Sprinkler)</option>
            <option value="alarm">Burglary Alarm</option>
          </select>
        </div>
      </div>

      {/* PEAS Analysis */}
      {peas && (
        <div className="glass-panel p-5 border-indigo-500/20 bg-indigo-500/5">
          <h3 className="m-0 mb-3 text-indigo-400 font-bold flex items-center gap-2"><Database size={20} /> PEAS Model Description</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-300">
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong>Performance:</strong> {peas.performance}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong>Environment:</strong> {peas.environment}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong>Actuators:</strong> {peas.actuators}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong>Sensors:</strong> {peas.sensors}</div>
          </div>
        </div>
      )}

      {/* Visual Canvas and CPT Editor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Visual DAG Network Builder Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-panel p-6 border-indigo-500/20 flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center">
              <h3 className="m-0 text-slate-200 font-bold flex items-center gap-2"><Eye size={20} className="text-indigo-400" /> Interactive Network Diagram</h3>
              <span className="text-xs text-slate-400">Click a node to edit CPT, select query or set evidence</span>
            </div>
            
            <div className="relative bg-black/40 rounded-xl p-4 border border-white/5 flex items-center justify-center min-h-[350px]">
              <svg width="600" height="320" className="overflow-visible select-none max-w-full">
                <defs>
                  {/* Arrow markers for edges */}
                  <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
                  </marker>
                  
                  {/* Glowing effects */}
                  <filter id="glow-gold">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Edges (Arrows) */}
                {activePreset.edges.map((edge, idx) => {
                  const fromNode = nodeLayout[edge.from];
                  const toNode = nodeLayout[edge.to];
                  if (!fromNode || !toNode) return null;
                  return (
                    <line 
                      key={idx}
                      x1={fromNode.x} y1={fromNode.y} 
                      x2={toNode.x} y2={toNode.y} 
                      stroke="#6366f1" strokeWidth="2.5" markerEnd="url(#arrow)"
                    />
                  );
                })}
                
                {/* Nodes rendering */}
                {Object.entries(nodeLayout).map(([name, pos]) => {
                  const isSelected = selectedNode === name;
                  const isQuery = queryVar === name;
                  const isTrueEv = evidence[name] === true;
                  const isFalseEv = evidence[name] === false;
                  
                  let glowColor = 'transparent';
                  let strokeColor = '#475569';
                  if (isSelected) strokeColor = '#818cf8';
                  if (isQuery) { strokeColor = '#f59e0b'; glowColor = '#f59e0b'; }
                  else if (isTrueEv) { strokeColor = '#10b981'; }
                  else if (isFalseEv) { strokeColor = '#ef4444'; }
                  
                  return (
                    <g 
                      key={name} 
                      transform={`translate(${pos.x}, ${pos.y})`} 
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(name)}
                    >
                      {/* Glow for Query */}
                      {isQuery && (
                        <circle r={35} fill="rgba(245, 158, 11, 0.1)" filter="url(#glow-gold)" stroke="#f59e0b" strokeWidth={1} />
                      )}
                      
                      {/* Main Circle */}
                      <circle 
                        r={30} 
                        fill={isTrueEv ? 'rgba(16, 185, 129, 0.15)' : isFalseEv ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.8)'}
                        stroke={strokeColor} 
                        strokeWidth={isSelected || isQuery ? 3.5 : 2} 
                        className="transition-all duration-300"
                      />
                      
                      {/* Text label */}
                      <text 
                        textAnchor="middle" 
                        alignmentBaseline="middle" 
                        fill="#f8fafc" 
                        className="text-xs font-bold pointer-events-none"
                        y={-2}
                      >
                        {pos.label}
                      </text>
                      
                      {/* State Badge indicator */}
                      <g transform="translate(0, 16)">
                        <rect 
                          x={-24} y={-6} width={48} height={12} rx={3} 
                          fill={isQuery ? '#f59e0b' : isTrueEv ? '#10b981' : isFalseEv ? '#ef4444' : '#334155'} 
                        />
                        <text 
                          textAnchor="middle" alignmentBaseline="middle" 
                          fill={isQuery ? '#000' : '#fff'} 
                          className="text-[8px] font-mono font-black"
                          y={-0.5}
                        >
                          {isQuery ? 'QUERY' : isTrueEv ? 'EVD: T' : isFalseEv ? 'EVD: F' : 'UNOBS'}
                        </text>
                      </g>
                    </g>
                  )
                })}
              </svg>
            </div>
            
            {/* Quick evidence toolbar for selected node */}
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-bold uppercase">Actions for: <strong className="text-indigo-400">{selectedNode}</strong></span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSetQuery(selectedNode)}
                  disabled={queryVar === selectedNode}
                  className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/20 disabled:text-amber-500/40 text-black px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer"
                >
                  Set as Query
                </button>
                <button 
                  onClick={() => handleToggleEvidence(selectedNode, true)}
                  disabled={queryVar === selectedNode}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Set Evid: True
                </button>
                <button 
                  onClick={() => handleToggleEvidence(selectedNode, false)}
                  disabled={queryVar === selectedNode}
                  className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Set Evid: False
                </button>
                <button 
                  onClick={() => handleToggleEvidence(selectedNode, null)}
                  disabled={queryVar === selectedNode || evidence[selectedNode] === undefined}
                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Clear Evidence
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* CPT inspector & edit form */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-6 border-indigo-500/20 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-2 text-slate-200 font-bold mb-4">
                <Sliders size={20} className="text-indigo-400" />
                <h3>CPT Inspector: <strong className="text-indigo-400">{selectedNode}</strong></h3>
              </div>
              
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Conditional Probability Tables dictate the dependency weights. You can modify these probabilities (0.0 to 1.0) and save them to re-run the engine.
              </p>
              
              <div className="bg-black/35 rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-xs font-bold text-slate-400">
                      {cpts[selectedNode].parents.map(p => (
                        <th key={p} className="p-3">{p}</th>
                      ))}
                      <th className="p-3 text-right">P({selectedNode} = True)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(editValues).map(([key, prob]) => {
                      const conditions = key === '' ? [] : key.split(',')
                      return (
                        <tr key={key} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          {conditions.map((cond, idx) => (
                            <td key={idx} className="p-3 font-mono text-xs">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cond === 'true' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                                {cond === 'true' ? 'True' : 'False'}
                              </span>
                            </td>
                          ))}
                          <td className="p-3 text-right">
                            <input 
                              type="number" step="0.05" min="0" max="1" 
                              value={prob}
                              onChange={e => handleEditValChange(key, e.target.value)}
                              className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs w-20 text-right text-indigo-300 focus:border-indigo-500 outline-none"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <button 
              onClick={handleSaveCpt}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs mt-6 transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
            >
              Save CPT Weights
            </button>
          </div>
        </div>

      </div>

      {/* Query Trigger & Setup Overview */}
      <div className="glass-panel p-6 border-indigo-500/20 bg-gradient-to-r from-black/40 to-indigo-950/10 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-xl font-bold text-slate-200">
            Active Query: <strong className="text-amber-400">P({queryVar} = True | Evidence)</strong>
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-400 mt-1">
            <span>Evidence:</span>
            {Object.keys(evidence).length === 0 ? (
              <span className="text-slate-500 italic">None (Prior Distribution)</span>
            ) : (
              Object.entries(evidence).map(([k, v]) => (
                <span key={k} className={`px-2 py-0.5 rounded ${v ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {k} = {v ? 'True' : 'False'}
                </span>
              ))
            )}
          </div>
          
          {/* Sample Size selector for sampling comparisons */}
          <div className="flex items-center gap-3 mt-2">
            <label className="text-xs text-slate-500">Rejection Sample Size:</label>
            <select 
              value={numSamples} 
              onChange={e => setNumSamples(parseInt(e.target.value))}
              className="bg-black/50 border border-slate-800 rounded px-3 py-1 text-xs text-slate-300 focus:border-indigo-500 outline-none"
            >
              <option value="1000">1,000 samples</option>
              <option value="5000">5,000 samples</option>
              <option value="10000">10,000 samples</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={handleSolve} disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 text-black px-8 py-4 rounded-xl font-black flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] cursor-pointer whitespace-nowrap"
        >
          <Play size={20} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Performing Inference...' : 'Compute Posterior Distribution'}
        </button>
      </div>

      {/* Side-by-Side Results Display */}
      <AnimatePresence>
        {exactResult && samplingResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Exact Inference Card */}
            <div className="glass-panel border-emerald-500/20 bg-emerald-950/5 p-6 flex flex-col justify-between">
              <div>
                <h3 className="m-0 mb-4 text-emerald-400 font-bold flex items-center gap-2"><Percent size={20} /> Exact Enumeration</h3>
                <div className="bg-black/35 p-5 rounded-xl border border-white/5 flex flex-col gap-4 items-center text-center shadow-inner">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Exact Posterior P({queryVar}=T | Evd)</span>
                  <strong className="text-4xl text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                    {(exactResult.posterior_prob * 100).toFixed(4)}%
                  </strong>
                  <span className="text-xs text-slate-400">Solved via exhaustive evaluation of full joint distribution</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Execution Cost</span>
                    <strong className="block text-md text-slate-300 mt-1">{exactResult.runtime.toFixed(6)}s</strong>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Time Complexity</span>
                    <strong className="block text-md text-amber-500 mt-1">O(2^N) Exponential</strong>
                  </div>
                </div>
              </div>

              {/* Exact Trace Logs */}
              <div className="flex flex-col gap-3 mt-6">
                <h4 className="m-0 text-slate-400 text-xs font-bold uppercase tracking-wider">Exact Solver Trace</h4>
                <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-slate-400 border border-white/5 max-h-[150px] overflow-y-auto custom-scrollbar">
                  {exactResult.trace.map((t, idx) => (
                    <div key={idx} className="py-1 border-b border-white/5 last:border-0">{t}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rejection Sampling Card */}
            <div className="glass-panel border-indigo-500/20 bg-indigo-950/5 p-6 flex flex-col justify-between">
              <div>
                <h3 className="m-0 mb-4 text-indigo-400 font-bold flex items-center gap-2"><Activity size={20} /> Rejection Sampling (N={numSamples})</h3>
                <div className="bg-black/35 p-5 rounded-xl border border-white/5 flex flex-col gap-4 items-center text-center shadow-inner">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Empirical Posterior P({queryVar}=T | Evd)</span>
                  <strong className="text-4xl text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                    {(samplingResult.posterior_prob * 100).toFixed(4)}%
                  </strong>
                  <span className="text-xs text-slate-400">Estimated using prior sampling + sample rejection clearing</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Execution Cost</span>
                    <strong className="block text-md text-slate-300 mt-1">{samplingResult.runtime.toFixed(6)}s</strong>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Inference Error Rate</span>
                    <strong className="block text-md text-rose-400 mt-1">
                      {Math.abs((samplingResult.posterior_prob - exactResult.posterior_prob) * 100).toFixed(4)}% Diff
                    </strong>
                  </div>
                </div>
              </div>

              {/* Rejection Trace Logs */}
              <div className="flex flex-col gap-3 mt-6">
                <h4 className="m-0 text-slate-400 text-xs font-bold uppercase tracking-wider">Sampling Solver Trace</h4>
                <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-slate-400 border border-white/5 max-h-[150px] overflow-y-auto custom-scrollbar">
                  {samplingResult.trace.map((t, idx) => (
                    <div key={idx} className="py-1 border-b border-white/5 last:border-0">{t}</div>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
