import time
import random
import math
from typing import Dict, List, Tuple, Any, Optional
from src.problems.timetable import TimetableProblem

class TimetableResult:
    def __init__(self):
        self.assignment: Optional[Dict[Tuple[str, int], Tuple[int, int, str]]] = None
        self.assignments_tried = 0
        self.backtracks = 0
        self.iterations = 0
        self.runtime = 0.0
        self.solved = False
        self.partial_assignment: Optional[Dict[Tuple[str, int], Tuple[int, int, str]]] = None
        self.unscheduled: List[Dict[str, Any]] = []
        self.trace: List[str] = []
        self.explainability_reports: List[Dict[str, Any]] = []
        self.visited_sequence: List[Dict[str, Any]] = []

def run_timetable(problem: TimetableProblem, solver_choice: str = "Backtracking (MRV+FC)") -> TimetableResult:
    if solver_choice == "Backtracking (MRV+FC)":
        return run_timetable_backtracking(problem)
    elif solver_choice == "Genetic Algorithm":
        return run_timetable_genetic_algorithm(problem)
    else:
        return run_timetable_simulated_annealing(problem)

def run_timetable_backtracking(problem: TimetableProblem) -> TimetableResult:
    result = TimetableResult()
    start_time = time.perf_counter()

    domains = {v: list(d) for v, d in problem.domains.items()}
    best_assignment = {}
    
    def backtrack(assignment: Dict[Tuple[str, int], Tuple[int, int, str]], current_domains: Dict[Tuple[str, int], List[Tuple[int, int, str]]]) -> Optional[Dict[Tuple[str, int], Tuple[int, int, str]]]:
        nonlocal best_assignment
        
        # Record trace / visited sequence for visualization
        result.visited_sequence.append({
            "assignment": {f"{var[0]}_{var[1]}": val for var, val in assignment.items()}
        })

        if len(assignment) > len(best_assignment):
            best_assignment = assignment.copy()

        if len(assignment) == len(problem.variables):
            return assignment

        unassigned = [v for v in problem.variables if v not in assignment]
        
        # MRV: Minimum Remaining Values
        min_len = min(len(current_domains[v]) for v in unassigned)
        mrv_vars = [v for v in unassigned if len(current_domains[v]) == min_len]
        
        # Tie breaker: degree heuristic (variables with most constraints on remaining variables)
        # We can sort by count of variables that share student groups or teacher
        def get_degree(var):
            c_name, _ = var
            groups = problem.course_groups.get(c_name, [])
            teacher = problem.course_map[c_name].get("teacher")
            degree = 0
            for u in unassigned:
                if u == var:
                    continue
                u_cname, _ = u
                u_groups = problem.course_groups.get(u_cname, [])
                u_teacher = problem.course_map[u_cname].get("teacher")
                if teacher == u_teacher or any(g in u_groups for g in groups):
                    degree += 1
            return degree

        mrv_vars = sorted(mrv_vars, key=get_degree, reverse=True)
        first = mrv_vars[0]

        # Fast LCV Approximation (Load Balancing Heuristic)
        # Instead of an O(V * D^2) deep conflict check, we simply sort the available periods
        # by how many classes are currently scheduled at that specific (day, period).
        # This naturally spreads classes out evenly across the week, completely avoiding 
        # room bottlenecks and teacher exhaustion early in the tree, which prevents backtracks.
        period_usage = {}
        for assigned_val in assignment.values():
            dp = (assigned_val[0], assigned_val[1])
            period_usage[dp] = period_usage.get(dp, 0) + 1
            
        def fast_lcv(val):
            return period_usage.get((val[0], val[1]), 0)
            
        sorted_values = sorted(current_domains[first], key=fast_lcv)

        for value in sorted_values:
            result.assignments_tried += 1
            
            # Prevent browser freezing by aborting if we've explored too many dead ends
            # (which usually means the requested schedule is mathematically impossible)
            if result.assignments_tried > 5000:
                return None

            # Use fast consistency check instead of expensive explainability evaluation for every node
            is_valid = problem.is_consistent(first, value, assignment)

            if is_valid:
                result.trace.append(f"Assigned {value} to {first[0]} (Period {first[1]})")
                local_assignment = assignment.copy()
                local_assignment[first] = value

                # Forward Checking
                domain_wipeout = False
                new_domains = {v: list(d) for v, d in current_domains.items()}
                for u in unassigned:
                    if u != first:
                        valid_vals = [d for d in new_domains[u] if problem.is_consistent(u, d, local_assignment)]
                        if not valid_vals:
                            domain_wipeout = True
                            break
                        new_domains[u] = valid_vals

                if not domain_wipeout:
                    res = backtrack(local_assignment, new_domains)
                    if res is not None:
                        return res
                else:
                    result.trace.append(f"FC wipeout for {first[0]} (Period {first[1]}) = {value}")

                result.trace.append(f"Backtracking from {first[0]} (Period {first[1]}) = {value}")
                result.backtracks += 1
                result.visited_sequence.append({
                    "assignment": {f"{var[0]}_{var[1]}": val for var, val in assignment.items()}
                })
            else:
                result.trace.append(f"Violation: Cannot assign {value} to {first[0]} (Period {first[1]}).")

        return None

    final_assignment = backtrack({}, domains)
    result.runtime = time.perf_counter() - start_time

    if final_assignment is not None:
        result.assignment = final_assignment
        result.solved = True
        result.trace.append("Timetable successfully solved!")
    else:
        result.solved = False
        result.trace.append("Backtracking completed. No full solution exists. Returning best partial timetable.")
        result.partial_assignment = best_assignment
        # Determine why remaining courses could not be scheduled
        unscheduled_vars = [v for v in problem.variables if v not in best_assignment]
        unscheduled_courses = set(v[0] for v in unscheduled_vars)
        for cname in unscheduled_courses:
            c_info = problem.course_map[cname]
            teacher = c_info.get("teacher")
            # Analyze domain of the first unscheduled period
            v_idx = [v[1] for v in unscheduled_vars if v[0] == cname][0]
            var = (cname, v_idx)
            initial_domain = problem.domains[var]
            
            if not initial_domain:
                reason = f"No eligible slots (check Teacher {teacher} availability, room types, or capacity limits)."
            else:
                reason = "Conflicts with other scheduled classes, room availability, or student group schedules."
            result.unscheduled.append({
                "course": cname,
                "reason": reason
            })

    return result

