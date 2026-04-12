from app.ml.confidence_score import get_confidence

def test_confidence():
    print("Testing Confidence Score Math...")
    
    # 0 min delay
    c1 = get_confidence("12229", "LJN Rajdhani", delay=0)
    print(f"0m delay: {c1['confidence_score']}% ({c1['on_time_note']})")
    
    # 10 min delay
    c2 = get_confidence("12229", "LJN Rajdhani", delay=10)
    print(f"10m delay: {c2['confidence_score']}% ({c2['on_time_note']})")
    
    # 60 min delay
    c3 = get_confidence("12229", "LJN Rajdhani", delay=60)
    print(f"60m delay: {c3['confidence_score']}% ({c3['on_time_note']})")
    
    # Fallback (no delay provided)
    c4 = get_confidence("12229", "LJN Rajdhani")
    print(f"Fallback: {c4['confidence_score']}% ({c4['on_time_note']})")

if __name__ == "__main__":
    test_confidence()
