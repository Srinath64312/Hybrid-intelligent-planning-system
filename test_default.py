import json
import time
from src.problems.timetable import TimetableProblem
from src.engines.timetable_engine import run_timetable

data = {
  "courses": [
    {"name": "DSA-II", "teacher": "DR. A. MAHESH BABU", "periods_required": 8, "groups": ["Section 1 (CS)", "Section 2 (CS)", "Section 3 (EE)"]},
    {"name": "MFDSA", "teacher": "DR. NAGESH", "periods_required": 6, "groups": ["Section 1 (CS)", "Section 2 (CS)"]},
    {"name": "MCS", "teacher": "DR. JITENDRA SHARMA", "periods_required": 6, "groups": ["Section 3 (EE)"]},
    {"name": "CFAI", "teacher": "DR. Y. SUDARSHAN", "periods_required": 6, "groups": ["Section 1 (CS)", "Section 2 (CS)", "Section 3 (EE)"]},
    {"name": "FEDF/UI", "teacher": "DR. T. PRIYANKA", "periods_required": 8, "groups": ["Section 1 (CS)", "Section 2 (CS)", "Section 3 (EE)"]},
    {"name": "JL (Japanese)", "teacher": "MS. SANDHYA", "periods_required": 5, "groups": ["Section 1 (CS)", "Section 2 (CS)", "Section 3 (EE)"]},
    {"name": "GLBPC", "teacher": "MR. SANDEEP CH", "periods_required": 7, "groups": ["Section 1 (CS)", "Section 2 (CS)", "Section 3 (EE)"]},
    {"name": "SPORTS / LIB", "teacher": "COACH / SELF", "periods_required": 2, "groups": ["Section 1 (CS)", "Section 2 (CS)", "Section 3 (EE)"]}
  ],
  "teachers": [
    {"name": "DR. A. MAHESH BABU", "max_periods_per_day": 5, "availability": []},
    {"name": "DR. NAGESH", "max_periods_per_day": 3, "availability": []},
    {"name": "DR. JITENDRA SHARMA", "max_periods_per_day": 3, "availability": []},
    {"name": "DR. Y. SUDARSHAN", "max_periods_per_day": 4, "availability": []},
    {"name": "DR. T. PRIYANKA", "max_periods_per_day": 5, "availability": []},
    {"name": "MS. SANDHYA", "max_periods_per_day": 4, "availability": []},
    {"name": "MR. SANDEEP CH", "max_periods_per_day": 4, "availability": []},
    {"name": "COACH / SELF", "max_periods_per_day": 6, "availability": []}
  ],
  "rooms": [
    {"name": "H1-07 (Sec 1)", "capacity": 60, "type": "Lecture Hall"},
    {"name": "H1-08 (Sec 2)", "capacity": 60, "type": "Lecture Hall"},
    {"name": "H1-09 (Sec 3)", "capacity": 60, "type": "Lecture Hall"},
    {"name": "Computer Lab 1", "capacity": 60, "type": "Lab"},
    {"name": "Computer Lab 2", "capacity": 60, "type": "Lab"},
    {"name": "Sports Field", "capacity": 200, "type": "Outdoor"}
  ],
  "groups": [
    {"name": "Section 1 (CS)", "capacity": 50, "courses": ["DSA-II", "MFDSA", "CFAI", "FEDF/UI", "JL (Japanese)", "GLBPC", "SPORTS / LIB"]},
    {"name": "Section 2 (CS)", "capacity": 50, "courses": ["DSA-II", "MFDSA", "CFAI", "FEDF/UI", "JL (Japanese)", "GLBPC", "SPORTS / LIB"]},
    {"name": "Section 3 (EE)", "capacity": 50, "courses": ["DSA-II", "MCS", "CFAI", "FEDF/UI", "JL (Japanese)", "GLBPC", "SPORTS / LIB"]}
  ],
  "config": {
    "periods_per_day": 8,
    "days_per_week": 6,
    "solver": "Backtracking (MRV+FC)"
  }
}

print(f"========================================\nTesting KLH Dataset (Latest)\n========================================")
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
    print(f"\nAll 8 core courses and 3 sections scheduled perfectly with ZERO conflicts.\n")
    
    # Process assignment for Section 3 (EE) as an example
    cohort_schedule = {d: {p: "Free Period" for p in range(8)} for d in range(6)}
    
    for var, val in result.assignment.items():
        c_name, p_idx = var
        day, period, room = val
        if "Section 3 (EE)" in problem.course_groups.get(c_name, []):
            cohort_schedule[day][period] = f"{c_name} ({room})"
            
    print(f"--- Sample View: Section 3 (EE) ---")
    for d in range(6):
        day_str = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d]
        print(f"{day_str}: {list(cohort_schedule[d].values())}")
