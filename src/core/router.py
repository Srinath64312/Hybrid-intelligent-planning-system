import re

class NLPQueryRouter:
    def __init__(self):
        # Keyword mappings for intents
        self.intent_keywords = {
            "SEARCH": [r"\broute\b", r"\bpath\b", r"\bnavigate\b", r"\bgo\b", r"\bshortest\b", r"\btravel\b", r"\bdistance\b", r"\bway\b", r"\bfind\b"],
            "CSP": [r"\bschedule\b", r"\btimetable\b", r"\bconflict\b", r"\broom\b", r"\bavailability\b", r"\bclash\b", r"\bbook\b"],
            "BAYESIAN": [r"\bdelay\b", r"\bprobability\b", r"\bchance\b", r"\buncertainty\b", r"\blikely\b", r"\brisk\b", r"\bpredict\b"],
            "DECISION": [r"\ballocate\b", r"\brecommend\b", r"\bchoose\b", r"\bresource\b", r"\boption\b", r"\bbest\b"]
        }

        # Regex patterns for parameter extraction
        # Source/Destination: look for "from [location]" and "to [location]"
        self.source_pattern = re.compile(r"from\s+([A-Za-z0-9\s]+?)(?=\s+(?:to|at|on|tomorrow|today|in|for|and)\b|\s*$)", re.IGNORECASE)
        self.dest_pattern = re.compile(r"to\s+([A-Za-z0-9\s]+?)(?=\s+(?:from|at|on|tomorrow|today|in|for|and)\b|\s*$)", re.IGNORECASE)
        
        # Time constraints: matches e.g., 2PM, 14:00, 9 AM
        self.time_pattern = re.compile(r"\b((?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:AM|PM|am|pm)|(?:[01]?[0-9]|2[0-3]):[0-5][0-9])\b")
        
        # Day constraints: matches days of week or today/tomorrow
        self.day_pattern = re.compile(r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b", re.IGNORECASE)
        
        # Resources: matches common campus resources
        self.resource_pattern = re.compile(r"\b(projector|lab|computer|laptop|auditorium|hall|microphone)\b", re.IGNORECASE)

    def route_query(self, query: str) -> dict:
        query_lower = query.lower()
        
        # 1. Identify Intents
        identified_intents = []
        for intent, patterns in self.intent_keywords.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    identified_intents.append(intent)
                    break # Move to next intent category once one keyword matches

        # If more than one intent, it's HYBRID, but we return the raw list of matched intents
        final_intents = identified_intents
        if len(identified_intents) > 1:
            final_intents.append("HYBRID")
        elif len(identified_intents) == 0:
            final_intents = ["UNKNOWN"]

        # 2. Extract Parameters
        source_match = self.source_pattern.search(query)
        dest_match = self.dest_pattern.search(query)
        time_match = self.time_pattern.search(query)
        day_match = self.day_pattern.search(query)
        resource_match = self.resource_pattern.search(query)

        source = source_match.group(1).strip() if source_match else None
        destination = dest_match.group(1).strip() if dest_match else None
        time_val = time_match.group(1).strip() if time_match else None
        day_val = day_match.group(1).strip() if day_match else None
        resource_val = resource_match.group(1).strip() if resource_match else None

        # 3. Calculate Confidence & Clarification
        # Simple heuristic: high confidence if we found an intent and at least one parameter
        has_params = any([source, destination, time_val, day_val, resource_val])
        
        confidence = 0.92 if (identified_intents and has_params) else 0.45
        clarification_needed = False
        clarification_question = None

        if not identified_intents or "UNKNOWN" in final_intents:
            confidence = 0.10
            clarification_needed = True
            clarification_question = "I couldn't identify the main goal of your request. Are you looking to find a route, check a schedule, or predict a delay?"
        elif "SEARCH" in final_intents and not destination:
            confidence = 0.65
            clarification_needed = True
            clarification_question = "I understand you're looking for a route, but where exactly are you trying to go?"
        elif "CSP" in final_intents and not time_val and not day_val:
            confidence = 0.70
            clarification_needed = True
            clarification_question = "To check availability, I need to know what time or day you are looking for."

        # Filter out HYBRID logic for the final list: the user asked for exact format returning array of primary intents
        # The prompt says: "intent": ["SEARCH", "CSP"]
        if "UNKNOWN" in final_intents and len(final_intents) > 1:
            final_intents.remove("UNKNOWN")

        params = {
            "source": source,
            "destination": destination,
            "time": time_val,
            "day": day_val,
            "resource": resource_val
        }

        conclusion = self._generate_conclusion(final_intents, params, clarification_needed, clarification_question)

        return {
            "intent": final_intents,
            "parameters": params,
            "confidence": confidence,
            "clarification_needed": clarification_needed,
            "clarification_question": clarification_question,
            "conclusion": conclusion
        }

    def _generate_conclusion(self, intents, params, clarification_needed, clarification_question) -> str:
        if clarification_needed:
            return clarification_question or "Clarification required to process the query."

        parts = []
        source = params.get("source")
        dest = params.get("destination")
        time_val = params.get("time")
        day_val = params.get("day")
        res_val = params.get("resource")
        
        if "SEARCH" in intents:
            msg = "Shortest path pathfinding query"
            if source and dest:
                msg += f" from {source} to {dest}"
            elif dest:
                msg += f" to {dest}"
            elif source:
                msg += f" starting from {source}"
                
            if time_val or day_val:
                time_info = []
                if time_val: time_info.append(f"at {time_val}")
                if day_val: time_info.append(f"on {day_val}")
                msg += " " + " ".join(time_info)
            parts.append(msg)
            
        if "CSP" in intents:
            msg = "Scheduling and constraint optimization query"
            if res_val:
                msg += f" for the {res_val}"
            if day_val or time_val:
                time_info = []
                if day_val: time_info.append(day_val)
                if time_val: time_info.append(time_val)
                msg += f" scheduled for {' '.join(time_info)}"
            parts.append(msg)
            
        if "BAYESIAN" in intents:
            msg = "Uncertainty and probability prediction query"
            if res_val:
                msg += f" regarding the {res_val}"
            if day_val or time_val:
                time_info = []
                if day_val: time_info.append(f"on {day_val}")
                if time_val: time_info.append(f"at {time_val}")
                msg += " " + " ".join(time_info)
            parts.append(msg)
            
        if "DECISION" in intents:
            msg = "Decision-making and resource allocation query"
            if res_val:
                msg += f" for {res_val}"
            parts.append(msg)

        if not parts:
            return "General query processed."
            
        if len(parts) > 1:
            return "Hybrid Request Detected: " + " and ".join(parts) + "."
        else:
            # Capitalize the first letter
            text = parts[0]
            if text:
                text = text[0].upper() + text[1:]
            return text + "."
