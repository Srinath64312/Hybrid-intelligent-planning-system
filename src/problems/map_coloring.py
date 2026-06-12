from typing import List, Dict
from src.core.problem import CSPProblem

class MapColoringProblem(CSPProblem[str, str]):
    def __init__(self, neighbors: Dict[str, List[str]], colors: List[str]):
        self.neighbors = neighbors
        variables = list(neighbors.keys())
        domains = {var: list(colors) for var in variables}
        super().__init__(variables, domains)

    def is_consistent(self, variable: str, value: str, assignment: Dict[str, str]) -> bool:
        # No adjacent region can have the same color
        for neighbor in self.neighbors.get(variable, []):
            if neighbor in assignment and assignment[neighbor] == value:
                return False
        return True

def build_australian_map_coloring() -> MapColoringProblem:
    # Neighbors map of Australian states/territories
    neighbors = {
        "WA": ["NT", "SA"],
        "NT": ["WA", "Q", "SA"],
        "SA": ["WA", "NT", "Q", "NSW", "V"],
        "Q": ["NT", "SA", "NSW"],
        "NSW": ["Q", "SA", "V"],
        "V": ["SA", "NSW"],
        "T": []  # standalone island Tasmania
    }
    colors = ["Red", "Green", "Blue"]
    return MapColoringProblem(neighbors, colors)
