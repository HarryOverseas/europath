# Dispatch to teamwork_worker_remediation_1 (Iteration 2 Remediation)

## Working Directory
`e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_remediation_1\`

## Authoritative Files
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_reviewer_2\handoff.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\GATE_STATUS.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks to Remediate
Reviewer 2 identified 4 concrete items in Iteration 1 Gate:

1. **`src/components/EnquiryWizard.tsx` (Critical)**:
   - In `handleSubmit`: send an HTTP request `POST /api/enquiries` via `fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(...) })`.
   - Map formData to match backend expectations:
     `full_name: formData.fullName`,
     `email: formData.email`,
     `phone: formData.phone`,
     `service_interest: formData.service || formData.visaType`,
     `destination_country: formData.destinationCountry || 'Germany'`,
     `message: formData.notes || formData.message || JSON.stringify(formData)`.
   - Also keep backup save to `localStorage.getItem('harry_global_enquiries')` for offline resilience.
   - Set submitted state upon completion.
2. **`src/App.tsx` (Critical)**:
   - In `handleLogout`, purge both `harry_admin_session` AND `harry_admin_token` from both `sessionStorage` and `localStorage`:
     ```ts
     sessionStorage.removeItem('harry_admin_session');
     localStorage.removeItem('harry_admin_session');
     sessionStorage.removeItem('harry_admin_token');
     localStorage.removeItem('harry_admin_token');
     ```
3. **`src/components/Careers.tsx` (Minor)**:
   - In `handleSubmitApplication`, verify that `response.ok` is true before setting `setSubmissionSuccess(true)`.
   - If `response.ok` is false, capture the error message and display an error alert banner to the applicant so they know the server rejected the application.
4. **`server/index.js` (Security hardening)**:
   - Sanitize 500 catch blocks across routes: return `{ success: false, error: 'Internal server error. Please try again later.' }` while logging `console.error(err)` server-side.
5. **Verification**:
   - Run `npm run build` — must pass cleanly with exit code 0.
   - Run `npm test` — all tests must pass.
   - Document verification commands and output in `handoff.md`.


## 2026-11-02T15:28:21Z
Read your dispatch instructions at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_remediation_1\DISPATCH.md and the authoritative request at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md and GATE_STATUS.md.
Working directory: e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_remediation_1\
Execute the 4 remediation items requested by Reviewer 2 (EnquiryWizard.tsx API submission, App.tsx logout token purge, Careers.tsx error handling, and server error sanitization). Verify with `npm run build` and `npm test`. Write handoff.md in your working directory and notify orchestrator when complete.
