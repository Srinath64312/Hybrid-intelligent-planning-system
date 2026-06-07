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
    ["Search Solver", "CSP Solver", "Game AI", "Bayesian Reasoning"])

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
    
    algo = st.sidebar.selectbox("Algorithm", ["BFS", "DFS", "A*"])
    if st.button("Solve Maze"):
        problem = MazeProblem(maze_grid, (0, 0), (4, 4))
        result = run_search(problem, algo)
        st.write(f"**Path Found:** {result.path}")
        st.write(f"**Cost:** {result.cost}, **Nodes Expanded:** {result.nodes_expanded}")
        st.write(f"**Runtime:** {result.runtime:.4f}s")
        with st.expander("Show Trace"):
            for t in result.trace: st.text(t)

elif problem_category == "CSP Solver":
    st.header("CSP Engine: N-Queens")
    display_peas("CSP")
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
