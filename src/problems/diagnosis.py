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
