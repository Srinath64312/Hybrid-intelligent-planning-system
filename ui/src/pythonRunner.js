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
  'problems/scheduling.py'
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
      pyGlobals.delete(`_js_input_${key}`);
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
        const fileUrl = `${baseUrl}src_py/${file}`;
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
json.dumps({
    "performance": peas.performance_measure,
    "environment": peas.environment,
    "actuators": peas.actuators,
    "sensors": peas.sensors,
    "env_type": peas.env_type
})
`;
    return runPythonCode(code, { category });
  },
  
  async runSearch(algorithm, grid) {
    const code = `
from src.problems.maze import MazeProblem
from src.engines.search_engine import run_search
from src.core.advisor import generate_advisor_report

selected_algo = algorithm
advisor_report = None
if algorithm == "Auto-Select Best":
    selected_algo = "A*"
    advisor_report = generate_advisor_report("Search")

problem = MazeProblem(grid, (0, 0), (4, 4))
result = run_search(problem, selected_algo)

res_dict = {
    "path": result.path,
    "cost": result.cost,
    "nodes_expanded": result.nodes_expanded,
    "runtime": result.runtime,
    "trace": result.trace,
    "auto_selected": selected_algo if algorithm == "Auto-Select Best" else None,
    "advisor_report": advisor_report
}
json.dumps(res_dict)
`;
    return runPythonCode(code, { algorithm, grid });
  },
  
  async runCsp(n) {
    const code = `
from src.problems.nqueens import NQueensProblem
from src.engines.csp_engine import run_csp

problem = NQueensProblem(n)
result = run_csp(problem)

res_dict = {
    "assignment": result.assignment,
    "assignments_tried": result.assignments_tried,
    "backtracks": result.backtracks,
    "runtime": result.runtime,
    "trace": result.trace[-50:]
}
json.dumps(res_dict)
`;
    return runPythonCode(code, { n });
  },
  
  async runGame(algorithm, boardState) {
    const code = `
from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
from src.engines.game_engine import run_minimax
from src.core.advisor import generate_advisor_report

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
        "advisor_report": advisor_report
    }
else:
    result = run_minimax(problem, state, 9, use_alpha_beta)
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
        "advisor_report": advisor_report
    }
json.dumps(res_dict)
`;
    return runPythonCode(code, { algorithm, boardState });
  },
  
  async runBayes(method, evidence) {
    const code = `
from src.problems.diagnosis import build_medical_network
from src.engines.bayes_engine import run_exact_inference, run_rejection_sampling

bn = build_medical_network()

if method == "Exact Enumeration":
    result = run_exact_inference(bn, "Flu", evidence)
else:
    result = run_rejection_sampling(bn, "Flu", evidence, 5000)

res_dict = {
    "posterior_prob": result.posterior_prob,
    "runtime": result.runtime,
    "trace": result.trace
}
json.dumps(res_dict)
`;
    return runPythonCode(code, { method, evidence });
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
    "trace": result.trace
}
json.dumps(res_dict)
`;
    return runPythonCode(code, { relax_newton, relax_cohort });
  }
};
