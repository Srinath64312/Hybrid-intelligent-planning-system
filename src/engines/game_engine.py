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
        self.evaluation_tree = None

def serialize_val(v):
    if v == float('inf'): return "Infinity"
    if v == float('-inf'): return "-Infinity"
    return v

def run_minimax(problem: GameProblem, state: Any, max_depth: int, use_alpha_beta: bool = True) -> GameResult:
    result = GameResult()
    start_time = time.perf_counter()
    
    if use_alpha_beta:
        utility, action, tree = _alpha_beta(problem, state, max_depth, float('-inf'), float('inf'), result)
    else:
        utility, action, tree = _minimax(problem, state, max_depth, result)
        
    result.best_action = action
    result.expected_utility = utility
    result.evaluation_tree = tree
    result.runtime = time.perf_counter() - start_time
    return result

def _minimax(problem: GameProblem, state: Any, depth: int, result: GameResult, path_id: str = "root") -> Tuple[float, Optional[Any], dict]:
    result.nodes_evaluated += 1
    board_state = state.board if hasattr(state, 'board') else None
    
    node_dict = {
        "id": path_id,
        "board": board_state,
        "is_max": problem.is_max_turn(state),
        "depth": depth,
        "value": None,
        "pruned": False,
        "alpha": None,
        "beta": None,
        "children": []
    }
    
    if depth == 0 or problem.is_terminal(state):
        val = problem.evaluate(state)
        node_dict["value"] = val
        return val, None, node_dict

    best_action = None
    if problem.is_max_turn(state):
        max_eval = float('-inf')
        for action in problem.get_possible_actions(state):
            child_state = problem.get_next_state(state, action)
            child_path_id = f"{path_id}-{action[0]}_{action[1]}"
            eval_score, _, child_node = _minimax(problem, child_state, depth - 1, result, child_path_id)
            node_dict["children"].append(child_node)
            if eval_score > max_eval:
                max_eval = eval_score
                best_action = action
        node_dict["value"] = max_eval
        return max_eval, best_action, node_dict
    else:
        min_eval = float('inf')
        for action in problem.get_possible_actions(state):
            child_state = problem.get_next_state(state, action)
            child_path_id = f"{path_id}-{action[0]}_{action[1]}"
            eval_score, _, child_node = _minimax(problem, child_state, depth - 1, result, child_path_id)
            node_dict["children"].append(child_node)
            if eval_score < min_eval:
                min_eval = eval_score
                best_action = action
        node_dict["value"] = min_eval
        return min_eval, best_action, node_dict

def _alpha_beta(problem: GameProblem, state: Any, depth: int, alpha: float, beta: float, result: GameResult, path_id: str = "root") -> Tuple[float, Optional[Any], dict]:
    result.nodes_evaluated += 1
    board_state = state.board if hasattr(state, 'board') else None
    
    node_dict = {
        "id": path_id,
        "board": board_state,
        "is_max": problem.is_max_turn(state),
        "depth": depth,
        "value": None,
        "pruned": False,
        "alpha": serialize_val(alpha),
        "beta": serialize_val(beta),
        "children": []
    }
    
    if depth == 0 or problem.is_terminal(state):
        val = problem.evaluate(state)
        node_dict["value"] = val
        return val, None, node_dict

    best_action = None
    actions = problem.get_possible_actions(state)
    
    if problem.is_max_turn(state):
        max_eval = float('-inf')
        pruned_active = False
        for action in actions:
            child_path_id = f"{path_id}-{action[0]}_{action[1]}"
            if pruned_active:
                try:
                    child_state = problem.get_next_state(state, action)
                    child_board = child_state.board if hasattr(child_state, 'board') else None
                except Exception:
                    child_board = None
                node_dict["children"].append({
                    "id": child_path_id,
                    "board": child_board,
                    "is_max": not problem.is_max_turn(state),
                    "depth": depth - 1,
                    "value": None,
                    "pruned": True,
                    "alpha": serialize_val(alpha),
                    "beta": serialize_val(beta),
                    "children": []
                })
                continue
                
            child_state = problem.get_next_state(state, action)
            eval_score, _, child_node = _alpha_beta(problem, child_state, depth - 1, alpha, beta, result, child_path_id)
            node_dict["children"].append(child_node)
            
            if eval_score > max_eval:
                max_eval = eval_score
                best_action = action
            
            alpha = max(alpha, eval_score)
            node_dict["alpha"] = serialize_val(alpha)
            
            if beta <= alpha:
                result.pruned_branches += 1
                result.trace.append(f"Pruned branch at max node (alpha={alpha:.2f}, beta={beta:.2f})")
                pruned_active = True
                
        node_dict["value"] = max_eval
        return max_eval, best_action, node_dict
    else:
        min_eval = float('inf')
        pruned_active = False
        for action in actions:
            child_path_id = f"{path_id}-{action[0]}_{action[1]}"
            if pruned_active:
                try:
                    child_state = problem.get_next_state(state, action)
                    child_board = child_state.board if hasattr(child_state, 'board') else None
                except Exception:
                    child_board = None
                node_dict["children"].append({
                    "id": child_path_id,
                    "board": child_board,
                    "is_max": not problem.is_max_turn(state),
                    "depth": depth - 1,
                    "value": None,
                    "pruned": True,
                    "alpha": serialize_val(alpha),
                    "beta": serialize_val(beta),
                    "children": []
                })
                continue
                
            child_state = problem.get_next_state(state, action)
            eval_score, _, child_node = _alpha_beta(problem, child_state, depth - 1, alpha, beta, result, child_path_id)
            node_dict["children"].append(child_node)
            
            if eval_score < min_eval:
                min_eval = eval_score
                best_action = action
                
            beta = min(beta, eval_score)
            node_dict["beta"] = serialize_val(beta)
            
            if beta <= alpha:
                result.pruned_branches += 1
                result.trace.append(f"Pruned branch at min node (alpha={alpha:.2f}, beta={beta:.2f})")
                pruned_active = True
                
        node_dict["value"] = min_eval
        return min_eval, best_action, node_dict
