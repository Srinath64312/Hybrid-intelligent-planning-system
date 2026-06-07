from typing import List, Dict, Tuple
from src.core.problem import CSPProblem

class SchedulingProblem(CSPProblem[str, Tuple[str, str]]):
    def __init__(self, relax_newton: bool = False, relax_cohort: bool = False):
        # Variables: Courses to schedule
        variables = ["BIO101", "CHEM101", "PHYS101"]
        
        # Timeslots and Rooms
        slots = ["Wednesday_0900", "Wednesday_1100", "Tuesday_0900"]
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
