import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { pythonRunner } from '../pythonRunner'

export default function AdvisorPanel() {
  const [size, setSize] = useState('Medium')
  const [costs, setCosts] = useState('Uniform')
  const [heuristic, setHeuristic] = useState(false)
  const [memoryLimited, setMemoryLimited] = useState(false)
  
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleConsult = async () => {
    setLoading(true)
    try {
      const data = await pythonRunner.runAdvisor({ size, costs, heuristic, memory_limited: memoryLimited })
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Failed to analyze graph features via Python advisor.")
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sparkles color="#a855f7" /> Graph Algorithm Advisor
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
        Input the structural features of your specific problem graph, and the expert AI will evaluate the state space complexity to recommend the optimal search algorithm mathematically.
      </p>

      <div className="grid-2">
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Graph State Space Size</label>
            <select value={size} onChange={e => setSize(e.target.value)} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px' }}>
              <option value="Small">Small (Can fit entirely in RAM)</option>
              <option value="Medium">Medium (Moderate depth/branching)</option>
              <option value="Massive">Massive / Infinite (e.g. 15-Puzzle, Chess)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Edge Step Costs</label>
            <select value={costs} onChange={e => setCosts(e.target.value)} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px' }}>
              <option value="Uniform">Uniform (All steps cost exactly 1)</option>
              <option value="Positive">Variable Positive (e.g. Distance in km)</option>
              <option value="Negative">Contains Negative Costs (e.g. Energy generation)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setHeuristic(!heuristic)}>
            <input type="checkbox" checked={heuristic} readOnly style={{ cursor: 'pointer' }} />
            <span style={{ color: '#cbd5e1' }}>Admissible Heuristic Available?</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setMemoryLimited(!memoryLimited)}>
            <input type="checkbox" checked={memoryLimited} readOnly style={{ cursor: 'pointer' }} />
            <span style={{ color: '#cbd5e1' }}>Strict Memory Constraint? (Avoid O(b^d) memory)</span>
          </div>

          <button className="btn" onClick={handleConsult} disabled={loading} style={{ marginTop: '10px', padding: '15px', fontSize: '1.1em', display: 'flex', justifyContent: 'center' }}>
            {loading ? 'Analyzing...' : 'Consult Expert Advisor'}
          </button>
        </div>

        <div>
          {result ? (
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '30px', borderRadius: '12px', animation: 'fadeIn 0.5s ease-out' }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>
                Recommended: <span style={{ color: '#a855f7' }}>{result.algorithm}</span>
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {result.report.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#a855f7', color: 'white', width: '24px', height: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8em' }}>{idx+1}</span>
                      {item.title}
                    </h4>
                    <p style={{ margin: 0, color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95em' }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '2px dashed #334155', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              Define your graph features on the left and click "Consult Expert Advisor" to see the algorithmic breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
