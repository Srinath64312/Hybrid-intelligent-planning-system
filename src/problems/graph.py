from typing import Dict, List, Tuple, Any
from src.core.problem import SearchProblem

class GraphProblem(SearchProblem[str, str]):
    def __init__(self, adjacency_list: Dict[str, List[Tuple[str, float]]], start: str, goal: str, heuristics: Dict[str, float] = None):
        self.adjacency_list = adjacency_list  # Node -> List of (neighbor, edge_cost)
        self.start = start
        self.goal = goal
        self.heuristics = heuristics if heuristics else {}

    def get_initial_state(self) -> str:
        return self.start

    def is_goal_state(self, state: str) -> bool:
        return state == self.goal

    def get_successors(self, state: str) -> List[Tuple[str, str, float]]:
        successors = []
        # Action is moving from state -> neighbor, action label is f"GO_TO_{neighbor}"
        for neighbor, cost in self.adjacency_list.get(state, []):
            successors.append((neighbor, f"GO_TO_{neighbor}", cost))
        return successors

    def heuristic(self, state: str) -> float:
        return float(self.heuristics.get(state, 0.0))
