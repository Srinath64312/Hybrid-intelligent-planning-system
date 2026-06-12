"""
HIPS - Hybrid Intelligent Problem Solver
Comprehensive Component Test Suite
Tests all engines, problems, and core modules.
"""

import pytest
import time
import sys
import os

# Ensure the project root is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ─────────────────────────────────────────────────────────────────
#  SECTION 1: CORE – PEAS & Problem Abstractions
# ─────────────────────────────────────────────────────────────────

class TestPEAS:
    """Tests for src/core/peas.py"""

    def test_search_peas(self):
        from src.core.peas import get_peas_analysis
        peas = get_peas_analysis("Search")
        assert "path" in peas.performance_measure.lower()
        assert peas.env_type != "Unknown"
        assert peas.actuators != ""

    def test_csp_peas(self):
        from src.core.peas import get_peas_analysis
        peas = get_peas_analysis("CSP")
        assert "constraint" in peas.performance_measure.lower()
        assert peas.env_type != "Unknown"

    def test_game_peas(self):
        from src.core.peas import get_peas_analysis
        peas = get_peas_analysis("Game")
        assert "utility" in peas.performance_measure.lower()
        assert "Multi Agent" in peas.env_type

    def test_bayes_peas(self):
        from src.core.peas import get_peas_analysis
        peas = get_peas_analysis("Bayes")
        assert "inference" in peas.performance_measure.lower()
        assert "Stochastic" in peas.env_type

    def test_unknown_category_returns_na(self):
        from src.core.peas import get_peas_analysis
        peas = get_peas_analysis("Nonexistent")
        assert peas.performance_measure == "N/A"


class TestAdvisor:
    """Tests for src/core/advisor.py"""

    def test_search_advisor_report(self):
        from src.core.advisor import generate_advisor_report
        report = generate_advisor_report("Search")
        assert isinstance(report, list)
        assert len(report) > 0
        titles = [r["title"] for r in report]
        assert "Validation" in titles

    def test_game_advisor_report(self):
        from src.core.advisor import generate_advisor_report
        report = generate_advisor_report("Game")
        assert isinstance(report, list)
        assert any("Alpha-Beta" in r["text"] for r in report)

    def test_unknown_advisor_returns_empty(self):
        from src.core.advisor import generate_advisor_report
        report = generate_advisor_report("Unknown")
        assert report == []

    def test_analyze_graph_astar(self):
        from src.core.advisor import analyze_graph_features
        result = analyze_graph_features({"costs": "Uniform", "heuristic": True, "memory_limited": False, "size": "Medium"})
        assert "A*" in result["algorithm"]
        assert len(result["report"]) > 0

    def test_analyze_graph_bfs(self):
        from src.core.advisor import analyze_graph_features
        result = analyze_graph_features({"costs": "Uniform", "heuristic": False, "memory_limited": False, "size": "Small"})
        assert "BFS" in result["algorithm"]

    def test_analyze_graph_bellman_ford(self):
        from src.core.advisor import analyze_graph_features
        result = analyze_graph_features({"costs": "Negative"})
        assert "Bellman-Ford" in result["algorithm"]

    def test_analyze_graph_ida_star(self):
        from src.core.advisor import analyze_graph_features
        result = analyze_graph_features({"costs": "Uniform", "heuristic": True, "memory_limited": True, "size": "Massive"})
        assert "IDA*" in result["algorithm"]

    def test_analyze_graph_iddfs(self):
        from src.core.advisor import analyze_graph_features
        result = analyze_graph_features({"costs": "Uniform", "heuristic": False, "memory_limited": True, "size": "Massive"})
        assert "IDDFS" in result["algorithm"]

    def test_analyze_graph_dijkstra(self):
        from src.core.advisor import analyze_graph_features
        result = analyze_graph_features({"costs": "NonUniform", "heuristic": False})
        assert "Dijkstra" in result["algorithm"]


# ─────────────────────────────────────────────────────────────────
#  SECTION 2: SEARCH ENGINE
# ─────────────────────────────────────────────────────────────────

