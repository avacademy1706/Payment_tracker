# Build a Production-Ready Full-Stack Payment Tracker Web App

Act as a **senior full-stack engineer, product architect, UI/UX designer, database designer, and QA engineer**.

I want you to build a complete, production-quality **Payment Tracker Web Application**.

The application is based on my existing Excel payment-record structure. Do not make this a simple Excel viewer. Build it as a proper database-driven web application that improves the workflow of maintaining, tracking, and collecting client payments.

---

## 1. EXISTING EXCEL DATA STRUCTURE

The existing Excel sheet contains these columns:

1. Client ID
2. Client Name
3. Company/Institute
4. Contact Number
5. Email
6. Service/Course
7. Monthly Fee (₹)
8. Billing Month
9. Invoice No.
10. Payment Due Date
11. Payment Date
12. Payment Status
13. Payment Mode
14. Amount Paid (₹)
15. Balance (₹)
16. Remarks

Use this structure as the foundation of the application.

Important:

- Do not blindly copy the Excel UI.
- Convert the spreadsheet concept into a proper relational database.
- Preserve all important information.
- Calculated values such as Balance should preferably be calculated by the application/database instead of manually entered.
- The architecture must support multiple months of payment history for the same client.
- A client should not need to be recreated every month.

---

# 2. PRIMARY OBJECTIVE

The application should allow me to easily:

- Add clients
- Edit clients
- View clients
- Track monthly fees
- Create monthly payment records
- Record payments
- Track pending payments
- Track overdue payments
- Track partially paid invoices
- Track completed payments
- See client payment history
- Search clients
- Filter payments
- View monthly revenue
- View outstanding balance
- View upcoming dues
- View overdue payments
- Generate invoices/payment records
- Import existing Excel data
- Export payment data
- Maintain a clean audit-friendly payment history

The application should feel like a professional SaaS dashboard rather than a spreadsheet.

---

# 3. RECOMMENDED TECH STACK

Use a modern, maintainable stack.

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- React Router
- TanStack Query
- React Hook Form
- Zod
- Recharts for dashboard charts

Backend:

- Node.js
- TypeScript
- Express.js OR a clean equivalent Node backend architecture

Database:

- MongoDB
- Mongoose

Authentication:

- Secure email/password authentication
- Password hashing
- JWT/session-based authentication
- Protected routes

Use environment variables for secrets and database credentials.

---

# 4. APPLICATION STRUCTURE

Create the following major sections:

## Dashboard

The dashboard should immediately answer:

- How much money was collected this month?
- How much is pending?
- How much is overdue?
- How much is partially paid?
- How many active clients are there?
- How many payments are due soon?
- How much outstanding balance exists?

Dashboard cards:

- Total Clients
- Expected Revenue
- Collected This Month
- Pending Amount
- Overdue Amount
- Outstanding Balance

Add charts:

### Monthly Revenue

Show collected revenue month-by-month.

### Payment Status

Show:

- Paid
- Partial
- Pending
- Overdue

### Outstanding Payments

Show clients with the highest outstanding balances.

---

# 5. CLIENT MANAGEMENT

Create a dedicated Clients page.

Table columns:

- Client ID
- Client Name
- Company/Institute
- Contact
- Email
- Service/Course
- Monthly Fee
- Current Status
- Outstanding
- Last Payment
- Actions

Actions:

- View
- Edit
- Add Payment
- Payment History
- Create Invoice
- Delete/Archive

Add:

### Add Client

Fields:

- Client Name
- Company/Institute
- Contact Number
- Email
- Service/Course
- Monthly Fee
- Billing Day / Default Due Day
- Notes

Automatically generate a unique Client ID.

Example:

CL-0001
CL-0002
CL-0003

Do not rely on client-entered IDs.

---

# 6. CLIENT PROFILE

When opening a client, show a detailed profile.

Header:

Client Name
Company/Institute
Client ID
Contact
Email
Service/Course

Summary cards:

- Monthly Fee
- Total Paid
- Total Outstanding
- Last Payment
- Current Month Status

Then show:

## Payment History

Columns:

- Billing Month
- Invoice No.
- Monthly Fee
- Due Date
- Payment Date
- Amount Paid
- Balance
- Status
- Payment Mode
- Remarks
- Actions

Allow filtering by:

- Year
- Month
- Status

Add a visual timeline/history if appropriate.

---

# 7. PAYMENT MANAGEMENT

Create a dedicated Payments page.

Main table:

- Invoice No.
- Client
- Company
- Billing Month
- Fee
- Due Date
- Payment Date
- Amount Paid
- Balance
- Status
- Payment Mode
- Actions

Status should be automatically determined where possible.

Statuses:

### Paid

Amount Paid >= Amount Due

### Partial

Amount Paid > 0 AND Amount Paid < Amount Due

### Pending

