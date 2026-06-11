import time
import random
from typing import Dict, Any, Optional
from src.core.problem import CSPProblem

class CSPResult:
    def __init__(self):
        self.assignment = None
        self.assignments_tried = 0
        self.backtracks = 0
        self.constraint_violations = 0
        self.runtime = 0.0
        self.trace = []
        self.explainability_reports = []
        self.visited_sequence = []

def run_csp(problem: CSPProblem) -> CSPResult:
    result = CSPResult()
    start_time = time.perf_counter()
    
    # Ensure domains is a copy we can modify for forward checking
    domains = {v: list(d) for v, d in problem.domains.items()}
    result.assignment = _backtracking_search({}, problem, result, domains)
    
    result.runtime = time.perf_counter() - start_time
    return result

def _backtracking_search(assignment: Dict[Any, Any], problem: CSPProblem, result: CSPResult, domains: Dict[Any, List[Any]]) -> Optional[Dict[Any, Any]]:
    # Record step state
    result.visited_sequence.append({
        "assignment": assignment.copy(),
        "domains": {v: list(d) for v, d in domains.items()}
    })

    if len(assignment) == len(problem.variables):
        return assignment
        
    unassigned = [v for v in problem.variables if v not in assignment]
    
    # MRV (Minimum Remaining Values)
    min_len = min(len(domains[v]) for v in unassigned)
    mrv_vars = [v for v in unassigned if len(domains[v]) == min_len]
    
    # Degree Heuristic (Tiebreaker): In N-Queens, all unassigned interact, so we just pick the first.
    # In more complex CSPs, we would count constraints.
    first = mrv_vars[0]
    
    # LCV (Least Constraining Value) - sort values by how many options they leave for others
    def count_conflicts(val):
        conflicts = 0
        test_assign = assignment.copy()
        test_assign[first] = val
        for u in unassigned:
            if u != first:
                for d in domains[u]:
                    if not problem.is_consistent(u, d, test_assign):
                        conflicts += 1
        return conflicts
        
    sorted_values = sorted(domains[first], key=count_conflicts)
    
    for value in sorted_values:
        result.assignments_tried += 1
        
        # Explainability Evaluation
        eval_report = problem.evaluate_constraints(first, value, assignment)
        report_entry = {
            "variable": first,
            "value": value,
            "probability": eval_report["probability"],
            "details": eval_report["details"],
            "passed": eval_report["passed"]
        }
        result.explainability_reports.append(report_entry)
        
        if eval_report["passed"]:
            result.trace.append(f"Assigned {value} to {first} (Bayesian Prob: {eval_report['probability']:.2f})")
            local_assignment = assignment.copy()
            local_assignment[first] = value
            
            # Forward Checking
            domain_wipeout = False
            new_domains = {v: list(d) for v, d in domains.items()}
            for u in unassigned:
                if u != first:
                    valid_vals = [d for d in new_domains[u] if problem.is_consistent(u, d, local_assignment)]
                    if not valid_vals:
                        domain_wipeout = True
                        break
                    new_domains[u] = valid_vals
            
            if not domain_wipeout:
                res = _backtracking_search(local_assignment, problem, result, new_domains)
                if res is not None:
                    return res
            else:
                result.trace.append(f"Forward Checking detected domain wipeout for {value} in {first}")
            
            result.trace.append(f"Backtracking from {first}={value}")
            result.backtracks += 1
            
            # Record backtrack state
            result.visited_sequence.append({
                "assignment": assignment.copy(),
                "domains": {v: list(d) for v, d in domains.items()}
            })
        else:
            result.constraint_violations += 1
            reasons = [d["reason"] for d in eval_report.get("details", []) if not d.get("passed", True)]
            reason_str = " | ".join(reasons) if reasons else "Constraint Failed"
            result.trace.append(f"Violation: Cannot assign {value} to {first}. Reasons: {reason_str}")
            
    return None

