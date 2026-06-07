import { useState } from 'react'
import { Brain, Grid, CalendarDays, Gamepad2, Activity, Lightbulb, Home, MessageSquare } from 'lucide-react'
import SearchPanel from './components/SearchPanel'
import CspPanel from './components/CspPanel'
import GamePanel from './components/GamePanel'
import BayesPanel from './components/BayesPanel'
import AdvisorPanel from './components/AdvisorPanel'
import HomePanel from './components/HomePanel'
import RouterPanel from './components/RouterPanel'
import SchedulePanel from './components/SchedulePanel'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  const tabs = [
    { id: 'home', icon: Home, label: 'Home Dashboard' },
    { id: 'search', icon: Grid, label: 'Search Engine (Maze)' },
    { id: 'csp', icon: CalendarDays, label: 'CSP Engine (N-Queens)' },
    { id: 'game', icon: Gamepad2, label: 'Game AI (Tic-Tac-Toe)' },
    { id: 'bayes', icon: Activity, label: 'Probabilistic (Diagnosis)' },
    { id: 'advisor', icon: Lightbulb, label: 'Advisor (Expert Systems)' },
    { id: 'router', icon: MessageSquare, label: 'NLP Query Router' },
    { id: 'schedule', icon: CalendarDays, label: 'Scheduling CSP' }
  ]

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
          {activeTab === 'router' && <RouterPanel />}
          {activeTab === 'schedule' && <SchedulePanel />}
        </div>
      </div>
    </div>
  )
}

export default App
