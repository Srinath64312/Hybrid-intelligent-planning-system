import { useState } from 'react'
import { Play, Pause, Square, FastForward, Calendar, AlertTriangle, CheckCircle, RefreshCw, Info, ChevronDown, ChevronUp, Bot, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'
import { anthropicClient } from '../anthropicClient'

export default function SchedulePanel() {
  const [relaxNewton, setRelaxNewton] = useState(false)
  const [relaxCohort, setRelaxCohort] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [showDomains, setShowDomains] = useState(true)
  
  useEffect(() => {
    let interval;
    if (isPlaying && result && result.visited_sequence && playbackIndex < result.visited_sequence.length) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => prev + 1);
      }, 700); // 700ms per step for timetable
    } else if (playbackIndex >= (result?.visited_sequence?.length || 0)) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackIndex, result]);

  // Explainability specific state
  const [expandedReport, setExpandedReport] = useState(null)

  // LLM Summarizer state
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropicApiKey') || '')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summary, setSummary] = useState(null)
  const [apiKeyError, setApiKeyError] = useState('')

  const handleApiKeyChange = (e) => {
    const key = e.target.value
    setApiKey(key)
    localStorage.setItem('anthropicApiKey', key)
    setApiKeyError('')
  }

  const handleSummarize = async () => {
    if (!apiKey) {
      setApiKeyError('Please provide your Anthropic API key to use Claude.')
      return
    }
    setIsSummarizing(true)
    setApiKeyError('')
    try {
      const resultText = await anthropicClient.summarizePlan(
        apiKey, 
        result, 
        "University Course Scheduling Constraint Satisfaction Problem (CSP)"
      )
      setSummary(resultText)
    } catch (err) {
      setApiKeyError(err.message)
    }
    setIsSummarizing(false)
  }

  const handleSolve = async () => {
    setLoading(true)
    setExpandedReport(null)
    setSummary(null)
    setApiKeyError('')
    setIsPlaying(false)
    setPlaybackIndex(0)
    try {
      const data = await pythonRunner.runSchedule(relaxNewton, relaxCohort)
      setResult(data)
      setIsPlaying(true)
    } catch (err) {
      console.error(err)
      alert("Failed to solve schedule CSP via Python solver.")
    }
    setLoading(false)
  }

  const resetTracer = () => {
    setIsPlaying(false)
    setPlaybackIndex(0)
  }

  const stepForward = () => {
    if (result && playbackIndex < result.visited_sequence.length) {
      setIsPlaying(false)
      setPlaybackIndex(prev => prev + 1)
    }
  }

  // Course Details
  const courseDetails = {
    "BIO101": { name: "Intro Biology Lab", prof: "Dr. Alan", color: "bg-purple-500" },
    "CHEM101": { name: "Intro Chemistry Lab", prof: "Dr. Grace", color: "bg-pink-500" },
    "PHYS101": { name: "Intro Physics Lecture", prof: "Dr. Newton", color: "bg-blue-500" }
  }

  const timeslots = [
    { id: "Tuesday_0900", label: "Tue 9:00 AM" },
    { id: "Wednesday_0900", label: "Wed 9:00 AM" },
    { id: "Wednesday_1100", label: "Wed 11:00 AM" }
  ]

  const rooms = [
    { id: "Lab_A_Wet", name: "Lab A (Wet Lab)" },
    { id: "Lecture_Hall_102", name: "Lecture Hall 102" }
  ]

  // Map assignments to slot-room grid
  const getAssignmentAt = (slotId, roomId) => {
    if (!result) return null
    
    // Determine the current state to show
    let currentAssignment = result.assignment
    let currentDomains = {}
    
    if (result.visited_sequence && playbackIndex > 0) {
      const step = result.visited_sequence[playbackIndex - 1]
      currentAssignment = step.assignment
      currentDomains = step.domains
    } else if (playbackIndex === 0) {
      currentAssignment = {}
      if (result.visited_sequence && result.visited_sequence.length > 0) {
        currentDomains = result.visited_sequence[0].domains
      }
    }

    const matches = []
    const prunedBy = []
    const availableFor = []

    if (currentAssignment) {
      for (const [course, val] of Object.entries(currentAssignment)) {
        const [assignedSlot, assignedRoom] = val
        if (assignedSlot === slotId && assignedRoom === roomId) {
          matches.push(course)
        }
      }
    }
    
    // Check domains for unassigned courses
    if (currentDomains && showDomains) {
      for (const course of Object.keys(courseDetails)) {
        if (!currentAssignment || !currentAssignment[course]) {
          const doms = currentDomains[course] || []
          // Check if this slot/room is in the domain
          const isValid = doms.some(d => d[0] === slotId && d[1] === roomId)
          if (isValid) {
            availableFor.push(course)
          } else {
            prunedBy.push(course)
          }
        }
      }
    }
    
    return { matches, prunedBy, availableFor }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto flex flex-col gap-8"
    >
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="bg-purple-500/20 p-3 rounded-xl">
          <Calendar size={32} className="text-purple-500" />
        </div>
        <div>
          <h1 className="m-0 text-3xl font-bold text-slate-200">University Scheduling CSP</h1>
          <p className="m-0 text-slate-400 mt-1">Solve the course scheduling conflict using Constraint Satisfaction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 border-purple-500/20">
            <h3 className="m-0 mb-4 text-purple-400 font-semibold flex items-center gap-2">Constraint Relaxations</h3>
            
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={relaxNewton} 
                  onChange={e => { setRelaxNewton(e.target.checked); setResult(null); }}
                  className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                />
                <div>
                  <strong className="text-slate-300 group-hover:text-purple-300 transition-colors">Relax Dr. Newton's Availability</strong>
                  <span className="block text-sm text-slate-500">Allow scheduling Physics on Tuesday morning (originally Wed only)</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={relaxCohort} 
                  onChange={e => { setRelaxCohort(e.target.checked); setResult(null); }}
                  className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                />
                <div>
                  <strong className="text-slate-300 group-hover:text-purple-300 transition-colors">Relax Cohort Corequisites</strong>
                  <span className="block text-sm text-slate-500">Allow Physics to run concurrently with Bio/Chem</span>
                </div>
              </label>

              <button 
                onClick={handleSolve} 
                disabled={loading}
                className={`mt-4 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-bold transition-all shadow-lg
                  ${loading 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-400 hover:to-indigo-500 hover:shadow-purple-500/25 hover:-translate-y-0.5'
                  }`}
              >
                <Play size={20} className={loading ? 'animate-pulse' : ''} /> 
                {loading ? 'Running CSP Solver...' : 'Solve Schedule'}
              </button>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="m-0 mb-6 text-slate-300 font-semibold">Visual Schedule Calendar</h3>
            
            <div className="grid grid-cols-[120px_1fr_1fr] gap-2 border-b border-white/10 pb-3 mb-3">
              <div className="font-bold text-slate-500 text-sm">Time / Day</div>
              {rooms.map(room => (
                <div key={room.id} className="font-bold text-indigo-400 text-sm text-center">{room.name}</div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {timeslots.map(slot => (
                <div key={slot.id} className="grid grid-cols-[120px_1fr_1fr] gap-3 items-center border-b border-white/5 pb-3">
                  <div className="font-semibold text-slate-300 text-sm">{slot.label}</div>
                  
                  {rooms.map(room => {
                    const data = getAssignmentAt(slot.id, room.id)
                    const assignedCourses = data ? data.matches : []
                    const prunedBy = data ? data.prunedBy : []
                    const availableFor = data ? data.availableFor : []
                    
                    const hasConflict = assignedCourses && assignedCourses.length > 1

                    return (
                      <div 
                        key={room.id} 
                        className={`min-h-[80px] rounded-xl flex flex-col gap-2 p-2 items-center justify-center border-2 transition-all duration-500 relative
                          ${hasConflict ? 'bg-red-500/10 border-red-500/50' : 'bg-black/20 border-white/5'}
                        `}
                      >
                        {assignedCourses && assignedCourses.map(course => {
                          const info = courseDetails[course]
                          return (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              key={course}
                              className={`${info.color} w-full text-white p-2 rounded-lg text-center shadow-lg relative z-10`}
                            >
                              <div className="font-bold text-sm">{course}</div>
                              <div className="text-xs opacity-90">{info.name}</div>
                              <div className="text-[0.7rem] opacity-75 mt-1 border-t border-white/20 pt-1">{info.prof}</div>
                            </motion.div>
                          )
                        })}
                        {(!assignedCourses || assignedCourses.length === 0) && (
                          <span className="text-slate-600 text-xs">Empty Slot</span>
                        )}
                        
                        {/* Domain Pruning Visualization */}
                        {showDomains && (!assignedCourses || assignedCourses.length === 0) && (
                          <div className="absolute inset-0 flex flex-wrap content-start p-1 gap-1 pointer-events-none">
                            {availableFor.map(c => (
                              <div key={c} className={`text-[0.6rem] font-bold px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`}>
                                {c}
                              </div>
                            ))}
                            {prunedBy.map(c => (
                              <div key={c} className={`text-[0.6rem] font-bold px-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 line-through opacity-50`}>
                                {c}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            
            {result && result.visited_sequence && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="mt-6 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg z-20 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-purple-400 font-bold">Domain Pruning Tracer</span>
                    <span className="text-slate-400">Step {playbackIndex} / {result.visited_sequence.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setShowDomains(!showDomains)} 
                      className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {showDomains ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showDomains ? "Hide Domain Pruning" : "Show Domain Pruning"}
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
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-purple-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(playbackIndex / result.visited_sequence.length) * 100}%` }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* LLM Summarizer API Key Input */}
          <div className="glass-panel p-6 border-indigo-500/20 bg-indigo-500/5">
            <h3 className="m-0 mb-3 text-indigo-400 font-semibold flex items-center gap-2">
              <Bot size={20} /> Anthropic LLM Integration
            </h3>
            <p className="text-sm text-slate-400 mb-4">Enter your Anthropic API Key (Claude) to generate plain-English summaries of the optimization runs. This is stored securely in your local browser.</p>
            <input 
              type="password" 
              placeholder="sk-ant-api03-..." 
              value={apiKey}
              onChange={handleApiKeyChange}
              className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Column: Explainability */}
        <div className="flex flex-col h-full">
          {!result ? (
            <div className="glass-panel flex-1 flex flex-col items-center justify-center text-slate-500 text-center p-12 border-dashed border-2 border-slate-700">
              <RefreshCw size={48} className="mb-4 opacity-30 animate-[spin_10s_linear_infinite]" />
              <h3 className="text-xl text-slate-400 mb-2">Awaiting Solver Execution</h3>
              <p className="max-w-xs text-sm">Select constraint settings and run the CSP solver to generate an Explainability Report.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >
              {result.assignment ? (
                <div className="glass-panel bg-emerald-500/10 border-emerald-500/30 flex gap-4 p-6">
                  <CheckCircle className="text-emerald-400 shrink-0" size={32} />
                  <div>
                    <h3 className="m-0 mb-1 text-emerald-400 text-xl font-bold">Valid Schedule Found!</h3>
                    <p className="m-0 text-slate-300 text-sm leading-relaxed">
                      The solver successfully satisfied all core constraints and applied relaxations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="glass-panel bg-red-500/10 border-red-500/30 flex gap-4 p-6">
                  <AlertTriangle className="text-red-400 shrink-0" size={32} />
                  <div>
                    <h3 className="m-0 mb-1 text-red-400 text-xl font-bold">Deadlock Encountered</h3>
                    <p className="m-0 text-slate-300 text-sm leading-relaxed mb-3">
                      No valid schedule exists. The solver exhausted all possibilities due to conflicting hard constraints.
                    </p>
                  </div>
                </div>
              )}

              {/* Explainability Dashboard */}
              <div className="glass-panel border-blue-500/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="m-0 text-blue-400 font-semibold flex items-center gap-2">
                    <Info size={20} /> Explainability Dashboard
                  </h3>
                </div>
                
                <p className="text-sm text-slate-400 mb-4">Why was this schedule chosen (or rejected)? Below are the constraint evaluations during the solver's execution path.</p>

                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.explainability_reports && result.explainability_reports.map((report, idx) => (
                    <div key={idx} className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                      <div 
                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${report.passed ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'}`}
                        onClick={() => setExpandedReport(expandedReport === idx ? null : idx)}
                      >
                        <div className="flex flex-col">
                          <strong className="text-slate-200">Attempted: {report.variable}</strong>
                          <span className="text-xs text-slate-400">Value: {report.value.join(' @ ')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-500">Bayesian Prob</span>
                            <span className={`font-mono font-bold ${report.probability > 0.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {(report.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                          {expandedReport === idx ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedReport === idx && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-black/40 p-4 border-t border-white/5 flex flex-col gap-2"
                          >
                            {report.details.map((d, dIdx) => (
                              <div key={dIdx} className="flex items-start gap-2 text-sm">
                                {d.passed ? <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />}
                                <div>
                                  <strong className={d.passed ? 'text-slate-300' : 'text-red-300'}>{d.name}</strong>
                                  <span className="text-slate-400 block text-xs mt-0.5">{d.reason}</span>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* LLM Summary Display */}
              <div className="glass-panel border-indigo-500/20 bg-indigo-500/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="m-0 text-indigo-400 font-semibold flex items-center gap-2">
                    <Bot size={20} /> AI Plan Summary
                  </h3>
                  <button 
                    onClick={handleSummarize}
                    disabled={isSummarizing || loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    {isSummarizing ? 'Generating...' : 'Summarize with Claude'}
                  </button>
                </div>
                
                {apiKeyError && (
                  <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {apiKeyError}
                  </div>
                )}

                {summary ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-slate-300 leading-relaxed text-sm bg-black/30 p-5 rounded-xl border border-indigo-500/20 shadow-inner"
                  >
                    {summary}
                  </motion.div>
                ) : (
                  <div className="text-slate-500 text-sm text-center py-6 border-2 border-dashed border-slate-700 rounded-xl">
                    Click "Summarize with Claude" to generate a plain-English explanation of this schedule.
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
