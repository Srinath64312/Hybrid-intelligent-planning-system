from typing import List, Dict
from src.core.problem import CSPProblem

class NQueensProblem(CSPProblem[int, int]):
    def __init__(self, n: int):
        self.n = n
        variables = list(range(n))
        domains = {i: list(range(n)) for i in range(n)}
        super().__init__(variables, domains)

    def is_consistent(self, variable: int, value: int, assignment: Dict[int, int]) -> bool:
        # Check against all currently assigned variables
        for var, val in assignment.items():
            if val == value or abs(var - variable) == abs(val - value):
                return False
        return True
