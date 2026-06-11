import random

class NegotiationAgent:
    def __init__(self, name: str, budget: float, preferences: dict):
        self.name = name
        self.budget = budget
        self.preferences = preferences # { item_id: base_utility }
        
    def generate_bid(self, item_id: str, round_num: int) -> float:
        base_utility = self.preferences.get(item_id, 0)
        if base_utility == 0 or self.budget <= 0:
            return 0.0
            
        # Nash-inspired bidding strategy: Bid aggressively if high utility, but shade bid based on budget
        max_possible = min(self.budget, base_utility * 1.5)
        
        # Add some strategic randomness to simulate human-like agents
        bid = max_possible * random.uniform(0.7, 1.0)
        return round(bid, 2)

class MultiAgentNegotiation:
    def __init__(self):
        self.agents = [
            NegotiationAgent("Dr. Newton (Physics)", 1000.0, {"Wed_0900": 800, "Tue_0900": 200}),
            NegotiationAgent("Dr. Grace (Chemistry)", 1000.0, {"Wed_0900": 600, "Wed_1100": 700}),
            NegotiationAgent("Dr. Alan (Biology)", 1000.0, {"Tue_0900": 400, "Wed_1100": 800}),
        ]
        self.items = ["Tue_0900", "Wed_0900", "Wed_1100"]
        self.trace = []
        
    def run_auction(self):
        self.trace.append("=== Starting Multi-Agent Negotiation (Vickrey-Clarke-Groves inspired) ===")
        allocations = {}
        
        for item in self.items:
            self.trace.append(f"\\n--- Auctioning Timeslot: {item} ---")
            bids = []
            
            for agent in self.agents:
                bid = agent.generate_bid(item, 1)
                bids.append((agent, bid))
                self.trace.append(f"[{agent.name}] submitted sealed bid: ${bid:.2f} (Remaining Budget: ${agent.budget:.2f})")
                
            # Sort bids descending
            bids.sort(key=lambda x: x[1], reverse=True)
            winner, highest_bid = bids[0]
            
            if len(bids) > 1:
                runner_up_bid = bids[1][1]
            else:
                runner_up_bid = highest_bid
                
            # Second-price (Vickrey) auction rules
            clearing_price = runner_up_bid + 1.0 if runner_up_bid < winner.budget else highest_bid
            clearing_price = min(clearing_price, winner.budget)
            
            if highest_bid > 0:
                allocations[item] = winner.name
                winner.budget -= clearing_price
                self.trace.append(f"✅ {winner.name} won {item} for ${clearing_price:.2f} (Nash Bargaining Equilibrium)")
            else:
                allocations[item] = "Unallocated"
                self.trace.append(f"❌ {item} went unallocated (No valid bids).")
                
        self.trace.append("\\n=== Negotiation Concluded ===")
        return {
            "allocations": allocations,
            "trace": self.trace,
            "final_budgets": {a.name: round(a.budget, 2) for a in self.agents}
        }
