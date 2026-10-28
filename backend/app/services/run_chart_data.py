from collections import defaultdict

from fastapi import HTTPException


def summarize_rows(rows):
    grouped = defaultdict(lambda: {"eligible": 0, "timely": 0, "reviewed": 0, "unresolved": 0, "minutes_weighted": 0.0, "duplicates": 0, "burden": []})
    for row in rows:
        if row.eligible_transitions < 0 or row.timely_checklists < 0 or row.timely_checklists > row.eligible_transitions:
            raise HTTPException(status_code=422, detail="Invalid process-measure denominator or numerator")
        if row.reviewed_transitions < 0 or row.unresolved_discrepancies < 0 or row.unresolved_discrepancies > row.reviewed_transitions:
            raise HTTPException(status_code=422, detail="Invalid outcome-measure denominator or numerator")
        item = grouped[row.week_start.isoformat()]
        item["eligible"] += row.eligible_transitions
        item["timely"] += row.timely_checklists
        item["reviewed"] += row.reviewed_transitions
        item["unresolved"] += row.unresolved_discrepancies
        item["minutes_weighted"] += row.documentation_minutes * row.eligible_transitions
        item["duplicates"] += row.duplicate_tasks
        item["burden"].append(row.workflow_burden_score)
    output = []
    for week, item in sorted(grouped.items()):
        output.append({
            "week_start": week,
            "eligible": item["eligible"],
            "timely": item["timely"],
            "process_rate": round(100 * item["timely"] / item["eligible"], 1) if item["eligible"] else None,
            "reviewed": item["reviewed"],
            "unresolved": item["unresolved"],
            "outcome_rate": round(100 * item["unresolved"] / item["reviewed"], 1) if item["reviewed"] else None,
            "documentation_minutes": round(item["minutes_weighted"] / item["eligible"], 1) if item["eligible"] else None,
            "duplicate_tasks": item["duplicates"],
            "workflow_burden_score": round(sum(item["burden"]) / len(item["burden"]), 1),
        })
    return output