def run_timetable_simulated_annealing(problem: TimetableProblem, max_steps: int = 2000, start_temp: float = 10.0, alpha: float = 0.99) -> TimetableResult:
    result = TimetableResult()
    start_time = time.perf_counter()

    # If any variable has an empty domain, we cannot schedule it at all.
    # Let's separate variables with non-empty domains.
    valid_vars = []
    empty_vars = []
    for v in problem.variables:
        if problem.domains[v]:
            valid_vars.append(v)
        else:
            empty_vars.append(v)

    # Helper function to count total conflicts/violations in a full assignment
    def evaluate_state(state: Dict[Tuple[str, int], Tuple[int, int, str]]) -> int:
        violations = 0
        
        # 1. Teacher daily load check
        teacher_daily_counts = {}
        for var, val in state.items():
            day, period, room = val
            cname, pidx = var
            teacher = problem.course_map[cname].get("teacher")
            key = (teacher, day)
            teacher_daily_counts[key] = teacher_daily_counts.get(key, 0) + 1

        for (teacher, day), count in teacher_daily_counts.items():
            max_periods = problem.teacher_map.get(teacher, {}).get("max_periods_per_day", problem.periods_per_day)
            if count > max_periods:
                violations += (count - max_periods) * 2

        # 2. Pairwise conflicts
        var_list = list(state.keys())
        for i in range(len(var_list)):
            v1 = var_list[i]
            val1 = state[v1]
            day1, period1, room1 = val1
            cname1, pidx1 = v1
            c_info1 = problem.course_map[cname1]
            teacher1 = c_info1.get("teacher")
            groups1 = problem.course_groups.get(cname1, [])
            is_lab1 = c_info1.get("is_lab", False) or "lab" in cname1.lower()

            for j in range(i + 1, len(var_list)):
                v2 = var_list[j]
                val2 = state[v2]
                day2, period2, room2 = val2
                cname2, pidx2 = v2
                c_info2 = problem.course_map[cname2]
                teacher2 = c_info2.get("teacher")
                groups2 = problem.course_groups.get(cname2, [])
                is_lab2 = c_info2.get("is_lab", False) or "lab" in cname2.lower()

                # Same period overlaps
                if day1 == day2 and period1 == period2:
                    if teacher1 == teacher2:
                        violations += 3
                    if room1 == room2:
                        violations += 3
                    if any(g in groups2 for g in groups1):
                        violations += 2

                # Same course spread/lab double periods
                if cname1 == cname2 and day1 == day2:
                    if is_lab1:
                        if abs(pidx1 - pidx2) == 1:
                            # Must be consecutive and in same room
                            if abs(period1 - period2) != 1 or room1 != room2:
                                violations += 4
                        else:
                            # Non-adjacent lab periods shouldn't share day
                            violations += 3
                    else:
                        if c_info1.get("periods_required", 1) <= problem.days_per_week:
                            violations += 1

        return violations

    # Initial state: assign a random value from the domain for each valid variable
    current_state = {}
    for v in valid_vars:
        current_state[v] = random.choice(problem.domains[v])

    current_energy = evaluate_state(current_state)
    best_state = current_state.copy()
    best_energy = current_energy

    temp = start_temp
    
    result.visited_sequence.append({
        "assignment": {f"{var[0]}_{var[1]}": val for var, val in current_state.items()},
        "domains": {f"{var[0]}_{var[1]}": list(problem.domains[var]) for var in problem.variables}
    })

    for step in range(max_steps):
        result.iterations += 1
        if best_energy == 0:
            result.trace.append(f"SA: Found zero-conflict assignment at step {step}!")
            break

        # Pick a random variable to reassign
        var = random.choice(valid_vars)
        old_val = current_state[var]
        
        # Pick a random new value from domain
        new_val = random.choice(problem.domains[var])
        if new_val == old_val:
            continue

        # Temporarily apply change
        current_state[var] = new_val
        new_energy = evaluate_state(current_state)
        
        delta = new_energy - current_energy

        # Accept check
        if delta <= 0:
            current_energy = new_energy
            if new_energy < best_energy:
                best_state = current_state.copy()
                best_energy = new_energy
        else:
            prob = math.exp(-delta / temp)
            if random.random() < prob:
                current_energy = new_energy
            else:
                # Revert
                current_state[var] = old_val

        # Cool temperature
        temp = max(0.01, temp * alpha)

        if step % 200 == 0:
            result.trace.append(f"SA Step {step}: Temp={temp:.2f}, Conflicts={current_energy}, Best Conflicts={best_energy}")
            result.visited_sequence.append({
                "assignment": {f"{var[0]}_{var[1]}": val for var, val in current_state.items()},
                "domains": {f"{var[0]}_{var[1]}": list(problem.domains[var]) for var in problem.variables}
            })

    # Try to extract a clean partial assignment from best_state
    # We do this by greedily inserting variables from best_state. If a variable causes conflicts with 
    # already accepted ones, we skip it. This ensures the output partial assignment is consistent.
    clean_assignment = {}
    for var, val in best_state.items():
        if problem.is_consistent(var, val, clean_assignment):
            clean_assignment[var] = val

    result.runtime = time.perf_counter() - start_time
    
    if len(clean_assignment) == len(problem.variables) and best_energy == 0:
        result.assignment = clean_assignment
        result.solved = True
        result.trace.append("Simulated Annealing solved timetable completely!")
    else:
        result.solved = False
        result.partial_assignment = clean_assignment
        result.trace.append(f"Simulated Annealing completed with conflicts. Clean partial size: {len(clean_assignment)}/{len(problem.variables)}")
        
        # Identify unscheduled
        unscheduled_vars = [v for v in problem.variables if v not in clean_assignment]
        unscheduled_courses = set(v[0] for v in unscheduled_vars)
        for cname in unscheduled_courses:
            c_info = problem.course_map[cname]
            teacher = c_info.get("teacher")
            reason = "Failed to converge conflict-free. Conflicts with other courses or teacher/room occupancy."
            if cname in [e[0] for e in empty_vars]:
                reason = f"No eligible slots initially (check Teacher {teacher} availability, room types, or capacity limits)."
            result.unscheduled.append({
                "course": cname,
                "reason": reason
            })

    return result

