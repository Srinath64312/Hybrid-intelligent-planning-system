import { useState, useEffect } from 'react'
import { Play, RotateCcw } from 'lucide-react'

export default function GamePanel() {
  const [peas, setPeas] = useState(null)
  const [algorithm, setAlgorithm] = useState('Auto-Select Best')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ])

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/peas/Game')
      .then(res => res.json())
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  const resetGame = () => {
    setBoard([
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ])
    setResult(null)
  }

  const makeAIMove = async (currentBoard) => {
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm, state: currentBoard })
      })
      const data = await res.json()
      
      setResult(data)
      
      if (data.best_action && !data.is_terminal && data.expected_utility !== undefined) {
        // Only update board if game wasn't already terminal
        const [r, c] = data.best_action
        setBoard(prev => {
          const newBoard = [...prev]
          newBoard[r] = [...prev[r]]
          newBoard[r][c] = "X" // AI is X
          return newBoard
        })
      }
    } catch (err) {
      console.error(err)
      alert("Failed to connect to backend API.")
    }
    setLoading(false)
  }

  const handleCellClick = (r, c) => {
    if (board[r][c] !== null || loading || (result && result.is_terminal)) return
    
    // User plays O
    const newBoard = [...board]
    newBoard[r] = [...board[r]]
    newBoard[r][c] = "O"
    setBoard(newBoard)
    
    // Trigger AI move
    makeAIMove(newBoard)
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#e2e8f0' }}>Game AI: Tic-Tac-Toe (Play against AI)</h1>
      
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
              <label style={{ fontSize: '0.9em', color: '#94a3b8' }}>AI Algorithm (Plays X)</label>
              <select value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
                <option value="Auto-Select Best">Auto-Select Best Algorithm</option>
                <option value="Minimax">Standard Minimax</option>
                <option value="Alpha-Beta Pruning">Alpha-Beta Pruning</option>
              </select>
            </div>
            <button className="btn" onClick={() => makeAIMove(board)} disabled={loading || (result && result.is_terminal)}>
              <Play size={18} /> Let AI Start First
            </button>
            <button className="btn" onClick={resetGame} style={{ background: 'rgba(255,255,255,0.1)' }}>
              <RotateCcw size={18} /> Reset
            </button>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: '5px', background: '#334155', padding: '5px', borderRadius: '8px' }}>
              {board.map((row, r) => row.map((cell, c) => {
                const isWinningCell = result?.winning_line?.some(([wr, wc]) => wr === r && wc === c)
                return (
                  <div 
                    key={`${r}-${c}`} 
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      width: '80px', height: '80px', 
                      background: isWinningCell ? 'rgba(74, 222, 128, 0.2)' : '#0f172a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '40px', fontWeight: 'bold', 
                      color: cell === 'X' ? '#c084fc' : cell === 'O' ? '#4ade80' : 'transparent',
                      border: isWinningCell ? '3px solid #4ade80' : 'none',
                      cursor: cell === null && !loading && !(result && result.is_terminal) ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      borderRadius: '4px',
                      textShadow: isWinningCell ? `0 0 15px ${cell === 'X' ? '#c084fc' : '#4ade80'}` : 'none',
                      transform: isWinningCell ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {cell}
                  </div>
                )
              }))}
            </div>
            <p style={{ fontSize: '0.8em', color: '#94a3b8', marginTop: '15px' }}>
              You play as <strong>O</strong> (Green). AI plays as <strong>X</strong> (Purple).
            </p>
          </div>
        </div>

        {result && (
          <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#c084fc' }}>AI Execution Results</h3>

            {result.is_terminal && (
              <div style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontSize: '1.2em', textAlign: 'center', fontWeight: 'bold', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                GAME OVER!
                {result.utility === 1 ? ' AI (X) WINS!' : result.utility === -1 ? ' YOU (O) WIN!' : ' IT\'S A DRAW!'}
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(99, 102, 241, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div><span style={{ color: '#94a3b8' }}>Nodes Evaluated:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.nodes_evaluated}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Expected Utility:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.expected_utility}</strong></div>
              {algorithm !== 'Minimax' && (
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8' }}>Branches Pruned:</span> <br/><strong>{result.pruned_branches}</strong></div>
              )}
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8' }}>Runtime:</span> <br/><strong>{result.runtime.toFixed(4)}s</strong></div>
            </div>

            {!result.is_terminal && (
              <>
                <h4 style={{ margin: '20px 0 10px 0', color: '#94a3b8' }}>Reasoning Trace Logs (Last 50)</h4>
                <div className="trace-box">
                  {result.trace.map((t, i) => <div key={i}>[{i}] {t}</div>)}
                </div>
              </>
            )}

            {result.auto_selected && (
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
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
          </div>
        )}
      </div>
    </div>
  )
}
