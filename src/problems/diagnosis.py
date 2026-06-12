from src.engines.bayes_engine import BayesNetwork

def build_medical_network() -> BayesNetwork:
    bn = BayesNetwork()
    # Flu: Prior
    bn.add_node("Flu", [], {(): 0.05})
    
    # Smokes: Prior
    bn.add_node("Smokes", [], {(): 0.20})
    
    # SoreThroat: Depends on Flu
    bn.add_node("SoreThroat", ["Flu"], {
        (True,): 0.60,
        (False,): 0.05
    })
    
    # Cough: Depends on Flu and Smokes
    bn.add_node("Cough", ["Flu", "Smokes"], {
        (True, True): 0.90,
        (True, False): 0.70,
        (False, True): 0.40,
        (False, False): 0.10
    })
    
    return bn

from src.engines.bayes_engine import DecisionNetwork

def build_campus_decision_network() -> DecisionNetwork:
    dn = DecisionNetwork()
    
    # Chance node Outbreak
    dn.add_chance_node("Outbreak", [], {(): 0.10})
    
    # Chance node HighAbsenteeism (depends on Outbreak)
    dn.add_chance_node("HighAbsenteeism", ["Outbreak"], {
        (True,): 0.80,
        (False,): 0.05
    })
    
    # Decision node ShiftToOnline
    dn.add_decision_node("ShiftToOnline")
    
    # Utility node CampusUtility: Depends on Outbreak, HighAbsenteeism, ShiftToOnline
    # Parents order: (Outbreak, HighAbsenteeism, ShiftToOnline)
    dn.add_utility_node("CampusUtility", ["Outbreak", "HighAbsenteeism", "ShiftToOnline"], {
        # Outbreak=True, HighAbsenteeism=True
        (True, True, True): -20.0,
        (True, True, False): -100.0,
        # Outbreak=True, HighAbsenteeism=False
        (True, False, True): -15.0,
        (True, False, False): -80.0,
        # Outbreak=False, HighAbsenteeism=True
        (False, True, True): -40.0,
        (False, True, False): -30.0,
        # Outbreak=False, HighAbsenteeism=False
        (False, False, True): -30.0,
        (False, False, False): 100.0
    })
    
    return dn
