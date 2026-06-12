import argparse
from src.core.peas import get_peas_analysis
from src.problems.maze import MazeProblem
from src.problems.nqueens import NQueensProblem
from src.problems.tictactoe import TicTacToeProblem
from src.problems.diagnosis import build_medical_network
from src.engines.search_engine import run_search
from src.engines.csp_engine import run_csp
from src.engines.game_engine import run_minimax
from src.engines.bayes_engine import run_exact_inference, run_rejection_sampling

def main():
    parser = argparse.ArgumentParser(description="HIPS Command Line Interface")
    parser.add_argument("--problem", type=str, choices=["search", "csp", "game", "bayes"], required=True, help="Which solver to run")
    args = parser.parse_args()

    print("="*60)
    print(" Hybrid Intelligent Problem Solver (HIPS) - CLI ")
    print("="*60)

    if args.problem == "search":
        print("[HIPS] Starting Search Engine: Maze Solving")
        maze_grid = [
            [0, 0, 0, 1, 0],
            [1, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ]
        problem = MazeProblem(maze_grid, (0, 0), (4, 4))
        result = run_search(problem, "A*")
        
        print("\n--- Reasoning Trace ---")
        for t in result.trace: print(f"[*] {t}")
            
        print("\n--- Final Metrics ---")
        print(f"Path Found: {result.path}")
        print(f"Nodes Expanded: {result.nodes_expanded}")
        print(f"Runtime: {result.runtime:.4f}s")
        
    elif args.problem == "csp":
        print("[HIPS] Starting CSP Engine: N-Queens (N=8)")
        problem = NQueensProblem(8)
        result = run_csp(problem)
        print("\n--- Final Metrics ---")
        print(f"Assignments Tried: {result.assignments_tried}")
        print(f"Backtracks: {result.backtracks}")
        print(f"Runtime: {result.runtime:.4f}s")
        print(f"Final Assignment: {result.assignment}")
        
        print("\n" + "="*40)
        print("[HIPS] Starting CSP Engine: Australia Map Coloring")
        from src.problems.map_coloring import build_australian_map_coloring
        problem_map = build_australian_map_coloring()
        result_map = run_csp(problem_map)
        print("--- Final Metrics ---")
        print(f"Assignments Tried: {result_map.assignments_tried}")
        print(f"Backtracks: {result_map.backtracks}")
        print(f"Runtime: {result_map.runtime:.4f}s")
        print(f"Final Assignment: {result_map.assignment}")
        
    elif args.problem == "game":
        print("[HIPS] Starting Game Engine: Tic-Tac-Toe")
        problem = TicTacToeProblem()
        result = run_minimax(problem, problem.get_initial_state(), 9, True)
        print("\n--- Final Metrics ---")
        print(f"Best First Move for X: {result.best_action}")
        print(f"Expected Utility: {result.expected_utility}")
        print(f"Nodes Evaluated: {result.nodes_evaluated}")
        print(f"Branches Pruned: {result.pruned_branches}")
        print(f"Runtime: {result.runtime:.4f}s")
        
    elif args.problem == "bayes":
        print("[HIPS] Starting Bayes Engine: Medical Diagnosis")
        bn = build_medical_network()
        evidence = {"Cough": True, "SoreThroat": True}
        result = run_exact_inference(bn, "Flu", evidence)
        print("\n--- Reasoning Trace ---")
        for t in result.trace: print(f"[*] {t}")
        print("\n--- Final Metrics ---")
        print(f"Probability of Flu: {result.posterior_prob*100:.2f}%")
        print(f"Runtime: {result.runtime:.4f}s")

if __name__ == "__main__":
    main()
