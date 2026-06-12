# pyrefly: ignore [missing-import]
import streamlit as st
from src.core.peas import get_peas_analysis
from src.problems.maze import MazeProblem
from src.problems.nqueens import NQueensProblem
from src.problems.tictactoe import TicTacToeProblem
from src.problems.diagnosis import build_medical_network
from src.engines.search_engine import run_search
from src.engines.csp_engine import run_csp
from src.engines.game_engine import run_minimax
from src.engines.bayes_engine import run_exact_inference, run_rejection_sampling

st.set_page_config(page_title="Hybrid Intelligent Problem Solver", layout="wide")

st.sidebar.title("HIPS Dashboard")
problem_category = st.sidebar.radio("Select Problem Category", 
    ["Search Solver", "CSP Solver", "Game AI", "Bayesian Reasoning", "Timetable Generator", "Multi-Agent Auction", "Decision Network"])

def display_peas(category):
    st.subheader("PEAS Analysis")
    peas = get_peas_analysis(category)
    st.write(f"**Performance:** {peas.performance_measure}")
    st.write(f"**Environment:** {peas.environment}")
    st.write(f"**Actuators:** {peas.actuators}")
    st.write(f"**Sensors:** {peas.sensors}")
    st.write(f"**Env Type:** {peas.env_type}")

