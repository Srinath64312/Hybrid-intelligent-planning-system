const filesToLoad = [
  'core/problem.py',
  'core/peas.py',
  'core/advisor.py',
  'engines/search_engine.py',
  'engines/csp_engine.py',
  'engines/game_engine.py',
  'engines/bayes_engine.py',
  'problems/maze.py',
  'problems/nqueens.py',
  'problems/tictactoe.py',
  'problems/diagnosis.py',
  'problems/scheduling.py',
  'problems/negotiation.py',
  'problems/timetable.py',
  'engines/timetable_engine.py',
  'problems/graph.py'
];

let pyodideInstance = null;

async function runPythonCode(code, inputs = {}) {
  if (!pyodideInstance) {
    throw new Error("Pyodide has not been initialized yet.");
  }
  
  const pyGlobals = pyodideInstance.globals;
  
  // Clean previous inputs if any
  for (const key of Object.keys(inputs)) {
    pyGlobals.set(`_js_input_${key}`, JSON.stringify(inputs[key]));
  }
  
  let setupCode = "import json\n";
  for (const key of Object.keys(inputs)) {
    setupCode += `${key} = json.loads(_js_input_${key})\n`;
  }
  
  const fullCode = `${setupCode}\n${code}`;
  
  try {
    const result = await pyodideInstance.runPythonAsync(fullCode);
    
    // Clean up globals to prevent memory growth
    for (const key of Object.keys(inputs)) {
      try {
        pyGlobals.delete(`_js_input_${key}`);
      } catch (e) {
        // Ignore KeyError if another concurrent execution already deleted it
      }
    }
    
    return JSON.parse(result);
  } catch (err) {
    console.error("Error executing Python code:", err);
    throw err;
  }
}

