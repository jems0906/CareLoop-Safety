from fastapi import HTTPException


TRANSITIONS = {
    "proposed": {"approved"},
    "approved": {"in_progress"},
    "in_progress": {"implemented"},
    "implemented": {"effectiveness_pending"},
    "effectiveness_pending": {"effective", "ineffective"},
    "effective": set(),
    "ineffective": {"approved"},
}


def transition_action(action, update):
    if update.state not in TRANSITIONS.get(action.state, set()):
        raise HTTPException(status_code=409, detail=f"Invalid action transition: {action.state} -> {update.state}")
    if update.state == "implemented" and not update.implementation_evidence:
        raise HTTPException(status_code=422, detail="Implementation evidence is required")
    if update.state == "effectiveness_pending" and not update.effectiveness_due:
        raise HTTPException(status_code=422, detail="An effectiveness check date is required")
    if update.state in {"effective", "ineffective"} and update.effectiveness_result != update.state:
        raise HTTPException(status_code=422, detail="Effectiveness result must match the selected state")
    action.state = update.state
    if update.implementation_evidence:
        action.implementation_evidence = update.implementation_evidence
    if update.effectiveness_due:
        action.effectiveness_due = update.effectiveness_due
    if update.effectiveness_result:
        action.effectiveness_result = update.effectiveness_result
    return action