import sys
import os

# Put project src on path
sys.path.insert(0, os.path.abspath('.'))

from src.engines.bayes_engine import BayesNetwork, run_exact_inference, run_rejection_sampling

# Presets to test
PRESETS = {
  "medical": {
    "queryVar": "Flu",
    "evidence": {
      "Cough": True,
      "SoreThroat": True
    },
    "cpts": {
      "Flu": {
        "parents": [],
        "table": { "": 0.05 }
      },
      "Smokes": {
        "parents": [],
        "table": { "": 0.20 }
      },
      "SoreThroat": {
        "parents": ["Flu"],
        "table": { "true": 0.60, "false": 0.05 }
      },
      "Cough": {
        "parents": ["Flu", "Smokes"],
        "table": {
          "true,true": 0.90,
          "true,false": 0.70,
          "false,true": 0.40,
          "false,false": 0.10
        }
      }
    }
  },
  "sprinkler": {
    "queryVar": "Cloudy",
    "evidence": {
      "WetGrass": True
    },
    "cpts": {
      "Cloudy": {
        "parents": [],
        "table": { "": 0.50 }
      },
      "Sprinkler": {
        "parents": ["Cloudy"],
        "table": { "true": 0.10, "false": 0.50 }
      },
      "Rain": {
        "parents": ["Cloudy"],
        "table": { "true": 0.80, "false": 0.20 }
      },
      "WetGrass": {
        "parents": ["Sprinkler", "Rain"],
        "table": {
          "true,true": 0.99,
          "true,false": 0.90,
          "false,true": 0.90,
          "false,false": 0.01
        }
      }
    }
  },
  "alarm": {
    "queryVar": "Burglary",
    "evidence": {
      "Alarm": True
    },
    "cpts": {
      "Burglary": {
        "parents": [],
        "table": { "": 0.02 }
      },
      "Earthquake": {
        "parents": [],
        "table": { "": 0.05 }
      },
      "Alarm": {
        "parents": ["Burglary", "Earthquake"],
        "table": {
          "true,true": 0.95,
          "true,false": 0.94,
          "false,true": 0.29,
          "false,false": 0.001
        }
      },
      "JohnCalls": {
        "parents": ["Alarm"],
        "table": { "true": 0.90, "false": 0.05 }
      },
      "MaryCalls": {
        "parents": ["Alarm"],
        "table": { "true": 0.70, "false": 0.01 }
      }
    }
  }
}

for name, preset in PRESETS.items():
    print(f"\n--- Testing Preset: {name} ---")
    customCpts = preset["cpts"]
    evidence = preset["evidence"]
    queryVar = preset["queryVar"]
    
    bn = BayesNetwork()
    for node_name, data in customCpts.items():
        parents = data["parents"]
        table = {}
        for key_str, prob in data["table"].items():
            if key_str == "":
                key = ()
            else:
                key = tuple(k == "true" for k in key_str.split(","))
            table[key] = float(prob)
        bn.add_node(node_name, parents, table)
        
    print("Running exact inference...")
    try:
        res_exact = run_exact_inference(bn, queryVar, evidence)
        print(f"  Exact posterior: {res_exact.posterior_prob:.6f}")
    except Exception as e:
        print(f"  Exact failed: {e}")
        import traceback
        traceback.print_exc()
        
    print("Running rejection sampling...")
    try:
        res_sampling = run_rejection_sampling(bn, queryVar, evidence, 5000)
        print(f"  Sampling posterior: {res_sampling.posterior_prob:.6f}")
    except Exception as e:
        print(f"  Sampling failed: {e}")
        import traceback
        traceback.print_exc()

print("\nFinished tests.")
