import { useState, useEffect } from 'react'
import { Play, Calendar, Download, RefreshCw, AlertTriangle, CheckCircle, Database, Sparkles, BookOpen, User, MapPin, Users, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pythonRunner } from '../pythonRunner'

// Sample data matching timetable_sample.json
const SAMPLE_TIMETABLE_DATA = {
  "courses": [
    {"name": "CS101", "teacher": "Dr. Alice", "periods_required": 3, "groups": ["CS-CohortA"]},
    {"name": "CS102", "teacher": "Dr. Bob", "periods_required": 3, "groups": ["CS-CohortA"]},
    {"name": "MATH101", "teacher": "Prof. Carol", "periods_required": 4, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "CS-Lab101", "teacher": "Dr. Alice", "periods_required": 2, "groups": ["CS-CohortA"], "is_lab": true},
    {"name": "CS201", "teacher": "Dr. Bob", "periods_required": 3, "groups": ["CS-CohortB"]},
    {"name": "MATH201", "teacher": "Prof. Carol", "periods_required": 3, "groups": ["CS-CohortB"]},
    {"name": "Sports", "teacher": "Coach Dave", "periods_required": 2, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "Library / Study", "teacher": "Self-Study", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "FED", "teacher": "Prof. Smith", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "CFAI", "teacher": "Prof. Jones", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "Foreign Language", "teacher": "Mme. Dupont", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB"]}
  ],
  "teachers": [
    {
      "name": "Dr. Alice",
      "max_periods_per_day": 3,
      "availability": [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2]]
    },
    {
      "name": "Dr. Bob",
      "max_periods_per_day": 3,
      "availability": [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [4, 4]]
    },
    {
      "name": "Prof. Carol",
      "max_periods_per_day": 4,
      "availability": [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5]]
    },
    {
      "name": "Coach Dave",
      "max_periods_per_day": 4,
      "availability": []
    },
    {
      "name": "Self-Study",
      "max_periods_per_day": 6,
      "availability": []
    },
    {
      "name": "Prof. Smith",
      "max_periods_per_day": 4,
      "availability": []
    },
    {
      "name": "Prof. Jones",
      "max_periods_per_day": 4,
      "availability": []
    },
    {
      "name": "Mme. Dupont",
      "max_periods_per_day": 4,
      "availability": []
    }
  ],
  "rooms": [
    {"name": "Room-101", "capacity": 60, "type": "Lecture Hall"},
    {"name": "Room-102", "capacity": 40, "type": "Lecture Hall"},
    {"name": "CS-LabA", "capacity": 30, "type": "Lab"},
    {"name": "Sports Field", "capacity": 100, "type": "Outdoor"},
    {"name": "Library", "capacity": 100, "type": "Study Area"}
  ],
  "groups": [
    {"name": "CS-CohortA", "capacity": 25, "courses": ["CS101", "CS102", "MATH101", "CS-Lab101", "Sports", "Library / Study", "FED", "CFAI", "Foreign Language"]},
    {"name": "CS-CohortB", "capacity": 35, "courses": ["MATH101", "CS201", "MATH201", "Sports", "Library / Study", "FED", "CFAI", "Foreign Language"]}
  ],
  "config": {
    "periods_per_day": 6,
    "days_per_week": 5
  }
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetablePanel() {
  const [peas, setPeas] = useState(null);
  
  // Input Data States
  const [courses, setCourses] = useState(SAMPLE_TIMETABLE_DATA.courses);
  const [teachers, setTeachers] = useState(SAMPLE_TIMETABLE_DATA.teachers);
  const [rooms, setRooms] = useState(SAMPLE_TIMETABLE_DATA.rooms);
  const [groups, setGroups] = useState(SAMPLE_TIMETABLE_DATA.groups);

  // Config States
  const [periodsPerDay, setPeriodsPerDay] = useState(6);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [solver, setSolver] = useState("Backtracking (MRV+FC)");

  // Solver Results
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // UI Display Control
  const [activeInputTab, setActiveInputTab] = useState("courses");
  const [viewMode, setViewMode] = useState("group"); // 'group' or 'teacher'
  const [selectedOwner, setSelectedOwner] = useState(""); // selected group name or teacher name
  const [jsonInput, setJsonInput] = useState(JSON.stringify(SAMPLE_TIMETABLE_DATA, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);

  // New Item States
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseTeacher, setNewCourseTeacher] = useState("");
  const [newCoursePeriods, setNewCoursePeriods] = useState(3);
  const [newCourseGroups, setNewCourseGroups] = useState("");
  const [newCourseIsLab, setNewCourseIsLab] = useState(false);

  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherPeriods, setNewTeacherPeriods] = useState(4);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCapacity, setNewGroupCapacity] = useState(30);
  const [newGroupCourses, setNewGroupCourses] = useState("");

  const handleAddCourse = () => {
    if (!newCourseName.trim() || !newCourseTeacher.trim()) return;
    const gList = newCourseGroups.split(',').map(g => g.trim()).filter(g => g);
    const newCourse = { 
      name: newCourseName.trim(), 
      teacher: newCourseTeacher.trim(), 
      periods_required: newCoursePeriods, 
      groups: gList 
    };
    if (newCourseIsLab) newCourse.is_lab = true;
    
    const updated = [...courses, newCourse];
    setCourses(updated);
    setNewCourseName("");
    setNewCourseTeacher("");
    setNewCourseGroups("");
    setNewCourseIsLab(false);
    try {
      const parsed = JSON.parse(jsonInput);
      parsed.courses = updated;
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch(e) {}
  };

  const handleAddTeacher = () => {
    if (!newTeacherName.trim()) return;
    const newTeacher = { name: newTeacherName.trim(), max_periods_per_day: newTeacherPeriods, availability: [] };
    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    setNewTeacherName("");
    try {
      const parsed = JSON.parse(jsonInput);
      parsed.teachers = updated;
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch(e) {}
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const cList = newGroupCourses.split(',').map(c => c.trim()).filter(c => c);
    const newGroup = { name: newGroupName.trim(), capacity: newGroupCapacity, courses: cList };
    const updated = [...groups, newGroup];
    setGroups(updated);
    setNewGroupName("");
    setNewGroupCourses("");
    try {
      const parsed = JSON.parse(jsonInput);
      parsed.groups = updated;
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch(e) {}
  };

  useEffect(() => {
    pythonRunner.getPeas('Timetable')
      .then(data => setPeas(data))
      .catch(err => console.error(err));
  }, []);

  // Sync JSON text when sample data is changed or modified
  const handleLoadSample = () => {
    setCourses(SAMPLE_TIMETABLE_DATA.courses);
    setTeachers(SAMPLE_TIMETABLE_DATA.teachers);
    setRooms(SAMPLE_TIMETABLE_DATA.rooms);
    setGroups(SAMPLE_TIMETABLE_DATA.groups);
    setPeriodsPerDay(SAMPLE_TIMETABLE_DATA.config.periods_per_day);
    setDaysPerWeek(SAMPLE_TIMETABLE_DATA.config.days_per_week);
    setJsonInput(JSON.stringify(SAMPLE_TIMETABLE_DATA, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (val) => {
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed.courses) setCourses(parsed.courses);
      if (parsed.teachers) setTeachers(parsed.teachers);
      if (parsed.rooms) setRooms(parsed.rooms);
      if (parsed.groups) setGroups(parsed.groups);
      if (parsed.config?.periods_per_day) setPeriodsPerDay(parsed.config.periods_per_day);
      if (parsed.config?.days_per_week) setDaysPerWeek(parsed.config.days_per_week);
      setJsonError(null);
    } catch (err) {
      setJsonError("Invalid JSON structure: " + err.message);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const configObj = {
        periods_per_day: periodsPerDay,
        days_per_week: daysPerWeek,
        solver: solver
      };
      
      const data = await pythonRunner.runTimetable(courses, teachers, rooms, groups, configObj);
      setResult(data);

      // Auto select the first group or teacher to view
      if (viewMode === "group" && groups.length > 0) {
        setSelectedOwner(groups[0].name);
      } else if (viewMode === "teacher" && teachers.length > 0) {
        setSelectedOwner(teachers[0].name);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate timetable: " + err.message);
    }
    setLoading(false);
  };

  // Sync selected target when tabs toggle
  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    if (mode === "group" && groups.length > 0) {
      setSelectedOwner(groups[0].name);
    } else if (mode === "teacher" && teachers.length > 0) {
      setSelectedOwner(teachers[0].name);
    }
  };

  // Export CSV locally
  const handleExportCSV = () => {
    if (!result) return;
    const gridData = viewMode === "group" ? result.group_timetables : result.teacher_timetables;
    if (!gridData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Day,Period,Course,Room,Teacher/Group Details\n`;

    Object.entries(gridData).forEach(([owner, grid]) => {
      csvContent += `\n--- TIMETABLE FOR: ${owner} ---\n`;
      grid.forEach((dayGrid, dIdx) => {
        const dayLabel = DAY_NAMES[dIdx] || `Day ${dIdx + 1}`;
        dayGrid.forEach((cell, pIdx) => {
          if (cell) {
            const extra = viewMode === "group" ? cell.teacher : cell.groups.join("/");
            csvContent += `"${dayLabel}","Period ${pIdx + 1}","${cell.course}","${cell.room}","${extra}"\n`;
          } else {
            csvContent += `"${dayLabel}","Period ${pIdx + 1}","-","-","-"\n`;
          }
        });
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timetable_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF from server
  const handleExportPDF = () => {
    // Generate trigger endpoint to localhost Flask API
    window.open("http://localhost:5000/api/timetable/export/pdf", "_blank");
  };

  const currentGrid = result && result.solved !== undefined
    ? (viewMode === "group" ? result.group_timetables[selectedOwner] : result.teacher_timetables[selectedOwner])
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
            <Calendar size={32} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="m-0 text-3xl font-bold text-slate-200">University Timetable Generator</h1>
            <p className="m-0 text-slate-400 mt-1">Multi-constraint scheduling engine using Backtracking & Simulated Annealing</p>
          </div>
        </div>
        
        <button
          onClick={handleLoadSample}
          className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
        >
          <Sparkles size={16} /> Load Sample Data
        </button>
      </div>

      {/* PEAS Analysis */}
      {peas && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass-panel p-5 border-indigo-500/20 bg-indigo-500/5"
        >
          <h3 className="m-0 mb-3 text-indigo-400 font-bold flex items-center gap-2">
            <Database size={20} /> PEAS Analysis (Timetable Planning)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-300">
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong className="text-indigo-300 block mb-1">Performance</strong>{peas.performance}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong className="text-indigo-300 block mb-1">Environment</strong>{peas.environment}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong className="text-indigo-300 block mb-1">Actuators</strong>{peas.actuators}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5"><strong className="text-indigo-300 block mb-1">Sensors</strong>{peas.sensors}</div>
            <div className="bg-black/35 p-3 rounded-lg border border-white/5 col-span-full flex items-center gap-2">
              <strong className="text-indigo-300 font-bold">Env Type:</strong>{peas.env_type}
            </div>
          </div>
        </motion.div>
      )}

      {/* Core Setup Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Setup (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-6 border-white/10 flex flex-col gap-5">
            <h3 className="m-0 text-lg font-bold text-slate-200 flex items-center gap-2">
              <Settings size={18} className="text-indigo-400" /> Solver Configuration
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Solver Method</label>
              <select
                value={solver}
                onChange={e => setSolver(e.target.value)}
                className="bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
              >
                <option value="Backtracking (MRV+FC)">Backtracking (MRV + Forward Checking)</option>
                <option value="Simulated Annealing">Simulated Annealing (Local Search)</option>
              </select>
              <p className="text-xs text-slate-500">
                {solver.includes("Backtracking") 
                  ? "Guarantees mathematically optimal consistency but may time out on massive data sets." 
                  : "Quickly converges on near-optimal schedules for large class matrices using cooling optimization."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Periods Per Day</label>
                <div className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl border border-white/5">
                  <input
                    type="range" min="4" max="10" value={periodsPerDay}
                    onChange={e => setPeriodsPerDay(parseInt(e.target.value))}
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-indigo-300 font-black font-mono w-6 text-center">{periodsPerDay}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Days Per Week</label>
                <div className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl border border-white/5">
                  <input
                    type="range" min="3" max="7" value={daysPerWeek}
                    onChange={e => setDaysPerWeek(parseInt(e.target.value))}
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-indigo-300 font-black font-mono w-6 text-center">{daysPerWeek}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !!jsonError}
              className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all text-base ${
                loading || !!jsonError
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 cursor-pointer'
              }`}
            >
              {loading ? (
                <><RefreshCw size={20} className="animate-spin" /> Calculating Timetable...</>
              ) : (
                <><Play size={20} /> Generate Timetable</>
              )}
            </button>
          </div>

          {/* Dataset Editor */}
          <div className="glass-panel p-6 border-white/10 flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="m-0 text-lg font-bold text-slate-200 flex items-center gap-2">
                <Database size={18} className="text-indigo-400" /> Database Matrix
              </h3>
              
              <div className="flex gap-1.5 bg-black/30 p-1 rounded-lg border border-white/5 text-xs font-bold">
                {["courses", "teachers", "rooms", "groups"].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveInputTab(t)}
                    className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                      activeInputTab === t ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* List Preview */}
            <div className="flex-1 overflow-y-auto max-h-[200px] border border-white/5 bg-black/25 rounded-xl p-3 text-xs leading-relaxed custom-scrollbar">
              {activeInputTab === "courses" && (
                <div className="flex flex-col gap-1">
                  {courses.map((c, i) => (
                    <div key={i} className="flex justify-between border-b border-white/5 py-1.5 last:border-0">
                      <span className="text-slate-300 font-bold">{c.name} {c.is_lab && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded font-normal">Lab</span>}</span>
                      <span className="text-slate-500">{c.teacher} · {c.periods_required} periods</span>
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <input type="text" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Course Name" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" />
                      <input type="text" value={newCourseTeacher} onChange={e => setNewCourseTeacher(e.target.value)} placeholder="Teacher Name" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" value={newCoursePeriods} onChange={e => setNewCoursePeriods(parseInt(e.target.value))} className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" title="Periods Required" />
                      <input type="text" value={newCourseGroups} onChange={e => setNewCourseGroups(e.target.value)} placeholder="Cohorts (e.g., CS-CohortA)" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" />
                      <label className="flex items-center gap-1 text-slate-400 text-[10px] cursor-pointer">
                        <input type="checkbox" checked={newCourseIsLab} onChange={e => setNewCourseIsLab(e.target.checked)} className="accent-indigo-500" /> Lab
                      </label>
                      <button onClick={handleAddCourse} className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-1 rounded font-bold transition-colors">Add</button>
                    </div>
                  </div>
                </div>
              )}
              {activeInputTab === "teachers" && (
                <div className="flex flex-col gap-1">
                  {teachers.map((t, i) => (
                    <div key={i} className="flex justify-between border-b border-white/5 py-1.5 last:border-0">
                      <span className="text-slate-300 font-bold">{t.name}</span>
                      <span className="text-slate-500">Max {t.max_periods_per_day}/day · {t.availability && t.availability.length > 0 ? t.availability.length : 'Any'} slots</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                    <input type="text" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} placeholder="Teacher Name" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" />
                    <input type="number" min="1" max="10" value={newTeacherPeriods} onChange={e => setNewTeacherPeriods(parseInt(e.target.value))} className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" title="Max Periods/Day" />
                    <button onClick={handleAddTeacher} className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-1 rounded font-bold transition-colors">+</button>
                  </div>
                </div>
              )}
              {activeInputTab === "rooms" && rooms.map((r, i) => (
                <div key={i} className="flex justify-between border-b border-white/5 py-1.5 last:border-0">
                  <span className="text-slate-300 font-bold">{r.name} ({r.type})</span>
                  <span className="text-slate-500">Cap: {r.capacity}</span>
                </div>
              ))}
              {activeInputTab === "groups" && (
                <div className="flex flex-col gap-1">
                  {groups.map((g, i) => (
                    <div key={i} className="flex justify-between border-b border-white/5 py-1.5 last:border-0">
                      <span className="text-slate-300 font-bold">{g.name} <span className="text-slate-500 font-normal">(Cap: {g.capacity})</span></span>
                      <span className="text-slate-500">{g.courses.length} courses</span>
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Cohort Name" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" />
                      <input type="number" min="1" value={newGroupCapacity} onChange={e => setNewGroupCapacity(parseInt(e.target.value))} className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" title="Capacity" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="text" value={newGroupCourses} onChange={e => setNewGroupCourses(e.target.value)} placeholder="Courses (comma separated, e.g., CS101, Sports)" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none text-[10px]" />
                      <button onClick={handleAddGroup} className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-1 rounded font-bold transition-colors">Add</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* JSON Text Editor for bulk changes */}
            <div className="flex flex-col gap-1.5 flex-1 mt-2">
              <label className="text-xs font-bold text-slate-400">Bulk JSON Editor (Editable)</label>
              <textarea
                value={jsonInput}
                onChange={e => handleJsonChange(e.target.value)}
                rows={8}
                className="w-full font-mono text-[10px] bg-black/60 border border-slate-700 rounded-xl p-3 text-emerald-400 outline-none focus:border-indigo-500 custom-scrollbar resize-none"
              />
              {jsonError && (
                <span className="text-red-400 text-xs mt-1 font-semibold flex items-center gap-1">
                  <AlertTriangle size={12} /> {jsonError}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Timetable Grid & Stats (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Grid View */}
          <div className="glass-panel p-6 border-white/10 flex-1 flex flex-col min-h-[450px]">
            {result ? (
              <div className="flex flex-col flex-1 gap-4">
                
                {/* View Selection & Exports */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => handleToggleViewMode("group")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                          viewMode === "group" ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400'
                        }`}
                      >
                        <Users size={14} /> Cohorts
                      </button>
                      <button
                        onClick={() => handleToggleViewMode("teacher")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                          viewMode === "teacher" ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400'
                        }`}
                      >
                        <User size={14} /> Teachers
                      </button>
                    </div>

                    <select
                      value={selectedOwner}
                      onChange={e => setSelectedOwner(e.target.value)}
                      className="bg-black/40 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
                    >
                      {viewMode === "group" 
                        ? groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)
                        : teachers.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={12} /> CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={12} /> PDF
                    </button>
                  </div>
                </div>

                {/* Calendar Grid rendering */}
                <div className="flex-1 overflow-x-auto min-w-full">
                  <div 
                    className="grid border border-white/10 rounded-xl overflow-hidden shadow-inner text-center min-w-[550px]"
                    style={{ gridTemplateColumns: `repeat(${periodsPerDay + 1}, minmax(0, 1fr))` }}
                  >
                    
                    {/* Grid Header */}
                    <div className="bg-black/45 border-b border-r border-white/10 p-2 text-xs font-bold text-slate-400">Day / Period</div>
                    {Array.from({ length: periodsPerDay }).map((_, p) => (
                      <div key={p} className="bg-black/45 border-b border-r border-white/10 last:border-r-0 p-2 text-xs font-bold text-slate-400">
                        Period {p + 1}
                      </div>
                    ))}

                    {/* Grid Rows */}
                    {Array.from({ length: daysPerWeek }).map((_, d) => {
                      const dayLabel = DAY_NAMES[d] || `Day ${d + 1}`;
                      return (
                        <div key={d} className="contents">
                          <div className="bg-black/25 border-b border-r border-white/10 p-3 text-xs font-bold text-slate-300 flex items-center justify-center">
                            {dayLabel}
                          </div>
                          
                          {Array.from({ length: periodsPerDay }).map((_, p) => {
                            const cell = currentGrid ? currentGrid[d][p] : null;
                            const isLab = cell && (cell.course.toLowerCase().includes("lab") || cell.room.toLowerCase().includes("lab"));
                            const isHovered = cell && hoveredCourse === cell.course;

                            return (
                              <div
                                key={p}
                                onMouseEnter={() => cell && setHoveredCourse(cell.course)}
                                onMouseLeave={() => setHoveredCourse(null)}
                                className={`border-b border-r border-white/10 last:border-r-0 p-2 flex flex-col justify-center min-h-[65px] transition-all duration-200 relative group select-none ${
                                  cell 
                                    ? isHovered 
                                      ? 'bg-indigo-500/25'
                                      : isLab 
                                      ? 'bg-purple-500/10 hover:bg-purple-500/15' 
                                      : 'bg-indigo-500/10 hover:bg-indigo-500/15'
                                    : 'bg-black/5 hover:bg-black/10'
                                }`}
                              >
                                {cell ? (
                                  <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col gap-0.5"
                                  >
                                    <span className="text-xs font-black text-indigo-300">{cell.course}</span>
                                    <span className="text-[10px] text-slate-200 font-semibold">{cell.room}</span>
                                    <span className="text-[9px] text-slate-400 truncate">
                                      {viewMode === "group" ? cell.teacher : cell.groups.join(", ")}
                                    </span>
                                  </motion.div>
                                ) : (
                                  <span className="text-[10px] text-slate-600">-</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Conflict/Unscheduled Summary */}
                {result.unscheduled && result.unscheduled.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-2">
                    <span className="text-red-400 font-bold text-xs flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Unscheduled Courses ({result.unscheduled.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      {result.unscheduled.map((item, idx) => (
                        <div key={idx} className="bg-black/35 p-2 rounded-lg border border-white/5">
                          <span className="text-red-300 font-bold block">{item.course}</span>
                          <span className="text-slate-400 leading-normal">{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-12">
                <Calendar size={48} className="opacity-20 mb-4" />
                <h3 className="text-xl text-slate-400 mb-2">Awaiting Generation</h3>
                <p className="max-w-xs text-sm">
                  Review the database matrix or solver setup on the left, then click "Generate Timetable" to produce schedules.
                </p>
              </div>
            )}
          </div>

          {/* Solver Stats Panel */}
          {result && (
            <div className="glass-panel p-6 border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-slate-400 text-xs block">Solve Status</span>
                <span className={`text-base font-black mt-1 inline-flex items-center gap-1 ${result.solved ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {result.solved ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {result.solved ? 'Full Schedule' : 'Partial'}
                </span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-slate-400 text-xs block">Solve Time</span>
                <span className="text-lg font-black text-blue-300 block mt-1">{result.runtime.toFixed(4)}s</span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-slate-400 text-xs block">Assignments Tried</span>
                <span className="text-lg font-black text-indigo-300 block mt-1">{result.assignments_tried}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-slate-400 text-xs block">
                  {solver.includes("Backtracking") ? 'Total Backtracks' : 'SA Iterations'}
                </span>
                <span className="text-lg font-black text-rose-300 block mt-1">{result.backtracks}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
