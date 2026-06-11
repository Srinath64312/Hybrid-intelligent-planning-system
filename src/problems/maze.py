from typing import List, Tuple
from src.core.problem import SearchProblem
import random

def generate_maze(size: int = 5, density: float = 0.2) -> Tuple[List[List[int]], Tuple[int, int], Tuple[int, int]]:
    """Generates a random maze of `size x size` with obstacle `density`."""
    grid = [[0 for _ in range(size)] for _ in range(size)]
    
    for r in range(size):
        for c in range(size):
            if random.random() < density:
                grid[r][c] = 1
                
    start = (0, 0)
    goal = (size - 1, size - 1)
    
    # Ensure start and goal are open
    grid[start[0]][start[1]] = 0
    grid[goal[0]][goal[1]] = 0
    
    return grid, start, goal

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
