import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import { pythonRunner } from '../pythonRunner'

export default function BayesPanel() {
  const [peas, setPeas] = useState(null)
  const [method, setMethod] = useState('Exact Enumeration')
  const [cough, setCough] = useState(true)
  const [soreThroat, setSoreThroat] = useState(true)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    pythonRunner.getPeas('Bayes')
      .then(data => setPeas(data))
      .catch(err => console.error(err))
  }, [])

  const handleSolve = async () => {
    setLoading(true)
    try {
      const data = await pythonRunner.runBayes(method, { Cough: cough, SoreThroat: soreThroat })
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Failed to run Bayesian inference via Python solver.")
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#e2e8f0' }}>Bayes Engine: Medical Diagnosis</h1>
      
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
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#e2e8f0' }}>Bayesian Network Setup</h4>
            <div style={{ fontFamily: 'monospace', color: '#94a3b8', lineHeight: '1.6' }}>
              <div>[Flu] ----&gt; [SoreThroat]</div>
              <div>[Flu, Smokes] ----&gt; [Cough]</div>
              <br/>
              <div>P(Flu) = 0.05</div>
              <div>P(Smokes) = 0.20</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.9em', color: '#94a3b8' }}>Inference Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)} style={{ maxWidth: '250px' }}>
                <option value="Exact Enumeration">Exact Enumeration</option>
                <option value="Rejection Sampling">Rejection Sampling (N=5000)</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={cough} onChange={e => setCough(e.target.checked)} />
                Has Cough
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={soreThroat} onChange={e => setSoreThroat(e.target.checked)} />
                Has Sore Throat
              </label>
            </div>
            
            <button className="btn" onClick={handleSolve} disabled={loading} style={{ maxWidth: '200px', margin: '10px 0' }}>
              <Play size={18} /> {loading ? 'Running...' : 'Query P(Flu=True)'}
            </button>
          </div>
        </div>

        {result && (
          <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#c084fc' }}>Execution Results</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', background: 'rgba(99, 102, 241, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Posterior Probability P(Flu=True | Evidence):</span> <br/>
                <strong style={{ fontSize: '1.8em', color: '#a7f3d0' }}>{(result.posterior_prob * 100).toFixed(2)}%</strong>
              </div>
              <div><span style={{ color: '#94a3b8' }}>Runtime:</span> <strong>{result.runtime.toFixed(4)}s</strong></div>
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
