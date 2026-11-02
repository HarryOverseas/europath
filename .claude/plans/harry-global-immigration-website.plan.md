# Plan: Harry Global Immigration Website

**Source PRD**: Harry_Global_Immigration_Website_Requirements.pdf
**Selected Milestone**: Full Website Development (MVP & Production Polish)
**Complexity**: Medium

## Summary
Build a modern, professional, mobile-first website for Harry Global Immigration combining immigration consultancy, German Language Academy (A1-B2), and Germany arrival assistance. Includes a multi-step enquiry form, admin dashboard, WhatsApp/email integration, and legal policy pages.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Styling | Tailwind CSS | Utility-first styling with dark blue (`#0A192F`) and gold (`#C5A059`) brand palette |
| Form Architecture | Multi-step wizard | React state machine with validation per step |
| Dashboard | CRUD table view | Responsive data table with filterable status badges |

## Files to Change
| File | Action | Why |
|---|---|---|
| `index.html` | CREATE | Main entry point |
| `src/App.tsx` | CREATE | Root component with view switching (Public Site vs Admin Dashboard) |
| `src/components/Navbar.tsx` | CREATE | Global navigation with mobile menu and WhatsApp CTA |
| `src/components/Hero.tsx` | CREATE | Hero section with tagline and world-map theme |
| `src/components/Services.tsx` | CREATE | Immigration services breakdown (Student, Spouse, Chancenkarte, Work, Tourist) |
| `src/components/LanguageAcademy.tsx` | CREATE | German language courses (A1-B2) and pricing bundle tables |
| `src/components/ArrivalAssistance.tsx` | CREATE | Arrival support services |
| `src/components/EnquiryWizard.tsx` | CREATE | 5-step interactive enquiry form |
| `src/components/AdminDashboard.tsx` | CREATE | Admin interface for managing enquiries |
| `src/components/LegalFooter.tsx` | CREATE | Legal disclaimers, privacy policy, terms, and footer |

## Tasks
### Task 1: Project Setup & Design System
- **Action**: Create index.html and root React component with Tailwind styling and brand color tokens.
- **Validate**: Build succeeds without errors.

### Task 2: Public Website & Language Academy
- **Action**: Implement Navbar, Hero, Immigration Services, German Language Academy pricing tables, and Arrival Assistance.
- **Validate**: Visual check of all content sections.

### Task 3: Multi-Step Enquiry Form
- **Action**: Build 5-step interactive enquiry wizard with validation, summary step, and submission handling.
- **Validate**: Complete form flow and test validation.

### Task 4: Admin Dashboard & Legal Pages
- **Action**: Implement admin view for managing enquiries, status updates, and legal policy sections.
- **Validate**: Status toggle and filtering in admin dashboard.

## Validation
```bash
npm run build
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Mobile form usability | Medium | Keep steps concise with clear progress indicators |

## Acceptance
- [ ] All tasks complete
- [ ] Validation passes
- [ ] Patterns mirrored, not reinvented
