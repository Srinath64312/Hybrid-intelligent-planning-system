from flask import Flask, request, jsonify
from flask_cors import CORS

from src.core.peas import get_peas_analysis
from src.problems.maze import MazeProblem
from src.problems.nqueens import NQueensProblem
from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
from src.problems.diagnosis import build_medical_network, build_campus_decision_network
from src.engines.search_engine import run_search
from src.engines.csp_engine import run_csp
from src.engines.game_engine import run_minimax
from src.engines.bayes_engine import run_exact_inference, run_rejection_sampling, run_decision_inference
from src.core.advisor import generate_advisor_report, analyze_graph_features
from src.problems.timetable import TimetableProblem
from src.engines.timetable_engine import run_timetable
from src.problems.negotiation import MultiAgentNegotiation

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
    
    problem_type = data.get("problem_type", "maze")
    if problem_type == "graph":
        from src.problems.graph import GraphProblem
        raw_adj = data.get("adjacency_list", {})
        adj_list = {}
        for k, v in raw_adj.items():
            adj_list[k] = [(item[0], float(item[1])) for item in v]
        start = data.get("start", "")
        goal = data.get("goal", "")
        heuristics = {k: float(v) for k, v in data.get("heuristics", {}).items()}
        problem = GraphProblem(adj_list, start, goal, heuristics)
    else:
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
    problem_type = data.get("problem_type", "nqueens")
    
    if problem_type == "map_coloring":
        from src.problems.map_coloring import build_australian_map_coloring
        problem = build_australian_map_coloring()
    else:
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

@app.route("/api/decision", methods=["POST"])
def run_decision_api():
    data = request.json or {}
    evidence = data.get("evidence", {"HighAbsenteeism": True})
    dn = build_campus_decision_network()
    result = run_decision_inference(dn, evidence)
    return jsonify(result)

@app.route("/api/negotiation/auction", methods=["POST"])
def run_negotiation_api():
    data = request.json or {}
    agents_data = data.get("agents")
    items = data.get("items")
    neg = MultiAgentNegotiation(agents_data=agents_data, items=items)
    result = neg.run_auction()
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

last_timetable_data = None

