import { useState, useEffect } from 'react'
import { Brain, Grid, CalendarDays, Gamepad2, Activity, Lightbulb, Home, MessageSquare, Loader2, AlertTriangle } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('home')
  const [pyStatus, setPyStatus] = useState('initializing') // 'initializing', 'ready', 'error'
  const [pyStatusMessage, setPyStatusMessage] = useState('Loading Python WebAssembly runtime...')

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
    { id: 'home', icon: Home, label: 'Home Dashboard' },
    { id: 'search', icon: Grid, label: 'Search Engine (Maze)' },
    { id: 'csp', icon: CalendarDays, label: 'CSP Engine (N-Queens)' },
    { id: 'game', icon: Gamepad2, label: 'Game AI (Tic-Tac-Toe)' },
    { id: 'bayes', icon: Activity, label: 'Probabilistic (Diagnosis)' },
    { id: 'advisor', icon: Lightbulb, label: 'Advisor (Expert Systems)' },
    { id: 'schedule', icon: CalendarDays, label: 'Scheduling CSP' }
  ]

  if (pyStatus !== 'ready') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: '#0f172a',
        backgroundImage: 'radial-gradient(at 50% 50%, #1e1b4b 0%, #0f172a 100%)',
        color: '#e2e8f0',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div className="glass-panel" style={{
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(168, 85, 247, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain size={48} color="#a855f7" className={pyStatus === 'initializing' ? 'pulse' : ''} />
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              background: 'linear-gradient(to right, #a855f7, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              HIPS Platform
            </h1>
          </div>
          
          {pyStatus === 'initializing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              <div style={{ animation: 'spin 1.5s linear infinite', color: '#6366f1' }}>
                <Loader2 size={36} />
              </div>
              <p style={{ margin: 0, fontSize: '1.1rem', color: '#cbd5e1', fontWeight: 500 }}>
                {pyStatusMessage}
              </p>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Running Python directly in your browser using WebAssembly. This first-time download may take 5-10 seconds.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              <AlertTriangle size={48} color="#ef4444" />
              <h3 style={{ margin: 0, color: '#ef4444' }}>Initialization Failed</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8', wordBreak: 'break-word' }}>
                {pyStatusMessage}
              </p>
              <button className="btn" onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>
                Retry Loading
              </button>
            </div>
          )}
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .pulse {
            animation: pulse 2s infinite ease-in-out;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '280px', margin: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Brain color="#a855f7" size={32} />
          <h2 style={{ margin: 0, fontSize: '1.2rem', background: 'linear-gradient(to right, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HIPS Platform
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px',
                background: activeTab === tab.id ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'rgba(168, 85, 247, 0.3)' : 'transparent'}`,
                color: activeTab === tab.id ? '#c084fc' : 'rgba(255,255,255,0.7)',
                borderRadius: '8px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '20px 20px 20px 0', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ minHeight: 'calc(100vh - 80px)' }}>
          {activeTab === 'home' && <HomePanel setActiveTab={setActiveTab} />}
          {activeTab === 'search' && <SearchPanel />}
          {activeTab === 'csp' && <CspPanel />}
          {activeTab === 'game' && <GamePanel />}
          {activeTab === 'bayes' && <BayesPanel />}
          {activeTab === 'advisor' && <AdvisorPanel />}
          {activeTab === 'schedule' && <SchedulePanel />}
        </div>
      </div>
    </div>
  )
}

export default App
