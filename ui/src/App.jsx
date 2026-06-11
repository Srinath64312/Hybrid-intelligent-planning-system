import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Grid, CalendarDays, Gamepad2, Activity, Lightbulb, Home, Loader2, AlertTriangle } from 'lucide-react'
import { pythonRunner } from './pythonRunner'
import SearchPanel from './components/SearchPanel'
import CspPanel from './components/CspPanel'
import GamePanel from './components/GamePanel'
import BayesPanel from './components/BayesPanel'
import AdvisorPanel from './components/AdvisorPanel'
import HomePanel from './components/HomePanel'
import SchedulePanel from './components/SchedulePanel'
import './index.css'

function App() {
  const [pyStatus, setPyStatus] = useState('initializing')
  const [pyStatusMessage, setPyStatusMessage] = useState('Loading Python WebAssembly runtime...')
  const location = useLocation()

  useEffect(() => {
    pythonRunner.initialize((msg) => {
      setPyStatusMessage(msg);
      if (msg === 'Ready') {
        setPyStatus('ready');
      } else if (msg.startsWith('Error:')) {
        setPyStatus('error');
      }
    }).catch(err => {
      setPyStatus('error');
      setPyStatusMessage(err.message || 'Failed to initialize Python environment.');
    });
  }, []);

  const tabs = [
    { id: 'home', path: '/home', icon: Home, label: 'Home Dashboard' },
    { id: 'search', path: '/search', icon: Grid, label: 'Search Engine (Maze)' },
    { id: 'csp', path: '/csp', icon: CalendarDays, label: 'CSP Engine (N-Queens)' },
    { id: 'game', path: '/game', icon: Gamepad2, label: 'Game AI (Tic-Tac-Toe)' },
    { id: 'bayes', path: '/bayes', icon: Activity, label: 'Probabilistic (Diagnosis)' },
    { id: 'advisor', path: '/advisor', icon: Lightbulb, label: 'Advisor (Expert Systems)' },
    { id: 'schedule', path: '/schedule', icon: CalendarDays, label: 'Scheduling CSP' }
  ]

  if (pyStatus !== 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full text-slate-200 p-5 box-border bg-transparent">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel max-w-lg w-full text-center p-10 flex flex-col items-center gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-purple-500/20 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <motion.div animate={pyStatus === 'initializing' ? { scale: [1, 1.1, 1], opacity: [1, 0.7, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}>
              <Brain size={48} className="text-purple-500" />
            </motion.div>
            <h1 className="m-0 text-3xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              HIPS Platform
            </h1>
          </div>
          
          {pyStatus === 'initializing' ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="text-indigo-500">
                <Loader2 size={36} />
              </motion.div>
              <p className="m-0 text-lg text-slate-300 font-medium">
                {pyStatusMessage}
              </p>
              <span className="text-sm text-slate-500">
                Running Python directly in your browser using WebAssembly. This first-time download may take 5-10 seconds.
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <AlertTriangle size={48} className="text-red-500" />
              <h3 className="m-0 text-red-500 font-bold text-xl">Initialization Failed</h3>
              <p className="m-0 text-[0.95rem] text-slate-400 break-words">
                {pyStatusMessage}
              </p>
              <button className="btn mt-2" onClick={() => window.location.reload()}>
                Retry Loading
              </button>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden text-slate-200 bg-transparent">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="glass-panel w-72 m-5 flex flex-col gap-5 border border-white/5 rounded-2xl shadow-xl z-10 p-5"
      >
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <Brain className="text-purple-500" size={32} />
          <h2 className="m-0 text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
            HIPS Platform
          </h2>
        </div>
        
        <div className="flex flex-col gap-2">
          {tabs.map(tab => (
            <NavLink 
              key={tab.id}
              to={tab.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300
                ${isActive 
                  ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400 font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                  : 'border border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <tab.icon size={20} />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 pl-0 overflow-y-auto">
        <div className="glass-panel min-h-[calc(100vh-40px)] rounded-2xl relative border border-white/5 shadow-2xl overflow-hidden p-0">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePanel />} />
              <Route path="/search" element={<SearchPanel />} />
              <Route path="/csp" element={<CspPanel />} />
              <Route path="/game" element={<GamePanel />} />
              <Route path="/bayes" element={<BayesPanel />} />
              <Route path="/advisor" element={<AdvisorPanel />} />
              <Route path="/schedule" element={<SchedulePanel />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default App
