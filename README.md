# HIPS (Hybrid Intelligent Planning System) – Smart Campus AI Planner

HIPS is a comprehensive campus planning suite showcasing core academic AI algorithms—ranging from pathfinding and constraint satisfaction to adversarial game theory, probabilistic reasoning, and resource optimization. It features a modern React client with a live Python engine running client-side using WebAssembly (Pyodide), alongside a Python Flask backend API and a Streamlit demo.

---

## Timetable Generator Module

The **Timetable Generator** is a standalone module designed to automate the scheduling of weekly academic calendars for students and instructors under strict operational constraints.

### 1. Problem Inputs
The system consumes a structured configuration matrix (provided as JSON/CSV or input directly):
- **Courses:** A list of course requirements containing subject name, assigned teacher, periods required per week, student groups involved, and whether it requires a laboratory setup (`is_lab`).
- **Teachers:** List of instructors, their max allowed teaching load per day, and a custom list of day/period availability coordinates.
- **Rooms:** List of rooms, their capacities, and their category (`Lecture Hall` vs `Lab`).
- **Student Groups:** The sections/cohorts (e.g. `CS-CohortA`) and their list of registered subjects.
- **Dimensions:** Configurable days per week (default 5) and periods per day (default 6).

### 2. Constraints Modeled
The Timetable Generator enforces several critical campus scheduling constraints:
- **Teacher Double-Booking (Hard):** An instructor cannot be assigned to teach two classes in the same day and period.
- **Room Collision (Hard):** A room cannot host more than one course in the same day and period.
- **Student Group Collision (Hard):** A cohort of students cannot attend two courses in the same day and period.
- **Teacher Availability (Hard):** Classes are only scheduled during slots where the instructor marked themselves as available.
- **Teacher Loading limit (Hard):** Daily periods scheduled for an instructor cannot exceed their configured `max_periods_per_day`.
- **Lab Facility (Hard):** Laboratorial courses (flagged as `is_lab`) are restricted to rooms categorized as `Lab`.
- **Lab Double Periods (Soft/Hard):** Laboratory sessions are scheduled consecutively (e.g., period 0 and 1, 2 and 3) on the same day and in the same room.
- **Daily Spread (Soft/Hard):** Multi-period standard classes are balanced across different days (no subject scheduled twice on the same day unless total weekly sessions exceed days available).

### 3. Solver Optimization Methods
Users can toggle between two alternate search solvers:
1. **Backtracking Search (with MRV, LCV, and Forward Checking):** Combines Minimum Remaining Values (MRV) selection, Least Constraining Value (LCV) heuristic ordering, and Forward Checking (FC) to prune branches early. Recommended for small/medium datasets where it guarantees an optimal solution.
2. **Simulated Annealing (Local Search):** Employs iterative cooling schedule changes to navigate large state-spaces. It minimizes constraint conflicts over a fixed iteration limit and excels at finding conflict-free schedules for complex datasets where backtracking is too slow.

---

## How to Run the System

### 1. Flask API Backend
Launch the Flask REST server (port 5000) for processing API requests:
```bash
pip install -r requirements.txt
python api.py
```

#### Endpoints:
- **POST `/api/timetable/generate`**
  Send course/teacher/room matrices. Returns solved timetable grids and metrics.
- **GET `/api/timetable/export/csv`**
  Downloads the last generated timetable report in CSV format.
- **GET `/api/timetable/export/pdf`**
  Downloads the last generated timetable report in PDF format (requires `fpdf2`).

### 2. Streamlit Dashboard
Launch the simple interactive playground page to test solvers and visualize grids:
```bash
pip install streamlit pandas
streamlit run app.py
```
*Select **Timetable Generator** in the sidebar category to explore.*

### 3. React + Vite UI Client
Start the rich visual frontend client:
```bash
cd ui
npm install
node copy-python.js
npm run dev
```
Navigate to the **Timetable Generator** tab in the sidebar dashboard to interact, edit dataset JSONs, view calendar sheets, and export results.

### 4. Running Tests
Run all unit and integration tests (including the new timetable constraint validation tests):
```bash
python -m pytest -v
```
