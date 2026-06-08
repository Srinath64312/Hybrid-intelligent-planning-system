import { useState } from 'react'
import { Play, Calendar, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { pythonRunner } from '../pythonRunner'

export default function SchedulePanel() {
  const [relaxNewton, setRelaxNewton] = useState(false)
  const [relaxCohort, setRelaxCohort] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSolve = async () => {
    setLoading(true)
    try {
      const data = await pythonRunner.runSchedule(relaxNewton, relaxCohort)
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Failed to solve schedule CSP via Python solver.")
    }
    setLoading(false)
  }

  // Course Details
  const courseDetails = {
    "BIO101": { name: "Intro Biology Lab", prof: "Dr. Alan", color: "#a855f7" },
    "CHEM101": { name: "Intro Chemistry Lab", prof: "Dr. Grace", color: "#ec4899" },
    "PHYS101": { name: "Intro Physics Lecture", prof: "Dr. Newton", color: "#3b82f6" }
  }

  const timeslots = [
    { id: "Tuesday_0900", label: "Tue 9:00 AM" },
    { id: "Wednesday_0900", label: "Wed 9:00 AM" },
    { id: "Wednesday_1100", label: "Wed 11:00 AM" }
  ]

  const rooms = [
    { id: "Lab_A_Wet", name: "Lab A (Wet Lab)" },
    { id: "Lecture_Hall_102", name: "Lecture Hall 102" }
  ]

  // Map assignments to slot-room grid
  const getAssignmentAt = (slotId, roomId) => {
    if (!result || !result.assignment) return null
    
    // The assignment looks like: { "BIO101": ["Wednesday_0900", "Lab_A_Wet"] }
    const matches = []
    for (const [course, val] of Object.entries(result.assignment)) {
      const [assignedSlot, assignedRoom] = val
      if (assignedSlot === slotId && assignedRoom === roomId) {
        matches.push(course)
      }
    }
    return matches
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Calendar color="#a855f7" /> University Scheduling CSP
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '30px', maxWidth: '800px', lineHeight: '1.5' }}>
        Solve the university course scheduling conflict. Hard constraints include classroom equipment (Bio/Chem labs need wet labs) and safety limits (no room overlaps). Toggle soft preference constraints below to see how the solver resolves dead-ends.
      </p>

      <div className="grid-2">
        <div>
          {/* Controls */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#c084fc' }}>Toggle Soft Constraint Relaxations</h3>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={relaxNewton} 
                onChange={e => {
                  setRelaxNewton(e.target.checked)
                  setResult(null)
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <strong>Relax Dr. Newton's Availability</strong>
                <span style={{ display: 'block', fontSize: '0.85em', color: '#94a3b8' }}>Allow scheduling Physics on Tuesday morning (originally Wednesday only)</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={relaxCohort} 
                onChange={e => {
                  setRelaxCohort(e.target.checked)
                  setResult(null)
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <strong>Relax Cohort Corequisites</strong>
                <span style={{ display: 'block', fontSize: '0.85em', color: '#94a3b8' }}>Allow Physics to run concurrently with Bio/Chem (cohort splitting)</span>
              </div>
            </label>

            <button 
              className="btn" 
              onClick={handleSolve} 
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#a855f7' }}
            >
              <Play size={18} /> {loading ? 'Solving...' : 'Run Scheduling CSP'}
            </button>
          </div>

          {/* Visual Grid */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#cbd5e1' }}>Visual Schedule Calendar</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(2, 1fr)', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', color: '#94a3b8' }}>Time / Day</div>
              {rooms.map(room => (
                <div key={room.id} style={{ fontWeight: 'bold', color: '#c084fc', textAlign: 'center' }}>{room.name}</div>
              ))}
            </div>

            {timeslots.map(slot => (
              <div key={slot.id} style={{ display: 'grid', gridTemplateColumns: '120px repeat(2, 1fr)', gap: '8px', minHeight: '80px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.9em' }}>{slot.label}</div>
                
                {rooms.map(room => {
                  const assignedCourses = getAssignmentAt(slot.id, room.id)
                  const hasConflict = assignedCourses && assignedCourses.length > 1

                  return (
                    <div 
                      key={room.id} 
                      style={{ 
                        background: hasConflict ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', 
                        border: `1px dashed ${hasConflict ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '6px',
                        minHeight: '70px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        padding: '6px',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      {assignedCourses && assignedCourses.map(course => {
                        const info = courseDetails[course]
                        return (
                          <div 
                            key={course}
                            style={{
                              background: info.color,
                              color: '#ffffff',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              width: '100%',
                              textAlign: 'center',
                              fontSize: '0.8em',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{course}</div>
                            <div style={{ opacity: 0.9, fontSize: '0.9em' }}>{info.name}</div>
                            <div style={{ opacity: 0.8, fontSize: '0.85em', borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '4px', paddingTop: '2px' }}>{info.prof}</div>
                          </div>
                        )
                      })}
                      {(!assignedCourses || assignedCourses.length === 0) && (
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8em' }}>Empty Slot</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Results Panel */}
        <div>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Alert Status */}
              {result.assignment ? (
                <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '20px', borderRadius: '8px', color: '#e2e8f0', display: 'flex', gap: '15px' }}>
                  <CheckCircle color="#34d399" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#34d399' }}>Valid Schedule Computed Successfully!</h4>
                    <p style={{ margin: 0, fontSize: '0.9em', color: '#cbd5e1' }}>
                      Solver resolved all constraints. Dr. Newton was scheduled successfully and cohort corequisites were respected.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '20px', borderRadius: '8px', color: '#e2e8f0', display: 'flex', gap: '15px' }}>
                  <AlertTriangle color="#ef4444" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#f87171' }}>Deadlock Encountered! No Valid Schedule Exists.</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: '#cbd5e1' }}>
                      The solver reached a dead-end. The remaining variable <strong>PHYS101</strong> could not be assigned due to conflicting hard constraints.
                    </p>
                    <div style={{ fontSize: '0.85em', background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <strong>Conflict Core:</strong> Bio & Chem labs completely fill Wed 9:00 AM & 11:00 AM in the only wet lab room. Dr. Newton is only available on Wednesdays, but scheduling him then creates a corequisite conflict.
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'rgba(99, 102, 241, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div><span style={{ color: '#94a3b8', fontSize: '0.85em' }}>Assignments Tried:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.assignments_tried}</strong></div>
                <div><span style={{ color: '#94a3b8', fontSize: '0.85em' }}>Backtracks:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.backtracks}</strong></div>
                <div><span style={{ color: '#94a3b8', fontSize: '0.85em' }}>Runtime:</span> <br/><strong style={{ fontSize: '1.2em' }}>{result.runtime.toFixed(4)}s</strong></div>
              </div>

              {/* Backtracking Trace */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Solver Backtracking Trace Logs</h4>
                <div className="trace-box" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {result.trace.map((t, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        color: t.includes("Backtracking") ? '#f87171' : t.includes("Violation") ? '#fbbf24' : '#a7f3d0',
                        marginBottom: '4px' 
                      }}
                    >
                      [{i}] {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '2px dashed #334155', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <RefreshCw size={48} style={{ marginBottom: '15px', animation: 'spin 10s linear infinite', opacity: 0.3 }} />
              <h3>Awaiting Solver Execution</h3>
              <p style={{ margin: 0, maxWidth: '300px', fontSize: '0.9em' }}>Select your constraint configuration on the left and run the scheduling solver to visualize results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
