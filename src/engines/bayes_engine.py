import time
import random
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class BayesNode:
    name: str
    parents: List[str]
    cpt: Dict[Tuple[bool, ...], float]

class BayesNetwork:
    def __init__(self):
        self.nodes: Dict[str, BayesNode] = {}
        
    def add_node(self, name: str, parents: List[str], cpt: Dict[Tuple[bool, ...], float]):
        self.nodes[name] = BayesNode(name, parents, cpt)
        
    def get_prob(self, node_name: str, val: bool, evidence: Dict[str, bool]) -> float:
        node = self.nodes[node_name]
        parent_vals = tuple(evidence.get(p, False) for p in node.parents)
        p_true = node.cpt.get(parent_vals, 0.0)
        return p_true if val else 1.0 - p_true

    def topological_sort(self) -> List[str]:
        visited = set()
        temp = set()
        order = []
        
        def visit(node_name: str):
            if node_name in temp:
                raise ValueError("Cycle detected in Bayesian Network")
            if node_name not in visited:
                temp.add(node_name)
                node = self.nodes.get(node_name)
                if node:
                    for p in node.parents:
                        visit(p)
                temp.remove(node_name)
                visited.add(node_name)
                order.append(node_name)
                
        for name in self.nodes:
            if name not in visited:
                visit(name)
        return order

class BayesResult:
    def __init__(self):
        self.posterior_prob = 0.0
        self.runtime = 0.0
        self.trace = []

def run_exact_inference(bn: BayesNetwork, query_var: str, evidence: Dict[str, bool]) -> BayesResult:
    result = BayesResult()
    start_time = time.perf_counter()
    
    def enumerate_all(vars_list: List[str], e: Dict[str, bool]) -> float:
        if not vars_list:
            return 1.0
        first = vars_list[0]
        rest = vars_list[1:]
        if first in e:
            return bn.get_prob(first, e[first], e) * enumerate_all(rest, e)
        else:
            sum_prob = 0.0
            for val in [True, False]:
                e_copy = e.copy()
                e_copy[first] = val
                sum_prob += bn.get_prob(first, val, e_copy) * enumerate_all(rest, e_copy)
            return sum_prob

    vars_list = bn.topological_sort()
    
    e_true = evidence.copy()
    e_true[query_var] = True
    prob_true = enumerate_all(vars_list, e_true)
    
    e_false = evidence.copy()
    e_false[query_var] = False
    prob_false = enumerate_all(vars_list, e_false)
    
    alpha = 1.0 / (prob_true + prob_false) if (prob_true + prob_false) > 0 else 0.0
    result.posterior_prob = alpha * prob_true
    
    result.trace.append(f"Unnormalized P({query_var}=True) = {prob_true:.6f}")
    result.trace.append(f"Unnormalized P({query_var}=False) = {prob_false:.6f}")
    result.trace.append(f"Normalized P({query_var}=True | Evidence) = {result.posterior_prob:.6f}")
    
    result.runtime = time.perf_counter() - start_time
    return result

def run_rejection_sampling(bn: BayesNetwork, query_var: str, evidence: Dict[str, bool], num_samples: int = 2000) -> BayesResult:
    result = BayesResult()
    start_time = time.perf_counter()
    
    topo_order = bn.topological_sort()
    
    def prior_sample() -> Dict[str, bool]:
        sample = {}
        for node_name in topo_order:
            node = bn.nodes[node_name]
            parent_tuple = tuple(sample[p] for p in node.parents)
            prob_true = node.cpt.get(parent_tuple, 0.0)
            sample[node_name] = random.random() < prob_true
        return sample

    counts = {True: 0, False: 0}
    
    for _ in range(num_samples):
        sample = prior_sample()
        consistent = all(sample[k] == v for k, v in evidence.items())
        if consistent:
            counts[sample[query_var]] += 1
            
    total = counts[True] + counts[False]
    if total == 0:
        result.posterior_prob = 0.5
        result.trace.append(f"No samples matched evidence. Falling back to 0.5")
    else:
        result.posterior_prob = counts[True] / total
        result.trace.append(f"Retained {total}/{num_samples} samples.")
        result.trace.append(f"P({query_var}=True | Evidence) = {counts[True]}/{total} = {result.posterior_prob:.6f}")
        
    result.runtime = time.perf_counter() - start_time
    return result

