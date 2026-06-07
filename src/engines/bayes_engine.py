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

    vars_list = list(bn.nodes.keys())
    
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
    
    def prior_sample() -> Dict[str, bool]:
        sample = {}
        for node_name, node in bn.nodes.items():
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
