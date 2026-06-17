import random
import time
from src.problems.timetable import TimetableProblem
from src.engines.timetable_engine import run_timetable

def generate_random_data():
    num_cohorts = random.randint(2, 4)
    num_teachers = random.randint(3, 6)
    num_rooms = random.randint(3, 5)
    
    cohorts = [f"Cohort-{i}" for i in range(num_cohorts)]
    teachers = [f"Teacher-{i}" for i in range(num_teachers)]
    rooms = [{"name": f"Room-{i}", "capacity": random.randint(30, 100), "type": "Lecture Hall"} for i in range(num_rooms)]
    
    teacher_data = [{"name": t, "max_periods_per_day": random.randint(3, 5), "availability": []} for t in teachers]
    group_data = [{"name": c, "capacity": random.randint(20, 50), "courses": []} for c in cohorts]
    
    courses = []
    num_courses = random.randint(10, 20)
    for i in range(num_courses):
        course_name = f"Course-{i}"
        teacher = random.choice(teachers)
        periods = random.randint(2, 4)
        
        # Pick 1 to 2 random cohorts
        assigned_cohorts = random.sample(cohorts, random.randint(1, min(2, num_cohorts)))
        courses.append({
            "name": course_name,
            "teacher": teacher,
            "periods_required": periods,
            "groups": assigned_cohorts
        })
        
        for c in assigned_cohorts:
            for g in group_data:
                if g["name"] == c:
                    g["courses"].append(course_name)
                    
    data = {
        "courses": courses,
        "teachers": teacher_data,
        "rooms": rooms,
        "groups": group_data,
        "config": {
            "periods_per_day": 6,
            "days_per_week": 5,
            "solver": "Backtracking (MRV+FC)"
        }
    }
    return data

for run_id in range(1, 4):
    print(f"\n{'='*40}")
    print(f"RUN {run_id}: Generating Random Timetable")
    print(f"{'='*40}")
    
    data = generate_random_data()
    print(f"Random Inputs: {len(data['courses'])} courses, {len(data['teachers'])} teachers, {len(data['groups'])} cohorts.")
    
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
        for u in result.unscheduled[:3]:
            print(f"  - {u['course']}: {u['reason']}")
        if len(result.unscheduled) > 3:
            print(f"  ... and {len(result.unscheduled) - 3} more.")
            
    # Post-processing padding logic (on best partial or full assignment)
    assignment_to_use = result.assignment if result.solved else result.partial_assignment
    
    if assignment_to_use is not None:
        group_timetables = {g["name"]: {d: {p: None for p in range(problem.periods_per_day)} for d in range(problem.days_per_week)} for g in data["groups"]}
        
        for var, val in assignment_to_use.items():
            c_name, p_idx = var
            day, period, room = val
            c_info = problem.course_map[c_name]
            for g in c_info.get("groups", []):
                if g in group_timetables:
                    group_timetables[g][day][period] = {
                        "course": c_name,
                        "teacher": c_info.get("teacher"),
                        "room": room,
                        "type": "Lab" if c_info.get("is_lab") else "Lecture"
                    }

        # Fill empty slots
        for g in group_timetables:
            for d in range(problem.days_per_week):
                for p in range(problem.periods_per_day):
                    if group_timetables[g][d][p] is None:
                        group_timetables[g][d][p] = {"course": "Free Period"}

        print(f"\n--- Sample Output for {data['groups'][0]['name']} ---")
        sample_cohort = data["groups"][0]["name"]
        for d in range(problem.days_per_week):
            row = [group_timetables[sample_cohort][d][p]["course"] for p in range(problem.periods_per_day)]
            print(f"Day {d}: {row}")
    else:
        print("\nNo assignment returned at all (complete wipeout).")
