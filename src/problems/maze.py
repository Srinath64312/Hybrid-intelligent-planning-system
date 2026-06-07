from typing import List, Tuple
from src.core.problem import SearchProblem

class MazeProblem(SearchProblem[Tuple[int, int], str]):
    def __init__(self, grid: List[List[int]], start: Tuple[int, int], goal: Tuple[int, int]):
        self.grid = grid  # 0 is empty, 1 is wall
        self.start = start
        self.goal = goal
        self.height = len(grid)
        self.width = len(grid[0]) if self.height > 0 else 0

    def get_initial_state(self) -> Tuple[int, int]:
        return self.start

    def is_goal_state(self, state: Tuple[int, int]) -> bool:
        return state == self.goal

    def get_successors(self, state: Tuple[int, int]) -> List[Tuple[Tuple[int, int], str, float]]:
        successors = []
        r, c = state
        moves = [((r-1, c), "UP"), ((r+1, c), "DOWN"), ((r, c-1), "LEFT"), ((r, c+1), "RIGHT")]
        
        for (nr, nc), action in moves:
            if 0 <= nr < self.height and 0 <= nc < self.width and self.grid[nr][nc] == 0:
                successors.append(((nr, nc), action, 1.0))
        return successors

    def heuristic(self, state: Tuple[int, int]) -> float:
        # Manhattan distance
        return abs(state[0] - self.goal[0]) + abs(state[1] - self.goal[1])
