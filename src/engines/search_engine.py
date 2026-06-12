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
        self.visited_sequence = [] # Stores dicts: {"state": state, "frontier_size": int, "closed_size": int, "g": float, "h": float}

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
    elif algorithm == "Bi-directional A*":
        _bidirectional_a_star(problem, result)
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
        
        result.visited_sequence.append({
            "state": current,
            "frontier_size": len(queue),
            "closed_size": len(explored),
            "g": cost,
            "h": 0.0
        })
        
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
        
        result.visited_sequence.append({
            "state": current,
            "frontier_size": len(stack),
            "closed_size": len(explored),
            "g": cost,
            "h": 0.0
        })
        
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
        
        result.visited_sequence.append({
            "state": current,
            "frontier_size": len(pq),
            "closed_size": len(explored),
            "g": g_score,
            "h": problem.heuristic(current)
        })
        
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
        
        result.visited_sequence.append({
            "state": current,
            "frontier_size": len(pq),
            "closed_size": len(explored),
            "g": cost,
            "h": 0.0
        })
        
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
        
        result.visited_sequence.append({
            "state": current,
            "frontier_size": len(pq),
            "closed_size": len(explored),
            "g": g_cost,
            "h": h_val
        })
        
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

def _bidirectional_a_star(problem: SearchProblem, result: SearchResult):
    start_state = problem.get_initial_state()
    if not hasattr(problem, "goal"):
        # If no goal attribute exists, run standard A* as fallback
        return _a_star(problem, result)
        
    goal_state = problem.goal
    if start_state == goal_state:
        result.path = []
        result.cost = 0.0
        result.trace.append("Start state is goal state!")
        return

    # Forward search
    tb_f = 0
    g_f = {start_state: 0.0}
    parent_f = {start_state: (None, None)}  # state -> (parent_state, action)
    h_f = lambda s: float(abs(s[0] - goal_state[0]) + abs(s[1] - goal_state[1]))
    pq_f = [(h_f(start_state), tb_f, start_state)]
    explored_f = set()

    # Backward search
    tb_b = 0
    g_b = {goal_state: 0.0}
    parent_b = {goal_state: (None, None)}  # state -> (parent_state, action)
    h_b = lambda s: float(abs(s[0] - start_state[0]) + abs(s[1] - start_state[1]))
    pq_b = [(h_b(goal_state), tb_b, goal_state)]
    explored_b = set()

    intersect_state = None
    min_total_cost = float('inf')

    # Opposing action helper for backward path construction
    opposing_actions = {"UP": "DOWN", "DOWN": "UP", "LEFT": "RIGHT", "RIGHT": "LEFT"}

    while pq_f and pq_b:
        result.max_frontier = max(result.max_frontier, len(pq_f) + len(pq_b))
        
        # Step Forward Search
        if pq_f:
            f_score, _, curr_f = heapq.heappop(pq_f)
            if curr_f not in explored_f:
                explored_f.add(curr_f)
                result.nodes_expanded += 1
                result.trace.append(f"[Forward] Expanded: {curr_f} (f={f_score:.2f})")
                
                result.visited_sequence.append({
                    "state": curr_f,
                    "frontier_size": len(pq_f) + len(pq_b),
                    "closed_size": len(explored_f) + len(explored_b),
                    "g": g_f[curr_f],
                    "h": h_f(curr_f)
                })

                # Check intersection
                if curr_f in explored_b:
                    total_cost = g_f[curr_f] + g_b[curr_f]
                    if total_cost < min_total_cost:
                        min_total_cost = total_cost
                        intersect_state = curr_f
                        break

                for next_state, action, step_cost in problem.get_successors(curr_f):
                    new_g = g_f[curr_f] + step_cost
                    if next_state not in g_f or new_g < g_f[next_state]:
                        g_f[next_state] = new_g
                        parent_f[next_state] = (curr_f, action)
                        tb_f += 1
                        heapq.heappush(pq_f, (new_g + h_f(next_state), tb_f, next_state))

        # Step Backward Search
        if pq_b:
            f_score, _, curr_b = heapq.heappop(pq_b)
            if curr_b not in explored_b:
                explored_b.add(curr_b)
                result.nodes_expanded += 1
                result.trace.append(f"[Backward] Expanded: {curr_b} (f={f_score:.2f})")
                
                result.visited_sequence.append({
                    "state": curr_b,
                    "frontier_size": len(pq_f) + len(pq_b),
                    "closed_size": len(explored_f) + len(explored_b),
                    "g": g_b[curr_b],
                    "h": h_b(curr_b)
                })

                # Check intersection
                if curr_b in explored_f:
                    total_cost = g_f[curr_b] + g_b[curr_b]
                    if total_cost < min_total_cost:
                        min_total_cost = total_cost
                        intersect_state = curr_b
                        break

                for next_state, action, step_cost in problem.get_successors(curr_b):
                    new_g = g_b[curr_b] + step_cost
                    if next_state not in g_b or new_g < g_b[next_state]:
                        g_b[next_state] = new_g
                        opp_action = opposing_actions.get(action, action)
                        parent_b[next_state] = (curr_b, opp_action)
                        tb_b += 1
                        heapq.heappush(pq_b, (new_g + h_b(next_state), tb_b, next_state))

    if intersect_state is not None:
        # Reconstruct path
        path_f = []
        curr = intersect_state
        while curr != start_state:
            parent_state, action = parent_f[curr]
            path_f.append(action)
            curr = parent_state
        path_f.reverse()

        path_b = []
        curr = intersect_state
        while curr != goal_state:
            child_state, action = parent_b[curr]
            path_b.append(action)
            curr = child_state

        result.path = path_f + path_b
        result.cost = min_total_cost
        result.trace.append(f"Intersection found at {intersect_state}! Reconstructed path.")
    else:
        result.trace.append("No path found.")
