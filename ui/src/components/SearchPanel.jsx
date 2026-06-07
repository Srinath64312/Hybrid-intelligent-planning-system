import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'

export default function SearchPanel() {
  const [peas, setPeas] = useState(null)
  const [algorithm, setAlgorithm] = useState('Auto-Select Best')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [grid, setGrid] = useState([
    [0, 0, 0, 1, 0],
    [1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0]
  ])

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/peas/Search')
      .then(res => res.json())
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  const handleSolve = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm, grid })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Failed to connect to backend API.")
    }
    setLoading(false)
  }

  const toggleCell = (r, c) => {
    // Prevent toggling start and goal
    if ((r === 0 && c === 0) || (r === 4 && c === 4)) return
    const newGrid = [...grid]
    newGrid[r] = [...grid[r]]
    newGrid[r][c] = newGrid[r][c] === 0 ? 1 : 0
    setGrid(newGrid)
    // Clear previous results when grid changes
    setResult(null)
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#e2e8f0' }}>Search Engine: Interactive Maze</h1>
      
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
              <label style={{ fontSize: '0.9em', color: '#94a3b8' }}>Algorithm Selection</label>
              <select value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
                <option value="Auto-Select Best">Auto-Select Best Algorithm</option>
                <option value="A*">A* Search</option>
                <option value="UCS">Uniform Cost Search (Dijkstra)</option>
                <option value="Greedy">Greedy Best-First Search</option>
                <option value="BFS">Breadth First Search (BFS)</option>
                <option value="DFS">Depth First Search (DFS)</option>
              </select>
            </div>
            <button className="btn" onClick={handleSolve} disabled={loading}>
              <Play size={18} /> {loading ? 'Solving...' : 'Solve Maze'}
            </button>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 40px)', gap: '4px' }}>
              {grid.map((row, r) => row.map((cell, c) => {
                const isStart = r === 0 && c === 0
                const isGoal = r === 4 && c === 4
                // Check if this cell is part of the solution path
                const inPath = result && result.path && !isStart && !isGoal && (() => {
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

                let bgColor = cell === 1 ? '#334155' : 'rgba(255,255,255,0.05)'
                if (isStart) bgColor = '#4ade80' // Green
                if (isGoal) bgColor = '#f87171'  // Red
                if (inPath) bgColor = '#a855f7'  // Purple path

                return (
                  <div 
                    key={`${r}-${c}`}
                    onClick={() => toggleCell(r, c)}
                    style={{
                      width: '40px', height: '40px', background: bgColor,
                      borderRadius: '4px', cursor: (isStart || isGoal) ? 'not-allowed' : 'pointer',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', color: 'white'
                    }}
                  >
                    {isStart ? 'S' : isGoal ? 'G' : ''}
                  </div>
                )
              }))}
            </div>
            <p style={{ fontSize: '0.8em', color: '#94a3b8', marginTop: '15px', textAlign: 'center' }}>
              Click cells to toggle walls (dark gray).<br/>S = Start | G = Goal
            </p>
          </div>
        </div>

        {result && (
          <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#c084fc' }}>Execution Results</h3>
            {result.auto_selected && (
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✨ Expert AI Advisor
                </h3>
                <div style={{ color: '#e2e8f0', marginBottom: '15px' }}>
                  Optimal Algorithm Selected: <strong style={{ color: '#4ade80' }}>{result.auto_selected}</strong>
                </div>
                {result.advisor_report && result.advisor_report.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', fontSize: '0.95em', lineHeight: '1.5' }}>
                    <strong style={{ color: '#cbd5e1' }}>{idx + 1}. {item.title}:</strong> <span style={{ color: '#94a3b8' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(99, 102, 241, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div><span style={{ color: '#94a3b8' }}>Nodes Expanded:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.nodes_expanded}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Path Cost:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.cost}</strong></div>
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8' }}>Runtime:</span> <br/><strong>{result.runtime.toFixed(4)}s</strong></div>
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8' }}>Path Found:</span> <br/>
                <span style={{ color: '#a7f3d0' }}>{result.path && result.path.length > 0 ? result.path.join(' → ') : 'No path found!'}</span>
              </div>
            </div>

            <h4 style={{ margin: '20px 0 10px 0', color: '#94a3b8' }}>Reasoning Trace Logs</h4>
            <div className="trace-box">
              {result.trace.map((t, i) => <div key={i}>[{i}] {t}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
