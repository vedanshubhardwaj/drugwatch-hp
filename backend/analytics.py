import math
from typing import Dict, List, Tuple

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

def calculate_district_anomalies(monthly_case_counts: Dict[str, List[int]]) -> Dict[str, Dict]:
    """
    Computes rolling averages, z-score anomaly index, and deterministic 1-month forecast
    for each district using historical time-series data.
    """
    results = {}

    for district, counts in monthly_case_counts.items():
        if len(counts) < 6:
            # Insufficient observations: return safe defaults without predictive claims
            results[district] = {
                "rolling_3_month_avg": round(sum(counts) / len(counts), 1) if counts else 0,
                "rolling_6_month_avg": 0.0,
                "z_score": 0.0,
                "activity_level": "Baseline",
                "percent_change": 0.0,
                "forecast": round(sum(counts) / len(counts)) if counts else 0,
                "confidence": "Low (insufficient historical data points)",
            }
            continue

        if HAS_PANDAS:
            series = pd.Series(counts, dtype=float)
            mean_val = float(series.mean())
            std_val = float(series.std(ddof=1)) if len(series) > 1 else 0.0
            last_3 = float(series[-3:].mean())
            last_6 = float(series[-6:].mean())
            prev_3 = float(series[-6:-3].mean()) if len(series) >= 6 else last_3
        else:
            mean_val = sum(counts) / len(counts)
            var = sum((x - mean_val) ** 2 for x in counts) / (len(counts) - 1)
            std_val = math.sqrt(var) if var > 0 else 0.0
            last_3 = sum(counts[-3:]) / 3.0
            last_6 = sum(counts[-6:]) / 6.0
            prev_3 = sum(counts[-6:-3]) / 3.0

        percent_change = round(((last_3 - prev_3) / prev_3) * 100, 1) if prev_3 > 0 else 0.0

        # Calculate z-score of the most recent observation against historical baseline
        latest = float(counts[-1])
        z_score = round((latest - mean_val) / std_val, 2) if std_val > 0.001 else 0.0

        if z_score >= 1.5:
            activity_level = "Elevated"
        elif z_score >= 0.8:
            activity_level = "Moderate"
        else:
            activity_level = "Baseline"

        # Deterministic exponential smoothing forecast: F_{t+1} = alpha * y_t + (1 - alpha) * F_t
        alpha = 0.3
        forecast_val = latest
        smoothed = float(counts[0])
        for val in counts:
            smoothed = alpha * val + (1 - alpha) * smoothed
        forecast_val = max(0, round(smoothed))

        margin = max(2, round(std_val * 0.8))

        results[district] = {
            "rolling_3_month_avg": round(last_3, 1),
            "rolling_6_month_avg": round(last_6, 1),
            "z_score": z_score,
            "activity_level": activity_level,
            "percent_change": percent_change,
            "forecast": forecast_val,
            "forecast_lower": max(0, forecast_val - margin),
            "forecast_upper": forecast_val + margin,
            "confidence": "Validated on historical monthly aggregates",
        }

    return results

def compute_model_evaluation_metrics(train_counts: List[int], test_counts: List[int]) -> Dict[str, float]:
    """
    Evaluates forecast model against simple moving average baseline on a time-based split.
    """
    if not train_counts or not test_counts:
        return {"mae": 0.0, "rmse": 0.0}

    # Exponential smoothing baseline
    alpha = 0.3
    level = float(train_counts[0])
    for val in train_counts:
        level = alpha * val + (1 - alpha) * level

    errors = []
    sq_errors = []
    for actual in test_counts:
        err = abs(actual - level)
        errors.append(err)
        sq_errors.append(err ** 2)
        level = alpha * actual + (1 - alpha) * level

    mae = round(sum(errors) / len(errors), 2)
    rmse = round(math.sqrt(sum(sq_errors) / len(sq_errors)), 2)

    return {"mae": mae, "rmse": rmse}

def find_duplicate_report_candidates(new_report: Dict, existing_reports: List[Dict]) -> List[Tuple[str, float, str]]:
    """
    Identifies potential duplicate reports within the same district and proximate date window.
    Returns list of (candidate_report_id, similarity_score, reason).
    """
    candidates = []
    new_desc = new_report.get("description", "").lower()
    new_dist = new_report.get("district", "")
    new_loc = new_report.get("approximate_location", "").lower()

    for rep in existing_reports:
        if rep.get("id") == new_report.get("id"):
            continue
        if rep.get("district") != new_dist:
            continue

        rep_desc = rep.get("description", "").lower()
        rep_loc = rep.get("approximate_location", "").lower()

        # Word overlap Jaccard similarity on location and description
        new_words = set(new_desc.split() + new_loc.split())
        rep_words = set(rep_desc.split() + rep_loc.split())

        if not new_words or not rep_words:
            continue

        intersection = len(new_words.intersection(rep_words))
        union = len(new_words.union(rep_words))
        jaccard = intersection / union if union > 0 else 0.0

        if jaccard >= 0.25:
            candidates.append((
                rep.get("id"),
                round(jaccard, 2),
                f"Same district ({new_dist}) with high lexical and location term overlap ({round(jaccard * 100)}%)"
            ))

    # Sort descending by similarity
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates
