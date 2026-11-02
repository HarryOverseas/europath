# Dispatch to teamwork_worker_m2 (Milestone M2: Public Careers Page & Site Navigation)

## Working Directory
`e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m2\`

## Authoritative Files to Read
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md`
- `e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_explorer_survey_1\handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## File Ownership
- You EXCLUSIVELY own:
  - `src/components/Careers.tsx` (new component)
  - `src/components/Navbar.tsx`
  - `src/components/LegalFooter.tsx`
  - `src/App.tsx` (routing & view state)
- DO NOT edit `server/*` or `src/components/Admin*`.

## Requirements to Implement (R1, R4)
1. Create `src/components/Careers.tsx`:
   - Premium styling matching EuroPath brand (navy, slate, brand-gold, clean typography, Lucide icons).
   - Showcase at least 4 detailed job vacancies:
     1. German Language Trainer (DaF B1-C1) — Department: Language Training
     2. Senior Visa & Immigration Consultant (Opportunity Card, EU Blue Card) — Department: Visa & Immigration
     3. Overseas Student Counselor (German Higher Education) — Department: Student Counseling
     4. European Relocation & Settlement Coordinator — Department: Relocation & Settlement
   - For each vacancy: detailed role descriptions, key responsibilities (bulleted), requirements/qualifications (bulleted), job type (Full-time / Hybrid), location (Berlin / Frankfurt / Remote / Regional Offices), and "Apply Now" button.
   - Interactive category/department filtering tab bar with active listing counts and clear filter toggle.
   - Interactive Job Application Form Modal or dedicated section:
     - Opens pre-populated with selected role.
     - Form fields: Full Name, Email, Phone Number, Role dropdown, Resume / Portfolio link, Notes / Cover letter.
     - Real-time client-side validation (all required fields, valid email format, phone digits).
     - Submits to `POST /api/applications` via `fetch('/api/applications')`.
     - Offline / resilient fallback: stores copy in `localStorage` under `harry_global_job_applications`.
     - Immediate clear success confirmation feedback card with reference ID, next steps timeline, and option to submit another or return to listings.
2. Update `src/components/Navbar.tsx`:
   - Add functional "Careers" button to desktop navigation bar.
   - Add functional "Careers" button to mobile menu dropdown.
   - Clicking "Careers" switches view to `'careers'` and updates URL hash `#careers`.
   - Update Staff Portal button label logic so it remains consistent when on the careers view.
3. Update `src/components/LegalFooter.tsx`:
   - Add functional "Careers" button/link under Quick Links.
   - Ensure clicking it navigates to `'careers'` and scrolls to top smoothly.
4. Update `src/App.tsx`:
   - Support `currentView`: `'public' | 'careers' | 'admin'`.
   - Sync `currentView` with `window.location.hash` (`#careers`, `#admin`, etc.) on load and `hashchange`.
   - Render `<Careers />` view when `currentView === 'careers'`.
   - Pass navigation handler to `LegalFooter` so footer links correctly switch views.
5. Verification:
   - Run `npm run build` to verify production bundle compiles with exit code 0.
   - Write handoff report with exact verification evidence to `handoff.md`.

## 2026-11-02T15:04:45Z
Read your dispatch instructions at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m2\DISPATCH.md and the authoritative request at e:\Projects\VS_Projects\EuroPath\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read e:\Projects\VS_Projects\EuroPath\.agents\teamwork\orchestrator_1\PROJECT.md.
Working directory: e:\Projects\VS_Projects\EuroPath\.agents\teamwork\teamwork_worker_m2\
Implement Milestone 2 (Public Careers Page, Vacancies Showcase, Application Submission Form, and Site Navigation), verify build with `npm run build`, and write handoff.md in your working directory. Send a message to orchestrator when complete.