Amount Paid = 0 AND due date has not passed

### Overdue

Amount Paid = 0 or remaining balance > 0 AND due date has passed

The system must handle edge cases correctly.

Do not allow contradictory states.

For example:

If the invoice is ₹20,000 and ₹10,000 has been paid:

Amount Due = ₹20,000
Amount Paid = ₹10,000
Balance = ₹10,000
Status = Partial

If the remaining ₹10,000 is paid later:

Amount Paid = ₹20,000
Balance = ₹0
Status = Paid

---

# 8. PAYMENT RECORDING

Create a clean "Record Payment" modal/page.

Fields:

- Client
- Invoice
- Billing Month
- Amount
- Payment Date
- Payment Mode
- Transaction/Reference ID
- Remarks

Payment modes:

- Cash
- Bank Transfer
- UPI
- Card
- Cheque
- Other

Validate:

- Amount cannot be negative.
- Payment cannot exceed remaining balance unless overpayment is explicitly supported.
- Date must be valid.
- Required fields must be enforced.

---

# 9. SUPPORT PARTIAL PAYMENTS

This is extremely important.

Do NOT design the database assuming one payment can only happen once.

A client may pay:

₹50,000 invoice

First payment:
₹20,000

Second payment:
₹15,000

Third payment:
₹15,000

The system should preserve all payment transactions.

Recommended database relationship:

Client
→ Invoices/Monthly Charges
→ Payment Transactions

The invoice should calculate:

Total Due
- Total Payments
= Remaining Balance

This gives a proper payment history.

---

# 10. MONTHLY BILLING

The system should support recurring monthly charges.

Example:

Client:
ABC Pvt Ltd

Monthly Fee:
₹50,000

September 2026:
₹50,000

October 2026:
₹50,000

November 2026:
₹50,000

Each month should have its own billing/payment record.

Do not duplicate the client.

Create a new monthly invoice/charge instead.

---

# 11. INVOICE NUMBER

Automatically generate invoice numbers.

Example:

INV-2026-0001
INV-2026-0002
INV-2026-0003

Invoice numbers must be unique.

Do not allow duplicate invoice numbers.

---

# 12. DUE DATE LOGIC

Each monthly invoice should have:

- Billing Month
- Invoice Date
- Due Date

The client can have a default billing/due day.

Example:

Billing Day: 5

September invoice:
Due September 5

October invoice:
Due October 5

Allow the due date to be manually overridden for individual invoices.

---

# 13. SEARCH AND FILTERING

Implement fast global search.

Search by:

- Client Name
- Client ID
- Company
- Phone
- Email
- Invoice Number

Payment filters:

- All
- Paid
- Partial
- Pending
- Overdue

Date filters:

- Today
- This Week
- This Month
- Last Month
- Custom Range

Also allow:

- Sort by newest
- Sort by oldest
- Highest balance
- Lowest balance
- Due date

Use server-side pagination for large datasets.

---

# 14. OVERDUE MANAGEMENT

Create a dedicated "Overdue" view.

Show:

- Client
- Invoice
- Due Date
- Days Overdue
- Total Due
- Paid
- Outstanding
- Contact
- Actions

Calculate:

Days Overdue = Current Date - Due Date

If payment is partially completed, calculate overdue based on the remaining balance.

Highlight overdue records clearly but professionally.

---

# 15. UPCOMING PAYMENTS

Create an "Upcoming Dues" section.

Show payments due within:

- 7 days
- 15 days
- 30 days

Include:

- Client
- Invoice
- Due Date
- Amount
- Outstanding
- Days remaining

---

# 16. DASHBOARD FINANCIAL CALCULATIONS

Implement reliable financial calculations.

### Expected Revenue

Sum of all charges for the selected period.

### Collected Revenue

Sum of actual payments received.

### Outstanding

Expected Revenue - Collected Revenue

But calculate this based on valid invoice/payment relationships rather than blindly summing spreadsheet columns.

### Overdue

Outstanding invoices whose due date has passed.

### Collection Rate

Collected / Expected × 100

Prevent division-by-zero errors.

Allow dashboard filtering by:

- Current Month
- Previous Month
- Current Year
- Custom Date Range

---

# 17. EXCEL IMPORT

Create an Excel import feature.

I already have historical payment data in Excel using these columns:

Client ID
Client Name
Company/Institute
Contact Number
Email
Service/Course
Monthly Fee (₹)
Billing Month
Invoice No.
Payment Due Date
Payment Date
Payment Status
Payment Mode
Amount Paid (₹)
Balance (₹)
Remarks

Allow the administrator to upload the Excel file.

Process it safely.

Requirements:

- Validate columns
- Validate dates
- Validate currency values
- Detect duplicate invoices
- Detect duplicate clients
- Show import preview
- Show validation errors before importing
- Allow the user to confirm import
- Provide an import summary

