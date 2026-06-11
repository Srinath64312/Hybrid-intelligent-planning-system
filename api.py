from flask import Flask, request, jsonify
from flask_cors import CORS

from src.core.peas import get_peas_analysis
from src.problems.maze import MazeProblem
from src.problems.nqueens import NQueensProblem
from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
from src.problems.diagnosis import build_medical_network
from src.engines.search_engine import run_search
from src.engines.csp_engine import run_csp
from src.engines.game_engine import run_minimax
from src.engines.bayes_engine import run_exact_inference, run_rejection_sampling
from src.core.advisor import generate_advisor_report, analyze_graph_features

app = Flask(__name__)
CORS(app)

@app.route("/api/peas/<category>", methods=["GET"])
def get_peas(category):
    peas = get_peas_analysis(category)
    return jsonify({
        "performance": peas.performance_measure,
        "environment": peas.environment,
        "actuators": peas.actuators,
        "sensors": peas.sensors,
        "env_type": peas.env_type
    })

@app.route("/api/search", methods=["POST"])
def run_search_api():
    data = request.json or {}
    algorithm = data.get("algorithm", "A*")
    
    selected_algo = algorithm
    advisor_report = None
    if algorithm == "Auto-Select Best":
        selected_algo = "A*"
        advisor_report = generate_advisor_report("Search")
    
    maze_grid = data.get("grid", [
        [0, 0, 0, 1, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ])
    problem = MazeProblem(maze_grid, (0, 0), (4, 4))
    result = run_search(problem, selected_algo)
    
    return jsonify({
        "path": result.path,
        "cost": result.cost,
        "nodes_expanded": result.nodes_expanded,
        "runtime": result.runtime,
        "trace": result.trace,
        "visited_sequence": result.visited_sequence,
        "auto_selected": selected_algo if algorithm == "Auto-Select Best" else None,
        "advisor_report": advisor_report
    })

@app.route("/api/csp", methods=["POST"])
def run_csp_api():
    data = request.json or {}
    n = data.get("n", 8)
    
    problem = NQueensProblem(n)
    result = run_csp(problem)
    
    return jsonify({
        "assignment": result.assignment,
        "assignments_tried": result.assignments_tried,
        "backtracks": result.backtracks,
        "runtime": result.runtime,
        "trace": result.trace[-50:]
    })

@app.route("/api/game", methods=["POST"])
def run_game_api():
    data = request.json or {}
    algorithm = data.get("algorithm", "Alpha-Beta Pruning")
    
    selected_algo = algorithm
    advisor_report = None
    if algorithm == "Auto-Select Best":
        selected_algo = "Alpha-Beta Pruning"
        advisor_report = generate_advisor_report("Game")
        
    use_alpha_beta = (selected_algo == "Alpha-Beta Pruning")
    
    board_data = data.get("state", None)
    problem = TicTacToeProblem()
    
    if board_data:
        board = [[' ' if cell is None else cell for cell in row] for row in board_data]
        x_count = sum(row.count('X') for row in board)
        o_count = sum(row.count('O') for row in board)
        is_x_turn = x_count <= o_count
        state = TicTacToeState(board, is_x_turn)
    else:
        state = problem.get_initial_state()
        
    is_terminal = problem.is_terminal(state)
    if is_terminal:
        return jsonify({
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
        })
    
    result = run_minimax(problem, state, 9, use_alpha_beta)
    
    next_state = problem.get_next_state(state, result.best_action) if result.best_action else state
    is_term_next = problem.is_terminal(next_state)
    util_next = problem.evaluate(next_state) if is_term_next else None
    winning_line = next_state.get_winning_line() if is_term_next else None
    
    return jsonify({
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
    })

@app.route("/api/bayes", methods=["POST"])
def run_bayes_api():
    data = request.json or {}
    method = data.get("method", "Exact Enumeration")
    evidence = data.get("evidence", {"Cough": True, "SoreThroat": True})
    
    bn = build_medical_network()
    
    if method == "Exact Enumeration":
        result = run_exact_inference(bn, "Flu", evidence)
    else:
        result = run_rejection_sampling(bn, "Flu", evidence, 5000)
        
    return jsonify({
        "posterior_prob": result.posterior_prob,
        "runtime": result.runtime,
        "trace": result.trace
    })

@app.route("/api/advisor", methods=["POST"])
def run_advisor_api():
    data = request.json or {}
    result = analyze_graph_features(data)
    return jsonify(result)

@app.route("/api/schedule", methods=["POST"])
def run_schedule_api():
    from src.problems.scheduling import SchedulingProblem
    data = request.json or {}
    relax_newton = data.get("relax_newton", False)
    relax_cohort = data.get("relax_cohort", False)
    
    problem = SchedulingProblem(relax_newton=relax_newton, relax_cohort=relax_cohort)
    result = run_csp(problem)
    
    return jsonify({
        "assignment": result.assignment,
        "assignments_tried": result.assignments_tried,
        "backtracks": result.backtracks,
        "runtime": result.runtime,
        "trace": result.trace
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