export const pythonRunner = {
  async initialize(onStatusUpdate) {
    try {
      onStatusUpdate("Loading Python WebAssembly runtime...");
      
      // Load Pyodide using the CDN script injected in index.html
      if (!window.loadPyodide) {
        throw new Error("loadPyodide function not found on window. Ensure the CDN script tag in index.html loaded correctly.");
      }
      
      pyodideInstance = await window.loadPyodide();
      
      onStatusUpdate("Creating Python virtual filesystem...");
      
      // Build directory structures in Pyodide MEMFS
      pyodideInstance.FS.mkdirTree('/target/src/core');
      pyodideInstance.FS.mkdirTree('/target/src/engines');
      pyodideInstance.FS.mkdirTree('/target/src/problems');
      
      // Fetch and mount files
      const baseUrl = import.meta.env.BASE_URL || '/';
      
      for (const file of filesToLoad) {
        onStatusUpdate(`Loading algorithm: ${file}...`);
        // Add cache-buster to prevent GitHub Pages from serving stale python scripts
        const fileUrl = `${baseUrl}src_py/${file}?v=${Date.now()}`;
        const res = await fetch(fileUrl);
        if (!res.ok) {
          throw new Error(`Failed to load ${fileUrl}: ${res.statusText}`);
        }
        const text = await res.text();
        pyodideInstance.FS.writeFile(`/target/src/${file}`, text);
      }
      
      // Inject __init__.py files so directories are treated as packages
      pyodideInstance.FS.writeFile('/target/__init__.py', '');
      pyodideInstance.FS.writeFile('/target/src/__init__.py', '');
      pyodideInstance.FS.writeFile('/target/src/core/__init__.py', '');
      pyodideInstance.FS.writeFile('/target/src/engines/__init__.py', '');
      pyodideInstance.FS.writeFile('/target/src/problems/__init__.py', '');
      
      // Add target folder to sys.path
      pyodideInstance.runPython(`
        import sys
        sys.path.append('/target')
      `);
      
      onStatusUpdate("Ready");
    } catch (err) {
      console.error("Pyodide initialization failed:", err);
      onStatusUpdate(`Error: ${err.message}`);
      throw err;
    }
  },
  
  async getPeas(category) {
    const code = `
from src.core.peas import get_peas_analysis
peas = get_peas_analysis(category)
import json
json.dumps({"performance": peas.performance_measure, "environment": peas.environment, "actuators": peas.actuators, "sensors": peas.sensors, "env_type": peas.env_type})
`;
    return runPythonCode(code, { category });
  },

  async generateMaze(size, density) {
    const code = `
from src.problems.maze import generate_maze
grid, start, goal = generate_maze(size, density)
import json
json.dumps({
    "grid": grid,
    "start": start,
    "goal": goal
})
`;
    return runPythonCode(code, { size, density });
  },

  async analyzeHeuristic(grid, goal, heuristic) {
    const code = `
from src.problems.maze import analyze_heuristic
import json

g_tuple = tuple(goal) if goal else (len(grid)-1, len(grid[0])-1)
analysis = analyze_heuristic(grid, g_tuple, heuristic)

json.dumps(analysis)
`;
    return runPythonCode(code, { grid, goal, heuristic });
  },
  
  async runSearch(algorithm, grid, start = null, goal = null, heuristic = "manhattan") {
    const code = `
from src.problems.maze import MazeProblem
from src.engines.search_engine import run_search
from src.core.advisor import generate_advisor_report
import json

s_tuple = tuple(start) if start else (0, 0)
g_tuple = tuple(goal) if goal else (len(grid)-1, len(grid[0])-1)

selected_algo = algorithm
advisor_report = None
if algorithm == "Auto-Select Best":
    selected_algo = "A*"
    advisor_report = generate_advisor_report("Search")

problem = MazeProblem(grid, s_tuple, g_tuple, heuristic_type=heuristic)
result = run_search(problem, selected_algo)

json.dumps({
    "path": result.path,
    "cost": result.cost,
    "nodes_expanded": result.nodes_expanded,
    "runtime": result.runtime,
    "visited_sequence": result.visited_sequence,
    "trace": result.trace,
    "auto_selected": selected_algo if algorithm == "Auto-Select Best" else None,
    "advisor_report": advisor_report
})
`;
    return runPythonCode(code, { algorithm, grid, start, goal, heuristic });
  },

  async runGraphSearch(algorithm, adjacencyList, startNode, goalNode, heuristics = null) {
    const code = `
from src.problems.graph import GraphProblem
from src.engines.search_engine import run_search
from src.core.advisor import generate_advisor_report
import json

selected_algo = algorithm
advisor_report = None
if algorithm == "Auto-Select Best":
    selected_algo = "A*"
    advisor_report = generate_advisor_report("Search")

problem = GraphProblem(adjacency_list, start, goal, heuristics=heuristics)
result = run_search(problem, selected_algo)

json.dumps({
    "path": result.path,
    "cost": result.cost,
    "nodes_expanded": result.nodes_expanded,
    "runtime": result.runtime,
    "visited_sequence": result.visited_sequence,
    "trace": result.trace,
    "auto_selected": selected_algo if algorithm == "Auto-Select Best" else None,
    "advisor_report": advisor_report
})
`;
    return runPythonCode(code, { algorithm, adjacency_list: adjacencyList, start: startNode, goal: goalNode, heuristics });
  },
  
  async runCsp(n, algorithm = "Backtracking (MRV+FC)") {
    const code = `
from src.problems.nqueens import NQueensProblem
from src.engines.csp_engine import run_csp, run_local_search

problem = NQueensProblem(n)

if algorithm == "Backtracking (MRV+FC)":
    result = run_csp(problem)
else:
    result = run_local_search(problem, algorithm)

res_dict = {
    "assignment": result.assignment,
    "assignments_tried": result.assignments_tried,
    "backtracks": result.backtracks,
    "runtime": result.runtime,
    "trace": result.trace[-50:],
    "visited_sequence": result.visited_sequence,
    "explainability_reports": result.explainability_reports
}
import json
json.dumps(res_dict)
`;
    return runPythonCode(code, { n, algorithm });
  },
  
  async runGame(algorithm, boardState, difficulty = 'hard') {
    const depthLimit = difficulty === 'hard' ? 9 : 2;
    const code = `
from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
from src.engines.game_engine import run_minimax
from src.core.advisor import generate_advisor_report
import random

selected_algo = algorithm
advisor_report = None
if algorithm == "Auto-Select Best":
    selected_algo = "Alpha-Beta Pruning"
    advisor_report = generate_advisor_report("Game")
    
use_alpha_beta = (selected_algo == "Alpha-Beta Pruning")

problem = TicTacToeProblem()

if boardState:
    board = [[' ' if cell is None else cell for cell in row] for row in boardState]
    x_count = sum(row.count('X') for row in board)
    o_count = sum(row.count('O') for row in board)
    is_x_turn = x_count <= o_count
    state = TicTacToeState(board, is_x_turn)
else:
    state = problem.get_initial_state()
    
is_terminal = problem.is_terminal(state)

def prune_tree(node, max_depth, current_depth=0):
    if not node:
        return None
    if current_depth >= max_depth:
        node["children"] = []
        return node
    node["children"] = [prune_tree(child, max_depth, current_depth + 1) for child in node.get("children", [])]
    return node

if is_terminal:
    res_dict = {
        "best_action": None,
        "expected_utility": problem.evaluate(state),
        "nodes_evaluated": 0,
        "pruned_branches": 0,
        "runtime": 0.0,
        "trace": ["Game is already over."],
        "is_terminal": True,
        "utility": problem.evaluate(state),
        "winning_line": state.get_winning_line(),
        "auto_selected": selected_algo if algorithm == "Auto-Select Best" else None,
        "advisor_report": advisor_report,
        "evaluation_tree": {
            "id": "root",
            "board": state.board,
            "is_max": problem.is_max_turn(state),
            "depth": depthLimit,
            "value": problem.evaluate(state),
            "pruned": False,
            "alpha": None,
            "beta": None,
            "children": []
        }
    }
else:
    result = run_minimax(problem, state, depthLimit, use_alpha_beta)
    
    # Friendly mode: 35% chance to make a random legal move instead of optimal minimax move
    if difficulty == "friendly" and not is_terminal:
        actions = problem.get_possible_actions(state)
        if actions and random.random() < 0.35:
            result.best_action = random.choice(actions)
            next_state_rand = problem.get_next_state(state, result.best_action)
            result.expected_utility = problem.evaluate(next_state_rand) if problem.is_terminal(next_state_rand) else 0.0
            result.trace.append("Friendly Mode: AI made a random sub-optimal move.")
            
    next_state = problem.get_next_state(state, result.best_action) if result.best_action else state
    is_term_next = problem.is_terminal(next_state)
    util_next = problem.evaluate(next_state) if is_term_next else None
    winning_line = next_state.get_winning_line() if is_term_next else None
    
    res_dict = {
        "best_action": result.best_action,
        "expected_utility": result.expected_utility,
        "nodes_evaluated": result.nodes_evaluated,
        "pruned_branches": result.pruned_branches,
        "runtime": result.runtime,
        "trace": result.trace[-50:],
        "is_terminal": is_term_next,
        "utility": util_next,
        "winning_line": winning_line,
        "auto_selected": selected_algo if algorithm == "Auto-Select Best" else None,
        "advisor_report": advisor_report,
        "evaluation_tree": prune_tree(result.evaluation_tree, 3)
    }
import json
json.dumps(res_dict)
`;
    return runPythonCode(code, { algorithm, boardState, difficulty, depthLimit });
  },
  
  async runBayes(method, queryVar, evidence, customCpts, numSamples = 5000) {
    const code = `
import traceback
try:
    from src.engines.bayes_engine import BayesNetwork, run_exact_inference, run_rejection_sampling

    bn = BayesNetwork()
    for name, data in customCpts.items():
        parents = data["parents"]
        table = {}
        for key_str, prob in data["table"].items():
            if key_str == "":
                key = ()
            else:
                key = tuple(k == "true" for k in key_str.split(","))
            table[key] = float(prob)
        bn.add_node(name, parents, table)

    if method == "Exact Enumeration":
        result = run_exact_inference(bn, queryVar, evidence)
    else:
        result = run_rejection_sampling(bn, queryVar, evidence, numSamples)

    res_dict = {
        "posterior_prob": result.posterior_prob,
        "runtime": result.runtime,
        "trace": result.trace
    }
except Exception as e:
    res_dict = {
        "error": str(e),
        "traceback": traceback.format_exc()
    }
import json
json.dumps(res_dict)
`;
    return runPythonCode(code, { method, queryVar, evidence, customCpts, numSamples });
  },
  
  async runAdvisor(graphData) {
    const code = `
from src.core.advisor import analyze_graph_features
result = analyze_graph_features(graphData)
json.dumps(result)
`;
    return runPythonCode(code, { graphData });
  },
  

  
  async runSchedule(relax_newton, relax_cohort) {
    const code = `
from src.problems.scheduling import SchedulingProblem
from src.engines.csp_engine import run_csp

problem = SchedulingProblem(relax_newton=relax_newton, relax_cohort=relax_cohort)
result = run_csp(problem)

res_dict = {
    "assignment": result.assignment,
    "assignments_tried": result.assignments_tried,
    "backtracks": result.backtracks,
    "runtime": result.runtime,
    "trace": result.trace,
    "visited_sequence": result.visited_sequence,
    "explainability_reports": result.explainability_reports
}
json.dumps(res_dict)
`;
    return runPythonCode(code, { relax_newton, relax_cohort });
  },

  async runNegotiation() {
    const code = `
from src.problems.negotiation import MultiAgentNegotiation
negotiation = MultiAgentNegotiation()
result = negotiation.run_auction()
import json
json.dumps(result)
`;
    return runPythonCode(code, {});
  },

  async runTimetable(courses, teachers, rooms, groups, config) {
    const code = `
from src.problems.timetable import TimetableProblem
from src.engines.timetable_engine import run_timetable
import json
import copy

courses_sim = copy.deepcopy(courses)
teachers_sim = copy.deepcopy(teachers)
rooms_sim = copy.deepcopy(rooms)
groups_sim = copy.deepcopy(groups)

periods_per_day = int(config["periods_per_day"])
days_per_week = int(config["days_per_week"])
total_slots = periods_per_day * days_per_week

group_total = {g["name"]: 0 for g in groups_sim}
for c in courses_sim:
    c_groups = c.get("groups", [])
    if not c_groups:
        c_groups = [g["name"] for g in groups_sim if c.get("name") in g.get("courses", [])]
    for g in c_groups:
        if g in group_total:
            group_total[g] += c.get("periods_required", 1)

for g_name, total in group_total.items():
    shortfall = total_slots - total
    if shortfall > 0:
        dummy_teacher = f"Self-Study ({g_name})"
        teachers_sim.append({
            "name": dummy_teacher,
            "max_periods_per_day": periods_per_day,
            "availability": []
        })
        dummy_room = f"Study Hall ({g_name})"
        rooms_sim.append({
            "name": dummy_room,
            "capacity": 999,
            "type": "Open Area"
        })
        courses_sim.append({
            "name": "Free Period",
            "teacher": dummy_teacher,
            "periods_required": shortfall,
            "groups": [g_name]
        })

problem = TimetableProblem(
    courses=courses_sim,
    teachers=teachers_sim,
    rooms=rooms_sim,
    groups=groups_sim,
    periods_per_day=periods_per_day,
    days_per_week=days_per_week
)

result = run_timetable(problem, config["solver"])

# Serialize assignment
assignment = result.assignment if result.solved else result.partial_assignment
serialized_assignment = {}
if assignment:
    for (cname, pidx), val in assignment.items():
        serialized_assignment[f"{cname}_{pidx}"] = list(val)

# Generate structured timetables per group and per teacher
group_timetables = {g["name"]: [[None for _ in range(int(config["periods_per_day"]))] for _ in range(int(config["days_per_week"]))] for g in groups_sim}
teacher_timetables = {t["name"]: [[None for _ in range(int(config["periods_per_day"]))] for _ in range(int(config["days_per_week"]))] for t in teachers_sim}


if assignment:
    for (cname, pidx), val in assignment.items():
        day, period, room = val
        c_info = problem.course_map[cname]
        tname = c_info.get("teacher")
        c_groups = problem.course_groups.get(cname, [])
        
        # Add to group grids
        for g in c_groups:
            if g in group_timetables:
                group_timetables[g][day][period] = {
                    "course": cname,
                    "teacher": tname,
                    "room": room
                }
        # Add to teacher grid
        if tname in teacher_timetables:
            teacher_timetables[tname][day][period] = {
                "course": cname,
                "groups": c_groups,
                "room": room
            }

res_dict = {
    "solved": result.solved,
    "assignment": serialized_assignment,
    "group_timetables": group_timetables,
    "teacher_timetables": teacher_timetables,
    "assignments_tried": result.assignments_tried,
    "backtracks": result.backtracks if config["solver"] == "Backtracking (MRV+FC)" else result.iterations,
    "runtime": result.runtime,
    "trace": result.trace[-100:],
    "unscheduled": result.unscheduled,
    "visited_sequence": result.visited_sequence,
    "explainability_reports": result.explainability_reports
}
json.dumps(res_dict)
`;
    return runPythonCode(code, { courses, teachers, rooms, groups, config });
  }
};
