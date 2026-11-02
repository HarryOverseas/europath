Enhance the EuroPath / Harry Global Immigration website into a production-grade, well-defined web application with a comprehensive Careers page, secure admin authentication without dummy data, and clean architecture across the codebase.

Working directory: e:\Projects\VS_Projects\EuroPath
Integrity mode: development

## Requirements

### R1. Careers Page and Job Showcase
Provide a dedicated Careers page accessible from the site navigation header and footer that showcases available vacancies (such as German language trainers, visa consultants, student counselors, and European relocation coordinators) with category/department filtering, detailed role descriptions (responsibilities and requirements), and an interactive job application submission form.

### R2. Job Applications Storage and Admin Management
Store submitted job applications in the database and display them in the Admin Dashboard alongside customer inquiries, enabling administrators to view, inspect, and track applicant submissions.

### R3. Secure Admin Authentication and Credentials Management
Modernize the admin authentication system by removing hardcoded demo credentials, demo user auto-fill shortcuts, and client-side password checks. Admin authentication must authenticate against the backend API using environment-configured credentials (`.env`) with secure hashed password comparison and JWT/session management.

### R4. Website Architecture, Cleanup, and UI Polish
Refine the website architecture, navigation consistency, and styling across public pages and administrative views, ensuring responsive layout, clean component structure, and removal of leftover placeholder and dummy data.

## Acceptance Criteria

### Careers Page & Navigation
- [ ] The header navbar and footer include a functional Careers link that navigates to a dedicated full Careers page view.
- [ ] The Careers page displays active job listings with department/category filtering and detailed role descriptions (responsibilities and requirements).
- [ ] Users can submit job applications through a structured form with client-side validation and immediate submission feedback.

### Admin Dashboard & Applications Management
- [ ] Job application submissions persist to the database with candidate details (name, email, phone, role, resume/notes).
- [ ] The Admin Dashboard displays submitted job applications in a dedicated view, allowing administrators to inspect candidate details and status.

### Authentication & Security
- [ ] Hardcoded demo credentials (e.g., `admin` / `admin123`) and demo quick-fill buttons are removed from the client interface and client source files.
- [ ] Admin login authenticates against the backend API using credentials configured via `.env` with password hashing.
- [ ] Protected admin routes and API endpoints reject unauthenticated requests.

### Verification & Code Quality
- [ ] Automated tests or verification scripts are provided and pass, verifying authentication and application submission endpoints.
- [ ] The application builds cleanly with `npm run build` without TypeScript, lint, or bundling errors.
