import { Brain, Grid, CalendarDays, Gamepad2, Activity, Lightbulb, ChevronRight, Calendar } from 'lucide-react'

export default function HomePanel({ setActiveTab }) {
  const modules = [
    { id: 'search', title: 'Search Engine', icon: Grid, color: '#3b82f6', desc: 'Pathfinding in 2D grids using BFS, DFS, and A*.' },
    { id: 'csp', title: 'Constraint Satisfaction', icon: CalendarDays, color: '#f59e0b', desc: 'Solving the N-Queens problem using Backtracking.' },
    { id: 'schedule', title: 'University Scheduling', icon: Calendar, color: '#8b5cf6', desc: 'Constraint Satisfaction Problem (CSP) solver for resolving class and room conflicts.' },
    { id: 'game', title: 'Adversarial Game AI', icon: Gamepad2, color: '#ef4444', desc: 'Tic-Tac-Toe agent with Minimax & Alpha-Beta Pruning.' },
    { id: 'bayes', title: 'Probabilistic Reasoning', icon: Activity, color: '#10b981', desc: 'Medical diagnosis using Bayesian Networks.' },
    { id: 'advisor', title: 'Expert AI Advisor', icon: Lightbulb, color: '#ec4899', desc: 'Algorithmic recommendations based on graph traits.' }
  ]

  return (
    <div style={{ padding: '20px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px', marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '20px', borderRadius: '50%', boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)' }}>
            <Brain size={64} color="#c084fc" />
          </div>
        </div>
        <h1 style={{ fontSize: '3em', margin: '0 0 10px 0', background: 'linear-gradient(to right, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Hybrid Intelligent Problem Solver (HIPS)
        </h1>
        <p style={{ fontSize: '1.2em', color: '#94a3b8', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
          A comprehensive artificial intelligence suite demonstrating core academic algorithms.
          Navigate through the modules below to interact with Graph Search, Constraint Satisfaction, Game Theory, and Probabilistic Models.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {modules.map((mod) => (
          <div 
            key={mod.id}
            onClick={() => setActiveTab(mod.id)}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: '16px',
              padding: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.border = `1px solid ${mod.color}`
              e.currentTarget.style.boxShadow = `0 10px 20px rgba(0,0,0,0.3), 0 0 15px ${mod.color}33`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ background: `${mod.color}22`, padding: '12px', borderRadius: '12px' }}>
                <mod.icon size={28} color={mod.color} />
              </div>
              <ChevronRight color="rgba(255,255,255,0.3)" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '1.3em' }}>{mod.title}</h3>
              <p style={{ margin: 0, color: '#94a3b8', lineHeight: '1.5' }}>{mod.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#64748b', fontSize: '0.9em' }}>
        Built for Advanced AI Coursework • HIPS Architecture Version 1.0
      </div>
    </div>
  )
}
