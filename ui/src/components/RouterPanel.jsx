import { useState } from 'react'
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { pythonRunner } from '../pythonRunner'

export default function RouterPanel() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRoute = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await pythonRunner.runRouter(query)
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Failed to route query via Python router.")
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MessageSquare color="#3b82f6" /> NLP Query Router
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '30px', maxWidth: '800px', lineHeight: '1.5' }}>
        Type a natural language query representing a real-world campus problem (e.g. "What is the shortest path from the Hostel Block to the CS Department at 2PM tomorrow?"). The NLP engine will parse the intent, extract entities, and output a structured routing payload.
      </p>

      <div className="grid-2">
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: 'bold' }}>Enter Query</label>
            <textarea 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g., I need to find a route from the Library to the Auditorium tomorrow at 9 AM..."
              style={{ 
                width: '100%', height: '120px', padding: '15px', 
                background: '#1e293b', border: '1px solid #334155', 
                color: '#f8fafc', borderRadius: '8px', fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <button className="btn" onClick={handleRoute} disabled={loading || !query.trim()} style={{ padding: '15px', fontSize: '1.1em', display: 'flex', justifyContent: 'center', gap: '10px', background: '#3b82f6' }}>
            <Send size={20} /> {loading ? 'Parsing NLP...' : 'Route Query'}
          </button>
          
          <div style={{ marginTop: '20px', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>Try these examples:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '0.9em', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => setQuery("What is the shortest path from the Hostel Block to the CS Department at 2PM tomorrow?")}>
                "What is the shortest path from the Hostel Block to the CS Department at 2PM tomorrow?"
              </li>
              <li style={{ cursor: 'pointer' }} onClick={() => setQuery("Are there any timetable conflicts for the auditorium on Friday?")}>
                "Are there any timetable conflicts for the auditorium on Friday?"
              </li>
              <li style={{ cursor: 'pointer' }} onClick={() => setQuery("What is the probability of a delay if I go to the lab today?")}>
                "What is the probability of a delay if I go to the lab today?"
              </li>
              <li style={{ cursor: 'pointer' }} onClick={() => setQuery("Find the shortest path starting from the CS Department tomorrow.")}>
                "Find the shortest path starting from the CS Department tomorrow." (Needs Clarification)
              </li>
              <li style={{ cursor: 'pointer' }} onClick={() => setQuery("Can we schedule a projector in the hall on Monday at 10 AM without conflicts?")}>
                "Can we schedule a projector in the hall on Monday at 10 AM without conflicts?"
              </li>
              <li style={{ cursor: 'pointer' }} onClick={() => setQuery("Recommend the best routing algorithm to allocate options for a massive graph.")}>
                "Recommend the best routing algorithm to allocate options for a massive graph."
              </li>
            </ul>
          </div>
        </div>

        <div>
          {result ? (
            <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '25px', borderRadius: '12px', animation: 'fadeIn 0.5s ease-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #334155' }}>
                <h3 style={{ margin: 0, color: '#e2e8f0' }}>Structured Output Payload</h3>
                {result.clarification_needed ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.9em', background: 'rgba(251, 191, 36, 0.1)', padding: '5px 10px', borderRadius: '20px' }}>
                    <AlertCircle size={16} /> Needs Clarification
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.9em', background: 'rgba(52, 211, 153, 0.1)', padding: '5px 10px', borderRadius: '20px' }}>
                    <CheckCircle2 size={16} /> Fully Parsed
                  </span>
                )}
              </div>

              {result.conclusion && (
                <div style={{ 
                  background: result.clarification_needed ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                  border: `1px solid ${result.clarification_needed ? 'rgba(251, 191, 36, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`, 
                  padding: '15px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  color: '#e2e8f0',
                  lineHeight: '1.5',
                  fontSize: '1em'
                }}>
                  <strong style={{ 
                    color: result.clarification_needed ? '#fbbf24' : '#60a5fa', 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '0.85em', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                  }}>
                    {result.clarification_needed ? 'Clarification Required' : 'Parsed Conclusion'}
                  </strong>
                  {result.conclusion}
                </div>
              )}
              
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', overflowX: 'auto', flex: 1 }}>
                <pre style={{ margin: 0, color: '#a5b4fc', fontSize: '0.95em', fontFamily: 'monospace', lineHeight: '1.5' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '2px dashed #334155', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              Submit a natural language query to see the structured JSON routing payload here.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