@dataclass
class DecisionNetworkNode:
    name: str
    node_type: str  # "chance", "decision", "utility"
    parents: List[str]
    cpt_or_utility: Dict[Tuple[bool, ...], float]

class DecisionNetwork:
    def __init__(self):
        self.nodes: Dict[str, DecisionNetworkNode] = {}
        
    def add_chance_node(self, name: str, parents: List[str], cpt: Dict[Tuple[bool, ...], float]):
        self.nodes[name] = DecisionNetworkNode(name, "chance", parents, cpt)
        
    def add_decision_node(self, name: str):
        self.nodes[name] = DecisionNetworkNode(name, "decision", [], {})
        
    def add_utility_node(self, name: str, parents: List[str], utility_table: Dict[Tuple[bool, ...], float]):
        self.nodes[name] = DecisionNetworkNode(name, "utility", parents, utility_table)

def run_decision_inference(dn: DecisionNetwork, evidence: Dict[str, bool]) -> Dict[str, Any]:
    decisions = [n.name for n in dn.nodes.values() if n.node_type == "decision"]
    utilities = [n for n in dn.nodes.values() if n.node_type == "utility"]
    
    if not utilities:
        return {"error": "No utility node defined in decision network"}
    u_node = utilities[0]
    
    # Build a BayesNetwork dynamically to query probabilities
    bn = BayesNetwork()
    for node in dn.nodes.values():
        if node.node_type == "chance":
            bn.add_node(node.name, node.parents, node.cpt_or_utility)
        elif node.node_type == "decision":
            bn.add_node(node.name, [], {(): 0.5})

    import itertools
    u_parents = u_node.parents
    parent_settings = list(itertools.product([True, False], repeat=len(u_parents)))
    
    decision_name = decisions[0]
    results = {}
    trace = []
    
    best_decision = None
    best_eu = -float('inf')
    
    for d_val in [True, False]:
        eu = 0.0
        d_evidence = evidence.copy()
        d_evidence[decision_name] = d_val
        
        trace.append(f"Evaluating Decision: {decision_name} = {d_val}")
        
        for setting in parent_settings:
            setting_dict = dict(zip(u_parents, setting))
            
            consistent = True
            for k, v in setting_dict.items():
                if k in d_evidence and d_evidence[k] != v:
                    consistent = False
                    break
            if not consistent:
                continue
                
            def get_joint_prob(env: Dict[str, bool]) -> float:
                vars_list = list(bn.nodes.keys())
                
                def enumerate_all_vars(vl: List[str], e: Dict[str, bool]) -> float:
                    if not vl:
                        return 1.0
                    first = vl[0]
                    rest = vl[1:]
                    if first in e:
                        return bn.get_prob(first, e[first], e) * enumerate_all_vars(rest, e)
                    else:
                        sum_p = 0.0
                        for val in [True, False]:
                            e_copy = e.copy()
                            e_copy[first] = val
                            sum_p += bn.get_prob(first, val, e_copy) * enumerate_all_vars(rest, e_copy)
                        return sum_p
                return enumerate_all_vars(vars_list, env)
            
            p_joint = get_joint_prob(joint_env := {**d_evidence, **setting_dict})
            p_denom = get_joint_prob(d_evidence)
            
            p_cond = p_joint / p_denom if p_denom > 0 else 0.0
            
            utility_val = u_node.cpt_or_utility.get(setting, 0.0)
            eu += p_cond * utility_val
            
            setting_str = ", ".join(f"{k}={v}" for k, v in setting_dict.items())
            trace.append(f"  P({setting_str} | {decision_name}={d_val}, evidence) = {p_cond:.4f} (Utility: {utility_val})")
            
        trace.append(f"Expected Utility for {decision_name}={d_val}: {eu:.2f}\n")
        results[d_val] = eu
        if eu > best_eu:
            best_eu = eu
            best_decision = d_val
            
    trace.append(f"Recommended Action: {decision_name} = {best_decision} (Max EU = {best_eu:.2f})")
    
    return {
        "results": {str(k): v for k, v in results.items()},
        "best_decision": best_decision,
        "best_eu": best_eu,
        "trace": trace
    }