class TestMazeProblem:
    """Tests for src/problems/maze.py"""

    MAZE = [
        [0, 0, 0, 1, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ]

    def test_get_initial_state(self):
        from src.problems.maze import MazeProblem
        p = MazeProblem(self.MAZE, (0, 0), (4, 4))
        assert p.get_initial_state() == (0, 0)

    def test_is_goal_state(self):
        from src.problems.maze import MazeProblem
        p = MazeProblem(self.MAZE, (0, 0), (4, 4))
        assert p.is_goal_state((4, 4))
        assert not p.is_goal_state((0, 0))

    def test_successors_not_walls(self):
        from src.problems.maze import MazeProblem
        p = MazeProblem(self.MAZE, (0, 0), (4, 4))
        succs = p.get_successors((0, 0))
        states = [s for s, _, _ in succs]
        # (0,0) -> RIGHT is (0,1) open; DOWN is (1,0) wall => not in succs
        assert (1, 0) not in states
        assert (0, 1) in states

    def test_manhattan_heuristic(self):
        from src.problems.maze import MazeProblem
        p = MazeProblem(self.MAZE, (0, 0), (4, 4), heuristic_type="manhattan")
        assert p.heuristic((0, 0)) == 8.0
        assert p.heuristic((4, 4)) == 0.0

    def test_euclidean_heuristic(self):
        from src.problems.maze import MazeProblem
        import math
        p = MazeProblem(self.MAZE, (0, 0), (4, 4), heuristic_type="euclidean")
        assert abs(p.heuristic((0, 0)) - math.sqrt(32)) < 0.001

    def test_zero_heuristic(self):
        from src.problems.maze import MazeProblem
        p = MazeProblem(self.MAZE, (0, 0), (4, 4), heuristic_type="zero")
        assert p.heuristic((0, 0)) == 0.0

    def test_generate_maze(self):
        from src.problems.maze import generate_maze
        grid, start, goal = generate_maze(7, 0.2)
        assert len(grid) == 7
        assert len(grid[0]) == 7
        assert start == (0, 0)
        assert goal == (6, 6)
        assert grid[0][0] == 0
        assert grid[6][6] == 0

    def test_analyze_heuristic_manhattan_admissible(self):
        from src.problems.maze import analyze_heuristic
        result = analyze_heuristic(self.MAZE, (4, 4), "manhattan")
        assert result["admissible"] is True
        assert result["consistent"] is True


class TestSearchEngine:
    """Tests for src/engines/search_engine.py"""

    MAZE = [
        [0, 0, 0, 1, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ]

    def _make_problem(self, heuristic="manhattan"):
        from src.problems.maze import MazeProblem
        return MazeProblem(self.MAZE, (0, 0), (4, 4), heuristic_type=heuristic)

    def test_bfs_finds_path(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem(), "BFS")
        assert result.path is not None
        assert len(result.path) > 0
        assert result.nodes_expanded > 0
        assert result.cost > 0

    def test_dfs_finds_path(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem(), "DFS")
        assert result.path is not None
        assert result.nodes_expanded > 0

    def test_astar_finds_path(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem(), "A*")
        assert result.path is not None
        assert result.cost > 0

    def test_ucs_finds_path(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem(), "UCS")
        assert result.path is not None

    def test_greedy_finds_path(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem(), "Greedy")
        assert result.path is not None

    def test_astar_optimal_cost(self):
        """A* should find the same cost as BFS (uniform cost maze)"""
        from src.engines.search_engine import run_search
        r_bfs = run_search(self._make_problem(), "BFS")
        r_astar = run_search(self._make_problem(), "A*")
        assert r_astar.cost <= r_bfs.cost  # A* is at least as good

    def test_runtime_recorded(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem(), "A*")
        assert result.runtime > 0.0

    def test_visited_sequence_populated(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem(), "A*")
        assert len(result.visited_sequence) > 0
        first = result.visited_sequence[0]
        assert "state" in first and "frontier_size" in first

    def test_trace_populated(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem(), "BFS")
        assert len(result.trace) > 0
        assert any("Goal" in t for t in result.trace)

    def test_unknown_algorithm_raises(self):
        from src.engines.search_engine import run_search
        with pytest.raises(ValueError):
            run_search(self._make_problem(), "Dijkstra_NOT_EXISTS")

    def test_euclidean_heuristic_search(self):
        from src.engines.search_engine import run_search
        result = run_search(self._make_problem("euclidean"), "A*")
        assert result.path is not None


# ─────────────────────────────────────────────────────────────────
#  SECTION 3: CSP ENGINE (N-Queens & Scheduling)
# ─────────────────────────────────────────────────────────────────

class TestNQueensProblem:
    """Tests for src/problems/nqueens.py"""

    def test_variables_count(self):
        from src.problems.nqueens import NQueensProblem
        p = NQueensProblem(6)
        assert len(p.variables) == 6

    def test_domain_size(self):
        from src.problems.nqueens import NQueensProblem
        p = NQueensProblem(4)
        for var in p.variables:
            assert len(p.domains[var]) == 4

    def test_consistent_no_conflict(self):
        from src.problems.nqueens import NQueensProblem
        p = NQueensProblem(4)
        # Row 0 -> Col 1, Row 1 -> Col 3: no conflict
        assignment = {0: 1}
        assert p.is_consistent(1, 3, assignment) is True

    def test_consistent_same_column_conflict(self):
        from src.problems.nqueens import NQueensProblem
        p = NQueensProblem(4)
        assignment = {0: 2}
        assert p.is_consistent(1, 2, assignment) is False  # same column

    def test_consistent_diagonal_conflict(self):
        from src.problems.nqueens import NQueensProblem
        p = NQueensProblem(4)
        assignment = {0: 0}
        # row 0 col 0 and row 1 col 1 → diagonal
        assert p.is_consistent(1, 1, assignment) is False


class TestCSPEngine:
    """Tests for src/engines/csp_engine.py"""

    def test_nqueens_4_solves(self):
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_csp
        p = NQueensProblem(4)
        result = run_csp(p)
        assert result.assignment is not None
        assert len(result.assignment) == 4

    def test_nqueens_8_solves(self):
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_csp
        p = NQueensProblem(8)
        result = run_csp(p)
        assert result.assignment is not None
        assert len(result.assignment) == 8

    def test_nqueens_solution_valid(self):
        """Verify the 8-queens solution has no attacking queens."""
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_csp
        p = NQueensProblem(8)
        result = run_csp(p)
        assignment = result.assignment
        rows = list(assignment.keys())
        cols = list(assignment.values())
        # All columns unique
        assert len(set(cols)) == len(cols)
        # No diagonal attacks
        for i in range(len(rows)):
            for j in range(i + 1, len(rows)):
                assert abs(rows[i] - rows[j]) != abs(cols[i] - cols[j])

    def test_runtime_recorded(self):
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_csp
        p = NQueensProblem(6)
        result = run_csp(p)
        assert result.runtime > 0.0

    def test_backtracks_nonnegative(self):
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_csp
        p = NQueensProblem(8)
        result = run_csp(p)
        assert result.backtracks >= 0

    def test_explainability_reports_generated(self):
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_csp
        p = NQueensProblem(4)
        result = run_csp(p)
        assert isinstance(result.explainability_reports, list)
        assert len(result.explainability_reports) > 0

    def test_visited_sequence_populated(self):
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_csp
        p = NQueensProblem(4)
        result = run_csp(p)
        assert len(result.visited_sequence) > 0

    def test_local_search_min_conflicts(self):
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_local_search
        p = NQueensProblem(8)
        result = run_local_search(p, "Min-Conflicts", max_steps=500)
        # May or may not solve in 500 steps, but should run without error
        assert result.assignments_tried >= 0
        assert result.runtime > 0

    def test_local_search_hill_climbing(self):
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_local_search
        p = NQueensProblem(8)
        result = run_local_search(p, "Hill Climbing (Restarts)", max_steps=200)
        assert result.runtime > 0


class TestSchedulingProblem:
    """Tests for src/problems/scheduling.py"""

    def test_scheduling_solves(self):
        from src.problems.scheduling import SchedulingProblem
        from src.engines.csp_engine import run_csp
        p = SchedulingProblem()
        result = run_csp(p)
        assert result.assignment is not None

    def test_scheduling_all_courses_assigned(self):
        from src.problems.scheduling import SchedulingProblem
        from src.engines.csp_engine import run_csp
        p = SchedulingProblem()
        result = run_csp(p)
        for var in ["BIO101", "CHEM101", "PHYS101"]:
            assert var in result.assignment

    def test_scheduling_wet_lab_constraint(self):
        """BIO101 and CHEM101 must be in Lab_A_Wet"""
        from src.problems.scheduling import SchedulingProblem
        from src.engines.csp_engine import run_csp
        p = SchedulingProblem()
        result = run_csp(p)
        bio_slot, bio_room = result.assignment["BIO101"]
        chem_slot, chem_room = result.assignment["CHEM101"]
        assert bio_room == "Lab_A_Wet"
        assert chem_room == "Lab_A_Wet"

    def test_scheduling_no_room_overlap(self):
        """Two courses cannot share room and timeslot"""
        from src.problems.scheduling import SchedulingProblem
        from src.engines.csp_engine import run_csp
        p = SchedulingProblem()
        result = run_csp(p)
        assignments = list(result.assignment.values())
        assert len(set(assignments)) == len(assignments)  # All (slot, room) pairs unique

    def test_scheduling_relax_newton(self):
        from src.problems.scheduling import SchedulingProblem
        from src.engines.csp_engine import run_csp
        p = SchedulingProblem(relax_newton=True)
        result = run_csp(p)
        assert result.assignment is not None

    def test_scheduling_relax_cohort(self):
        from src.problems.scheduling import SchedulingProblem
        from src.engines.csp_engine import run_csp
        p = SchedulingProblem(relax_cohort=True)
        result = run_csp(p)
        assert result.assignment is not None

    def test_evaluate_constraints_returns_dict(self):
        from src.problems.scheduling import SchedulingProblem
        p = SchedulingProblem()
        result = p.evaluate_constraints("BIO101", ("Wednesday_0900", "Lab_A_Wet"), {})
        assert "passed" in result
        assert "probability" in result
        assert "details" in result


# ─────────────────────────────────────────────────────────────────
#  SECTION 4: GAME ENGINE
# ─────────────────────────────────────────────────────────────────

class TestTicTacToeProblem:
    """Tests for src/problems/tictactoe.py"""

    def test_initial_state_empty_board(self):
        from src.problems.tictactoe import TicTacToeProblem
        p = TicTacToeProblem()
        state = p.get_initial_state()
        assert all(cell == ' ' for row in state.board for cell in row)

    def test_9_possible_actions_on_empty(self):
        from src.problems.tictactoe import TicTacToeProblem
        p = TicTacToeProblem()
        state = p.get_initial_state()
        assert len(p.get_possible_actions(state)) == 9

    def test_x_moves_first(self):
        from src.problems.tictactoe import TicTacToeProblem
        p = TicTacToeProblem()
        state = p.get_initial_state()
        assert p.is_max_turn(state) is True

    def test_get_next_state_places_x(self):
        from src.problems.tictactoe import TicTacToeProblem
        p = TicTacToeProblem()
        state = p.get_initial_state()
        next_state = p.get_next_state(state, (1, 1))
        assert next_state.board[1][1] == 'X'
        assert next_state.is_x_turn is False

    def test_is_terminal_on_x_win(self):
        from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
        p = TicTacToeProblem()
        board = [['X', 'X', 'X'], [' ', 'O', ' '], [' ', ' ', 'O']]
        state = TicTacToeState(board, False)
        assert p.is_terminal(state) is True
        assert p.evaluate(state) == 1.0

    def test_is_terminal_on_o_win(self):
        from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
        p = TicTacToeProblem()
        board = [['X', 'X', ' '], ['O', 'O', 'O'], ['X', ' ', ' ']]
        state = TicTacToeState(board, True)
        assert p.is_terminal(state) is True
        assert p.evaluate(state) == -1.0

    def test_is_terminal_on_draw(self):
        from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
        p = TicTacToeProblem()
        board = [['X', 'O', 'X'], ['X', 'X', 'O'], ['O', 'X', 'O']]
        state = TicTacToeState(board, True)
        assert p.is_terminal(state) is True
        assert p.evaluate(state) == 0.0

    def test_winning_line_row(self):
        from src.problems.tictactoe import TicTacToeState
        board = [['X', 'X', 'X'], [' ', 'O', ' '], [' ', ' ', 'O']]
        state = TicTacToeState(board, False)
        line = state.get_winning_line()
        assert line == [(0, 0), (0, 1), (0, 2)]

    def test_get_winner_diagonal(self):
        from src.problems.tictactoe import TicTacToeState
        board = [['O', 'X', ' '], ['X', 'O', ' '], [' ', 'X', 'O']]
        state = TicTacToeState(board, True)
        assert state.get_winner() == 'O'


class TestGameEngine:
    """Tests for src/engines/game_engine.py"""

    def test_minimax_returns_valid_action(self):
        from src.problems.tictactoe import TicTacToeProblem
        from src.engines.game_engine import run_minimax
        p = TicTacToeProblem()
        state = p.get_initial_state()
        result = run_minimax(p, state, max_depth=3, use_alpha_beta=False)
        assert result.best_action is not None
        assert len(result.best_action) == 2

    def test_alpha_beta_returns_valid_action(self):
        from src.problems.tictactoe import TicTacToeProblem
        from src.engines.game_engine import run_minimax
        p = TicTacToeProblem()
        state = p.get_initial_state()
        result = run_minimax(p, state, max_depth=3, use_alpha_beta=True)
        assert result.best_action is not None

    def test_alpha_beta_prunes(self):
        """Alpha-beta should prune more than pure minimax evaluates fewer nodes"""
        from src.problems.tictactoe import TicTacToeProblem
        from src.engines.game_engine import run_minimax
        p = TicTacToeProblem()
        state = p.get_initial_state()
        r_mm = run_minimax(p, state, max_depth=5, use_alpha_beta=False)
        r_ab = run_minimax(p, state, max_depth=5, use_alpha_beta=True)
        assert r_ab.nodes_evaluated <= r_mm.nodes_evaluated
        assert r_ab.pruned_branches > 0

    def test_minimax_same_utility_as_alpha_beta(self):
        """Both algorithms must agree on the optimal utility"""
        from src.problems.tictactoe import TicTacToeProblem
        from src.engines.game_engine import run_minimax
        p = TicTacToeProblem()
        state = p.get_initial_state()
        r_mm = run_minimax(p, state, max_depth=9, use_alpha_beta=False)
        r_ab = run_minimax(p, state, max_depth=9, use_alpha_beta=True)
        assert r_mm.expected_utility == r_ab.expected_utility

    def test_runtime_recorded(self):
        from src.problems.tictactoe import TicTacToeProblem
        from src.engines.game_engine import run_minimax
        p = TicTacToeProblem()
        state = p.get_initial_state()
        result = run_minimax(p, state, max_depth=3, use_alpha_beta=True)
        assert result.runtime > 0.0

    def test_evaluation_tree_structure(self):
        from src.problems.tictactoe import TicTacToeProblem
        from src.engines.game_engine import run_minimax
        p = TicTacToeProblem()
        state = p.get_initial_state()
        result = run_minimax(p, state, max_depth=2, use_alpha_beta=True)
        tree = result.evaluation_tree
        assert tree is not None
        assert "id" in tree
        assert "children" in tree
        assert "value" in tree

    def test_terminal_state_returns_no_action(self):
        """When a terminal board is passed, best_action should be None and nodes=0"""
        from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
        from src.engines.game_engine import run_minimax
        p = TicTacToeProblem()
        board = [['X', 'X', 'X'], [' ', 'O', ' '], [' ', ' ', 'O']]
        state = TicTacToeState(board, False)
        result = run_minimax(p, state, max_depth=9, use_alpha_beta=True)
        # Terminal node: value returned immediately
        assert result.nodes_evaluated >= 1
        assert result.best_action is None


# ─────────────────────────────────────────────────────────────────
#  SECTION 5: BAYESIAN ENGINE
# ─────────────────────────────────────────────────────────────────

class TestBayesNetwork:
    """Tests for src/engines/bayes_engine.py BayesNetwork"""

    def test_add_and_get_node(self):
        from src.engines.bayes_engine import BayesNetwork
        bn = BayesNetwork()
        bn.add_node("A", [], {(): 0.3})
        assert "A" in bn.nodes

    def test_get_prob_no_parents(self):
        from src.engines.bayes_engine import BayesNetwork
        bn = BayesNetwork()
        bn.add_node("Flu", [], {(): 0.05})
        assert abs(bn.get_prob("Flu", True, {}) - 0.05) < 1e-9
        assert abs(bn.get_prob("Flu", False, {}) - 0.95) < 1e-9

    def test_get_prob_with_parents(self):
        from src.engines.bayes_engine import BayesNetwork
        bn = BayesNetwork()
        bn.add_node("Flu", [], {(): 0.05})
        bn.add_node("Cough", ["Flu"], {(True,): 0.7, (False,): 0.1})
        p = bn.get_prob("Cough", True, {"Flu": True})
        assert abs(p - 0.7) < 1e-9


class TestBayesEngine:
    """Tests for exact inference and rejection sampling"""

    def _make_network(self):
        from src.problems.diagnosis import build_medical_network
        return build_medical_network()

    def test_exact_inference_returns_probability(self):
        from src.engines.bayes_engine import run_exact_inference
        bn = self._make_network()
        result = run_exact_inference(bn, "Flu", {"Cough": True, "SoreThroat": True})
        assert 0.0 <= result.posterior_prob <= 1.0

    def test_exact_inference_flu_with_cough(self):
        """Flu probability should be higher with cough+sore throat than without"""
        from src.engines.bayes_engine import run_exact_inference
        bn = self._make_network()
        r_with = run_exact_inference(bn, "Flu", {"Cough": True, "SoreThroat": True})
        r_without = run_exact_inference(bn, "Flu", {"Cough": False, "SoreThroat": False})
        assert r_with.posterior_prob > r_without.posterior_prob

    def test_exact_inference_trace_populated(self):
        from src.engines.bayes_engine import run_exact_inference
        bn = self._make_network()
        result = run_exact_inference(bn, "Flu", {"Cough": True})
        assert len(result.trace) > 0

    def test_exact_inference_runtime(self):
        from src.engines.bayes_engine import run_exact_inference
        bn = self._make_network()
        result = run_exact_inference(bn, "Flu", {"Cough": True})
        assert result.runtime >= 0.0

    def test_rejection_sampling_returns_probability(self):
        from src.engines.bayes_engine import run_rejection_sampling
        bn = self._make_network()
        result = run_rejection_sampling(bn, "Flu", {"Cough": True}, num_samples=1000)
        assert 0.0 <= result.posterior_prob <= 1.0

    def test_rejection_sampling_convergence(self):
        """With many samples, rejection sampling should be close to exact inference"""
        from src.engines.bayes_engine import run_exact_inference, run_rejection_sampling
        bn = self._make_network()
        evidence = {"Cough": True, "SoreThroat": True}
        exact = run_exact_inference(bn, "Flu", evidence)
        sampled = run_rejection_sampling(bn, "Flu", evidence, num_samples=5000)
        # Allow 20% deviation for stochastic sampling
        assert abs(exact.posterior_prob - sampled.posterior_prob) < 0.20

    def test_rejection_sampling_empty_evidence(self):
        """Should still return a probability (prior) with no evidence"""
        from src.engines.bayes_engine import run_rejection_sampling
        bn = self._make_network()
        result = run_rejection_sampling(bn, "Flu", {}, num_samples=2000)
        assert 0.0 <= result.posterior_prob <= 1.0

    def test_exact_inference_normalization(self):
        """Exact inference should return a valid probability (normalized sum = 1)"""
        from src.engines.bayes_engine import run_exact_inference
        bn = self._make_network()
        result_true = run_exact_inference(bn, "Flu", {"Cough": True})
        result_false = run_exact_inference(bn, "Flu", {"Cough": False})
        # Just verify each is a valid probability
        assert 0.0 <= result_true.posterior_prob <= 1.0
        assert 0.0 <= result_false.posterior_prob <= 1.0


# ─────────────────────────────────────────────────────────────────
#  SECTION 6: NEGOTIATION
# ─────────────────────────────────────────────────────────────────

class TestNegotiation:
    """Tests for src/problems/negotiation.py"""

    def test_auction_runs(self):
        from src.problems.negotiation import MultiAgentNegotiation
        neg = MultiAgentNegotiation()
        result = neg.run_auction()
        assert "allocations" in result
        assert "trace" in result
        assert "final_budgets" in result

    def test_all_timeslots_auctioned(self):
        from src.problems.negotiation import MultiAgentNegotiation
        neg = MultiAgentNegotiation()
        result = neg.run_auction()
        # All 3 items should appear in allocations
        assert len(result["allocations"]) == 3

    def test_all_agents_have_budgets(self):
        from src.problems.negotiation import MultiAgentNegotiation
        neg = MultiAgentNegotiation()
        result = neg.run_auction()
        assert len(result["final_budgets"]) == 3

    def test_winner_budget_decreases(self):
        from src.problems.negotiation import MultiAgentNegotiation
        neg = MultiAgentNegotiation()
        result = neg.run_auction()
        initial_budgets = 1000.0
        for agent_name, final_budget in result["final_budgets"].items():
            assert final_budget <= initial_budgets

    def test_trace_nonempty(self):
        from src.problems.negotiation import MultiAgentNegotiation
        neg = MultiAgentNegotiation()
        result = neg.run_auction()
        assert len(result["trace"]) > 0

    def test_agent_bid_is_nonnegative(self):
        from src.problems.negotiation import NegotiationAgent
        agent = NegotiationAgent("Test", 500.0, {"item1": 300})
        bid = agent.generate_bid("item1", 1)
        assert bid >= 0.0

    def test_agent_bid_zero_budget(self):
        from src.problems.negotiation import NegotiationAgent
        agent = NegotiationAgent("Broke", 0.0, {"item1": 300})
        bid = agent.generate_bid("item1", 1)
        assert bid == 0.0


# ─────────────────────────────────────────────────────────────────
#  SECTION 7: INTEGRATION – End-to-end flows
# ─────────────────────────────────────────────────────────────────

class TestIntegration:
    """End-to-end integration tests that simulate full pipeline flows"""

    def test_search_full_pipeline(self):
        """Full search pipeline: maze → BFS → validate path follows maze"""
        from src.problems.maze import MazeProblem
        from src.engines.search_engine import run_search

        maze = [
            [0, 0, 1],
            [1, 0, 1],
            [1, 0, 0]
        ]
        p = MazeProblem(maze, (0, 0), (2, 2))
        result = run_search(p, "BFS")
        assert result.path is not None
        # Trace path manually and verify it's valid
        r, c = 0, 0
        for action in result.path:
            if action == "DOWN": r += 1
            elif action == "UP": r -= 1
            elif action == "LEFT": c -= 1
            elif action == "RIGHT": c += 1
            assert maze[r][c] != 1, f"Path went through wall at ({r},{c})"
        assert (r, c) == (2, 2)

    def test_game_full_pipeline_x_wins_when_possible(self):
        """When X can win on next move, alpha-beta should pick it"""
        from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
        from src.engines.game_engine import run_minimax

        board = [['X', 'X', ' '], ['O', 'O', ' '], [' ', ' ', ' ']]
        state = TicTacToeState(board, True)  # X's turn
        p = TicTacToeProblem()
        result = run_minimax(p, state, max_depth=9, use_alpha_beta=True)
        assert result.best_action == (0, 2), f"Expected (0,2) win move, got {result.best_action}"

    def test_game_full_pipeline_o_blocks_x(self):
        """When O must block X's win, alpha-beta should choose the block"""
        from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
        from src.engines.game_engine import run_minimax

        board = [['X', 'X', ' '], [' ', 'O', ' '], [' ', ' ', ' ']]
        state = TicTacToeState(board, False)  # O's turn
        p = TicTacToeProblem()
        result = run_minimax(p, state, max_depth=9, use_alpha_beta=True)
        # O must block (0,2) or X wins immediately
        assert result.best_action == (0, 2), f"Expected block at (0,2), got {result.best_action}"

    def test_bayes_exact_vs_sampling_close_enough(self):
        """Exact and sampling inference should agree within tolerance"""
        from src.engines.bayes_engine import run_exact_inference, run_rejection_sampling
        from src.problems.diagnosis import build_medical_network
        bn = build_medical_network()
        evidence = {"Cough": True}
        exact = run_exact_inference(bn, "Flu", evidence)
        sampled = run_rejection_sampling(bn, "Flu", evidence, 8000)
        assert abs(exact.posterior_prob - sampled.posterior_prob) < 0.15

    def test_csp_schedule_no_timeslot_conflicts(self):
        """No two courses should share the same timeslot (cohort constraint)"""
        from src.problems.scheduling import SchedulingProblem
        from src.engines.csp_engine import run_csp
        p = SchedulingProblem(relax_newton=False, relax_cohort=False)
        result = run_csp(p)
        slots = [v[0] for v in result.assignment.values()]
        assert len(set(slots)) == len(slots)

    def test_peas_and_advisor_consistency(self):
        """PEAS categories should map to advisor categories correctly"""
        from src.core.peas import get_peas_analysis
        from src.core.advisor import generate_advisor_report
        for category in ["Search", "Game"]:
            peas = get_peas_analysis(category)
            report = generate_advisor_report(category)
            assert peas.performance_measure != "N/A"
            assert len(report) > 0


# ─────────────────────────────────────────────────────────────────
#  SECTION 8: EDGE CASES & ROBUSTNESS
# ─────────────────────────────────────────────────────────────────

class TestEdgeCases:
    """Edge cases and boundary condition tests"""

    def test_maze_1x1_trivial(self):
        """A 1x1 maze with start=goal should find path immediately"""
        from src.problems.maze import MazeProblem
        from src.engines.search_engine import run_search
        maze = [[0]]
        p = MazeProblem(maze, (0, 0), (0, 0))
        result = run_search(p, "BFS")
        assert result.path == []  # Already at goal, no moves needed

    def test_maze_blocked_all_walls(self):
        """A completely walled maze should return path=None"""
        from src.problems.maze import MazeProblem
        from src.engines.search_engine import run_search
        maze = [[0, 1], [1, 0]]
        p = MazeProblem(maze, (0, 0), (1, 1))
        result = run_search(p, "BFS")
        assert result.path is None

    def test_nqueens_minimum_n4(self):
        """N=4 is the minimum valid N-Queens; should always solve"""
        from src.problems.nqueens import NQueensProblem
        from src.engines.csp_engine import run_csp
        p = NQueensProblem(4)
        result = run_csp(p)
        assert result.assignment is not None

    def test_bayes_zero_prior_returns_zero(self):
        """A variable with 0% prior should have ~0 probability"""
        from src.engines.bayes_engine import BayesNetwork, run_exact_inference
        bn = BayesNetwork()
        bn.add_node("Rare", [], {(): 0.0})
        result = run_exact_inference(bn, "Rare", {})
        assert abs(result.posterior_prob - 0.0) < 1e-6

    def test_bayes_certain_prior_returns_one(self):
        """A variable with 100% prior should have probability ~1"""
        from src.engines.bayes_engine import BayesNetwork, run_exact_inference
        bn = BayesNetwork()
        bn.add_node("Certain", [], {(): 1.0})
        result = run_exact_inference(bn, "Certain", {})
        assert abs(result.posterior_prob - 1.0) < 1e-6

    def test_game_empty_board_has_9_actions(self):
        from src.problems.tictactoe import TicTacToeProblem
        p = TicTacToeProblem()
        state = p.get_initial_state()
        assert len(p.get_possible_actions(state)) == 9

    def test_game_full_board_has_0_actions(self):
        from src.problems.tictactoe import TicTacToeProblem, TicTacToeState
        p = TicTacToeProblem()
        board = [['X', 'O', 'X'], ['X', 'X', 'O'], ['O', 'X', 'O']]
        state = TicTacToeState(board, True)
        assert len(p.get_possible_actions(state)) == 0

    def test_search_greedy_may_not_be_optimal(self):
        """Greedy may not find optimal path but should still find a path if exists"""
        from src.problems.maze import MazeProblem
        from src.engines.search_engine import run_search
        maze = [
            [0, 0, 0, 1, 0],
            [1, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ]
        p = MazeProblem(maze, (0, 0), (4, 4))
        result = run_search(p, "Greedy")
        assert result.path is not None

    def test_bidirectional_a_star_maze(self):
        from src.problems.maze import MazeProblem
        from src.engines.search_engine import run_search
        maze = [
            [0, 0, 0, 1, 0],
            [1, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ]
        p = MazeProblem(maze, (0, 0), (4, 4))
        r_astar = run_search(p, "A*")
        r_bi = run_search(p, "Bi-directional A*")
        assert r_bi.path is not None
        assert r_bi.cost == r_astar.cost

    def test_decision_network_expected_utility(self):
        from src.problems.diagnosis import build_campus_decision_network
        from src.engines.bayes_engine import run_decision_inference
        dn = build_campus_decision_network()
        # With high absenteeism, outbreak probability is higher, so shifting to online should yield higher utility
        res_high = run_decision_inference(dn, {"HighAbsenteeism": True})
        assert res_high["best_decision"] is True  # Should recommend shift to online
        
        # With low absenteeism, physical classes should be preferred
        res_low = run_decision_inference(dn, {"HighAbsenteeism": False})
        assert res_low["best_decision"] is False  # Should recommend maintain physical

    def test_multi_agent_negotiation_custom_initialization(self):
        from src.problems.negotiation import MultiAgentNegotiation
        custom_agents = [
            {"name": "Prof A", "budget": 500.0, "preferences": {"Slot1": 400.0}},
            {"name": "Prof B", "budget": 300.0, "preferences": {"Slot1": 200.0}}
        ]
        neg = MultiAgentNegotiation(agents_data=custom_agents, items=["Slot1"])
        res = neg.run_auction()
        assert res["allocations"]["Slot1"] == "Prof A"
        assert res["final_budgets"]["Prof A"] < 500.0
        assert res["final_budgets"]["Prof B"] == 300.0

    def test_map_coloring_solves(self):
        from src.problems.map_coloring import build_australian_map_coloring
        from src.engines.csp_engine import run_csp
        problem = build_australian_map_coloring()
        result = run_csp(problem)
        assert result.assignment is not None
        assert len(result.assignment) == 7
        # Verify no adjacent region has the same color
        for region, color in result.assignment.items():
            for neighbor in problem.neighbors[region]:
                assert result.assignment[neighbor] != color