if problem_category == "Search Solver":
    st.header("Search Engine: Maze Solving")
    display_peas("Search")
    
    maze_grid = [
        [0, 0, 0, 1, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ]
    st.text("Maze Map (0=Path, 1=Wall):")
    st.text("\n".join(str(row) for row in maze_grid))
    
    algo = st.sidebar.selectbox("Algorithm", ["BFS", "DFS", "A*", "Bi-directional A*"])
    if st.button("Solve Maze"):
        problem = MazeProblem(maze_grid, (0, 0), (4, 4))
        result = run_search(problem, algo)
        st.write(f"**Path Found:** {result.path}")
        st.write(f"**Cost:** {result.cost}, **Nodes Expanded:** {result.nodes_expanded}")
        st.write(f"**Runtime:** {result.runtime:.4f}s")
        with st.expander("Show Trace"):
            for t in result.trace: st.text(t)

elif problem_category == "CSP Solver":
    st.header("CSP Engine Solver")
    display_peas("CSP")
    
    csp_choice = st.selectbox("Select CSP Example", ["N-Queens", "Map Coloring (Australia)"])
    
    if csp_choice == "N-Queens":
        n = st.number_input("N (Board Size)", min_value=4, max_value=12, value=8)
        if st.button("Solve N-Queens"):
            problem = NQueensProblem(n)
            result = run_csp(problem)
            st.write(f"**Assignments Tried:** {result.assignments_tried}")
            st.write(f"**Backtracks:** {result.backtracks}")
            st.write(f"**Runtime:** {result.runtime:.4f}s")
            st.write("**Final Assignment (Row -> Col):**")
            st.json(result.assignment)
            with st.expander("Show Trace"):
                for t in result.trace: st.text(t)
    else:
        st.write("Color regional nodes (WA, NT, SA, Q, NSW, V, T) using Red, Green, and Blue such that no adjacent regions share a color.")
        from src.problems.map_coloring import build_australian_map_coloring
        if st.button("Solve Map Coloring"):
            problem = build_australian_map_coloring()
            result = run_csp(problem)
            st.write(f"**Assignments Tried:** {result.assignments_tried}")
            st.write(f"**Backtracks:** {result.backtracks}")
            st.write(f"**Runtime:** {result.runtime:.4f}s")
            st.write("**Final Coloring Assignments:**")
            st.json(result.assignment)
            with st.expander("Show Trace"):
                for t in result.trace: st.text(t)

elif problem_category == "Game AI":
    st.header("Game Engine: Tic-Tac-Toe (AI vs AI)")
    display_peas("Game")
    algo = st.sidebar.selectbox("Algorithm", ["Minimax", "Alpha-Beta Pruning"])
    
    if st.button("Calculate First Move"):
        problem = TicTacToeProblem()
        state = problem.get_initial_state()
        result = run_minimax(problem, state, max_depth=9, use_alpha_beta=(algo=="Alpha-Beta Pruning"))
        st.write(f"**Best Move:** {result.best_action}")
        st.write(f"**Expected Utility:** {result.expected_utility}")
        st.write(f"**Nodes Evaluated:** {result.nodes_evaluated}")
        if algo == "Alpha-Beta Pruning":
            st.write(f"**Branches Pruned:** {result.pruned_branches}")
        st.write(f"**Runtime:** {result.runtime:.4f}s")

elif problem_category == "Bayesian Reasoning":
    st.header("Bayes Engine: Medical Diagnosis")
    display_peas("Bayes")
    st.text("Network: Flu -> SoreThroat; Flu & Smokes -> Cough")
    
    st.sidebar.subheader("Evidence")
    has_cough = st.sidebar.checkbox("Has Cough", value=True)
    has_sore_throat = st.sidebar.checkbox("Has Sore Throat", value=True)
    
    method = st.sidebar.selectbox("Inference Method", ["Exact Enumeration", "Rejection Sampling"])
    
    if st.button("Run Inference (Query: Flu=True)"):
        bn = build_medical_network()
        evidence = {"Cough": has_cough, "SoreThroat": has_sore_throat}
        if method == "Exact Enumeration":
            result = run_exact_inference(bn, "Flu", evidence)
        else:
            result = run_rejection_sampling(bn, "Flu", evidence, num_samples=5000)
            
        st.write(f"**Probability of Flu:** {result.posterior_prob*100:.2f}%")
        st.write(f"**Runtime:** {result.runtime:.4f}s")
        with st.expander("Show Trace"):
            for t in result.trace: st.text(t)

elif problem_category == "Timetable Generator":
    st.header("Timetable Generator")
    display_peas("Timetable")
    
    import json
    import os
    import pandas as pd
    from src.problems.timetable import TimetableProblem
    from src.engines.timetable_engine import run_timetable
    
    # Load sample data
    sample_path = os.path.join("sample_data", "timetable_sample.json")
    with open(sample_path, "r") as f:
        sample_data = json.load(f)
        
    st.sidebar.subheader("Configuration")
    solver = st.sidebar.selectbox("Solver Choice", ["Backtracking (MRV+FC)", "Simulated Annealing", "Genetic Algorithm"])
    periods_per_day = st.sidebar.slider("Periods Per Day", 4, 10, 6)
    days_per_week = st.sidebar.slider("Days Per Week", 3, 7, 5)
    
    st.write("### Input Dataset Preview")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.write(f"**Courses:** {len(sample_data['courses'])}")
        st.json([c["name"] for c in sample_data["courses"]])
    with col2:
        st.write(f"**Teachers:** {len(sample_data['teachers'])}")
        st.json([t["name"] for t in sample_data["teachers"]])
    with col3:
        st.write(f"**Rooms:** {len(sample_data['rooms'])}")
        st.json([r["name"] for r in sample_data["rooms"]])
    with col4:
        st.write(f"**Student Groups:** {len(sample_data['groups'])}")
        st.json([g["name"] for g in sample_data["groups"]])
        
    if st.button("Generate Timetable Matrix"):
        problem = TimetableProblem(
            courses=sample_data["courses"],
            teachers=sample_data["teachers"],
            rooms=sample_data["rooms"],
            groups=sample_data["groups"],
            periods_per_day=periods_per_day,
            days_per_week=days_per_week
        )
        
        result = run_timetable(problem, solver)
        
        st.write("---")
        st.subheader("Solver Performance Metrics")
        st.write(f"**Status:** {'Full Solution Found' if result.solved else 'Partial Solution (Conflicts Exist)'}")
        st.write(f"**Time Taken:** {result.runtime:.4f}s")
        st.write(f"**Assignments Evaluated:** {result.assignments_tried}")
        st.write(f"**Backtracks/Iterations:** {result.backtracks}")
        
        if result.unscheduled:
            st.warning("The following courses could not be scheduled fully:")
            for item in result.unscheduled:
                st.write(f"- **{item['course']}**: {item['reason']}")
                
        # Generate and show grids per student group
        st.write("### Cohort Weekly Grids")
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        groups_list = sample_data["groups"]
        teachers_list = sample_data["teachers"]
        
        assignment = result.assignment if result.solved else result.partial_assignment
        
        group_grids = {g["name"]: [["" for _ in range(periods_per_day)] for _ in range(days_per_week)] for g in groups_list}
        teacher_grids = {t["name"]: [["" for _ in range(periods_per_day)] for _ in range(days_per_week)] for t in teachers_list}
        
        if assignment:
            for (cname, pidx), val in assignment.items():
                day, period, room = val
                c_info = problem.course_map[cname]
                tname = c_info.get("teacher")
                c_groups = problem.course_groups.get(cname, [])
                
                # Group grid
                for g in c_groups:
                    if g in group_grids:
                        group_grids[g][day][period] = f"{cname} ({room})"
                # Teacher grid
                if tname in teacher_grids:
                    teacher_grids[tname][day][period] = f"{cname} ({room})"

        for gname, grid in group_grids.items():
            st.write(f"#### Cohort: {gname}")
            df = pd.DataFrame(
                grid,
                index=[day_names[d] for d in range(days_per_week)],
                columns=[f"Period {p+1}" for p in range(periods_per_day)]
            )
            st.table(df)
            
        st.write("### Teacher Weekly Grids")
        for tname, grid in teacher_grids.items():
            st.write(f"#### Instructor: {tname}")
            df = pd.DataFrame(
                grid,
                index=[day_names[d] for d in range(days_per_week)],
                columns=[f"Period {p+1}" for p in range(periods_per_day)]
            )
            st.table(df)
            
        with st.expander("Show AI Engine Solving Trace"):
            for t in result.trace[-100:]:
                st.text(t)

elif problem_category == "Multi-Agent Auction":
    st.header("Multi-Agent Negotiation: Course/Slot Auction")
    display_peas("CSP")
    st.write("Instructors submit bids for their preferred timeslots under budget limits. The system resolves allocations via a Vickrey second-price auction.")
    
    from src.problems.negotiation import MultiAgentNegotiation
    
    if st.button("Simulate Bidding War"):
        neg = MultiAgentNegotiation()
        res = neg.run_auction()
        
        st.success("Negotiation Completed!")
        st.write("### Allocations")
        st.json(res["allocations"])
        
        st.write("### Final Budgets")
        st.json(res["final_budgets"])
        
        with st.expander("Show Auction Bidding Log"):
            for log in res["trace"]:
                st.text(log)

elif problem_category == "Decision Network":
    st.header("Bayesian Decision Network: Campus Outbreak Advisory")
    display_peas("Bayes")
    st.write("Influence Diagram: Outbreak -> HighAbsenteeism; Outbreak & HighAbsenteeism & ShiftToOnline -> CampusUtility")
    
    st.sidebar.subheader("Evidence")
    high_absenteeism = st.sidebar.checkbox("High Absenteeism Observed", value=True)
    
    from src.problems.diagnosis import build_campus_decision_network
    from src.engines.bayes_engine import run_decision_inference
    
    if st.button("Evaluate Optimal Administrative Action"):
        dn = build_campus_decision_network()
        evidence = {"HighAbsenteeism": high_absenteeism}
        res = run_decision_inference(dn, evidence)
        
        st.write(f"### Recommended Action: **{'Shift to Online classes' if res['best_decision'] else 'Maintain Physical classes'}**")
        st.write(f"**Max Expected Utility (EU):** {res['best_eu']:.2f}")
        
        st.write("Expected Utility breakdown:")
        for decision_val, eu_val in res["results"].items():
            label = "Shift to Online" if decision_val == "True" else "Maintain Physical"
            st.write(f"- {label}: Expected Utility = **{eu_val:.2f}**")
            
        with st.expander("Show Decision Inference Trace"):
            for t in res["trace"]:
                st.text(t)