@app.route("/api/timetable/generate", methods=["POST"])
def generate_timetable_api():
    global last_timetable_data
    try:
        data = request.json or {}
        courses = data.get("courses")
        teachers = data.get("teachers")
        rooms = data.get("rooms")
        groups = data.get("groups")
        
        # Validation checks
        if not courses or not isinstance(courses, list):
            return jsonify({"error": "Missing or invalid 'courses' field. Must be a non-empty list."}), 400
        if not teachers or not isinstance(teachers, list):
            return jsonify({"error": "Missing or invalid 'teachers' field. Must be a non-empty list."}), 400
        if not rooms or not isinstance(rooms, list):
            return jsonify({"error": "Missing or invalid 'rooms' field. Must be a non-empty list."}), 400
        if not groups or not isinstance(groups, list):
            return jsonify({"error": "Missing or invalid 'groups' field. Must be a non-empty list."}), 400
            
        config = data.get("config", {})
        periods_per_day = int(config.get("periods_per_day", 6))
        days_per_week = int(config.get("days_per_week", 5))
        solver_choice = config.get("solver", "Backtracking (MRV+FC)")

        # Deep copy to avoid polluting the original data references
        import copy
        courses_sim = copy.deepcopy(courses)
        teachers_sim = copy.deepcopy(teachers)
        rooms_sim = copy.deepcopy(rooms)
        groups_sim = copy.deepcopy(groups)

        # Inject Free Periods to guarantee no empty spaces
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
                    "name": f"Free Period",
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
        
        result = run_timetable(problem, solver_choice)
        
        # Prepare serialization
        assignment = result.assignment if result.solved else result.partial_assignment
        serialized_assignment = {}
        if assignment:
            for (cname, pidx), val in assignment.items():
                serialized_assignment[f"{cname}_{pidx}"] = list(val)
                
        # Generate structured timetables per group and per teacher
        group_timetables = {g["name"]: [[None for _ in range(periods_per_day)] for _ in range(days_per_week)] for g in groups}
        teacher_timetables = {t["name"]: [[None for _ in range(periods_per_day)] for _ in range(days_per_week)] for t in teachers}
        
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

        # Cache data for export
        last_timetable_data = {
            "assignment": serialized_assignment,
            "courses": courses,
            "teachers": teachers,
            "rooms": rooms,
            "groups": groups,
            "periods_per_day": periods_per_day,
            "days_per_week": days_per_week,
            "group_timetables": group_timetables,
            "teacher_timetables": teacher_timetables
        }

        return jsonify({
            "solved": result.solved,
            "assignment": serialized_assignment,
            "group_timetables": group_timetables,
            "teacher_timetables": teacher_timetables,
            "assignments_tried": result.assignments_tried,
            "backtracks": result.backtracks if solver_choice == "Backtracking (MRV+FC)" else result.iterations,
            "runtime": result.runtime,
            "trace": result.trace[-100:],
            "unscheduled": result.unscheduled
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An error occurred while generating the timetable: {str(e)}"}), 500

@app.route("/api/timetable/validate", methods=["POST"])
def validate_timetable_api():
    try:
        data = request.json or {}
        courses = data.get("courses")
        teachers = data.get("teachers")
        rooms = data.get("rooms")
        groups = data.get("groups")
        config = data.get("config", {})
        periods_per_day = int(config.get("periods_per_day", 6))
        days_per_week = int(config.get("days_per_week", 5))
        assignment_data = data.get("assignment", {})
        
        problem = TimetableProblem(
            courses=courses,
            teachers=teachers,
            rooms=rooms,
            groups=groups,
            periods_per_day=periods_per_day,
            days_per_week=days_per_week
        )
        
        assignment = {}
        for k, v in assignment_data.items():
            parts = k.rsplit("_", 1)
            if len(parts) == 2:
                cname, pidx = parts[0], int(parts[1])
                assignment[(cname, pidx)] = tuple(v)
                
        violations = []
        for var, val in assignment.items():
            temp_assignment = {v: val for v, val in assignment.items() if v != var}
            eval_report = problem.evaluate_constraints(var, val, temp_assignment)
            if not eval_report["passed"]:
                for detail in eval_report["details"]:
                    if not detail["passed"]:
                        violations.append({
                            "variable": f"{var[0]}_{var[1]}",
                            "course": var[0],
                            "period_index": var[1],
                            "value": val,
                            "constraint": detail["name"],
                            "reason": detail["reason"]
                        })
                        
        return jsonify({
            "valid": len(violations) == 0,
            "violations": violations
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An error occurred while validating: {str(e)}"}), 500

@app.route("/api/timetable/export/<export_format>", methods=["GET"])
def export_timetable_api(export_format):
    global last_timetable_data
    if not last_timetable_data:
        return jsonify({"error": "No timetable data found. Generate a timetable first."}), 400
        
    export_format = export_format.lower()
    
    assignment = last_timetable_data["assignment"]
    periods_per_day = last_timetable_data["periods_per_day"]
    days_per_week = last_timetable_data["days_per_week"]
    courses = last_timetable_data["courses"]
    group_timetables = last_timetable_data["group_timetables"]
    teacher_timetables = last_timetable_data["teacher_timetables"]
    
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    if export_format == "csv":
        import csv
        import io
        from flask import make_response
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Day", "Period", "Type", "Owner", "Course", "Room/Teacher Info"])
        
        # Output group timetables
        for gname, grid in group_timetables.items():
            writer.writerow([])
            writer.writerow([f"TIMETABLE FOR STUDENT GROUP: {gname}"])
            header = ["Day / Period"] + [f"Period {p+1}" for p in range(periods_per_day)]
            writer.writerow(header)
            for d in range(days_per_week):
                day_label = day_names[d] if d < len(day_names) else f"Day {d+1}"
                row = [day_label]
                for p in range(periods_per_day):
                    cell = grid[d][p]
                    if cell:
                        row.append(f"{cell['course']} ({cell['teacher']} @ {cell['room']})")
                    else:
                        row.append("-")
                writer.writerow(row)
                
        # Output teacher timetables
        for tname, grid in teacher_timetables.items():
            writer.writerow([])
            writer.writerow([f"TIMETABLE FOR TEACHER: {tname}"])
            header = ["Day / Period"] + [f"Period {p+1}" for p in range(periods_per_day)]
            writer.writerow(header)
            for d in range(days_per_week):
                day_label = day_names[d] if d < len(day_names) else f"Day {d+1}"
                row = [day_label]
                for p in range(periods_per_day):
                    cell = grid[d][p]
                    if cell:
                        groups_str = ",".join(cell["groups"])
                        row.append(f"{cell['course']} (Groups: {groups_str} @ {cell['room']})")
                    else:
                        row.append("-")
                writer.writerow(row)
                
        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = "attachment; filename=timetable.csv"
        response.headers["Content-type"] = "text/csv"
        return response

    elif export_format == "pdf":
        from flask import make_response
        try:
            from fpdf import FPDF
        except ImportError:
            text_out = "Please run 'pip install fpdf2' to get real PDF export.\n\n"
            for gname, grid in group_timetables.items():
                text_out += f"--- {gname} Timetable ---\n"
                for d in range(days_per_week):
                    day_label = day_names[d] if d < len(day_names) else f"Day {d+1}"
                    text_out += f"{day_label}: "
                    for p in range(periods_per_day):
                        cell = grid[d][p]
                        if cell:
                            text_out += f"[{cell['course']} ({cell['room']})] "
                        else:
                            text_out += "[-]"
                    text_out += "\n"
                text_out += "\n"
            
            response = make_response(text_out)
            response.headers["Content-Disposition"] = "attachment; filename=timetable.txt"
            response.headers["Content-type"] = "text/plain"
            return response
            
        class PDF(FPDF):
            def header(self):
                self.set_font('Helvetica', 'B', 14)
                self.cell(0, 10, 'HIPS Campus Timetable Report', 0, 1, 'C')
                self.ln(5)
            def footer(self):
                self.set_y(-15)
                self.set_font('Helvetica', 'I', 8)
                self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')
                
        pdf = PDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        col_width = 180 / (periods_per_day + 1)
        
        # Add Group Timetables
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, 'Student Group Timetables', 0, 1, 'L')
        pdf.ln(5)
        
        for gname, grid in group_timetables.items():
            pdf.set_font('Helvetica', 'B', 10)
            pdf.cell(0, 8, f'Group: {gname}', 0, 1, 'L')
            
            pdf.set_font('Helvetica', 'B', 8)
            pdf.cell(col_width, 7, 'Day', 1, 0, 'C')
            for p in range(periods_per_day):
                pdf.cell(col_width, 7, f'P{p+1}', 1, 0, 'C')
            pdf.ln()
            
            pdf.set_font('Helvetica', '', 7)
            for d in range(days_per_week):
                day_label = day_names[d] if d < len(day_names) else f"D{d+1}"
                pdf.cell(col_width, 10, day_label, 1, 0, 'C')
                for p in range(periods_per_day):
                    cell = grid[d][p]
                    if cell:
                        pdf.cell(col_width, 10, f"{cell['course']} ({cell['room']})", 1, 0, 'C')
                    else:
                        pdf.cell(col_width, 10, '-', 1, 0, 'C')
                pdf.ln()
            pdf.ln(10)
            
        # Add Teacher Timetables
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, 'Teacher Timetables', 0, 1, 'L')
        pdf.ln(5)
        
        for tname, grid in teacher_timetables.items():
            pdf.set_font('Helvetica', 'B', 10)
            pdf.cell(0, 8, f'Teacher: {tname}', 0, 1, 'L')
            
            pdf.set_font('Helvetica', 'B', 8)
            pdf.cell(col_width, 7, 'Day', 1, 0, 'C')
            for p in range(periods_per_day):
                pdf.cell(col_width, 7, f'P{p+1}', 1, 0, 'C')
            pdf.ln()
            
            pdf.set_font('Helvetica', '', 7)
            for d in range(days_per_week):
                day_label = day_names[d] if d < len(day_names) else f"D{d+1}"
                pdf.cell(col_width, 10, day_label, 1, 0, 'C')
                for p in range(periods_per_day):
                    cell = grid[d][p]
                    if cell:
                        pdf.cell(col_width, 10, f"{cell['course']} ({cell['room']})", 1, 0, 'C')
                    else:
                        pdf.cell(col_width, 10, '-', 1, 0, 'C')
                pdf.ln()
            pdf.ln(10)
            
        # We output using latin-1 encoding
        response = make_response(pdf.output(dest='S').encode('latin-1'))
        response.headers["Content-Disposition"] = "attachment; filename=timetable.pdf"
        response.headers["Content-type"] = "application/pdf"
        return response
        
    else:
        return jsonify({"error": f"Unsupported format: {export_format}"}), 400

if __name__ == "__main__":
    app.run(debug=True, port=5000)