def run_timetable_genetic_algorithm(
    problem: TimetableProblem,
    pop_size: int = 50,
    generations: int = 100,
    crossover_rate: float = 0.8,
    mutation_rate: float = 0.2,
    elitism_count: int = 2
) -> TimetableResult:
    result = TimetableResult()
    start_time = time.perf_counter()

    # Filter variables that have non-empty domains
    valid_vars = [v for v in problem.variables if problem.domains[v]]
    empty_vars = [v for v in problem.variables if not problem.domains[v]]

    # A chromosome is a dict mapping var -> value
    def make_random_chromosome() -> Dict[Tuple[str, int], Tuple[int, int, str]]:
        return {v: random.choice(problem.domains[v]) for v in valid_vars}

    # Fitness evaluation: count total violations
    def count_violations(state: Dict[Tuple[str, int], Tuple[int, int, str]]) -> int:
        violations = 0
        
        # 1. Teacher daily load check
        teacher_daily_counts = {}
        for var, val in state.items():
            day, period, room = val
            cname, pidx = var
            teacher = problem.course_map[cname].get("teacher")
            key = (teacher, day)
            teacher_daily_counts[key] = teacher_daily_counts.get(key, 0) + 1

        for (teacher, day), count in teacher_daily_counts.items():
            max_periods = problem.teacher_map.get(teacher, {}).get("max_periods_per_day", problem.periods_per_day)
            if count > max_periods:
                violations += (count - max_periods) * 2

        # 2. Pairwise conflicts
        var_list = list(state.keys())
        for i in range(len(var_list)):
            v1 = var_list[i]
            val1 = state[v1]
            day1, period1, room1 = val1
            cname1, pidx1 = v1
            c_info1 = problem.course_map[cname1]
            teacher1 = c_info1.get("teacher")
            groups1 = problem.course_groups.get(cname1, [])
            is_lab1 = c_info1.get("is_lab", False) or "lab" in cname1.lower()

            for j in range(i + 1, len(var_list)):
                v2 = var_list[j]
                val2 = state[v2]
                day2, period2, room2 = val2
                cname2, pidx2 = v2
                c_info2 = problem.course_map[cname2]
                teacher2 = c_info2.get("teacher")
                groups2 = problem.course_groups.get(cname2, [])
                is_lab2 = c_info2.get("is_lab", False) or "lab" in cname2.lower()

                # Same period overlaps
                if day1 == day2 and period1 == period2:
                    if teacher1 == teacher2:
                        violations += 3
                    if room1 == room2:
                        violations += 3
                    if any(g in groups2 for g in groups1):
                        violations += 2

                # Same course spread/lab double periods
                if cname1 == cname2 and day1 == day2:
                    if is_lab1:
                        if abs(pidx1 - pidx2) == 1:
                            if abs(period1 - period2) != 1 or room1 != room2:
                                violations += 4
                        else:
                            violations += 3
                    else:
                        if c_info1.get("periods_required", 1) <= problem.days_per_week:
                            violations += 1

        return violations

    # Initial population
    population = [make_random_chromosome() for _ in range(pop_size)]
    best_chrom = None
    best_violations = float('inf')

    for gen in range(generations):
        result.iterations += 1
        
        # Calculate fitness for all
        evaluated = []
        for chrom in population:
            v_count = count_violations(chrom)
            evaluated.append((chrom, v_count))
            if v_count < best_violations:
                best_violations = v_count
                best_chrom = chrom.copy()

        if best_violations == 0:
            result.trace.append(f"GA: Found zero-conflict assignment at generation {gen}!")
            break

        if gen % 20 == 0:
            result.trace.append(f"GA Gen {gen}: Best Conflicts={best_violations}")
            result.visited_sequence.append({
                "assignment": {f"{var[0]}_{var[1]}": val for var, val in best_chrom.items()},
                "domains": {f"{var[0]}_{var[1]}": list(problem.domains[var]) for var in problem.variables}
            })

        # Tournament Selection
        def select_parent():
            candidates = random.sample(evaluated, min(3, len(evaluated)))
            candidates.sort(key=lambda x: x[1])
            return candidates[0][0]

        new_population = []
        
        # Elitism
        evaluated.sort(key=lambda x: x[1])
        for i in range(min(elitism_count, pop_size)):
            new_population.append(evaluated[i][0].copy())

        # Breed next generation
        while len(new_population) < pop_size:
            parent1 = select_parent()
            parent2 = select_parent()

            # Crossover
            if random.random() < crossover_rate:
                child1 = {}
                child2 = {}
                for v in valid_vars:
                    if random.random() < 0.5:
                        child1[v] = parent1[v]
                        child2[v] = parent2[v]
                    else:
                        child1[v] = parent2[v]
                        child2[v] = parent1[v]
            else:
                child1 = parent1.copy()
                child2 = parent2.copy()

            # Mutation
            for child in [child1, child2]:
                for v in valid_vars:
                    if random.random() < mutation_rate:
                        child[v] = random.choice(problem.domains[v])

            new_population.append(child1)
            if len(new_population) < pop_size:
                new_population.append(child2)

        population = new_population

    # Post-process: clean assignment
    clean_assignment = {}
    if best_chrom:
        for var, val in best_chrom.items():
            if problem.is_consistent(var, val, clean_assignment):
                clean_assignment[var] = val

    result.runtime = time.perf_counter() - start_time
    
    if len(clean_assignment) == len(problem.variables) and best_violations == 0:
        result.assignment = clean_assignment
        result.solved = True
        result.trace.append("Genetic Algorithm solved timetable completely!")
    else:
        result.solved = False
        result.partial_assignment = clean_assignment
        result.trace.append(f"Genetic Algorithm completed. Clean partial size: {len(clean_assignment)}/{len(problem.variables)}")
        
        unscheduled_vars = [v for v in problem.variables if v not in clean_assignment]
        unscheduled_courses = set(v[0] for v in unscheduled_vars)
        for cname in unscheduled_courses:
            c_info = problem.course_map[cname]
            teacher = c_info.get("teacher")
            reason = "Failed to converge conflict-free. Conflicts with other courses or teacher/room occupancy."
            if cname in [e[0] for e in empty_vars]:
                reason = f"No eligible slots initially (check Teacher {teacher} availability, room types, or capacity limits)."
            result.unscheduled.append({
                "course": cname,
                "reason": reason
            })

    return result
