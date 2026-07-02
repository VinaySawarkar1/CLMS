# Software Requirement Specification (SRS)
## ERP System Enhancement — Five Core Modules
### Version 1.0 | Date: 2026-06-27

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Common Features & Architecture](#3-common-features--architecture)
4. [Module 1 — Customer Management](#4-module-1--customer-management)
5. [Module 2 — Quotation Management](#5-module-2--quotation-management)
6. [Module 3 — Purchase Order Management](#6-module-3--purchase-order-management)
7. [Module 4 — Delivery Challan Management](#7-module-4--delivery-challan-management)
8. [Module 5 — Invoice Management](#8-module-5--invoice-management)
9. [Cross-Module Integration](#9-cross-module-integration)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [User Roles & Permissions Matrix](#11-user-roles--permissions-matrix)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirement Specification defines the complete functional and non-functional requirements for enhancing five core modules of the existing ERP system: Customer Management, Quotation Management, Purchase Order Management, Delivery Challan Management, and Invoice Management. The goal is to bring each module to enterprise-grade capability comparable to Zoho Books, Odoo, Microsoft Dynamics 365, or SAP Business One — without redesigning the existing system.

### 1.2 Scope

This document covers:
- Detailed feature specifications for all five modules
- Complete workflow definitions with status transitions
- All required fields, validation rules, and business logic
- Dashboard widgets and reporting requirements
- Notification and alert specifications
- Role-based permission requirements
- Future enhancement roadmap

### 1.3 Definitions & Abbreviations

| Term | Meaning |
|------|---------|
| GST | Goods and Services Tax |
| PAN | Permanent Account Number |
| PO | Purchase Order |
| DC | Delivery Challan |
| LR | Lorry Receipt |
| GSTIN | GST Identification Number |
| HSN | Harmonized System of Nomenclature |
| SAC | Services Accounting Code |
| TDS | Tax Deducted at Source |
| CRM | Customer Relationship Management |
| SRS | Software Requirement Specification |
| RBAC | Role-Based Access Control |
| API | Application Programming Interface |
| PDF | Portable Document Format |
| UI | User Interface |
| UX | User Experience |

---

## 2. System Overview

### 2.1 System Context

The ERP system is a multi-tenant SaaS platform serving SMEs. The five modules being enhanced form the core sales and procurement lifecycle:

```
Customer → Quotation → Purchase Order
                ↓
         Delivery Challan
                ↓
            Invoice → Payment
```

### 2.2 Design Philosophy

- **Mobile-first responsive UI** — all screens work on desktop, tablet, and mobile
- **Progressive disclosure** — simple forms by default, advanced fields accessible on demand
- **Inline validation** — real-time feedback without full-page submissions
- **Keyboard accessibility** — power users can navigate entirely via keyboard
- **Consistent patterns** — uniform list views, detail views, and action menus across modules
- **Audit-first** — every create, update, delete, and status change is logged immutably

---

## 3. Common Features & Architecture

### 3.1 Global Search

- **Scope:** searches across customers, quotations, POs, delivery challans, and invoices simultaneously
- **Trigger:** keyboard shortcut (Ctrl+K / Cmd+K) or top search bar
- **Results:** grouped by module with count badges; shows top 5 per category
- **Fields indexed:** document number, customer/supplier name, contact person, amount, status
- **Speed requirement:** results within 300 ms for up to 1 million records

### 3.2 Advanced Filters

Every list view must support:

| Filter Type | Description |
|-------------|-------------|
| Date Range | Created date, modified date, document date |
| Status | Multi-select status chips |
| Amount Range | Min/max numeric inputs |
| Assigned User | Dropdown of active users |
| Customer/Supplier | Type-ahead search |
| Tags | Multi-select tag filter |
| Custom Fields | Any user-defined field |

- Filters are combinable with AND logic by default; OR logic switchable per filter group
- **Saved Filters:** users can name and save filter combinations; saved filters appear in a pinned sidebar
- **Filter sharing:** saved filters can be shared with specific roles or all users

### 3.3 Column Customization

- Users can show/hide columns per list view
- Column order is drag-and-drop adjustable
- Column width is resizable by dragging column borders
- Preferences are persisted per user per module in the database (not just localStorage)

### 3.4 Export & Print

| Format | Scope |
|--------|-------|
| Excel (.xlsx) | All visible columns including filtered data; max 100,000 rows |
| PDF | Document-level (single record) and list-level (filtered set, max 1,000 rows) |
| Print | Browser print dialog with print-optimized CSS |

- Exports run in the background for datasets > 1,000 rows; user is notified via in-app notification when ready
- Export jobs are listed in a download center with expiry after 24 hours

### 3.5 Email Integration

- Compose email from within any document with pre-populated recipient, subject, and body
- Email template support with Handlebars-style placeholders (`{{customer_name}}`, `{{document_number}}`, etc.)
- PDF attachment auto-attached to emails
- Sent email is logged in the document's activity timeline
- Email open tracking (optional; configurable per organization)
- Reply-to address configurable per organization

### 3.6 WhatsApp Sharing

- Generates a pre-filled WhatsApp deep link (`https://wa.me/...`) with document summary text
- PDF download link (time-limited signed URL, 7-day expiry) included in message
- One-click button on document detail view and list action menu

### 3.7 Attachments

- Upload from device, drag-and-drop, or camera (mobile)
- Accepted types: PDF, JPEG, PNG, XLSX, DOCX, CSV — max 10 MB per file, max 20 files per document
- Files stored in object storage (e.g., S3-compatible); never in the database
- Virus scan on upload; quarantine if flagged
- Download / preview in-browser for PDF and images
- Delete allowed only by owner or admin; soft-deleted (not physically removed for 30 days)

### 3.8 Activity Timeline

Every document has a chronological feed showing:
- Status changes (who changed it, when, from→to)
- Field edits (field name, old value, new value)
- Emails sent (to, subject, timestamp)
- Comments added
- Attachments uploaded / deleted
- PDF downloads
- Bulk actions applied

### 3.9 Comments & Notes

- **Comments:** visible to all users with access to the document; supports @mention to notify a user
- **Internal Notes:** flagged as internal; not visible in customer-facing PDFs or portal; visible only to internal roles
- Rich text (bold, italic, bullet lists, links)
- Edit/delete own comments within 15 minutes; admins can delete any

### 3.10 Audit Log

- Immutable log stored separately from business data
- Records: timestamp (UTC), user ID, user name, IP address, action type, module, record ID, field-level diff
- Accessible to Admin and Auditor roles only
- Exportable as Excel or CSV
- Retention: minimum 7 years (configurable)

### 3.11 Auto Number Generation

- Each module has a configurable number format: prefix + separator + year/month + sequence
  - Example: `QTN-2026-00001`, `INV-JUN-2026-001`
- Sequence resets: never / yearly / monthly (configurable per module)
- Manual override allowed only for Admin role with audit log entry
- Gap detection: system alerts if a sequence gap is detected

### 3.12 Soft Delete

- Records are never physically deleted via normal UI actions
- Deleted records have `deleted_at` timestamp and `deleted_by` user reference
- Deleted records are hidden from all list views by default
- Admin can view and restore deleted records from a "Trash" view
- Physical purge available only after 90-day retention period, requires Super Admin

### 3.13 Notifications

Notification channels:
- **In-app bell:** real-time via WebSocket; shows unread count badge
- **Email:** configurable per user and per event type
- **Browser push:** opt-in; requires HTTPS

Notification preferences: each user configures which events trigger which channels.

### 3.14 Bulk Operations

Available on all list views when rows are selected:

| Operation | Modules |
|-----------|---------|
| Bulk export | All |
| Bulk delete (soft) | All |
| Bulk status change | Quotation, PO, DC, Invoice |
| Bulk email | Quotation, Invoice |
| Bulk assign | Customer, Quotation |
| Bulk tag | All |

Bulk operations > 100 records run as background jobs with progress indication.

### 3.15 Pagination

- Default page size: 25 rows; options: 10, 25, 50, 100
- Server-side pagination (no full-table loads)
- Infinite scroll mode optional per user preference

### 3.16 Mobile Responsive UI

- Breakpoints: mobile (< 768 px), tablet (768–1024 px), desktop (> 1024 px)
- On mobile: list view collapses to card layout showing key fields
- Detail view stacks into single column on mobile
- Action buttons collapse to a floating action button (FAB) on mobile
- All form inputs are touch-friendly (minimum 44 × 44 px tap targets)

---

## 4. Module 1 — Customer Management

### 4.1 Module Overview

The Customer Management module is the master data hub for all customer records. It serves as the single source of truth for customer information referenced across Quotation, Delivery Challan, and Invoice modules. It is not a separate CRM — it is embedded within the ERP workflow.

### 4.2 Business Purpose

- Maintain accurate, de-duplicated customer master data
- Track the full commercial relationship history with each customer
- Enforce credit and payment policies
- Provide account managers visibility into customer health

### 4.3 Complete Features

#### 4.3.1 Core Information

| Field | Type | Description |
|-------|------|-------------|
| Customer Code | Auto-generated | Format: `CUST-00001`; unique |
| Customer Type | Enum | `Individual` / `Business` |
| Company Name | Text | Required for Business type |
| Display Name | Text | Auto-populated; editable |
| Contact Person (Primary) | Text | Full name |
| Salutation | Enum | Mr / Ms / Dr / Prof |
| Designation | Text | Job title of primary contact |
| Mobile (Primary) | Phone | E.164 format; validated |
| Mobile (Secondary) | Phone | Optional |
| Email (Primary) | Email | Validated; unique across active customers (warning, not block) |
| Email (Secondary) | Email | Optional |
| Website | URL | Optional; validated format |
| Customer Category | Lookup | Configurable categories e.g., Retail, Wholesale, Government |
| Sales Executive | User Lookup | Assigned internal user |
| Customer Tags | Multi-tag | Free-form or predefined tags |
| Customer Status | Enum | `Active` / `Inactive` / `Blacklisted` |
| Opening Balance | Currency | Debit/Credit toggle |
| Opening Balance Date | Date | Date of opening balance |
| Notes | Rich Text | Internal notes |

#### 4.3.2 Tax & Compliance

| Field | Type | Description |
|-------|------|-------------|
| GSTIN | Text | 15-character GST number; format-validated |
| GST Registration Type | Enum | Regular / Composition / Unregistered / SEZ / Deemed Export |
| PAN Number | Text | 10-character; format-validated |
| TAN Number | Text | Optional; 10-character |
| TDS Applicable | Boolean | Triggers TDS deduction on invoices |
| TDS Rate | Decimal | Percentage; active only if TDS Applicable |

#### 4.3.3 Financial Settings

| Field | Type | Description |
|-------|------|-------------|
| Payment Terms | Lookup | E.g., Net 15, Net 30, Immediate, Custom |
| Credit Limit | Currency | Maximum outstanding allowed; 0 = unlimited |
| Credit Days | Integer | Number of days credit allowed |
| Currency | Lookup | Default invoice currency for this customer |
| Price List | Lookup | Specific pricing tier assigned to customer |
| Discount % | Decimal | Default discount applied on quotations/invoices |

#### 4.3.4 Multiple Contact Persons

A customer can have unlimited contact persons. Each contact has:
- Salutation, First Name, Last Name
- Designation
- Department
- Mobile, Work Phone, Email
- WhatsApp Number
- Is Primary (boolean — exactly one primary)
- Active/Inactive status

#### 4.3.5 Addresses

**Billing Address:**
- Address Line 1, Line 2
- City, State (lookup from state master), PIN Code
- Country (lookup; default India)
- Same-as-billing checkbox on Shipping Address

**Shipping Address:**
- Supports multiple shipping addresses
- Each shipping address has a label (e.g., "Warehouse A", "Head Office")
- One shipping address can be marked as default
- Customer can have up to 10 shipping addresses

#### 4.3.6 Customer Profile Dashboard

The customer detail page has a profile header and tabbed sections:

**Header Stats (live-calculated):**
- Total Quotations (count + total value)
- Total Sales Orders (count + total value)
- Total Purchase Orders if customer is also a vendor
- Total Delivery Challans (count)
- Total Invoices (count + total value)
- Total Payments Received
- Outstanding Amount (= Total Invoiced − Total Received)
- Overdue Amount (outstanding past due date)

**Tabs:**
1. Overview (summary stats + recent activity)
2. Contacts (multiple contact persons)
3. Addresses
4. Financial (payment terms, credit limit, ledger link)
5. Documents (linked quotations, invoices, POs, DCs)
6. Attachments (files and documents)
7. Activity Timeline
8. Notes & Comments

#### 4.3.7 Customer Ledger

- Date-wise list of all transactions: invoices, payments, credit notes, debit notes
- Running balance column
- Filterable by date range
- Exportable as PDF (statement format) and Excel
- Printable as Account Statement with company letterhead

### 4.4 Workflow

```
[Create Customer] → Draft
        ↓
[Verify Details / GSTIN] → Active
        ↓
[Transactions Begin] → Active (ongoing)
        ↓
[No Activity / Manual] → Inactive
        ↓
[Policy Breach] → Blacklisted
```

- Draft state: customer created but not yet verified; cannot be used in transactions
- Active: default usable state
- Inactive: hidden from new transaction dropdowns; existing links preserved
- Blacklisted: system blocks new transactions; requires Admin override with reason

### 4.5 Required Fields

Minimum required to save a customer:
- Customer Type
- Display Name (or Company Name for Business type)
- Mobile (Primary) OR Email (Primary) — at least one required
- Customer Status

Additional required for tax transactions:
- GSTIN (if GST Registration Type is Regular or Composition)
- Billing Address (required before first invoice)

### 4.6 Validation Rules

| Field | Rule |
|-------|------|
| Customer Code | Auto-generated; read-only; unique |
| GSTIN | Must match `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` |
| PAN | Must match `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` |
| Mobile | Must be 10 digits (after stripping country code); Indian format enforced |
| Email | RFC 5322 compliant |
| PIN Code | 6 digits for India |
| Credit Limit | Non-negative decimal |
| Opening Balance | Numeric; must specify debit or credit |
| Website | Must begin with `http://` or `https://` or be a valid domain |
| GSTIN State Code | First 2 digits of GSTIN must match the selected billing state code |

### 4.7 Business Logic

1. **GSTIN Uniqueness Warning:** If a GSTIN already exists on another active customer, show a warning (not a block) and ask the user to confirm or merge.
2. **Credit Limit Enforcement:** On invoice save, if outstanding amount + new invoice amount exceeds credit limit, block save and show alert. Admin can override with a reason.
3. **Auto-derive State from GSTIN:** First 2 digits of entered GSTIN auto-populate the State field.
4. **Duplicate Detection:** On save, system checks for near-duplicates using: same phone, same email, or same GSTIN. Shows a merge suggestion panel if duplicates found.
5. **Sales Executive Notification:** When a customer is assigned/re-assigned to a sales executive, the new executive receives an in-app notification.
6. **Opening Balance Accounting:** Opening balance is posted to the ledger as a system-generated journal entry on the Opening Balance Date.
7. **Customer Code Immutability:** Customer code cannot be changed after the first transaction is linked.

### 4.8 Status Flow

```
Draft ──────────────────────────────────┐
  │                                     │
  ↓ [Verify]                            │ [Delete before first transaction]
Active ──[Manual Deactivate]──→ Inactive │
  │                                     │
  ↓ [Policy violation]                  │
Blacklisted ──[Admin unblacklist]──→ Active
```

| Transition | Who Can Trigger |
|------------|----------------|
| Draft → Active | User, Admin |
| Active → Inactive | Admin, Manager |
| Inactive → Active | Admin, Manager |
| Active → Blacklisted | Admin only |
| Blacklisted → Active | Admin only |

### 4.9 Merge Duplicate Customers

- Admin selects two customer records to merge
- System shows a side-by-side comparison of all fields
- User selects the "master" record (the one to keep)
- User resolves field-level conflicts by choosing from either record
- On confirm: all linked transactions (quotations, invoices, DCs, POs) are re-pointed to the master record; the duplicate is soft-deleted with a merge reference
- Merge is irreversible; requires explicit confirmation dialog with the duplicate record name

### 4.10 Import Customers

- Upload Excel or CSV template
- System provides a downloadable template with required and optional columns
- Mapping step: user maps spreadsheet columns to system fields
- Validation report: shows rows with errors (invalid GSTIN, duplicate phone, etc.) without importing them
- Partial import allowed: import valid rows, download error rows for correction
- Max 5,000 rows per import batch
- Import progress shown as a background job with percentage
- Notification on completion with summary: X imported, Y failed

### 4.11 Export Customers

- Export filtered/selected customer list
- Fields: all standard fields, including computed fields (outstanding, last transaction date)
- Formats: Excel, CSV
- Sensitive fields (PAN, GSTIN) excluded from export unless user has Finance role

### 4.12 Dashboard Widgets

| Widget | Type | Description |
|--------|------|-------------|
| Total Active Customers | KPI tile | Count of active customers |
| New Customers This Month | KPI tile | Count + trend vs last month |
| Customers by Category | Donut chart | Breakdown by customer category |
| Top 10 Customers by Revenue | Bar chart | Last 12 months, sortable |
| Customers with Overdue Payments | Table | Count + total overdue amount |
| Customer Acquisition Trend | Line chart | Monthly new customers, 12 months |
| Sales Executive Performance | Table | Customers and revenue per executive |
| Recently Added Customers | Table | Last 10 added |

### 4.13 Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Customer Master Report | Full list with all fields | Status, Category, Sales Executive |
| Customer Ledger | Transaction-wise statement per customer | Date range, Customer |
| Customer Outstanding | Aged outstanding balances (0-30, 31-60, 61-90, 90+ days) | Customer, Date |
| Customer Activity Report | Transaction count and value per customer | Date range, Customer |
| New Customer Acquisition | Customers added per period | Date range, Sales Executive |
| Inactive Customer Report | Customers with no transactions in N days | Days threshold |

### 4.14 Notifications

| Event | Recipients | Channel |
|-------|-----------|---------|
| New customer created | Admin, Manager | In-app |
| Customer blacklisted | Admin, assigned Sales Executive | In-app + Email |
| Credit limit breach | Admin, Finance | In-app + Email |
| Customer imported | Import initiator | In-app |
| Merge completed | Initiating user, Admin | In-app |

### 4.15 User Permissions

| Permission | Super Admin | Admin | Manager | Sales Exec | Accountant | Viewer |
|------------|:-----------:|:-----:|:-------:|:----------:|:----------:|:------:|
| View customers | ✓ | ✓ | ✓ | Own only | ✓ | ✓ |
| Create customer | ✓ | ✓ | ✓ | ✓ | — | — |
| Edit customer | ✓ | ✓ | ✓ | Own only | — | — |
| Delete customer | ✓ | ✓ | — | — | — | — |
| Change status | ✓ | ✓ | ✓ | — | — | — |
| Blacklist | ✓ | ✓ | — | — | — | — |
| Merge duplicates | ✓ | ✓ | — | — | — | — |
| Import | ✓ | ✓ | ✓ | — | — | — |
| Export | ✓ | ✓ | ✓ | Own only | ✓ | — |
| View ledger | ✓ | ✓ | ✓ | — | ✓ | — |
| Override credit limit | ✓ | ✓ | — | — | — | — |

### 4.16 Future Enhancements

- Customer Portal: self-service login for customers to view invoices and make payments
- AI-powered duplicate detection using fuzzy name matching
- WhatsApp Business API integration for automated invoice reminders
- Credit score integration with third-party CIBIL/Experian APIs
- Customer health score dashboard widget
- Automated re-activation workflow for dormant customers

---

## 5. Module 2 — Quotation Management

### 5.1 Module Overview

The Quotation module enables the sales team to create, send, and track price proposals to customers. Quotations can be converted to Sales Orders, Invoices, or Purchase Orders, and are the starting point of the order-to-cash cycle.

### 5.2 Business Purpose

- Standardize the pricing and proposal process
- Track win/loss rates for sales analytics
- Reduce manual data entry by converting accepted quotations directly into downstream documents
- Maintain version history for revised quotations

### 5.3 Complete Features

#### 5.3.1 Header Information

| Field | Type | Description |
|-------|------|-------------|
| Quotation Number | Auto-generated | Format: `QTN-YYYY-MM-NNNNN`; read-only |
| Quotation Date | Date | Defaults to today |
| Validity Date | Date | Expiry date; required |
| Customer | Lookup | Searchable; shows code, name, outstanding |
| Contact Person | Lookup | From customer's contact list |
| Billing Address | Lookup | From customer's billing addresses |
| Shipping Address | Lookup | From customer's shipping addresses |
| Sales Executive | User Lookup | Defaults to logged-in user |
| Reference Number | Text | Customer's internal reference / enquiry number |
| Subject / Title | Text | Brief description of the quotation |
| Currency | Lookup | Defaults from customer; editable |
| Exchange Rate | Decimal | Auto-fetched for non-base currency; editable |
| Price List | Lookup | Overrides default pricing |
| Quotation Revision | Integer | Auto-incremented on each revision; `R0` = original |

#### 5.3.2 Line Items

Each line item (unlimited rows) has:

| Field | Type | Description |
|-------|------|-------------|
| # | Auto | Line number |
| Product/Service | Lookup | From product master; supports HSN/SAC |
| Description | Text | Auto-filled from product; editable |
| HSN/SAC Code | Text | Auto-filled from product |
| Quantity | Decimal | Required; > 0 |
| Unit | Lookup | UOM from product master |
| Unit Price | Currency | Required; auto-filled from price list if applicable |
| Discount % | Decimal | Row-level; 0–100 |
| Discount Amount | Currency | Calculated: Qty × Price × Discount% |
| Taxable Amount | Currency | Calculated: (Qty × Price) − Discount |
| GST Type | Enum | IGST / CGST+SGST / Exempt (auto based on customer state vs company state) |
| GST Rate | Decimal | From product's GST classification |
| GST Amount | Currency | Calculated |
| Total | Currency | Taxable Amount + GST Amount |

Line item features:
- Drag-and-drop reordering
- Copy/duplicate a row
- Add a description-only row (for section headers or notes within the table)
- Inline edit without opening a separate form

#### 5.3.3 Totals Section

| Field | Calculation |
|-------|-------------|
| Sub Total | Sum of all Taxable Amounts |
| Total Discount | Sum of all Discount Amounts |
| CGST | Sum of CGST for intrastate lines |
| SGST | Sum of SGST for intrastate lines |
| IGST | Sum of IGST for interstate lines |
| Round Off | Nearest rupee / configurable |
| Grand Total | Sub Total + GST − Round Off |
| Amount in Words | Auto-generated (e.g., "Rupees Forty Five Thousand Only") |

#### 5.3.4 Footer Information

| Field | Type | Description |
|-------|------|-------------|
| Payment Terms | Lookup | Defaults from customer |
| Delivery Terms | Text | E.g., "Ex-works", "Freight included" |
| Delivery Period | Text | E.g., "2–4 weeks from PO" |
| Terms & Conditions | Rich Text | Template-selectable; editable per quotation |
| Internal Notes | Rich Text | Not visible on PDF |
| Bank Details | Lookup | Which bank account to show on PDF |
| Signature | Image upload | Digital signature image; or DocuSign integration placeholder |

### 5.4 Actions

| Action | Description | Available In Status |
|--------|-------------|---------------------|
| Save Draft | Save without sending | Any |
| Preview PDF | Preview before sending | Any |
| Send by Email | Email PDF to customer | Draft, Sent, Accepted |
| Send via WhatsApp | WhatsApp share link | Any |
| Download PDF | Download to device | Any |
| Print | Browser print dialog | Any |
| Duplicate | Copy all fields to new Draft | Any except Cancelled |
| Revise | Create new revision (increments R#) | Sent, Rejected, Expired |
| Mark as Sent | Manually mark without emailing | Draft |
| Mark as Accepted | Record customer acceptance | Sent, Viewed |
| Mark as Rejected | Record with optional reason | Sent, Viewed |
| Convert to Invoice | Creates invoice pre-filled from quotation | Accepted |
| Convert to Sales Order | Creates SO pre-filled | Accepted |
| Convert to Purchase Order | Creates PO (for vendor quotations) | Accepted |
| Cancel | Soft cancel with reason | Draft, Sent |

### 5.5 Workflow & Status Flow

```
[Create] → DRAFT
              │
              ↓ [Send Email / Mark Sent]
            SENT
              │
              ↓ [Customer opens email tracker]
           VIEWED  ←──── (email open event, optional)
              │
        ┌─────┴─────┐
        ↓           ↓
    ACCEPTED     REJECTED
        │
        ↓ [Past Validity Date, no action]
      EXPIRED
        │
        ↓ [Admin/User action]
    CANCELLED
```

**Revision Flow:**
- When a Sent/Rejected/Expired quotation is revised, the original record's status changes to `Superseded`
- A new quotation is created as `QTN-YYYY-MM-NNNNN-R2` (same base number, incremented revision)
- The new revision starts in Draft status

### 5.6 Required Fields

Minimum required to save a Draft:
- Customer (linked)
- Quotation Date
- At least one line item with Product, Quantity, and Unit Price

Additional required to Send:
- Validity Date
- Customer Email (at least one)

### 5.7 Validation Rules

| Field | Rule |
|-------|------|
| Quotation Date | Cannot be a future date beyond 30 days |
| Validity Date | Must be ≥ Quotation Date |
| Quantity | Must be > 0; max 6 decimal places |
| Unit Price | Must be ≥ 0 |
| Discount % | Must be 0–100 |
| GST Rate | Must match product's configured GST slab |
| Grand Total | Must be > 0 to send (cannot send a ₹0 quotation) |
| Customer Status | Customer must be Active to create a quotation |
| Currency | Cannot change currency after line items are added without confirmation |

### 5.8 Business Logic

1. **Auto GST Type Selection:** Compare customer's billing state with company's registered state. Intrastate → CGST + SGST; Interstate → IGST; Unregistered customers → IGST (configurable).
2. **Price List Override:** If a price list is assigned, unit prices are auto-fetched from the price list. Manual override is allowed with a visual indicator (orange price field).
3. **Discount Tiers:** If customer has a default discount %, it pre-fills the discount column on all line items. Row-level override allowed.
4. **Multi-Currency:** Grand Total displayed in both transaction currency and base currency (INR). Exchange rate editable; rate auto-fetched from configured rate source daily.
5. **Validity Auto-Expiry:** A nightly job changes `Sent` and `Viewed` quotations past their validity date to `Expired` status.
6. **Revision Linking:** Each revision stores a reference to the previous revision's ID. Full revision history is viewable in the activity timeline.
7. **Conversion Traceability:** When a quotation is converted to an invoice or SO, the source quotation ID is stored on the target document and vice versa. The quotation is marked as `Converted` and cannot be converted again.
8. **Terms Template:** Default Terms & Conditions pulled from a configurable master; each quotation can override. Changed terms are not retroactively applied to existing quotations.

### 5.9 PDF Template

The quotation PDF must include:
- Company logo, name, address, GSTIN
- Quotation number, date, validity date, revision number
- Customer details: name, address, GSTIN
- Line item table with all columns
- GST breakdown table (CGST, SGST, IGST, Rate-wise)
- Terms & Conditions
- Bank details
- Authorized signature block
- Footer with page numbers and watermark if status is Draft

### 5.10 Dashboard Widgets

| Widget | Type | Description |
|--------|------|-------------|
| Quotation Pipeline | Funnel chart | Count and value by status |
| Win Rate | KPI % | Accepted / (Accepted + Rejected) last 90 days |
| Average Quotation Value | KPI | Rolling 30-day average |
| Expiring Soon | Table | Quotations expiring in next 7 days |
| Top Quotations | Table | Highest-value open quotations |
| Sales Executive Leaderboard | Bar chart | Accepted value per executive |
| Monthly Quotation Trend | Line chart | Created vs Accepted per month |
| Pending Follow-up | Table | Sent quotations > 5 days without response |

### 5.11 Reports

| Report | Description | Key Filters |
|--------|-------------|-------------|
| Quotation Register | All quotations with status, value, customer | Date, Status, Executive |
| Pending Quotations | Sent/Viewed not yet accepted or rejected | Validity date, Executive |
| Accepted Quotations | Accepted quotations and conversion status | Date, Customer, Executive |
| Rejected Quotations | With rejection reasons | Date, Customer |
| Expired Quotations | Past validity date | Date range |
| Monthly Quotation Summary | Count and value per month | Year, Executive |
| Product-wise Quotation Report | Which products quoted most | Date range |
| Customer-wise Quotation Summary | Per-customer win rate | Customer, Date range |

### 5.12 Notifications

| Event | Recipients | Channel |
|-------|-----------|---------|
| Quotation sent to customer | Sales Executive | In-app |
| Quotation viewed by customer | Sales Executive | In-app |
| Quotation accepted | Sales Executive, Manager | In-app + Email |
| Quotation rejected | Sales Executive, Manager | In-app |
| Quotation expiring in 2 days | Sales Executive | In-app + Email |
| Quotation expired | Sales Executive, Manager | In-app |
| Follow-up reminder (configurable days) | Sales Executive | In-app + Email |

### 5.13 User Permissions

| Permission | Super Admin | Admin | Manager | Sales Exec | Accountant | Viewer |
|------------|:-----------:|:-----:|:-------:|:----------:|:----------:|:------:|
| View quotations | ✓ | ✓ | ✓ | Own only | ✓ | ✓ |
| Create | ✓ | ✓ | ✓ | ✓ | — | — |
| Edit (Draft) | ✓ | ✓ | ✓ | Own only | — | — |
| Edit (Sent) | ✓ | ✓ | ✓ | Own only | — | — |
| Send | ✓ | ✓ | ✓ | ✓ | — | — |
| Cancel | ✓ | ✓ | ✓ | — | — | — |
| Revise | ✓ | ✓ | ✓ | Own only | — | — |
| Convert to Invoice | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Delete (Draft only) | ✓ | ✓ | — | — | — | — |
| Export | ✓ | ✓ | ✓ | Own only | ✓ | — |
| Override price | ✓ | ✓ | ✓ | — | — | — |

### 5.14 Future Enhancements

- e-Signature integration (DocuSign / Aadhaar eSign)
- Customer approval portal with digital acceptance
- AI price suggestion based on historical accepted quotations
- Competitive analysis tags (lost to which competitor)
- WhatsApp Business API for automated follow-up sequences
- Multi-language PDF templates

---

## 6. Module 3 — Purchase Order Management

### 6.1 Module Overview

The Purchase Order module manages the procurement lifecycle — from issuing POs to suppliers, through goods receipt, to closure. It links directly to inventory receiving and accounts payable.

### 6.2 Business Purpose

- Formalize procurement with documented approval
- Track delivery commitments from suppliers
- Prevent unauthorized purchases
- Enable three-way matching: PO ↔ Goods Receipt ↔ Supplier Invoice

### 6.3 Complete Features

#### 6.3.1 Header Information

| Field | Type | Description |
|-------|------|-------------|
| PO Number | Auto-generated | Format: `PO-YYYY-MM-NNNNN` |
| PO Date | Date | Defaults to today |
| Supplier | Lookup | From customer master with vendor flag or separate vendor master |
| Supplier Reference | Text | Supplier's quotation number |
| Contact Person | Lookup | From supplier contacts |
| Delivery Date (Expected) | Date | Required; must be ≥ PO Date |
| Delivery Address | Lookup | Company's receiving location |
| Payment Terms | Lookup | From supplier profile |
| Currency | Lookup | Defaults from supplier |
| Exchange Rate | Decimal | For foreign currency POs |
| Project / Cost Center | Lookup | For cost allocation |
| Requisition Reference | Text | Link to internal purchase requisition |
| Priority | Enum | Normal / Urgent / Critical |

#### 6.3.2 Line Items

| Field | Type | Description |
|-------|------|-------------|
| Product/Service | Lookup | From product master |
| Description | Text | Editable |
| HSN/SAC Code | Text | Auto from product |
| Quantity Ordered | Decimal | Required |
| Quantity Received | Decimal | System-updated on goods receipt; read-only |
| Pending Quantity | Decimal | Ordered − Received; calculated |
| Unit | Lookup | UOM |
| Unit Price | Currency | Negotiated price |
| Discount % | Decimal | |
| Taxable Amount | Currency | Calculated |
| GST Rate | Decimal | |
| GST Amount | Currency | Calculated |
| Total | Currency | Calculated |
| Delivery Date (line-level) | Date | Optional; overrides header delivery date |
| Item Status | Enum | Pending / Partially Received / Received / Cancelled |

#### 6.3.3 Totals Section

Same structure as Quotation: Sub Total, Discount, GST breakdowns (CGST/SGST/IGST), Grand Total, Amount in Words.

#### 6.3.4 Footer Information

| Field | Type | Description |
|-------|------|-------------|
| Payment Terms | Lookup | |
| Shipping Terms | Text | Incoterms |
| Special Instructions | Text | Printed on PO PDF |
| Internal Notes | Rich Text | Not on PDF |
| Authorized By | User Lookup | Approver name |
| Approval Date | Date/Time | Auto on approval |

### 6.4 Actions

| Action | Description | Available In Status |
|--------|-------------|---------------------|
| Save Draft | Save without approval | Draft |
| Submit for Approval | Route to approver | Draft |
| Approve | Approve and activate | Pending Approval |
| Reject (Approval) | Reject with reason | Pending Approval |
| Email PO | Send PDF to supplier | Approved, Sent |
| Download PDF | Download PO document | Any |
| Print | Print dialog | Any |
| Duplicate | Clone as new Draft | Any except Cancelled |
| Receive Goods | Record partial/full receipt | Sent, Partially Received |
| Close PO | Close manually even if items pending | Approved, Sent, Partially Received |
| Cancel | Cancel with reason | Draft, Approved, Sent |
| Link to Invoice | Link to supplier invoice | Completed, Closed |

### 6.5 Workflow & Status Flow

```
[Create] → DRAFT
              │
              ↓ [Submit]
        PENDING APPROVAL
              │
        ┌─────┴──────┐
        ↓            ↓
    APPROVED       REJECTED → back to DRAFT
        │
        ↓ [Email / Mark Sent]
       SENT
        │
        ↓ [Partial Goods Receipt]
  PARTIALLY RECEIVED
        │
        ↓ [All items received]
    COMPLETED
        │
        ↓ [Manual close or linked invoice settled]
      CLOSED
```

**Cancellation** is available at Draft, Approved, and Sent stages. Cancellation requires a reason and is irreversible.

### 6.6 Approval Workflow

- Approval matrix is configurable in Settings:
  - PO value < ₹10,000: Auto-approved
  - PO value ₹10,000 – ₹1,00,000: Manager approval required
  - PO value > ₹1,00,000: Admin / Finance Head approval required
- Thresholds and roles are configurable
- Approver receives an in-app notification and email with a direct approve/reject link
- Re-submission after rejection resets the approval chain

### 6.7 Goods Receipt

When receiving goods against a PO:
- Select the PO
- System shows all line items with ordered and pending quantities
- Enter received quantity per item (cannot exceed pending)
- Enter receipt date, vehicle number, challan number from supplier
- Attach delivery note / supplier DC
- System updates item-level "Received Qty" and recalculates "Pending Qty"
- PO status auto-transitions: Sent → Partially Received → Completed (when all received)
- Each goods receipt is a separate GRN (Goods Receipt Note) record linked to the PO

### 6.8 Required Fields

To save Draft:
- Supplier
- PO Date
- At least one line item with Product, Quantity, Unit Price

Additional to submit for approval:
- Expected Delivery Date
- Delivery Address

### 6.9 Validation Rules

| Field | Rule |
|-------|------|
| PO Date | Cannot be back-dated more than 30 days (configurable) |
| Expected Delivery Date | Must be ≥ PO Date |
| Quantity | Must be > 0 |
| Unit Price | Must be ≥ 0 |
| Received Qty | Cannot exceed Ordered Qty |
| Supplier Status | Supplier must be Active |
| Duplicate PO | Warn if same supplier + same products within 7 days |

### 6.10 Business Logic

1. **Auto-Approval Bypass:** POs below the minimum approval threshold are auto-approved on submission.
2. **Three-Way Matching:** When posting supplier invoice, system cross-checks: supplier invoice line items vs PO line items vs GRN quantities and prices. Variance > 2% triggers a hold and Finance review notification.
3. **Partial Closure:** Purchasing manager can manually close a PO even if quantities are not fully received (e.g., supplier cannot supply remainder). Close reason is mandatory.
4. **PO Amendment:** If a Sent PO needs amendment, a PO Amendment document is created (not a new PO). The amendment goes through the same approval workflow. The original PO and amendment are linked.
5. **Currency Gain/Loss:** For foreign currency POs, if actual payment exchange rate differs from PO rate, a gain/loss entry is automatically suggested in accounts.
6. **Supplier Price History:** On line item entry, show a tooltip with last 3 purchase prices for this product from this supplier.

### 6.11 Dashboard Widgets

| Widget | Type | Description |
|--------|------|-------------|
| Open PO Value | KPI | Total value of Approved + Sent POs |
| POs Pending Approval | KPI + Table | Count and list |
| Overdue Deliveries | Table | POs past expected delivery date |
| Supplier-wise PO Summary | Bar chart | Value per top 10 suppliers |
| Monthly Purchase Trend | Line chart | PO value per month |
| PO Completion Rate | KPI % | Completed / Total closed POs |
| Recently Created POs | Table | Last 10 |
| Goods Receipt Due This Week | Table | POs with delivery dates in next 7 days |

### 6.12 Reports

| Report | Description |
|--------|-------------|
| Purchase Order Register | All POs with status, supplier, value |
| Pending Purchase Orders | Approved/Sent POs not yet completed |
| Supplier-wise PO Summary | Aggregated by supplier |
| Monthly Purchase Summary | Monthly totals |
| Goods Receipt Report | GRNs with matched PO details |
| PO vs Invoice Reconciliation | Three-way matching report |
| Overdue PO Report | POs past expected delivery |

### 6.13 Notifications

| Event | Recipients | Channel |
|-------|-----------|---------|
| PO submitted for approval | Approver | In-app + Email |
| PO approved | Requestor | In-app + Email |
| PO rejected | Requestor | In-app + Email |
| PO sent to supplier | Requestor, Manager | In-app |
| Delivery overdue (day 0, +3) | Requestor, Manager | In-app + Email |
| Goods receipt recorded | Requestor, Finance | In-app |
| PO cancelled | Requestor, Finance | In-app + Email |

### 6.14 User Permissions

| Permission | Super Admin | Admin | Manager | Purchase Exec | Accountant | Viewer |
|------------|:-----------:|:-----:|:-------:|:-------------:|:----------:|:------:|
| View POs | ✓ | ✓ | ✓ | Own only | ✓ | ✓ |
| Create | ✓ | ✓ | ✓ | ✓ | — | — |
| Edit (Draft) | ✓ | ✓ | ✓ | Own only | — | — |
| Submit for Approval | ✓ | ✓ | ✓ | ✓ | — | — |
| Approve | ✓ | ✓ | ✓ | — | — | — |
| Reject (Approval) | ✓ | ✓ | ✓ | — | — | — |
| Email PO | ✓ | ✓ | ✓ | ✓ | — | — |
| Record Receipt | ✓ | ✓ | ✓ | ✓ | — | — |
| Close PO | ✓ | ✓ | ✓ | — | — | — |
| Cancel | ✓ | ✓ | — | — | — | — |
| Export | ✓ | ✓ | ✓ | Own only | ✓ | — |

### 6.15 Future Enhancements

- Vendor portal for suppliers to acknowledge and update delivery status
- Automated RFQ (Request for Quotation) module feeding into POs
- Inventory integration: auto-create PO from reorder point alerts
- Budget integration: block PO if budget exceeded
- Contract management: link POs to master supply agreements

---

## 7. Module 4 — Delivery Challan Management

### 7.1 Module Overview

The Delivery Challan (DC) module tracks goods dispatched to customers. It serves as the physical dispatch document and bridges the gap between sales orders and invoices, especially for partial deliveries or when invoicing is done after delivery.

### 7.2 Business Purpose

- Provide a legally valid delivery document for goods in transit
- Track partial fulfillment of orders
- Support post-delivery invoicing workflow
- Maintain dispatch records for logistics tracking

### 7.3 Complete Features

#### 7.3.1 Header Information

| Field | Type | Description |
|-------|------|-------------|
| Challan Number | Auto-generated | Format: `DC-YYYY-MM-NNNNN` |
| Challan Date | Date | Defaults to today |
| Challan Type | Enum | Sale / Job Work / Returnable / Non-Returnable |
| Customer | Lookup | Required |
| Contact Person | Lookup | From customer contacts |
| Billing Address | Lookup | Customer billing address |
| Delivery Address | Lookup | Customer delivery/site address |
| Linked Quotation | Lookup | Optional source quotation |
| Linked Sales Order | Lookup | Optional source SO |
| Linked Invoice | Lookup | Optional pre-linked invoice |

#### 7.3.2 Line Items

| Field | Type | Description |
|-------|------|-------------|
| Product | Lookup | From product master |
| Description | Text | Editable |
| HSN Code | Text | Auto from product |
| Ordered Quantity | Decimal | From linked SO/quotation |
| Dispatched Quantity | Decimal | This challan's dispatch quantity |
| Previously Dispatched | Decimal | Sum from earlier challans; read-only |
| Unit | Lookup | UOM |
| Rate | Currency | For reference only (not billed here) |
| Serial Numbers | Text | For serialized products (comma-separated) |
| Batch Number | Text | For batch-tracked products |
| Remarks | Text | Per-line remarks |

#### 7.3.3 Logistics Details

| Field | Type | Description |
|-------|------|-------------|
| Dispatch Date | Date/Time | Actual dispatch date and time |
| Expected Delivery Date | Date | Estimated arrival |
| Transport Mode | Enum | Road / Rail / Air / Courier / Hand Delivery |
| Transporter Name | Text or Lookup | From transporter master |
| Vehicle Number | Text | Registration number |
| Driver Name | Text | |
| Driver Mobile | Phone | |
| LR Number | Text | Lorry Receipt number |
| LR Date | Date | |
| Freight Charge | Currency | |
| Freight Paid By | Enum | Company / Customer / Transporter |
| E-Way Bill Number | Text | For consignments > ₹50,000 (GST requirement) |
| E-Way Bill Expiry | Date | |
| Number of Packages | Integer | |
| Weight (kg) | Decimal | Total shipment weight |
| Dimensions | Text | L × W × H in cm |
| Seal Number | Text | For sealed containers |
| Remarks | Rich Text | General remarks for this challan |

### 7.4 Actions

| Action | Description | Available In Status |
|--------|-------------|---------------------|
| Save Draft | Save without dispatching | Draft |
| Confirm Dispatch | Mark as dispatched; triggers dispatch notifications | Draft |
| Mark Delivered | Record delivery confirmation | Dispatched |
| Email DC | Send DC PDF to customer | Any |
| WhatsApp Share | Share DC link via WhatsApp | Any |
| Download PDF | Download challan PDF | Any |
| Print | Print dialog | Any |
| Duplicate | Clone to new Draft | Any except Cancelled |
| Convert to Invoice | Create invoice from this DC | Dispatched, Delivered |
| Cancel | Cancel with reason | Draft, Dispatched |
| Add POD | Upload Proof of Delivery document | Dispatched |

### 7.5 Workflow & Status Flow

```
[Create] → DRAFT
              │
              ↓ [Confirm Dispatch]
          DISPATCHED ←──── e-Way bill generated
              │
              ↓ [Delivery confirmed / POD uploaded]
           DELIVERED
              │
              ↓ [Invoice created and closed]
            CLOSED
```

**Cancellation** available at Draft and Dispatched (with reason). Delivered and Closed challans cannot be cancelled — they require a returns/credit note process.

### 7.6 Required Fields

To save Draft:
- Customer
- Challan Date
- At least one line item with Product and Dispatched Quantity

Additional to Confirm Dispatch:
- Dispatch Date
- Delivery Address
- At least one of: Transport Mode, Transporter Name, or Vehicle Number

### 7.7 Validation Rules

| Field | Rule |
|-------|------|
| Challan Date | Cannot be future-dated more than 1 day |
| Dispatched Quantity | Must be > 0; cannot exceed remaining quantity from linked SO |
| E-Way Bill | Required if Grand Total (at challan rate) > ₹50,000 for interstate; warning shown |
| Vehicle Number | Indian registration format validation (optional) |
| Customer Status | Must be Active |
| Linked SO | If linked, products and quantities must be from that SO |

### 7.8 Business Logic

1. **Partial Delivery Tracking:** If a challan is linked to a Sales Order, the system calculates the cumulative dispatched quantity across all challans. It warns if over-dispatching.
2. **Auto Invoice Linking:** If an invoice already exists for the same customer and period, the DC can be linked to that invoice. If not, "Convert to Invoice" creates a new invoice pre-filled with DC line items.
3. **E-Way Bill Warning:** System checks if total value of goods in challan (using product rates) exceeds the e-Way bill threshold and shows a warning if E-Way Bill Number is not filled.
4. **Returnable Challan Tracking:** For Returnable type challans, system creates a return due date (dispatch date + configured return period). An alert is generated if materials are not returned by due date.
5. **POD (Proof of Delivery):** When POD is uploaded and DC is marked Delivered, a notification is sent to the invoicing team to raise the invoice.
6. **Multiple Challans per Invoice:** One invoice can be linked to multiple DCs (consolidated invoicing). The invoice line items are aggregated.
7. **Challan from Multiple Sources:** A single challan can have line items from different quotations/SOs (mix-and-match), with each line linked to its source.

### 7.9 PDF Template

The DC PDF must include:
- Company name, address, GSTIN (for tax invoice context)
- Challan number, date, challan type
- Customer details and delivery address
- Line item table (without prices for non-invoicing challans; with rates for others)
- Logistics details: transporter, vehicle, LR number
- E-Way bill number if applicable
- Terms: "This is not a tax invoice"
- Receiver's signature block (for POD)
- Driver acknowledgment section

### 7.10 Dashboard Widgets

| Widget | Type | Description |
|--------|------|-------------|
| Dispatched Today | KPI | Count of challans dispatched today |
| Pending Delivery | KPI + Table | Dispatched but not delivered |
| Overdue Deliveries | Table | Expected delivery date passed |
| Delivery TAT | KPI | Average days from dispatch to delivery |
| Returnable Pending Returns | Table | Returnable challans past due |
| DC by Transport Mode | Donut chart | Breakdown |
| Monthly Dispatch Trend | Line chart | Count per month |
| Customer-wise Delivery Count | Bar chart | Top 10 customers |

### 7.11 Reports

| Report | Description |
|--------|-------------|
| Delivery Register | All DCs with status, customer, date |
| Pending Deliveries | Dispatched but not delivered |
| Delivered Items Report | Delivered DCs with POD status |
| Customer Delivery History | Per-customer delivery record |
| Returnable Challan Register | Returnable DCs with return status |
| Transport-wise Report | Grouped by transporter |
| DC vs Invoice Reconciliation | DCs not yet invoiced |

### 7.12 Notifications

| Event | Recipients | Channel |
|-------|-----------|---------|
| DC dispatched | Customer (email/WhatsApp), Sales Exec | Email + In-app |
| DC delivered (POD uploaded) | Sales Exec, Accounts | In-app |
| Delivery overdue | Sales Exec, Logistics | In-app + Email |
| Return overdue (returnable DC) | Sales Exec, Manager | In-app + Email |
| DC converted to invoice | Sales Exec, Accounts | In-app |

### 7.13 User Permissions

| Permission | Super Admin | Admin | Manager | Sales Exec | Dispatch Exec | Accountant | Viewer |
|------------|:-----------:|:-----:|:-------:|:----------:|:-------------:|:----------:|:------:|
| View DCs | ✓ | ✓ | ✓ | Own only | ✓ | ✓ | ✓ |
| Create | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Edit (Draft) | ✓ | ✓ | ✓ | Own only | Own only | — | — |
| Confirm Dispatch | ✓ | ✓ | ✓ | — | ✓ | — | — |
| Mark Delivered | ✓ | ✓ | ✓ | — | ✓ | — | — |
| Convert to Invoice | ✓ | ✓ | ✓ | ✓ | — | ✓ | — |
| Cancel | ✓ | ✓ | ✓ | — | — | — | — |
| Export | ✓ | ✓ | ✓ | Own only | Own only | ✓ | — |

### 7.14 Future Enhancements

- Real-time shipment tracking integration with courier APIs (FedEx, BlueDart, Delhivery)
- QR code on challan for receiver scan-to-confirm delivery
- E-Way bill API integration with NIC portal
- GPS vehicle tracking link
- Customer delivery confirmation via SMS OTP

---

## 8. Module 5 — Invoice Management

### 8.1 Module Overview

The Invoice module is the revenue-recognition and accounts-receivable backbone of the ERP. It generates GST-compliant tax invoices, tracks payments, and maintains the sales register required for GST filing.

### 8.2 Business Purpose

- Generate legally compliant GST tax invoices
- Track payment collection and outstanding
- Support GST return filing (GSTR-1)
- Provide accounts receivable aging for cash flow management

### 8.3 Complete Features

#### 8.3.1 Header Information

| Field | Type | Description |
|-------|------|-------------|
| Invoice Number | Auto-generated | Format: `INV-YYYY-MM-NNNNN`; must be sequential per GST rules |
| Invoice Date | Date | Required; defaults to today |
| Invoice Type | Enum | Tax Invoice / Proforma Invoice / Credit Note / Debit Note |
| Customer | Lookup | Required |
| Billing Address | Lookup | Required; must have state for GST calculation |
| Shipping Address | Lookup | Optional; if different from billing |
| Place of Supply | Lookup | State; auto-derived from billing address |
| Linked Quotation | Lookup | Source quotation |
| Linked Sales Order | Lookup | Source SO |
| Linked Delivery Challan(s) | Multi-lookup | One or more DCs |
| Customer PO Number | Text | Customer's purchase order reference |
| Customer PO Date | Date | |
| Payment Terms | Lookup | Defaults from customer |
| Due Date | Date | Calculated: Invoice Date + payment terms days |
| Currency | Lookup | Defaults from customer |
| Exchange Rate | Decimal | For foreign currency |
| Salesperson | User Lookup | |
| Project / Cost Center | Lookup | For revenue allocation |

#### 8.3.2 Line Items

| Field | Type | Description |
|-------|------|-------------|
| Product/Service | Lookup | Required |
| Description | Text | Editable |
| HSN/SAC Code | Text | Required for GST compliance |
| Quantity | Decimal | Required |
| Unit | Lookup | UOM |
| Unit Price | Currency | Required |
| Discount % | Decimal | |
| Discount Amount | Currency | Calculated |
| Taxable Amount | Currency | Calculated |
| GST Rate | Decimal | From product |
| CGST % / Amount | Decimal / Currency | For intrastate |
| SGST % / Amount | Decimal / Currency | For intrastate |
| IGST % / Amount | Decimal / Currency | For interstate |
| Cess % / Amount | Decimal / Currency | Where applicable |
| Total | Currency | Calculated |
| TDS % / Amount | Decimal / Currency | Where TDS applicable |

#### 8.3.3 Totals Section

| Field | Calculation |
|-------|-------------|
| Sub Total | Sum of Taxable Amounts |
| Total Discount | Sum of Discounts |
| CGST | Sum CGST (intrastate only) |
| SGST | Sum SGST (intrastate only) |
| IGST | Sum IGST (interstate only) |
| Cess | Sum Cess |
| TDS Deducted | Sum TDS |
| Advance Received | Applied advance from advance receipts |
| Adjustment | Manual adjustment (must have reason) |
| Round Off | Nearest rupee |
| Grand Total | Sub Total + GST − TDS − Advance − Round Off |
| Amount in Words | Auto-generated |

#### 8.3.4 Footer Information

| Field | Type | Description |
|-------|------|-------------|
| Terms & Conditions | Rich Text | Template-selectable |
| Notes to Customer | Rich Text | Visible on PDF |
| Internal Notes | Rich Text | Not on PDF |
| Bank Account | Lookup | Bank details to print on invoice |
| E-Signature | Image | Digital signature |

#### 8.3.5 Payment Recording

When recording a payment against an invoice:

| Field | Type | Description |
|-------|------|-------------|
| Payment Date | Date | Required |
| Amount Received | Currency | Required; ≤ outstanding amount |
| Payment Mode | Enum | Cash / Cheque / NEFT / RTGS / UPI / Card |
| Reference Number | Text | Transaction ID, cheque number, etc. |
| Bank Account | Lookup | Company's bank account credited |
| TDS Deducted | Currency | TDS amount deducted by customer |
| Notes | Text | |

Each payment creates a Payment Receipt record linked to the invoice. One invoice can have multiple partial payments.

### 8.4 Actions

| Action | Description | Available In Status |
|--------|-------------|---------------------|
| Save Draft | Save as proforma / draft | Draft |
| Generate Invoice | Finalize and assign invoice number | Draft |
| Email Invoice | Send PDF to customer | Any except Cancelled |
| WhatsApp Share | WhatsApp share link | Any except Cancelled |
| Download PDF | Download invoice PDF | Any |
| Print | Print dialog | Any |
| Duplicate | Copy to new Draft | Any except Cancelled |
| Record Payment | Log payment received | Issued, Partially Paid, Overdue |
| Send Payment Reminder | Send reminder email/WhatsApp | Issued, Partially Paid, Overdue |
| Create Credit Note | Issue credit note against this invoice | Issued, Partially Paid, Paid |
| Create Debit Note | Issue debit note | Issued |
| Cancel | Cancel with reason (GST reversal note) | Draft only (Issued invoices need Credit Note) |
| Export to Tally | Export in Tally XML format | Any |

### 8.5 Workflow & Status Flow

```
[Create] → DRAFT (Proforma Invoice)
              │
              ↓ [Generate Invoice — assigns invoice number]
           ISSUED
              │
              ↓ [Partial Payment Received]
       PARTIALLY PAID
              │
              ↓ [Full Payment Received]
            PAID ←──────────────────────────────┐
              │                                  │
              │ [Due Date Passed, not fully paid] │
              ↓                                  │
           OVERDUE ──[Payment Received]──────────┘
              │
              ↓ [Credit Note issued for full amount]
          CANCELLED
```

**Key Rules:**
- Once "Generated" (Issued), the invoice number is locked and cannot be changed (GST compliance)
- Issued invoices cannot be deleted; they must be cancelled via Credit Note
- Draft invoices can be deleted before generation

### 8.6 Required Fields

To save Draft:
- Customer
- Invoice Date
- At least one line item with Product, Quantity, Unit Price

Additional to Generate (Finalize):
- Billing Address with State
- HSN/SAC for all line items (GST compliance)
- Due Date

### 8.7 Validation Rules

| Field | Rule |
|-------|------|
| Invoice Date | Cannot be back-dated more than 30 days (configurable; critical for GST GSTR-1 filing) |
| Invoice Date | Cannot be forward-dated more than 1 day |
| HSN Code | Required for all product lines; must be valid 4 or 8-digit code |
| SAC Code | Required for service lines |
| GST Rate | Must match product's registered GST slab; mismatch blocks generation |
| Place of Supply | Required; determines CGST+SGST vs IGST |
| Due Date | Must be ≥ Invoice Date |
| Payment Amount | Must be > 0 and ≤ Outstanding Amount |
| Customer GSTIN | Required on invoice if customer is GST-registered; warning if absent |
| Advance Applied | Cannot exceed outstanding before this invoice |

### 8.8 Business Logic

1. **Sequential Invoice Numbering:** GST requires invoices to be sequential. System ensures no gaps. If a draft is discarded, its pre-allocated number is released and reused for the next generation.
2. **Place of Supply Determination:**
   - Customer billing state = Company state → CGST + SGST
   - Customer billing state ≠ Company state → IGST
   - SEZ customer → 0% IGST
   - Unregistered customer for B2C → follows state rule
3. **Advance Adjustment:** If the customer has advance receipts recorded, the invoice shows "Advance Applied" and deducts from payable amount. System applies FIFO order for advances.
4. **Auto Overdue:** Nightly job marks all Issued and Partially Paid invoices with Due Date < today as Overdue.
5. **Auto Payment Reminder:** System sends payment reminders N days before due date and N days after due date (N configurable per payment terms).
6. **Credit Limit Check:** On invoice generation, check if (existing outstanding + this invoice) exceeds customer credit limit. Block with admin override option.
7. **GST Return Locking:** Once GSTR-1 is filed for a period, invoices in that period are locked from editing. An "Amend Invoice" flow creates a B2BA (amended) record.
8. **TDS on Invoice:** If customer is set as TDS applicable, TDS is deducted from the invoice's net payable. The TDS amount is tracked in the customer ledger as "TDS Receivable."
9. **Foreign Currency Invoice:** Grand total in foreign currency is displayed alongside INR equivalent. INR amount is used for accounting and GST.
10. **E-Invoice Generation:** For businesses above the e-invoice threshold (₹5 crore turnover), system integrates with IRP (Invoice Registration Portal) to generate IRN and QR code. (Integration placeholder in v1; full integration in v2.)

### 8.9 Credit Note

A credit note:
- References the original invoice number
- Can be for full or partial amount
- Reduces the customer's outstanding
- Is included in GSTR-1 as a credit note entry
- Has its own sequential credit note number (`CN-YYYY-MM-NNNNN`)
- Cannot exceed the original invoice value

### 8.10 PDF Template

The invoice PDF must be GST-compliant and include:
- "TAX INVOICE" heading (per GST Act)
- Company: name, address, GSTIN, State, State Code
- Invoice number, date, due date
- Customer: name, billing address, GSTIN, State, State Code
- Place of Supply (State name and code)
- Delivery address (if different)
- Line item table with HSN/SAC, Qty, Rate, Discount, Taxable Value, GST %/Amount, Total
- GST summary table (rate-wise breakup)
- Total in words
- Bank details
- Terms & Conditions
- Authorized signature
- "This is a computer generated invoice" footer
- QR code (for e-invoices once IRN generated)

### 8.11 Dashboard Widgets

| Widget | Type | Description |
|--------|------|-------------|
| Total Outstanding | KPI | Sum of all Issued + Partially Paid + Overdue |
| Total Overdue | KPI (red) | Sum of overdue invoices |
| Invoiced This Month | KPI | Total value invoiced in current month |
| Collected This Month | KPI | Total payments received this month |
| Aging Summary | Bar chart | 0-30 / 31-60 / 61-90 / 90+ days outstanding |
| Invoice Status Breakdown | Donut chart | Count by status |
| Top 10 Overdue Customers | Table | Customer, outstanding, days overdue |
| Monthly Collection vs Invoicing | Line chart | 12 months |
| Payment Mode Breakdown | Donut chart | Cash, NEFT, UPI etc. |
| DSO (Days Sales Outstanding) | KPI | Rolling 90-day average |

### 8.12 Reports

| Report | Description | Key Filters |
|--------|-------------|-------------|
| Sales Register | All invoices with GST details | Date, Customer, Status |
| Invoice Register | Complete invoice listing | Date, Status, Executive |
| GST Report (GSTR-1) | HSN-wise, B2B/B2C breakup | Period |
| GST Summary Report | Rate-wise tax collection | Period |
| Outstanding Report | Aged outstanding per customer | Date, Customer |
| Customer Ledger | All transactions per customer | Customer, Date |
| Monthly Sales Summary | Revenue per month | Year, Customer, Product |
| Payment Report | All payments received | Date, Mode, Customer |
| TDS Report | TDS deducted per customer | Period, Customer |
| Credit Note Register | All credit notes | Date, Customer |
| Proforma Invoice Register | Draft/proforma invoices | Date, Customer |
| Top Customer by Revenue | Top N customers | Period |
| Product-wise Revenue | Revenue per product | Period |

### 8.13 Notifications

| Event | Recipients | Channel |
|-------|-----------|---------|
| Invoice generated | Sales Exec, Accounts | In-app |
| Invoice emailed to customer | Sales Exec | In-app |
| Payment received | Accounts, Sales Exec | In-app + Email |
| Invoice becomes overdue | Accounts, Sales Exec, Manager | In-app + Email |
| Payment reminder (before due) | Accounts | Auto Email to Customer |
| Payment reminder (after due) | Accounts | Auto Email + WhatsApp to Customer |
| Credit note created | Accounts, Manager | In-app |
| Credit limit breached | Admin, Finance | In-app + Email |

### 8.14 User Permissions

| Permission | Super Admin | Admin | Manager | Sales Exec | Accountant | Viewer |
|------------|:-----------:|:-----:|:-------:|:----------:|:----------:|:------:|
| View invoices | ✓ | ✓ | ✓ | Own only | ✓ | ✓ |
| Create Draft | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Generate Invoice | ✓ | ✓ | ✓ | — | ✓ | — |
| Email Invoice | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Record Payment | ✓ | ✓ | ✓ | — | ✓ | — |
| Create Credit Note | ✓ | ✓ | ✓ | — | ✓ | — |
| Cancel (Draft) | ✓ | ✓ | ✓ | Own only | ✓ | — |
| Edit (Issued) | ✓ | ✓ | — | — | — | — |
| Export | ✓ | ✓ | ✓ | Own only | ✓ | — |
| View GST Reports | ✓ | ✓ | — | — | ✓ | — |
| Export Tally XML | ✓ | ✓ | — | — | ✓ | — |

### 8.15 Future Enhancements

- E-Invoice (IRN) generation via IRP API integration
- E-Way bill auto-generation on invoice > threshold
- Payment gateway integration (Razorpay, PayU) with payment link generation
- Auto-reconciliation with bank statement (bank feed integration)
- Recurring invoice scheduler (subscription billing)
- Customer payment portal

---

## 9. Cross-Module Integration

### 9.1 Document Linkage Map

```
Customer
  └── Quotation ──────────────────┐
        └── Sales Order           │
              └── Delivery Challan─┤
                    └── Invoice ──┘
                          └── Payment Receipt

Vendor/Supplier
  └── Purchase Order
        └── Goods Receipt Note
              └── Supplier Invoice
```

### 9.2 Data Flow Between Modules

| Source Module | Target Module | Data Transferred |
|---------------|---------------|------------------|
| Customer | All modules | Customer details, addresses, payment terms, GSTIN |
| Quotation | Invoice | All line items, customer, amounts |
| Quotation | Delivery Challan | Line items, customer, quantities |
| Delivery Challan | Invoice | Dispatched quantities, customer |
| Invoice | Customer Ledger | Invoice amount, due date, payment records |
| Purchase Order | Goods Receipt | Ordered quantities per item |
| Goods Receipt | Inventory | Received quantities |

### 9.3 Status Propagation Rules

- When all DCs linked to a Sales Order are Delivered → SO auto-moves to "Fully Delivered"
- When an Invoice linked to a DC is Paid → DC moves to "Closed"
- When a Quotation is Converted → Quotation moves to "Converted" and is locked
- When a PO is Cancelled → Any draft GRNs against it are auto-cancelled with a warning

### 9.4 Shared Master Data

The following master tables are shared across all modules:
- Customer Master (with vendor flag for dual-role entities)
- Product/Service Master
- GST Rate Master (0%, 5%, 12%, 18%, 28%, Exempt)
- HSN/SAC Code Master
- UOM (Unit of Measure) Master
- State Master (with GST state codes)
- Currency Master
- Payment Terms Master
- Price List Master
- User Master
- Tax Slab Master

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Metric | Requirement |
|--------|-------------|
| Page load time | < 2 seconds for list views (up to 1M records) |
| Search results | < 300 ms |
| PDF generation | < 5 seconds per document |
| Bulk export (1,000 rows) | < 30 seconds |
| API response (CRUD) | < 500 ms at 95th percentile |
| Concurrent users | Support 200 concurrent users without degradation |

### 10.2 Security

- All data in transit: TLS 1.2+
- All data at rest: AES-256 encryption
- Authentication: JWT with refresh tokens; session expiry configurable
- 2FA: TOTP-based (Google Authenticator compatible) for Admin and Finance roles
- Rate limiting: 100 requests/minute per user
- Input sanitization: all text inputs sanitized against XSS and SQL injection
- File uploads: virus-scanned; stored in isolated object storage bucket
- GSTIN and PAN: stored encrypted in database
- Audit log access: restricted to Admin and Auditor roles
- API: OAuth 2.0 for external integrations

### 10.3 Availability & Reliability

- Uptime SLA: 99.9% (excluding scheduled maintenance)
- Scheduled maintenance: Sunday 2–4 AM IST
- Data backup: daily automated backup; 30-day retention
- Point-in-time recovery: last 7 days
- Disaster recovery RTO: 4 hours; RPO: 1 hour

### 10.4 Scalability

- Horizontal scaling via containerization (Docker/Kubernetes)
- Database read replicas for reporting queries
- Asynchronous job queue for bulk operations and email sending
- CDN for static assets and PDF delivery

### 10.5 Compliance

- GST Act 2017 (India): sequential invoice numbering, HSN/SAC mandatory, e-invoice readiness
- Companies Act: document retention minimum 8 years
- IT Act: digital signature support
- PDPA/Data Privacy: PII data fields identified; export and deletion on request

### 10.6 Usability

- WCAG 2.1 Level AA compliance (accessibility)
- Onboarding wizard for new users (first-time setup)
- Contextual help tooltips on all fields
- Keyboard shortcuts for power users (documented in Help)
- Dark mode support
- Multi-language UI support (English + Hindi in v1; regional languages in v2)

### 10.7 Browser & Device Support

| Platform | Supported |
|----------|-----------|
| Chrome 90+ | ✓ |
| Firefox 88+ | ✓ |
| Edge 90+ | ✓ |
| Safari 14+ | ✓ |
| iOS Safari 14+ | ✓ |
| Android Chrome 90+ | ✓ |

---

## 11. User Roles & Permissions Matrix

### 11.1 Role Definitions

| Role | Description |
|------|-------------|
| Super Admin | Full system access; can configure organization settings |
| Admin | Full module access; manages users and settings |
| Manager | Approves documents; views all records; limited delete |
| Sales Executive | Creates and manages own sales documents |
| Purchase Executive | Creates and manages own purchase documents |
| Dispatch Executive | Manages delivery challans and logistics |
| Accountant | Full access to financial modules; creates invoices and records payments |
| Auditor | Read-only access to all modules plus audit log |
| Viewer | Read-only access to assigned modules |

### 11.2 Module Access Matrix

| Module | Super Admin | Admin | Manager | Sales Exec | Purchase Exec | Dispatch Exec | Accountant | Auditor | Viewer |
|--------|:-----------:|:-----:|:-------:|:----------:|:-------------:|:-------------:|:----------:|:-------:|:------:|
| Customer Management | Full | Full | Full | Own | — | — | View | View | View |
| Quotation | Full | Full | Full | Own | — | — | View + Convert | View | View |
| Purchase Order | Full | Full | Full | — | Own | — | View + Receive | View | View |
| Delivery Challan | Full | Full | Full | Own | — | Own | View + Convert | View | View |
| Invoice | Full | Full | Full | — | — | — | Full | View | View |
| Audit Log | Full | Full | — | — | — | — | — | View | — |
| Reports | All | All | Sales only | Own | Own | DC only | Finance | All | — |
| Settings | Full | Full | — | — | — | — | — | — | — |

### 11.3 Special Permission Flags

The following actions require explicit permission flags beyond role defaults:

| Action | Default Role Required | Override Role |
|--------|-----------------------|---------------|
| Override credit limit | — (blocked) | Admin |
| Back-date invoice > 30 days | — (blocked) | Admin |
| Edit generated invoice | — (blocked) | Admin |
| Merge customers | Admin | Super Admin |
| Export sensitive fields (PAN/GSTIN) | Admin | Super Admin |
| Cancel approved PO | Admin | Admin |
| Bypass approval workflow | — (blocked) | Super Admin |

---

*End of Software Requirement Specification*

*Document Version: 1.0*
*Prepared for: ERP Enhancement Project*
*Status: Approved for Development*
