# Synthetic Data Dictionary

All records are constructed solely for this demonstration. There are no real-person identifiers or clinical documents.

## Event fixture and API fields

| Field | Type / allowed values | Meaning |
|---|---|---|
| `id` | Synthetic string | Demo event key |
| `setting` | assisted living, group home, independent living | Fictional setting |
| `event_type` | transition handoff, medication-list discrepancy, near miss | Controlled fictional scenario type |
| `occurred_on`, `reported_on` | ISO date | Scenario dates; report date cannot precede event date |
| `summary` | One of three category-matched summaries | No arbitrary incident narrative accepted |
| `communication_preference` | verbal, large-print, support-person phone, accessible email | Fictional preference for workflow demonstration |
| `access_barrier` | none recorded, handoff timing, document access, task duplication | Fictional barrier; not a research finding |
| `established_facts` | Bounded list of short entries | Human-entered scenario facts |
| `hypotheses` | Bounded list of short entries | Explanations to test, not conclusions |
| `open_questions` | Bounded list of short entries | Unresolved inquiry |
| `five_whys`, `cause_categories`, `findings` | Structured synthetic worksheets | Human-authored; reviewer sign-off required |

## Weekly metrics fixture

| Field | Type | Meaning |
|---|---|---|
| `week_start` | ISO date | Start of synthetic observation week |
| `setting` | Controlled setting | One fictional care setting |
| `access_barrier` | Controlled category | Fictional stratification dimension |
| `eligible_transitions` | Nonnegative integer | Process denominator |
| `timely_checklists` | Integer from zero to eligible | Process numerator |
| `missing_record_count` | Integer from zero to eligible | Constructed records missing a checklist outcome |
| `unresolved_discrepancies` | Integer from zero to reviewed | Outcome numerator at fixed checkpoint |
| `reviewed_transitions` | Nonnegative integer | Outcome denominator |
| `documentation_minutes` | Nonnegative decimal | Synthetic mean minutes per eligible transition |
| `duplicate_tasks` | Nonnegative integer | Weekly duplicate task count |
| `workflow_burden_score` | Decimal from 0 to 10 | Constructed burden score; not staff-reported feedback |
| `intervention` | Optional short label | Synthetic intervention annotation; not proof of exposure |

Rates with zero denominator are null. Equity summary suppresses setting/barrier cells under 30 eligible transitions. The suppression threshold is illustrative. CSV export contains weekly aggregates only.