Example:

Imported:
145 records

Skipped:
3 records

Errors:
2 records

Do not partially corrupt the database if the import fails.

Use transactions where possible.

---

# 18. EXCEL EXPORT

Allow exporting:

- All Clients
- All Payments
- Current Month
- Overdue Payments
- Outstanding Payments
- Custom Date Range

Export should produce a clean Excel-compatible file.

---

# 19. INVOICE / RECEIPT

Create printable invoice/receipt functionality.

Invoice should include:

- Business name
- Business logo placeholder
- Invoice number
- Invoice date
- Due date
- Client name
- Company
- Service/Course
- Amount due
- Amount paid
- Balance
- Payment status
- Payment mode
- Notes

Create a professional printable layout.

Support:

- Print
- Save as PDF through browser print workflow

Do not make the invoice visually cluttered.

---

# 20. NOTIFICATIONS / REMINDERS

Prepare the architecture for payment reminders.

The application should identify:

- Due today
- Due soon
- Overdue

Create reminder actions such as:

- WhatsApp
- Email

Initially these can open pre-filled messages rather than requiring a complex messaging API.

Example WhatsApp message:

"Hello [Client Name], this is a reminder that payment of ₹[Amount] for [Invoice] is due on [Due Date]. Please let us know once the payment has been completed. Thank you."

Use proper URL encoding.

---

# 21. DATABASE DESIGN

Use a normalized database structure.

Recommended models:

## User

- _id
- name
- email
- passwordHash
- role
- createdAt
- updatedAt

## Client

- _id
- clientId
- name
- company
- phone
- email
- service
- monthlyFee
- defaultDueDay
- notes
- isActive
- createdAt
- updatedAt

## Invoice / MonthlyCharge

- _id
- invoiceNumber
- clientId
- billingMonth
- invoiceDate
- dueDate
- amountDue
- status
- notes
- createdAt
- updatedAt

## Payment

- _id
- invoiceId
- clientId
- amount
- paymentDate
- paymentMode
- transactionReference
- remarks
- createdAt
- updatedAt

Do not store redundant calculated balances unless there is a strong reason.

Balance should be derived from:

amountDue - sum(payments)

Use database indexes for:

- clientId
- invoiceNumber
- billingMonth
- dueDate
- status
- paymentDate

---

# 22. UI / UX DESIGN

Make the interface modern, clean, and professional.

Design direction:

- SaaS dashboard
- Minimal
- Professional
- Responsive
- Fast
- Easy to scan
- Desktop-first but mobile responsive

Use:

- Sidebar navigation
- Top header
- Dashboard cards
- Data tables
- Modal forms
- Dropdown filters
- Date pickers
- Toast notifications
- Confirmation dialogs
- Empty states
- Loading states
- Skeleton loaders

Avoid:

- Excessive gradients
- Excessive animations
- Huge cards
- Unnecessary decorative elements
- Cluttered tables

Prioritize usability.

---

# 23. SIDEBAR

Create:

Dashboard

Clients

Payments

Invoices

Overdue

Upcoming Dues

Reports

Import / Export

Settings

---

# 24. RESPONSIVE DESIGN

Desktop:

Sidebar + large data tables.

Tablet:

Collapsible sidebar.

Mobile:

Responsive cards/list views instead of forcing a huge spreadsheet table.

Important actions such as:

- Add Client
- Record Payment
- View Invoice

must remain easy to access.

---

# 25. REPORTS

Create a Reports section.

Reports:

### Monthly Collection Report

Show:

Month
Expected
Collected
Outstanding
Collection Rate

### Client-wise Report

Show:

Client
Total Billed
Total Paid
Outstanding

### Payment Mode Report

Show:

UPI
Bank
Cash
Card
Cheque
Other

and total collected for each.

Allow date filtering.

---

# 26. SETTINGS

Settings should include:

- Business name
- Business email
- Business phone
- Business address
- GST number (optional)
- Logo
- Default currency
- Default payment terms
- Default due day

Keep these settings separate from client data.

---

# 27. SECURITY

Implement:

- Password hashing
- Authentication middleware
- Protected API routes
- Input validation
- Rate limiting where appropriate
- Secure HTTP headers
- CORS configuration
- Environment variables
- No passwords/secrets in source code
- Proper authorization checks

Never trust frontend validation alone.

Validate everything on the backend.

---

# 28. API DESIGN

Create clean REST APIs.

Examples:

POST /api/auth/login

GET /api/dashboard

GET /api/clients

POST /api/clients

GET /api/clients/:id

PUT /api/clients/:id

DELETE /api/clients/:id

GET /api/clients/:id/payments

GET /api/invoices

POST /api/invoices

GET /api/invoices/:id

POST /api/payments

PUT /api/payments/:id

DELETE /api/payments/:id

GET /api/reports/monthly

