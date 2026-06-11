import heapq
from collections import deque
from typing import List, Tuple, Optional, Any, Dict
from src.core.problem import SearchProblem
import time

class SearchResult:
    def __init__(self, path=None, nodes_expanded=0, max_frontier=0, cost=0.0, runtime=0.0):
        self.path = path
        self.nodes_expanded = nodes_expanded
        self.max_frontier = max_frontier
        self.cost = cost
        self.runtime = runtime
        self.trace = []
        self.visited_sequence = []

def run_search(problem: SearchProblem, algorithm: str) -> SearchResult:
    start_time = time.perf_counter()
    result = SearchResult()
    
    if algorithm == "BFS":
        _bfs(problem, result)
    elif algorithm == "DFS":
        _dfs(problem, result)
    elif algorithm == "A*":
        _a_star(problem, result)
    elif algorithm == "UCS":
        _ucs(problem, result)
    elif algorithm == "Greedy":
        _greedy_best_first(problem, result)
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")
        
    result.runtime = time.perf_counter() - start_time
    return result

def _bfs(problem: SearchProblem, result: SearchResult):
    start_state = problem.get_initial_state()
    queue = deque([(start_state, [], 0.0)])
    explored = {start_state}
    
    while queue:
        result.max_frontier = max(result.max_frontier, len(queue))
        current, path, cost = queue.popleft()
        result.nodes_expanded += 1
        result.visited_sequence.append(current)
        result.trace.append(f"Expanded node: {current}")
        
        if problem.is_goal_state(current):
            result.path = path
            result.cost = cost
            result.trace.append(f"Goal reached at {current}!")
            return
            
        for next_state, action, step_cost in problem.get_successors(current):
            if next_state not in explored:
                explored.add(next_state)
                queue.append((next_state, path + [action], cost + step_cost))

def _dfs(problem: SearchProblem, result: SearchResult):
    start_state = problem.get_initial_state()
    stack = [(start_state, [], 0.0)]
    explored = set()
    
    while stack:
        result.max_frontier = max(result.max_frontier, len(stack))
        current, path, cost = stack.pop()
        
        if current in explored:
            continue
            
        explored.add(current)
        result.nodes_expanded += 1
        result.visited_sequence.append(current)
        result.trace.append(f"Expanded node: {current}")
        
        if problem.is_goal_state(current):
            result.path = path
            result.cost = cost
            result.trace.append(f"Goal reached at {current}!")
            return
            
        for next_state, action, step_cost in reversed(problem.get_successors(current)):
            if next_state not in explored:
                stack.append((next_state, path + [action], cost + step_cost))

def _a_star(problem: SearchProblem, result: SearchResult):
    start_state = problem.get_initial_state()
    # pq stores (f_score, tie_breaker, current, path, g_score)
    tie_breaker = 0
    g_start = 0.0
    f_start = g_start + problem.heuristic(start_state)
    pq = [(f_start, tie_breaker, start_state, [], g_start)]
    
    explored = set()
    
    while pq:
        result.max_frontier = max(result.max_frontier, len(pq))
        f_score, _, current, path, g_score = heapq.heappop(pq)
        
        if current in explored:
            continue
            
        explored.add(current)
        result.nodes_expanded += 1
        result.visited_sequence.append(current)
        result.trace.append(f"Expanded node: {current} (f={f_score:.2f})")
        
        if problem.is_goal_state(current):
            result.path = path
            result.cost = g_score
            result.trace.append(f"Goal reached at {current}!")
            return
            
        for next_state, action, step_cost in problem.get_successors(current):
            if next_state not in explored:
                g_new = g_score + step_cost
                f_new = g_new + problem.heuristic(next_state)
                tie_breaker += 1
                heapq.heappush(pq, (f_new, tie_breaker, next_state, path + [action], g_new))

def _ucs(problem: SearchProblem, result: SearchResult):
    start_state = problem.get_initial_state()
    tie_breaker = 0
    pq = [(0.0, tie_breaker, start_state, [])]
    explored = set()
    
    while pq:
        result.max_frontier = max(result.max_frontier, len(pq))
        cost, _, current, path = heapq.heappop(pq)
        
        if current in explored:
            continue
            
        explored.add(current)
        result.nodes_expanded += 1
        result.visited_sequence.append(current)
        result.trace.append(f"Expanded node: {current} (g={cost:.2f})")
        
        if problem.is_goal_state(current):
            result.path = path
            result.cost = cost
            result.trace.append(f"Goal reached at {current}!")
            return
            
        for next_state, action, step_cost in problem.get_successors(current):
            if next_state not in explored:
                g_new = cost + step_cost
                tie_breaker += 1
                heapq.heappush(pq, (g_new, tie_breaker, next_state, path + [action]))

def _greedy_best_first(problem: SearchProblem, result: SearchResult):
    start_state = problem.get_initial_state()
    tie_breaker = 0
    h_start = problem.heuristic(start_state)
    pq = [(h_start, tie_breaker, start_state, [], 0.0)]
    explored = set()
    
    while pq:
        result.max_frontier = max(result.max_frontier, len(pq))
        h_val, _, current, path, g_cost = heapq.heappop(pq)
        
        if current in explored:
            continue
            
        explored.add(current)
        result.nodes_expanded += 1
        result.visited_sequence.append(current)
        result.trace.append(f"Expanded node: {current} (h={h_val:.2f})")
        
        if problem.is_goal_state(current):
            result.path = path
            result.cost = g_cost
            result.trace.append(f"Goal reached at {current}!")
            return
            
        for next_state, action, step_cost in problem.get_successors(current):
            if next_state not in explored:
                h_new = problem.heuristic(next_state)
                g_new = g_cost + step_cost
                tie_breaker += 1
                heapq.heappush(pq, (h_new, tie_breaker, next_state, path + [action], g_new))
