from abc import ABC, abstractmethod
from typing import List, Tuple, Any, Dict, Optional, Generic, TypeVar

S = TypeVar('S') # State Type
A = TypeVar('A') # Action Type

class SearchProblem(Generic[S, A], ABC):
    """Abstract class for Search problems (CO2)"""
    @abstractmethod
    def get_initial_state(self) -> S:
        pass

    @abstractmethod
    def is_goal_state(self, state: S) -> bool:
        pass

    @abstractmethod
    def get_successors(self, state: S) -> List[Tuple[S, A, float]]:
        """Returns list of (next_state, action, step_cost)"""
        pass

    def heuristic(self, state: S) -> float:
        """Default heuristic is 0 (UCS equivalent)"""
        return 0.0


V = TypeVar('V') # Variable Type
D = TypeVar('D') # Domain Type

class CSPProblem(Generic[V, D], ABC):
    """Abstract class for Constraint Satisfaction Problems (CO3)"""
    def __init__(self, variables: List[V], domains: Dict[V, List[D]]):
        self.variables = variables
        self.domains = domains

    @abstractmethod
    def is_consistent(self, variable: V, value: D, assignment: Dict[V, D]) -> bool:
        """Check if assigning value to variable violates constraints given current assignment."""
        pass

    def evaluate_constraints(self, variable: V, value: D, assignment: Dict[V, D]) -> Dict[str, Any]:
        """Returns detailed explainability report of constraint evaluations."""
        return {
            "passed": self.is_consistent(variable, value, assignment),
            "probability": 1.0,
            "details": []
        }


class GameProblem(Generic[S, A], ABC):
    """Abstract class for Two-Player Zero-Sum Games (CO4)"""
    @abstractmethod
    def get_initial_state(self) -> S:
        pass

    @abstractmethod
    def get_possible_actions(self, state: S) -> List[A]:
        pass

    @abstractmethod
    def get_next_state(self, state: S, action: A) -> S:
        pass

    @abstractmethod
    def is_terminal(self, state: S) -> bool:
        pass

    @abstractmethod
    def evaluate(self, state: S) -> float:
        """Utility from perspective of maximizing player"""
        pass

    @abstractmethod
    def is_max_turn(self, state: S) -> bool:
        pass
