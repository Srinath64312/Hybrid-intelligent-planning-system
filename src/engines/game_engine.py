import time
from typing import Tuple, Optional, Any
from src.core.problem import GameProblem

class GameResult:
    def __init__(self):
        self.best_action = None
        self.expected_utility = 0.0
        self.nodes_evaluated = 0
        self.pruned_branches = 0
        self.runtime = 0.0
        self.trace = []

def run_minimax(problem: GameProblem, state: Any, max_depth: int, use_alpha_beta: bool = True) -> GameResult:
    result = GameResult()
    start_time = time.perf_counter()
    
    if use_alpha_beta:
        utility, action = _alpha_beta(problem, state, max_depth, float('-inf'), float('inf'), result)
    else:
        utility, action = _minimax(problem, state, max_depth, result)
        
    result.best_action = action
    result.expected_utility = utility
    result.runtime = time.perf_counter() - start_time
    return result

def _minimax(problem: GameProblem, state: Any, depth: int, result: GameResult) -> Tuple[float, Optional[Any]]:
    result.nodes_evaluated += 1
    if depth == 0 or problem.is_terminal(state):
        return problem.evaluate(state), None

    best_action = None
    if problem.is_max_turn(state):
        max_eval = float('-inf')
        for action in problem.get_possible_actions(state):
            eval_score, _ = _minimax(problem, problem.get_next_state(state, action), depth - 1, result)
            if eval_score > max_eval:
                max_eval = eval_score
                best_action = action
        return max_eval, best_action
    else:
        min_eval = float('inf')
        for action in problem.get_possible_actions(state):
            eval_score, _ = _minimax(problem, problem.get_next_state(state, action), depth - 1, result)
            if eval_score < min_eval:
                min_eval = eval_score
                best_action = action
        return min_eval, best_action

def _alpha_beta(problem: GameProblem, state: Any, depth: int, alpha: float, beta: float, result: GameResult) -> Tuple[float, Optional[Any]]:
    result.nodes_evaluated += 1
    if depth == 0 or problem.is_terminal(state):
        return problem.evaluate(state), None

    best_action = None
    if problem.is_max_turn(state):
        max_eval = float('-inf')
        for action in problem.get_possible_actions(state):
            eval_score, _ = _alpha_beta(problem, problem.get_next_state(state, action), depth - 1, alpha, beta, result)
            if eval_score > max_eval:
                max_eval = eval_score
                best_action = action
            alpha = max(alpha, eval_score)
            if beta <= alpha:
                result.pruned_branches += 1
                result.trace.append(f"Pruned branch at max node (alpha={alpha:.2f}, beta={beta:.2f})")
                break
        return max_eval, best_action
    else:
        min_eval = float('inf')
        for action in problem.get_possible_actions(state):
            eval_score, _ = _alpha_beta(problem, problem.get_next_state(state, action), depth - 1, alpha, beta, result)
            if eval_score < min_eval:
                min_eval = eval_score
                best_action = action
            beta = min(beta, eval_score)
            if beta <= alpha:
                result.pruned_branches += 1
                result.trace.append(f"Pruned branch at min node (alpha={alpha:.2f}, beta={beta:.2f})")
                break
        return min_eval, best_action