def run_local_search(problem: CSPProblem, algorithm: str = "Min-Conflicts", max_steps: int = 1000) -> CSPResult:
    result = CSPResult()
    start_time = time.perf_counter()
    
    # Generate initial random assignment
    assignment = {}
    for v in problem.variables:
        assignment[v] = random.choice(problem.domains[v])
        
    result.visited_sequence.append({
        "assignment": assignment.copy(),
        "domains": {v: list(d) for v, d in problem.domains.items()}
    })
    
    def count_conflicts(var, val, current_assignment):
        conflicts = 0
        for u, u_val in current_assignment.items():
            if u != var:
                if u_val == val or abs(u - var) == abs(u_val - val):
                    conflicts += 1
        return conflicts
        
    def total_conflicts(current_assignment):
        total = 0
        vars_list = list(current_assignment.keys())
        for i in range(len(vars_list)):
            for j in range(i + 1, len(vars_list)):
                u, v = vars_list[i], vars_list[j]
                u_val, v_val = current_assignment[u], current_assignment[v]
                if u_val == v_val or abs(u - v) == abs(u_val - v_val):
                    total += 1
        return total

    if algorithm == "Min-Conflicts":
        for step in range(max_steps):
            result.assignments_tried += 1
            # Find conflicted variables
            conflicted_vars = []
            for v in problem.variables:
                if count_conflicts(v, assignment[v], assignment) > 0:
                    conflicted_vars.append(v)
                    
            if not conflicted_vars:
                result.trace.append(f"Solved in {step} steps!")
                result.assignment = assignment
                break
                
            # Pick a random conflicted variable
            var = random.choice(conflicted_vars)
            
            # Find value that minimizes conflicts
            min_c = float('inf')
            best_vals = []
            for val in problem.domains[var]:
                c = count_conflicts(var, val, assignment)
                if c < min_c:
                    min_c = c
                    best_vals = [val]
                elif c == min_c:
                    best_vals.append(val)
                    
            new_val = random.choice(best_vals)
            if new_val != assignment[var]:
                result.trace.append(f"Step {step}: Reassigned {var} to {new_val} (Conflicts: {min_c})")
                assignment[var] = new_val
                result.visited_sequence.append({
                    "assignment": assignment.copy(),
                    "domains": {v: list(d) for v, d in problem.domains.items()}
                })
        else:
            result.trace.append("Max steps reached. Local minimum.")
            
    elif algorithm == "Hill Climbing (Restarts)":
        restarts = 0
        step = 0
        while step < max_steps:
            current_conflicts = total_conflicts(assignment)
            if current_conflicts == 0:
                result.trace.append(f"Solved in {step} steps with {restarts} restarts!")
                result.assignment = assignment
                break
                
            # Get best neighbor
            best_neighbors = []
            min_c = current_conflicts
            
            for var in problem.variables:
                for val in problem.domains[var]:
                    if val != assignment[var]:
                        c = count_conflicts(var, val, assignment)
                        # We calculate the delta
                        old_c = count_conflicts(var, assignment[var], assignment)
                        neighbor_conflicts = current_conflicts - old_c + c
                        
                        if neighbor_conflicts < min_c:
                            min_c = neighbor_conflicts
                            best_neighbors = [(var, val)]
                        elif neighbor_conflicts == min_c:
                            best_neighbors.append((var, val))
                            
            if not best_neighbors or min_c == current_conflicts:
                result.trace.append(f"Plateau/Local Optima reached at {current_conflicts} conflicts. Restarting...")
                restarts += 1
                result.backtracks += 1 # Using backtracks to count restarts for UI
                for v in problem.variables:
                    assignment[v] = random.choice(problem.domains[v])
                result.visited_sequence.append({
                    "assignment": assignment.copy(),
                    "domains": {v: list(d) for v, d in problem.domains.items()}
                })
            else:
                var, val = random.choice(best_neighbors)
                assignment[var] = val
                result.assignments_tried += 1
                result.visited_sequence.append({
                    "assignment": assignment.copy(),
                    "domains": {v: list(d) for v, d in problem.domains.items()}
                })
                result.trace.append(f"Step {step}: Climbed to {min_c} conflicts (Changed {var} to {val})")
            
            step += 1
        else:
            result.trace.append("Max steps reached.")
            
    result.runtime = time.perf_counter() - start_time
    return result
