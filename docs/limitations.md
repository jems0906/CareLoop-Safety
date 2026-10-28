# Limitations and Safety Boundary

- All seed records, roles, feedback, weekly values, events, and decisions are synthetic. Do not add real resident/patient identifiers, safety narratives, or clinical documents.
- The app has no arbitrary file upload. Public event intake is read-only; administrative write endpoints use a shared demo API key, not individual identity or production authorization.
- The application has no diagnoses, treatment/prescribing advice, automated incident conclusions, clinical protocol, EHR/payer/CMS connection, or clinical authority.
- The 48-hour window, 72-hour checkpoint, inclusion logic, suppression count, and reopen thresholds are examples. They require governance and validation before real use.
- Before/after synthetic data are descriptive only. They do not show reduced readmissions, prevented harm, or causality.
- There is no HIPAA compliance claim. Real-data deployment requires independent security/privacy and contractual review, hosting-term verification, identity/access design, threat modeling, retention/backup controls, accessibility review, and clinical governance.
- Railway deployment, URLs, restart-persistence verification, screenshots, and live-user isolation were not performed. There are no individual demo-user accounts; anonymous access is read-only and the admin key controls all writes to the shared local demo workspace.