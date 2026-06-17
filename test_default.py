import json
import time
from src.problems.timetable import TimetableProblem
from src.engines.timetable_engine import run_timetable

# Load default dataset from ui/src/components/TimetablePanel.jsx
# I'll just copy the default dictionary here
data = {
  "courses": [
    {"name": "CS101", "teacher": "Dr. Alice", "periods_required": 3, "groups": ["CS-CohortA"]},
    {"name": "CS102", "teacher": "Dr. Bob", "periods_required": 3, "groups": ["CS-CohortA"]},
    {"name": "MATH101", "teacher": "Prof. Carol", "periods_required": 4, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "CS-Lab101", "teacher": "Dr. Alice", "periods_required": 2, "groups": ["CS-CohortA"], "is_lab": True},
    {"name": "CS201", "teacher": "Dr. Bob", "periods_required": 3, "groups": ["CS-CohortB"]},
    {"name": "MATH201", "teacher": "Prof. Carol", "periods_required": 3, "groups": ["CS-CohortB"]},
    {"name": "Sports", "teacher": "Coach Dave", "periods_required": 2, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "Library / Study", "teacher": "Self-Study", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "FED", "teacher": "Prof. Smith", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "CFAI", "teacher": "Prof. Jones", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB"]},
    {"name": "Foreign Language", "teacher": "Mme. Dupont", "periods_required": 3, "groups": ["CS-CohortA", "CS-CohortB"]}
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
    {"name": "CS-LabA", "capacity": 30, "type": "Lab"},
    {"name": "Sports Field", "capacity": 100, "type": "Outdoor"},
    {"name": "Library", "capacity": 100, "type": "Study Area"}
  ],
  "groups": [
    {"name": "CS-CohortA", "capacity": 25, "courses": ["CS101", "CS102", "MATH101", "CS-Lab101", "Sports", "Library / Study", "FED", "CFAI", "Foreign Language"]},
    {"name": "CS-CohortB", "capacity": 35, "courses": ["MATH101", "CS201", "MATH201", "Sports", "Library / Study", "FED", "CFAI", "Foreign Language"]}
  ],
  "config": {
    "periods_per_day": 6,
    "days_per_week": 5,
    "solver": "Backtracking (MRV+FC)"
  }
}

print(f"Testing Default Dataset")
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

if result.unscheduled:
    print("Reasons for unscheduled:")
    for u in result.unscheduled:
        print(f"  - {u['course']}: {u['reason']}")
