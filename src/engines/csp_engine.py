import time
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

def run_csp(problem: CSPProblem) -> CSPResult:
    result = CSPResult()
    start_time = time.perf_counter()
    
    result.assignment = _backtracking_search({}, problem, result)
    
    result.runtime = time.perf_counter() - start_time
    return result

def _backtracking_search(assignment: Dict[Any, Any], problem: CSPProblem, result: CSPResult) -> Optional[Dict[Any, Any]]:
    if len(assignment) == len(problem.variables):
        return assignment
        
    # Minimum Remaining Values (MRV) heuristic
    unassigned = [v for v in problem.variables if v not in assignment]
    first = min(unassigned, key=lambda var: len(problem.domains[var]))
    
    for value in problem.domains[first]:
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
            
            res = _backtracking_search(local_assignment, problem, result)
            if res is not None:
                return res
            
            result.trace.append(f"Backtracking from {first}={value}")
            result.backtracks += 1
        else:
            result.constraint_violations += 1
            reasons = [d["reason"] for d in eval_report["details"] if not d["passed"]]
            reason_str = " | ".join(reasons)
            result.trace.append(f"Violation: Cannot assign {value} to {first}. Reasons: {reason_str}")
            
    return None
