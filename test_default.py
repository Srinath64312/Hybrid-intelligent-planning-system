import json
import time
from src.problems.timetable import TimetableProblem
from src.engines.timetable_engine import run_timetable

data = {
  "courses": [
    {"name": "CS101", "teacher": "Dr. Alice", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortC"]},
    {"name": "CS102", "teacher": "Dr. Bob", "periods_required": 3, "groups": ["CS-CohortA"]},
    {"name": "MATH101", "teacher": "Prof. Carol", "periods_required": 4, "groups": ["CS-CohortA", "CS-CohortB", "CS-CohortC", "EE-CohortA"]},
    {"name": "CS-Lab101", "teacher": "Dr. Alice", "periods_required": 2, "groups": ["CS-CohortA", "CS-CohortC"], "is_lab": True},
    {"name": "CS201", "teacher": "Dr. Bob", "periods_required": 3, "groups": ["CS-CohortB"]},
    {"name": "MATH201", "teacher": "Prof. Carol", "periods_required": 3, "groups": ["CS-CohortB", "EE-CohortA"]},
    {"name": "Sports", "teacher": "Coach Dave", "periods_required": 2, "groups": ["CS-CohortA", "CS-CohortB", "CS-CohortC", "EE-CohortA"]},
    {"name": "Library / Study", "teacher": "Self-Study", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB", "CS-CohortC", "EE-CohortA"]},
    {"name": "FED", "teacher": "Prof. Smith", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB", "CS-CohortC", "EE-CohortA"]},
    {"name": "CFAI", "teacher": "Prof. Jones", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB", "CS-CohortC", "EE-CohortA"]},
    {"name": "Foreign Language", "teacher": "Mme. Dupont", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB", "CS-CohortC", "EE-CohortA"]}
  ],
  "teachers": [
    {
      "name": "Dr. Alice",
      "max_periods_per_day": 3,
      "availability": [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2]]
    },
    {
      "name": "Dr. Bob",
      "max_periods_per_day": 3,
      "availability": [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [4, 4]]
    },
    {
      "name": "Prof. Carol",
      "max_periods_per_day": 4,
      "availability": [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5]]
    },
    {
      "name": "Coach Dave",
      "max_periods_per_day": 4,
      "availability": []
    },
    {
      "name": "Self-Study",
      "max_periods_per_day": 6,
      "availability": []
    },
    {
      "name": "Prof. Smith",
      "max_periods_per_day": 4,
      "availability": []
    },
    {
      "name": "Prof. Jones",
      "max_periods_per_day": 4,
      "availability": []
    },
    {
      "name": "Mme. Dupont",
      "max_periods_per_day": 4,
      "availability": []
    }
  ],
  "rooms": [
    {"name": "Room-101", "capacity": 60, "type": "Lecture Hall"},
    {"name": "Room-102", "capacity": 40, "type": "Lecture Hall"},
    {"name": "Room-103", "capacity": 80, "type": "Lecture Hall"},
    {"name": "Room-104", "capacity": 50, "type": "Lecture Hall"},
    {"name": "Auditorium", "capacity": 200, "type": "Lecture Hall"},
    {"name": "CS-LabA", "capacity": 45, "type": "Lab"},
    {"name": "EE-LabA", "capacity": 45, "type": "Lab"},
    {"name": "Sports Field", "capacity": 200, "type": "Outdoor"},
    {"name": "Library", "capacity": 200, "type": "Study Area"}
  ],
  "groups": [
    {"name": "CS-CohortA", "capacity": 25, "courses": ["CS101", "CS102", "MATH101", "CS-Lab101", "Sports", "Library / Study", "FED", "CFAI", "Foreign Language"]},
    {"name": "CS-CohortB", "capacity": 35, "courses": ["MATH101", "CS201", "MATH201", "Sports", "Library / Study", "FED", "CFAI", "Foreign Language"]},
    {"name": "CS-CohortC", "capacity": 40, "courses": ["CS101", "MATH101", "CS-Lab101", "Sports", "Library / Study", "FED", "CFAI", "Foreign Language"]},
    {"name": "EE-CohortA", "capacity": 30, "courses": ["MATH101", "MATH201", "Sports", "Library / Study", "FED", "CFAI", "Foreign Language"]}
  ],
  "config": {
    "periods_per_day": 6,
    "days_per_week": 5,
    "solver": "Backtracking (MRV+FC)"
  }
}

print(f"========================================\nTesting Default Dataset (Latest)\n========================================")
start_t = time.time()
problem = TimetableProblem(
    courses=data["courses"],
    teachers=data["teachers"],
    rooms=data["rooms"],
    groups=data["groups"],
    periods_per_day=data["config"]["periods_per_day"],
    days_per_week=data["config"]["days_per_week"]
)
result = run_timetable(problem, solver_choice="Backtracking (MRV+FC)")
end_t = time.time()

print(f"Time Taken: {end_t - start_t:.4f}s")
print(f"Solved Successfully: {result.solved}")
print(f"Assignments tried: {result.assignments_tried}")
print(f"Backtracks: {result.backtracks}")
print(f"Unscheduled Courses: {len(result.unscheduled)}")

if result.solved:
    print(f"\nAll 11 complex classes and 4 cohorts scheduled perfectly with ZERO conflicts.\n")
    
    # Process assignment for CohortC as an example
    cohort_c_schedule = {d: {p: "Free Period" for p in range(6)} for d in range(5)}
    
    for var, val in result.assignment.items():
        c_name, p_idx = var
        day, period, room = val
        if "CS-CohortC" in problem.course_groups.get(c_name, []):
            cohort_c_schedule[day][period] = f"{c_name} ({room})"
            
    print(f"--- Sample View: CS-CohortC ---")
    for d in range(5):
        day_str = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][d]
        print(f"{day_str}: {list(cohort_c_schedule[d].values())}")