GET /api/reports/clients

POST /api/import/excel

GET /api/export/payments

Use consistent response structures and proper HTTP status codes.

---

# 29. ERROR HANDLING

Create professional error handling.

Frontend should show understandable messages.

Examples:

"Unable to save payment. Please try again."

"Invoice number already exists."

"Payment amount cannot exceed outstanding balance."

"Invalid Excel format."

"Client email is invalid."

Backend should log technical errors without exposing sensitive information to users.

---

# 30. AUDITABILITY

Important financial records should not silently disappear.

For payments and invoices:

- Track createdAt
- Track updatedAt
- Track who created/modified the record if authentication supports it.

Prefer archive/soft-delete for important financial records instead of destructive deletion.

---

# 31. DATA INTEGRITY

This is a financial tracking application.

Accuracy is more important than visual complexity.

Implement safeguards against:

- Duplicate invoices
- Duplicate client IDs
- Negative payments
- Invalid dates
- Incorrect balances
- Payment exceeding balance
- Duplicate monthly invoices
- Invalid statuses

Use server-side calculations.

Never trust a balance sent from the frontend.

---

# 32. PROJECT STRUCTURE

Create a clean structure similar to:

/client
  /src
    /components
    /pages
    /layouts
    /hooks
    /services
    /types
    /utils
    /lib

/server
  /src
    /controllers
    /routes
    /models
    /services
    /middleware
    /utils
    /validators
    /config

/shared
  /types

Include:

.env.example

README.md

seed script

database configuration

---

# 33. TESTING

Create tests for important business logic.

Especially test:

- Balance calculation
- Payment status
- Partial payments
- Overdue calculation
- Monthly billing
- Duplicate invoice prevention
- Excel import validation
- Dashboard totals

Example:

Invoice = ₹50,000

Payment 1 = ₹20,000

Expected balance = ₹30,000

Payment 2 = ₹10,000

Expected balance = ₹20,000

Payment 3 = ₹20,000

Expected balance = ₹0

Expected status = Paid

---

# 34. SEED DATA

Create realistic demo data.

At least:

10 clients

Several months of invoices

Paid payments

Partial payments

Pending payments

Overdue payments

Different payment modes

This is necessary to properly test the dashboard.

Do not use fake-looking random nonsense.

Use realistic Indian business/client data.

Currency must be displayed as INR.

Example:

₹50,000
₹1,25,000

Use Indian number formatting where appropriate.

---

# 35. IMPORTANT BUSINESS RULE

The system must distinguish between:

CLIENT

INVOICE / MONTHLY CHARGE

PAYMENT TRANSACTION

Do not combine everything into one giant database document.

One client can have many invoices.

One invoice can have multiple payments.

This is essential for correct payment history and partial payment tracking.

---

# 36. DEVELOPMENT PROCESS

Do NOT immediately start generating hundreds of files.

First:

1. Inspect the existing project.
2. Inspect the Excel file structure if available.
3. Decide the architecture.
4. Create the database schema.
5. Create the backend API.
6. Create frontend structure.
7. Implement authentication.
8. Implement client management.
9. Implement invoice/monthly billing.
10. Implement payments.
11. Implement dashboard.
12. Implement reports.
13. Implement Excel import/export.
14. Implement invoice printing.
15. Implement validation.
16. Add tests.
17. Run the application.
18. Fix all errors.
19. Test all major workflows.
20. Polish UI/UX.

Do not stop after creating a basic prototype.

---

# 37. QUALITY STANDARD

The final application must feel like something a real business can use daily.

Before declaring completion, verify:

- npm install works
- development server starts
- frontend loads
- backend loads
- database connects
- authentication works
- client CRUD works
- invoices work
- payments work
- partial payments work
- balance calculations are correct
- overdue logic works
- dashboard numbers are correct
- filters work
- search works
- Excel import works
- Excel export works
- invoice printing works
- responsive UI works
- no major console errors
- no broken routes
- no TypeScript errors
- no obvious UI bugs

---

# 38. IMPORTANT INSTRUCTION FOR CLAUDE CODE

You are responsible for actually implementing the application, not merely explaining how it could be built.

When making decisions, prioritize:

1. Data integrity
2. Correct financial calculations
3. Security
4. Maintainability
5. UX
6. Performance
7. Visual polish

If something is ambiguous, choose the most sensible production-grade implementation rather than stopping unnecessarily.

Keep the code modular and readable.

Avoid over-engineering.

Do not introduce unnecessary dependencies.

Use TypeScript throughout the application.

After implementation, run the relevant build, type-check, lint and test commands and fix the errors you encounter.

At the end, provide:

- Architecture summary
- Database schema summary
- API summary
- Setup instructions
- Environment variables required
- Commands to run the application
- Test credentials for demo login
- List of implemented features
- Any remaining limitations