# Day 10: Fee Management Module

## Objective
Implement a complete Fee Management system for the Multi-Tenant LMS SaaS project. This module manages the billing and payment cycles of the academic ERP, enabling administrators to set up global fee structures for batch classrooms, assign customized ledgers to individual students carrying scholarship/discount configurations, collect partial/full payments with unique receipt logs, and automatically adjust outstanding balances upon transaction modifications or deletions.

---

## Database Changes & New Models

We introduced three new Mongoose schema models:

### 1. FeeStructure Model (`models/FeeStructure.js`)
- **institute**: Reference (`Institute` model) enforcing multi-tenant isolation.
- **batch**: Reference (`Batch` model) mapping the target batch classroom.
- **academicYear**: Academic year string (e.g. `"2026-2027"`).
- **feeName**: Fee template headline.
- **tuitionFee**, **admissionFee**, **examFee**, **libraryFee**, **transportFee**, **otherCharges**: Individual charge values.
- **totalFee**: Auto-calculated sum of all individual charges before saving.
- **installmentPlan**: Installment strategy (e.g. `"One-time"`, `"Quarterly"`).
- **status**: Enum `["Active", "Inactive"]` (default `"Active"`).

### 2. StudentFee Model (`models/StudentFee.js`)
- **student**: Reference (`User` model, role `"student"`) linking the student.
- **enrollment**: Reference (`Enrollment` model) mapping batch enrollment.
- **batch**: Reference (`Batch` model).
- **feeStructure**: Reference (`FeeStructure` model) linking the template.
- **institute**: Reference (`Institute` model).
- **totalFee**: Copied from the blueprint's total fee sum.
- **paidAmount**: Total payments amount collected.
- **pendingAmount**: Outstanding balance (auto-computed before saving).
- **discount**: Deductions granted.
- **scholarship**: Scholarship value granted.
- **lateFee**: Penalties charged.
- **status**: Enum `["Unpaid", "Partially Paid", "Paid"]` (auto-evaluated).

### 3. Payment Model (`models/Payment.js`)
- **studentFee**: Reference (`StudentFee` ledger).
- **amount**: Payment transaction amount.
- **paymentMode**: Mode of transaction (e.g. `"Cash"`, `"Card"`, `"Bank Transfer"`).
- **paymentStatus**: Enum `["Pending", "Success", "Failed"]` (default `"Success"`).
- **transactionId**: Bank transaction trace ID.
- **receiptNumber**: Unique receipt number (e.g. `"REC-1784274097695-328"`).
- **paymentDate**: Transaction timestamp.
- **collectedBy**: Reference to the administrator user who processed it.
- **remarks**: Transaction comments.

---

## APIs Exposed

### Fee Structure Blueprint Endpoints
- `POST   /api/v1/fee-structures` (Create structure - Admin Only)
- `GET    /api/v1/fee-structures` (List structures - Scoped)
- `GET    /api/v1/fee-structures/:id` (Fetch single structure details)
- `PATCH  /api/v1/fee-structures/:id` (Update structure - Admin Only)
- `DELETE /api/v1/fee-structures/:id` (Delete structure - Admin Only)

### Student Ledger Endpoints
- `POST  /api/v1/student-fees` (Assign fee template to student - Admin Only)
- `GET   /api/v1/student-fees` (List ledgers - Scoped: student reads only their own)
- `GET   /api/v1/student-fees/:id` (Fetch single ledger details)
- `PATCH /api/v1/student-fees/:id` (Adjust discount/scholarship/lateFee - Admin Only)

### Payment Transaction Endpoints
- `POST   /api/v1/payments` (Collect payment - Admin Only)
- `GET    /api/v1/payments` (List transaction logs - Scoped)
- `GET    /api/v1/payments/:id` (Fetch single payment details)
- `DELETE /api/v1/payments/:id` (Delete transaction and revert ledger balance - Admin Only)
- `GET    /api/v1/payments/student/:studentId` (List payments for a student - Scoped)

---

## Business Rules Enforced

1. **Role Constraints**:
   - Modifying fee templates, assigning student fees, collecting payments, and deleting payments are strictly restricted to the **Admin** role.
   - Teachers can query but not modify logs.
   - Students can only view their own ledgers and payment logs.
2. **Balance Auto-Calculations**:
   - `pendingAmount = (totalFee - discount - scholarship + lateFee) - paidAmount`
   - Ledgers with `paidAmount = 0` are marked `'Unpaid'`. Ledgers with `pendingAmount <= 0` are marked `'Paid'`. Otherwise, they are `'Partially Paid'`.
3. **Transaction Controls**:
   - Overpayment protection blocks transaction collection if `amount > pendingAmount`.
   - Unique receipt numbers prevent duplicate logs.
   - Deleting a payment automatically decrements `paidAmount` on the student ledger, reverting outstanding balance and status states.

---

## Learning Outcomes
- Designing complex multi-model double-entry ledger update patterns.
- Implementing automatic transaction rollbacks on document deletion.
- Restricting critical financial database adjustments strictly to root administrators.

---

# Day 11: Dark & Light Theme Toggle (Frontend)

## Objective
Add a user-switchable Dark/Light theme to the `frontend` React app (Orbit LMS), persisted across sessions, so administrators, teachers, and students can pick their preferred appearance.

## Implementation
- **`frontend/src/context/ThemeContext.jsx`**: A `ThemeProvider`/`useTheme()` context that tracks `theme` (`"light"` | `"dark"`), toggles the `dark` class on `<html>`, persists the choice to `localStorage` under the `theme` key, and falls back to the OS `prefers-color-scheme` when nothing is saved yet (and keeps following it live via a `matchMedia` change listener, until the user picks explicitly).
- **`frontend/index.html`**: A small inline script sets the `dark` class on `<html>` before React hydrates, so there's no flash of the wrong theme on load.
- **`frontend/src/index.css`**: Enables Tailwind v4's class-based dark mode via `@custom-variant dark (&:where(.dark, .dark *));`, and sets dark-mode defaults for `body` background/text and scrollbars.
- **`frontend/src/components/layout/Navbar.jsx`**: A sun/moon toggle button (`toggleTheme()` from `useTheme()`) next to the notifications bell.
- **`frontend/src/main.jsx`**: Wraps the app in `<ThemeProvider>`.
- `dark:` Tailwind variants were added throughout the shared UI kit (`Button`, `Input`, `Select`, `Textarea`, `Table`, `Modal`, `Drawer`, `Badge`, `StatCard`, `EmptyState`, `ErrorState`, `Loading`, `ConfirmDialog`, `PageHeader`, `Menu`, `SearchInput`, `Tabs`, `Toaster`, `DetailList`, `Field`), the app shell (`Sidebar`, `Navbar`, `DashboardLayout`), and the `Login`, `Onboarding`, `Dashboard`, `Settings`, and `NotFound` pages.

## Learning Outcomes
- Implementing class-based dark mode in Tailwind CSS v4 (`@custom-variant`) instead of the media-query-only default.
- Persisting a UI preference to `localStorage` while still respecting a live OS-level `prefers-color-scheme` change until the user overrides it.
- Preventing flash-of-incorrect-theme by applying the theme class before the SPA's JS bundle runs.
