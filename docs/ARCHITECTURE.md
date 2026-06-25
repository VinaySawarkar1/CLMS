# CLMS Architecture

Calibration Laboratory Management System — enterprise architecture reference.
This document is the source of truth for the module roadmap, the calibration
workflow, the database design and the backend service boundaries.

## 1. Goals

100% digital · NABL compliant · ISO 17025 compliant · paperless · digital
signatures · immutable audit trail · multi-user / multi-branch / multi-discipline ·
cloud-ready · mobile-friendly.

## 2. User Roles

`SUPER_ADMIN`, `LAB_DIRECTOR`, `QUALITY_MANAGER`, `TECHNICAL_MANAGER`,
`CALIBRATION_ENGINEER`, `REVIEWER`, `DATA_ENTRY_OPERATOR`, `SALES`, `ACCOUNTS`,
`STORE_MANAGER`, `CUSTOMER`, `AUDITOR`.

Each role carries an independent permission set (RBAC permission matrix).

## 3. Calibration Workflow

```
Customer Request → Quotation → Approval → Instrument Entry → Job Card
→ Engineer Assignment → Calibration → Datasheet → Calculations → Uncertainty
→ Draft Report → Review → Approval → Certificate → Digital Signature
→ Invoice → Delivery → Customer Download
```

### Job Statuses

`RECEIVED → WAITING → ASSIGNED → IN_CALIBRATION → PENDING_REVIEW →
CORRECTION_REQUIRED → APPROVED → CERTIFICATE_GENERATED → DELIVERED → CLOSED`

## 4. Backend Services (NestJS modules)

Each service is an independent module under `backend/src/modules`:

Authentication · Authorization (RBAC) · Customer · Instrument · Calibration ·
Datasheet · Uncertainty · Certificate · Report · Engineer · Task · Inventory ·
Billing · Notification · Audit · Settings · Dashboard.

Implemented in this scaffold: **Auth, Users, Customers, Instruments, Jobs**.
The remaining modules follow the same module/controller/service/DTO pattern.

## 5. Database Design

Target: ~120–150 normalized tables across these groups. The Prisma schema in
`backend/prisma/schema.prisma` models the core of each group; specialised tables
(measurement points, uncertainty parameters, observations, etc.) are added as
each engine is built.

Major groups: Users · Roles · Permissions · Customers · Branches · Contacts ·
Instruments · Instrument Categories · Disciplines · Calibration Jobs · Sessions ·
Datasheets · Observations · Measurement Points · Reference / Master Standards ·
Uncertainty Templates & Parameters · Reports · Certificates · Digital Signatures ·
Audit Logs · Notifications · Invoices · Payments · Engineers · Tasks · Attendance ·
Training · Competency · Environmental Records · NCR · CAPA · Documents ·
Equipment Maintenance · Schedules · Settings.

## 6. Discipline Isolation

Every discipline (Mechanical, Electrical, Pressure, Temperature, Mass, Dimension,
Flow, Volume, Force, Torque, Humidity, RPM, Time/Frequency, Acoustics) owns its
own datasheet templates, uncertainty budget, certificate/report templates,
procedures, acceptance criteria, CMC, and master standards.

## 7. Engines (specialised sub-systems)

- **Datasheet engine** — Excel-like grid, formula/locked cells, auto-calc,
  versioning, dynamic rows/columns, image upload.
- **Formula engine** — internal parser supporting `+ - * /`, `SQRT ABS ROUND IF
  AVERAGE SUM MAX MIN LOG SIN COS TAN` with Excel-like semantics.
- **Uncertainty engine** — Type A / Type B, sensitivity coefficients, degrees of
  freedom, combined & expanded uncertainty, coverage factor, CMC comparison.
- **Report / Certificate engine** — dynamic PDF/Excel/Word generation (NABL &
  non-NABL), QR + digital signature + traceability + decision rule.
- **QR verification engine** — certificate hash + public verification URL.
- **Digital signature engine** — Engineer → Reviewer → Technical Manager →
  Quality Manager → final lock (certificate becomes immutable).

## 8. Security

JWT + refresh tokens · RBAC permission matrix · session timeout · password
policy · encryption at rest/in transit · HTTPS · input validation (SQLi/XSS/CSRF
protection) · immutable audit trail · scheduled backups.

## 9. API Surface

`/auth · /users · /customers · /instruments · /jobs · /calibration · /datasheets
· /uncertainty · /reports · /certificates · /masters · /tasks · /inventory ·
/billing · /dashboard · /settings`
