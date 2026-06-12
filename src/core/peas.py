from dataclasses import dataclass

@dataclass
class PEAS:
    performance_measure: str
    environment: str
    actuators: str
    sensors: str
    env_type: str = "Unknown"

def get_peas_analysis(problem_category: str) -> PEAS:
    """Returns the generic PEAS model for the given problem category."""
    if problem_category == "Search":
        return PEAS(
            performance_measure="Minimize path cost, minimize nodes expanded",
            environment="Static, fully observable, deterministic, discrete",
            actuators="Move agents along valid transitions",
            sensors="Detect current state and valid successors",
            env_type="Single Agent, Deterministic, Static"
        )
    elif problem_category == "CSP":
        return PEAS(
            performance_measure="Satisfy all constraints, minimize backtracks",
            environment="Static, fully observable, discrete assignments",
            actuators="Assign value to variable",
            sensors="Detect constraint violations",
            env_type="Single Agent, Deterministic, Static"
        )
    elif problem_category == "Game":
        return PEAS(
            performance_measure="Maximize expected utility against opponent",
            environment="Static, fully observable, deterministic, multi-agent",
            actuators="Make a legal game move",
            sensors="Observe board state and opponent moves",
            env_type="Multi Agent, Deterministic, Static"
        )
    elif problem_category == "Bayes":
        return PEAS(
            performance_measure="Maximize inference accuracy, minimize computation",
            environment="Static, partially observable, stochastic",
            actuators="Update beliefs based on evidence",
            sensors="Receive evidence observations",
            env_type="Single Agent, Stochastic, Static"
        )
    elif problem_category == "Timetable":
        return PEAS(
            performance_measure="Maximize course schedule coverage, satisfy all hard constraints, minimize backtracks/conflicts",
            environment="Static, fully observable, discrete assignments",
            actuators="Schedule course period to (day, period, room) slot",
            sensors="Detect teacher/room/group conflicts and constraints",
            env_type="Single Agent, Deterministic, Static"
        )
    return PEAS("N/A", "N/A", "N/A", "N/A")
