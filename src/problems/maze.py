from typing import List, Tuple, Dict, Any
from src.core.problem import SearchProblem
import random
import math
from collections import deque

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
    def __init__(self, grid: List[List[int]], start: Tuple[int, int], goal: Tuple[int, int], heuristic_type: str = "manhattan"):
        self.grid = grid  # 0 is empty, 1 is wall, >1 is weight
        self.start = start
        self.goal = goal
        self.height = len(grid)
        self.width = len(grid[0]) if self.height > 0 else 0
        self.heuristic_type = heuristic_type

    def get_initial_state(self) -> Tuple[int, int]:
        return self.start

    def is_goal_state(self, state: Tuple[int, int]) -> bool:
        return state == self.goal

    def get_successors(self, state: Tuple[int, int]) -> List[Tuple[Tuple[int, int], str, float]]:
        successors = []
        r, c = state
        moves = [((r-1, c), "UP"), ((r+1, c), "DOWN"), ((r, c-1), "LEFT"), ((r, c+1), "RIGHT")]
        
        for (nr, nc), action in moves:
            if 0 <= nr < self.height and 0 <= nc < self.width:
                cell_val = self.grid[nr][nc]
                if cell_val != 1:  # 1 is a wall
                    # Cost is 1 for open cell (0), or cell_val for weighted cell
                    cost = float(cell_val) if cell_val > 1 else 1.0
                    successors.append(((nr, nc), action, cost))
        return successors

    def heuristic(self, state: Tuple[int, int]) -> float:
        if self.heuristic_type == "euclidean":
            return math.sqrt((state[0] - self.goal[0])**2 + (state[1] - self.goal[1])**2)
        elif self.heuristic_type == "zero":
            return 0.0
        # Default Manhattan distance
        return float(abs(state[0] - self.goal[0]) + abs(state[1] - self.goal[1]))

def analyze_heuristic(grid: List[List[int]], goal: Tuple[int, int], heuristic_type: str = "manhattan") -> Dict[str, Any]:
    """Analyzes a heuristic for admissibility and consistency on the given grid."""
    height = len(grid)
    width = len(grid[0]) if height > 0 else 0
    problem = MazeProblem(grid, (0,0), goal, heuristic_type)
    
    # 1. Calculate true cost from every node to goal using BFS backward
    true_costs = {}
    queue = deque([(goal, 0.0)])
    true_costs[goal] = 0.0
    
    while queue:
        curr, cost = queue.popleft()
        r, c = curr
        moves = [((r-1, c), "UP"), ((r+1, c), "DOWN"), ((r, c-1), "LEFT"), ((r, c+1), "RIGHT")]
        
        for (nr, nc), _ in moves:
            if 0 <= nr < height and 0 <= nc < width:
                cell_val = grid[nr][nc]
                if cell_val != 1:  # Not a wall
                    step_cost = float(cell_val) if cell_val > 1 else 1.0
                    if (nr, nc) not in true_costs or true_costs[(nr, nc)] > cost + step_cost:
                        true_costs[(nr, nc)] = cost + step_cost
                        queue.append(((nr, nc), cost + step_cost))
                        
    # 2. Check Admissibility: h(n) <= true_cost(n) for all n
    # 3. Check Consistency: h(n) <= c(n, a, n') + h(n') for all n, a, n'
    is_admissible = True
    is_consistent = True
    inadmissible_nodes = []
    inconsistent_edges = []
    
    for r in range(height):
        for c in range(width):
            if grid[r][c] == 1: continue
            state = (r, c)
            h_val = problem.heuristic(state)
            
            # Check Admissibility
            if state in true_costs:
                if h_val > true_costs[state] + 0.0001: # float tolerance
                    is_admissible = False
                    inadmissible_nodes.append(state)
                    
            # Check Consistency
            for next_state, _, step_cost in problem.get_successors(state):
                h_next = problem.heuristic(next_state)
                if h_val > step_cost + h_next + 0.0001:
                    is_consistent = False
                    inconsistent_edges.append((state, next_state))
                    
    return {
        "admissible": is_admissible,
        "consistent": is_consistent,
        "inadmissible_count": len(inadmissible_nodes),
        "inconsistent_count": len(inconsistent_edges)
    }
