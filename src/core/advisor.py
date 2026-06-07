def generate_advisor_report(category: str):
    if category == "Search":
        return [
            {"title": "Validation", "text": "A* is optimally complete for grid-based pathfinding where edge costs are non-negative."},
            {"title": "Why A*", "text": "It uses both the path cost so far (g) and an estimated cost to goal (h) to explore the most promising paths first, vastly outperforming BFS or DFS on large grids."},
            {"title": "Edge Cases", "text": "If the heuristic overestimates (not admissible), A* may return a sub-optimal path. On incredibly large grids, memory consumption (Open Set) could be a bottleneck."},
            {"title": "Suggested Heuristic", "text": "The Manhattan Distance heuristic is perfectly suited for this 4-way movement grid."},
            {"title": "Clarifying Question", "text": "Are diagonal movements allowed in your specific use-case?"}
        ]
    elif category == "Game":
        return [
            {"title": "Validation", "text": "Alpha-Beta Pruning mathematically guarantees the exact same optimal move as Minimax while exploring significantly fewer nodes."},
            {"title": "Why Alpha-Beta", "text": "By maintaining bounds (`alpha` and `beta`), it trims entire branches of the game tree that can never be reached under optimal play, dropping time complexity from O(b^m) to O(b^(m/2))."},
            {"title": "Edge Cases", "text": "The pruning efficiency is highly dependent on move ordering. If worst moves are evaluated first, it behaves identically to standard Minimax."},
            {"title": "Suggested Heuristic", "text": "For deeper games, a cutoff depth with an evaluation function (e.g., number of open 3-in-a-rows) is essential to avoid timing out."},
            {"title": "Clarifying Question", "text": "Do you need a strict real-time response latency (e.g., <50ms)?"}
        ]
    return []

def analyze_graph_features(features: dict) -> dict:
    size = features.get("size", "Medium")
    costs = features.get("costs", "Uniform")
    heuristic = features.get("heuristic", False)
    memory_limited = features.get("memory_limited", False)
    
    algo = "Breadth-First Search (BFS)"
    report = []
    
    if costs == "Negative":
        algo = "Bellman-Ford / Negative Cycle Check"
        report = [
            {"title": "Validation", "text": "Bellman-Ford is the only standard algorithm capable of handling negative edge weights correctly."},
            {"title": "Why Bellman-Ford", "text": "Dijkstra and A* fail with negative edges because they assume cost monotonically increases. Bellman-Ford relaxes all edges |V|-1 times."},
            {"title": "Edge Cases", "text": "If a negative weight cycle exists, NO shortest path exists. The algorithm must detect this and abort."},
            {"title": "Suggested Heuristic", "text": "No heuristic is safely applicable here. Must run full relaxation."},
            {"title": "Clarifying Question", "text": "Are you sure your graph contains negative edges, or is it just a theoretical possibility?"}
        ]
    elif heuristic:
        if memory_limited and size == "Massive":
            algo = "IDA* (Iterative Deepening A*)"
            report = [
                {"title": "Validation", "text": "IDA* provides the optimality of A* with the strict memory limits of DFS."},
                {"title": "Why IDA*", "text": "Standard A* stores the entire frontier in memory, which crashes on massive graphs. IDA* only stores the current path, using O(d) memory."},
                {"title": "Edge Cases", "text": "If the heuristic has many unique values, IDA* can suffer from excessive re-expansion of nodes. A relaxed threshold may be needed."},
                {"title": "Suggested Heuristic", "text": "A heavily optimized, admissible heuristic is absolutely critical to avoid expanding the massive tree."},
                {"title": "Clarifying Question", "text": "Exactly how strict is your RAM limitation (MB vs GB)?"}
            ]
        else:
            algo = "A* Search"
            report = [
                {"title": "Validation", "text": "A* is optimally efficient for finding the shortest path when a valid heuristic exists."},
                {"title": "Why A*", "text": "It balances the greedy nature of Best-First Search with the uniform exploration of Dijkstra."},
                {"title": "Edge Cases", "text": "Memory exhaustion if the state space is massive. Can return sub-optimal paths if the heuristic is inadmissible."},
                {"title": "Suggested Heuristic", "text": "Ensure your heuristic function never overestimates the true cost to the goal."},
                {"title": "Clarifying Question", "text": "Is your heuristic function mathematically proven to be admissible and consistent?"}
            ]
    else:
        if costs == "Uniform":
            if memory_limited and size == "Massive":
                algo = "Iterative Deepening DFS (IDDFS)"
                report = [
                    {"title": "Validation", "text": "IDDFS is optimal for uniform cost and uses linear memory."},
                    {"title": "Why IDDFS", "text": "DFS isn't optimal, BFS runs out of memory. IDDFS gets the best of both worlds by repeatedly capping DFS depth."},
                    {"title": "Edge Cases", "text": "Node re-expansion overhead. Time complexity is slightly higher than pure BFS, but asymptotically equivalent."},
                    {"title": "Suggested Heuristic", "text": "N/A (Blind search)."},
                    {"title": "Clarifying Question", "text": "Since you have no heuristic, are you sure a goal state actually exists within a reasonable depth?"}
                ]
            else:
                algo = "Breadth-First Search (BFS)"
                report = [
                    {"title": "Validation", "text": "BFS guarantees the shortest path (minimum edges) when all step costs are equal."},
                    {"title": "Why BFS", "text": "It expands nodes layer by layer. Since costs are uniform, the first time it hits the goal is guaranteed to be optimal."},
                    {"title": "Edge Cases", "text": "Will rapidly consume memory O(b^d) as the branching factor or depth increases."},
                    {"title": "Suggested Heuristic", "text": "N/A (Blind search)."},
                    {"title": "Clarifying Question", "text": "What is the average branching factor of this graph?"}
                ]
        else:
            algo = "Dijkstra's Algorithm (Uniform Cost Search)"
            report = [
                {"title": "Validation", "text": "Dijkstra is the optimal blind search for graphs with non-uniform positive edge costs."},
                {"title": "Why Dijkstra", "text": "It continuously expands the lowest-cost path discovered so far, guaranteeing optimality without needing a heuristic."},
                {"title": "Edge Cases", "text": "Will devolve into an exhaustive search in all directions. Highly inefficient for massive graphs."},
                {"title": "Suggested Heuristic", "text": "None provided. (If you can find one, upgrade to A*)."},
                {"title": "Clarifying Question", "text": "Are you absolutely certain you cannot formulate a heuristic to estimate the remaining distance?"}
            ]

    return {
        "algorithm": algo,
        "report": report
    }
