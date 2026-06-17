from typing import List, Dict, Any, Tuple, Optional
import math
import random
from src.core.problem import CSPProblem

class TimetableProblem(CSPProblem[Tuple[str, int], Tuple[int, int, str]]):
    """
    Timetable Generator CSP Problem.
    Variables: (course_name, period_index) -> e.g. ("CS101", 0), ("CS101", 1)
    Values: (day, period, room_name) -> e.g. (0, 2, "Room_101")
    """
    def __init__(
        self,
        courses: List[Dict[str, Any]],
        teachers: List[Dict[str, Any]],
        rooms: List[Dict[str, Any]],
        groups: List[Dict[str, Any]],
        periods_per_day: int = 6,
        days_per_week: int = 5
    ):
        self.courses = courses
        self.teachers = teachers
        self.rooms = rooms
        self.groups = groups
        self.periods_per_day = periods_per_day
        self.days_per_week = days_per_week

        # Create quick-lookup maps
        self.course_map = {c["name"]: c for c in courses}
        self.teacher_map = {t["name"]: t for t in teachers}
        self.room_map = {r["name"]: r for r in rooms}
        self.group_map = {g["name"]: g for g in groups}

        # Identify student groups per course
        self.course_groups = {}
        for c in courses:
            c_name = c["name"]
            # A course can explicitly list student groups, or we scan student groups
            c_groups = c.get("groups", [])
            if not c_groups:
                c_groups = [g["name"] for g in groups if c_name in g.get("courses", [])]
            self.course_groups[c_name] = c_groups

        # Build variables list
        variables = []
        for c in courses:
            periods = c.get("periods_required", 1)
            for p_idx in range(periods):
                variables.append((c["name"], p_idx))

        # Build domains dynamically
        domains = {}
        for var in variables:
            c_name, p_idx = var
            c_info = self.course_map[c_name]
            teacher_name = c_info.get("teacher")
            t_info = self.teacher_map.get(teacher_name, {})
            
            # Get teacher availability if specified
            # Format: list of [day, period] or set of (day, period)
            t_avail = t_info.get("availability", [])
            t_avail_set = None
            if t_avail:
                t_avail_set = {(item[0], item[1]) for item in t_avail}

            # Max group capacity for this course
            c_grp_names = self.course_groups.get(c_name, [])
            max_capacity = 0
            if c_grp_names:
                max_capacity = max((self.group_map.get(g, {}).get("capacity", 0) for g in c_grp_names), default=0)

            is_lab = c_info.get("is_lab", False) or "lab" in c_name.lower()

            var_domain = []
            for day in range(self.days_per_week):
                for period in range(self.periods_per_day):
                    # Teacher Availability constraint (Unary)
                    if t_avail_set is not None and (day, period) not in t_avail_set:
                        continue

                    for room in self.rooms:
                        r_name = room["name"]
                        r_capacity = room.get("capacity", 999)
                        r_type = room.get("type", "Lecture Hall")
                        is_room_lab = "lab" in r_type.lower() or "lab" in r_name.lower()

                        # Room Capacity constraint (Unary)
                        if r_capacity < max_capacity:
                            continue

                        # Lab Room type constraint (Unary)
                        if is_lab and not is_room_lab:
                            continue
                        if not is_lab and is_room_lab:
                            # Standard courses ideally shouldn't go to lab unless forced
                            # Let's allow it as a fallback but prefer standard rooms
                            pass

                        var_domain.append((day, period, r_name))
            
            # Sort or shuffle domain for heuristics (default sorted by day, period, room)
            random.shuffle(var_domain)
            domains[var] = var_domain

        super().__init__(variables, domains)

    def is_consistent(self, variable: Tuple[str, int], value: Tuple[int, int, str], assignment: Dict[Tuple[str, int], Tuple[int, int, str]]) -> bool:
        """
        Quick check for hard constraint violations.
        """
        day, period, room = value
        c_name, p_idx = variable
        c_info = self.course_map[c_name]
        teacher = c_info.get("teacher")
        groups = self.course_groups.get(c_name, [])

        # 1. Teacher max periods check
        t_info = self.teacher_map.get(teacher, {})
        max_periods = t_info.get("max_periods_per_day", self.periods_per_day)
        
        # Count periods for this teacher on this day in current assignment
        t_count = 0
        for assigned_var, assigned_val in assignment.items():
            a_cname, a_pidx = assigned_var
            a_day, a_period, a_room = assigned_val
            a_teacher = self.course_map[a_cname].get("teacher")
            if a_teacher == teacher and a_day == day:
                t_count += 1
        if t_count >= max_periods:
            return False

        # Compare with other assigned variables
        for other_var, other_val in assignment.items():
            other_cname, other_pidx = other_var
            other_day, other_period, other_room = other_val
            other_info = self.course_map[other_cname]
            other_teacher = other_info.get("teacher")
            other_groups = self.course_groups.get(other_cname, [])

            # Same period constraints
            if day == other_day and period == other_period:
                # Teacher Conflict
                if teacher == other_teacher:
                    return False
                
                # Room Conflict
                if room == other_room:
                    return False

                # Student Group Conflict
                if any(g in other_groups for g in groups):
                    return False

            # Same day spread constraint: no same subject twice in one day
            # If it's a lab, double periods are allowed/expected.
            is_lab = c_info.get("is_lab", False) or "lab" in c_name.lower()
            other_is_lab = other_info.get("is_lab", False) or "lab" in other_cname.lower()

            if c_name == other_cname and day == other_day:
                if is_lab:
                    # Labs must be double periods (consecutive periods, same day, same room)
                    # For a lab, we only allow consecutive scheduling
                    # i.e., |p_idx - other_pidx| == 1 implies |period - other_period| == 1 and room == other_room
                    if abs(p_idx - other_pidx) == 1:
                        if abs(period - other_period) != 1 or room != other_room:
                            return False
                    else:
                        # Non-consecutive periods of the same lab on the same day are forbidden
                        return False
                else:
                    # Standard course: no same subject twice on same day
                    # But wait, what if periods_required > days_per_week? Then we must allow it.
                    if c_info.get("periods_required", 1) <= self.days_per_week:
                        return False

        return True

    def evaluate_constraints(self, variable: Tuple[str, int], value: Tuple[int, int, str], assignment: Dict[Tuple[str, int], Tuple[int, int, str]]) -> Dict[str, Any]:
        """
        Detailed evaluation for explainability reports.
        """
        day, period, room = value
        c_name, p_idx = variable
        c_info = self.course_map[c_name]
        teacher = c_info.get("teacher")
        groups = self.course_groups.get(c_name, [])

        details = []
        passed_all = True

        # Teacher availability check
        t_info = self.teacher_map.get(teacher, {})
        t_avail = t_info.get("availability", [])
        if t_avail:
            t_avail_set = {(item[0], item[1]) for item in t_avail}
            if (day, period) not in t_avail_set:
                passed_all = False
                details.append({
                    "name": "Teacher Availability",
                    "passed": False,
                    "weight": 0.1,
                    "reason": f"Teacher {teacher} is not available on Day {day}, Period {period}."
                })
            else:
                details.append({
                    "name": "Teacher Availability",
                    "passed": True,
                    "weight": 0.9,
                    "reason": f"Teacher {teacher} is available."
                })

        # Lab Room type check
        is_lab = c_info.get("is_lab", False) or "lab" in c_name.lower()
        r_type = self.room_map.get(room, {}).get("type", "Lecture Hall")
        is_room_lab = "lab" in r_type.lower() or "lab" in room.lower()
        if is_lab and not is_room_lab:
            passed_all = False
            details.append({
                "name": "Lab Room Match",
                "passed": False,
                "weight": 0.05,
                "reason": f"Lab course {c_name} cannot be scheduled in non-lab room {room}."
            })
        elif is_lab:
            details.append({
                "name": "Lab Room Match",
                "passed": True,
                "weight": 0.95,
                "reason": f"Lab course {c_name} scheduled in lab room {room}."
            })

        # Max periods per day check
        max_periods = t_info.get("max_periods_per_day", self.periods_per_day)
        t_count = 0
        for assigned_var, assigned_val in assignment.items():
            a_cname, a_pidx = assigned_var
            a_day, a_period, a_room = assigned_val
            a_teacher = self.course_map[a_cname].get("teacher")
            if a_teacher == teacher and a_day == day:
                t_count += 1
        if t_count >= max_periods:
            passed_all = False
            details.append({
                "name": "Teacher Daily Load",
                "passed": False,
                "weight": 0.2,
                "reason": f"Teacher {teacher} would exceed max load of {max_periods} periods on Day {day}."
            })
        else:
            details.append({
                "name": "Teacher Daily Load",
                "passed": True,
                "weight": 0.8,
                "reason": f"Teacher {teacher} load is within daily limit ({t_count + 1}/{max_periods})."
            })

        # Overlaps with other courses
        for other_var, other_val in assignment.items():
            other_cname, other_pidx = other_var
            other_day, other_period, other_room = other_val
            other_info = self.course_map[other_cname]
            other_teacher = other_info.get("teacher")
            other_groups = self.course_groups.get(other_cname, [])

            if day == other_day and period == other_period:
                if teacher == other_teacher:
                    passed_all = False
                    details.append({
                        "name": "Teacher Conflict",
                        "passed": False,
                        "weight": 0.0,
                        "reason": f"Teacher {teacher} is already teaching {other_cname}."
                    })
                if room == other_room:
                    passed_all = False
                    details.append({
                        "name": "Room Conflict",
                        "passed": False,
                        "weight": 0.0,
                        "reason": f"Room {room} is already occupied by {other_cname}."
                    })
                common_grps = [g for g in groups if g in other_groups]
                if common_grps:
                    passed_all = False
                    details.append({
                        "name": "Student Group Conflict",
                        "passed": False,
                        "weight": 0.1,
                        "reason": f"Student group(s) {common_grps} already have {other_cname} scheduled."
                    })

            # Daily spread / Double periods for labs
            if c_name == other_cname and day == other_day:
                if is_lab:
                    if abs(p_idx - other_pidx) == 1:
                        if abs(period - other_period) != 1 or room != other_room:
                            passed_all = False
                            details.append({
                                "name": "Lab Double Period",
                                "passed": False,
                                "weight": 0.15,
                                "reason": f"Lab periods of {c_name} must be consecutive and in the same room."
                            })
                    else:
                        passed_all = False
                        details.append({
                            "name": "Lab Spread",
                            "passed": False,
                            "weight": 0.15,
                            "reason": f"Lab periods {p_idx} and {other_pidx} of {c_name} cannot be on the same day."
                        })
                else:
                    if c_info.get("periods_required", 1) <= self.days_per_week:
                        passed_all = False
                        details.append({
                            "name": "Daily Spread",
                            "passed": False,
                            "weight": 0.2,
                            "reason": f"Course {c_name} is already scheduled on Day {day}."
                        })

        if passed_all:
            details.append({
                "name": "All Valid",
                "passed": True,
                "weight": 0.9,
                "reason": "Assignment is consistent with all constraints."
            })

        # Calculate probability
        prob = 1.0
        for d in details:
            prob *= d["weight"] if d["passed"] else (1.0 - d["weight"])

        return {
            "passed": passed_all,
            "probability": round(prob, 4),
            "details": details
        }
