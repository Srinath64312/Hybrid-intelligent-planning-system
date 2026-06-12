from typing import List, Dict, Tuple
from src.core.problem import CSPProblem

class SchedulingProblem(CSPProblem[str, Tuple[str, str]]):
    def __init__(self, relax_newton: bool = False, relax_cohort: bool = False):
        self.relax_newton = relax_newton
        self.relax_cohort = relax_cohort
        # Variables: Courses to schedule
        variables = ["BIO101", "CHEM101", "PHYS101"]
        
        # Timeslots and Rooms
        slots = ["Wednesday_0900", "Wednesday_1100", "Wednesday_1300", "Tuesday_0900"]
        rooms = ["Lab_A_Wet", "Lecture_Hall_102"]
        
        # Set up domains dynamically based on basic eligibility constraints
        domains = {}
        for var in variables:
            var_domain = []
            for s in slots:
                for r in rooms:
                    # Hard Constraint: BIO101 and CHEM101 require Lab_A_Wet (Wet Lab)
                    if var in ["BIO101", "CHEM101"] and r != "Lab_A_Wet":
                        continue
                    # Hard Constraint: Wet Lab is only open on Wednesdays
                    if var in ["BIO101", "CHEM101"] and s == "Tuesday_0900":
                        continue
                    # Soft Constraint: Dr. Newton (PHYS101) only teaches Wednesday (unless relaxed)
                    if var == "PHYS101" and not relax_newton and s == "Tuesday_0900":
                        continue
                    # Hard Constraint: Wet Lab is not available at Wednesday_1300
                    if r == "Lab_A_Wet" and s == "Wednesday_1300":
                        continue
                    var_domain.append((s, r))
            domains[var] = var_domain
            
        self.relax_cohort = relax_cohort
        super().__init__(variables, domains)

    def is_consistent(self, variable: str, value: Tuple[str, str], assignment: Dict[str, Tuple[str, str]]) -> bool:
        slot, room = value
        
        for other_var, other_val in assignment.items():
            other_slot, other_room = other_val
            
            # Constraint 1: Room Overlap Constraint (Hard)
            # Two classes cannot be scheduled in the same room at the same time.
            if slot == other_slot and room == other_room:
                return False
                
            # Constraint 2: Cohort Overlap Constraint (Soft - unless relaxed)
            # Students take all three courses, so they cannot overlap.
            if not self.relax_cohort:
                if slot == other_slot:
                    return False
                    
        return True

    def evaluate_constraints(self, variable: str, value: Tuple[str, str], assignment: Dict[str, Tuple[str, str]]) -> Dict:
        slot, room = value
        details = []
        passed_all = True
        
        # Hard constraints built into domains
        if variable in ["BIO101", "CHEM101"]:
            if room == "Lab_A_Wet":
                details.append({"name": "Wet Lab Requirement", "passed": True, "weight": 0.99, "reason": f"{variable} successfully scheduled in Wet Lab."})
            else:
                passed_all = False
                details.append({"name": "Wet Lab Requirement", "passed": False, "weight": 0.01, "reason": f"{variable} MUST be in a Wet Lab."})
                
            if slot == "Tuesday_0900":
                passed_all = False
                details.append({"name": "Lab Availability", "passed": False, "weight": 0.05, "reason": "Wet Lab is closed on Tuesdays."})
                
        if variable == "PHYS101" and not self.relax_newton and slot == "Tuesday_0900":
            passed_all = False
            details.append({"name": "Professor Availability", "passed": False, "weight": 0.10, "reason": "Dr. Newton only teaches on Wednesdays."})
            
        for other_var, other_val in assignment.items():
            other_slot, other_room = other_val
            
            # Constraint 1: Room Overlap
            if slot == other_slot and room == other_room:
                passed_all = False
                details.append({"name": "Room Conflict", "passed": False, "weight": 0.0, "reason": f"Room {room} is already booked by {other_var} at {slot}."})
                
            # Constraint 2: Cohort Overlap
            if not self.relax_cohort and slot == other_slot:
                passed_all = False
                details.append({"name": "Cohort Conflict", "passed": False, "weight": 0.15, "reason": f"Students cannot be in {variable} and {other_var} simultaneously at {slot}."})

        if passed_all:
            details.append({"name": "All Valid", "passed": True, "weight": 0.85, "reason": "Assignment satisfies all current constraints."})

        # Calculate a bayesian probability of success for this branch
        # Product of weights of passed constraints
        prob = 1.0
        for d in details:
            prob *= d["weight"] if d["passed"] else (1.0 - d["weight"])
            
        return {
            "passed": passed_all,
            "probability": round(prob, 4),
            "details": details
        }
