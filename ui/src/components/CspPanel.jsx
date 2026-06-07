import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'

export default function CspPanel() {
  const [peas, setPeas] = useState(null)
  const [n, setN] = useState(8)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/peas/CSP')
      .then(res => res.json())
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  const handleSolve = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/csp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: parseInt(n) })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Failed to connect to backend API.")
    }
    setLoading(false)
  }

  const renderBoard = () => {
    if (!result || !result.assignment) return null
    const board = []
    for (let r = 0; r < n; r++) {
      const row = []
      for (let c = 0; c < n; c++) {
        // Result gives string keys e.g., result.assignment["0"]
        const colVal = result.assignment[r.toString()] || result.assignment[r]
        const isQueen = colVal === c
        row.push(
          <div key={`${r}-${c}`} style={{
            width: '30px', height: '30px', 
            background: (r + c) % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px'
          }}>
            {isQueen ? '👑' : ''}
          </div>
        )
      }
      board.push(<div key={r} style={{ display: 'flex' }}>{row}</div>)
    }
    return <div style={{ border: '2px solid rgba(255,255,255,0.2)', display: 'inline-block' }}>{board}</div>
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#e2e8f0' }}>CSP Engine: N-Queens</h1>
      
      {peas && (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#c084fc' }}>PEAS Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9em', color: '#cbd5e1' }}>
            <div><strong>Performance:</strong> {peas.performance}</div>
            <div><strong>Environment:</strong> {peas.environment}</div>
            <div><strong>Actuators:</strong> {peas.actuators}</div>
            <div><strong>Sensors:</strong> {peas.sensors}</div>
            <div style={{ gridColumn: '1 / -1' }}><strong>Type:</strong> {peas.env_type}</div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.9em', color: '#94a3b8' }}>Board Size (N)</label>
              <input type="number" min="4" max="12" value={n} onChange={e => setN(e.target.value)} style={{ width: '80px' }}/>
            </div>
            <button className="btn" onClick={handleSolve} disabled={loading}>
              <Play size={18} /> {loading ? 'Solving...' : 'Solve N-Queens'}
            </button>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderBoard() || <span style={{ color: '#94a3b8' }}>Click Solve to generate board</span>}
          </div>
        </div>

        {result && (
          <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#c084fc' }}>Execution Results</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(99, 102, 241, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div><span style={{ color: '#94a3b8' }}>Assignments Tried:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.assignments_tried}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Backtracks:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.backtracks}</strong></div>
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8' }}>Runtime:</span> <br/><strong>{result.runtime.toFixed(4)}s</strong></div>
            </div>

            <h4 style={{ margin: '20px 0 10px 0', color: '#94a3b8' }}>Reasoning Trace Logs (Last 50)</h4>
            <div className="trace-box">
              {result.trace.map((t, i) => <div key={i}>[{i}] {t}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
