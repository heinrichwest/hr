# HR Management System - Features Documentation

## Overview

A comprehensive, multi-tenant HR Management System built with React 19, TypeScript, Vite, and Firebase. The system supports complete HR operations including employee management, leave management, payroll, industrial relations, and system administration.

**Live URL:** https://hr-system-9dfae.web.app

---

## Table of Contents

1. [Architecture](#architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Multi-Tenant System](#multi-tenant-system)
4. [Role-Based Access Control](#role-based-access-control)
5. [Core Modules](#core-modules)
6. [System Administration](#system-administration)
7. [Database Seeding](#database-seeding)
8. [Test Credentials](#test-credentials)

---

## Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite 7.x |
| Styling | CSS Modules (custom design system) |
| Backend | Firebase (Firestore + Authentication) |
| Hosting | Firebase Hosting |
| State Management | React Context API |

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # MainLayout, Navigation, Header
│   └── ui/             # Button, Card, Input, Modal, etc.
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Authentication state management
├── pages/              # Page components by module
│   ├── admin/          # System Admin pages
│   ├── auth/           # Login, Registration
│   ├── employees/      # Employee management
│   ├── leave/          # Leave management
│   ├── payroll/        # Payroll processing
│   ├── ir/             # Industrial Relations
│   └── settings/       # Company settings
├── services/           # Firebase service layer
│   ├── companyService.ts
│   ├── employeeService.ts
│   ├── userService.ts
│   ├── leaveService.ts
│   └── seeder.ts
├── types/              # TypeScript type definitions
└── firebase.ts         # Firebase configuration
```

---

## Authentication & Authorization

### Features

- **Email/Password Authentication** via Firebase Auth
- **Session Persistence** - Users stay logged in across browser sessions
- **Protected Routes** - Unauthorized users redirected to login
- **Role-Based Navigation** - Menu items filtered by user role

### Authentication Flow

1. User enters email and password
2. Firebase Auth validates credentials
3. On success, user profile fetched from Firestore
4. AuthContext populated with user data and role
5. User redirected to appropriate dashboard based on role

### AuthContext Properties

```typescript
interface AuthContextType {
  user: User | null;           // Firebase Auth user
  userProfile: UserProfile | null;  // Firestore user profile
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

---

## Multi-Tenant System

### Tenant Isolation

Every data record in Firestore includes a `companyId` field that isolates data between tenants:

- **Companies** - Each tenant has a company record
- **Employees** - Filtered by `companyId`
- **Users** - Linked to a specific `companyId`
- **Departments, Branches, Job Titles** - All scoped to company
- **Leave, Payroll, IR Records** - All tenant-isolated

### Tenant Data Model

```typescript
interface Company {
  id: string;
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  physicalAddress: Address;
  postalAddress?: Address;
  defaultCurrency: string;
  defaultPayFrequency: 'weekly' | 'fortnightly' | 'monthly';
  financialYearEnd: number;
  isActive: boolean;
  createdAt: Date;
}
```

### Firestore Indexes

Custom composite indexes configured for efficient tenant-scoped queries:

- `employees` - companyId + status
- `employees` - companyId + departmentId
- `users` - companyId + role
- `leaveRequests` - companyId + status
- `departments` - companyId + isActive

---

## Role-Based Access Control

### Available Roles (11 Total)

| Role | Access Level | Description |
|------|--------------|-------------|
| **System Admin** | Global | Manages all tenants, system-wide settings |
| **HR Admin** | Tenant | Full HR access within tenant |
| **HR Manager** | Tenant | Day-to-day HR operations |
| **Payroll Admin** | Tenant | Full payroll access |
| **Payroll Manager** | Tenant | Payroll processing |
| **Finance Approver** | Tenant | Financial approvals |
| **Line Manager** | Department | Team management, leave approvals |
| **Employee** | Self | Self-service access only |
| **IR Manager** | Tenant | Industrial relations management |
| **Recruitment Manager** | Tenant | Hiring and recruitment |
| **Training Manager** | Tenant | Learning and development |

### Role-Based Navigation

Navigation menu dynamically adjusts based on user role:

**System Admin sees:**
- Tenants (Tenant Management)
- Settings

**HR Admin/Manager sees:**
- Dashboard
- Employees
- Leave
- Payroll
- Industrial Relations
- Settings

**Employee sees:**
- Dashboard
- My Leave
- My Payslips

---

## Core Modules

### 1. Employee Management

**Location:** `/employees`

#### Features

- **Employee List View**
  - Paginated table with search and filters
  - Filter by department, status, contract type
  - Quick actions (view, edit, deactivate)

- **Employee Profile**
  - Personal information (name, ID, contact)
  - Employment details (department, job title, branch)
  - Contract information (type, start date, salary)
  - Address information

- **Employee Creation**
  - Multi-step form wizard
  - Validation for required fields
  - Auto-generate employee number

- **Employee Editing**
  - Update any employee field
  - Status changes (active/inactive/terminated)

#### Employee Data Model

```typescript
interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  initials: string;
  email: string;
  phone?: string;
  employeeNumber: string;
  idNumber: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  departmentId: string;
  jobTitleId: string;
  branchId: string;
  managerId?: string;
  status: 'active' | 'inactive' | 'terminated';
  contractType: 'permanent' | 'fixed-term' | 'contractor';
  startDate: Date;
  endDate?: Date;
  leaveBalance: number;
  address: Address;
  userId?: string;
  isActive: boolean;
  createdAt: Date;
}
```

---

### 2. Leave Management

**Location:** `/leave`

#### Features

- **Leave Request Submission**
  - Select leave type
  - Date range picker
  - Automatic business days calculation
  - Balance validation

- **Leave Approval Workflow**
  - Manager approval queue
  - Approve/Reject with comments
  - Email notifications (planned)

- **Leave Balance Tracking**
  - Annual leave
  - Sick leave
  - Family responsibility leave
  - Study leave
  - Maternity/Paternity leave

- **Leave Calendar**
  - Team leave visibility
  - Public holiday integration

#### Leave Types (Default)

| Type | Days/Year | Accumulates |
|------|-----------|-------------|
| Annual Leave | 15 | Yes |
| Sick Leave | 30 (3-year cycle) | No |
| Family Responsibility | 3 | No |
| Maternity Leave | 120 | No |
| Paternity Leave | 10 | No |
| Study Leave | 5 | No |

#### Leave Request Data Model

```typescript
interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}
```

---

### 3. Payroll Module

**Location:** `/payroll`

#### Features

- **Payroll Periods**
  - Monthly/Fortnightly/Weekly cycles
  - Period status tracking (open/processing/closed)

- **Pay Run Processing**
  - Batch processing by period
  - Earnings and deductions
  - Tax calculations (PAYE)
  - UIF contributions

- **Payslip Generation**
  - Individual payslips
  - PDF export (planned)
  - Employee self-service access

- **Pay Elements**
  - Basic salary
  - Allowances (travel, housing, phone)
  - Deductions (pension, medical aid, loans)
  - Overtime calculations

---

### 4. Industrial Relations

**Location:** `/ir`

#### Features

- **Case Management**
  - Create and track IR cases
  - Link to employees
  - Case categories (misconduct, grievance, dispute)

- **Warnings**
  - Verbal warnings
  - Written warnings
  - Final written warnings
  - Expiry tracking

- **Disciplinary Hearings**
  - Schedule hearings
  - Record outcomes
  - Appeal tracking

- **Document Management**
  - Attach supporting documents
  - Maintain audit trail

---

### 5. Company Settings

**Location:** `/settings`

#### Organizational Structure

- **Branches**
  - Multiple branch support
  - Head office designation
  - Branch-specific settings

- **Departments**
  - Department hierarchy
  - Link to branches
  - Department codes

- **Job Titles**
  - Title definitions
  - Job codes
  - Grade associations

- **Job Grades**
  - Salary bands
  - Grade progression

- **Cost Centres**
  - Financial tracking
  - Budget allocation

#### Leave Configuration

- **Leave Types**
  - Custom leave type creation
  - Days allocation
  - Accumulation rules
  - Carry-over policies

- **Public Holidays**
  - Country-specific holidays
  - Auto-exclude from leave calculations

#### Payroll Configuration

- **Pay Elements**
  - Define earnings types
  - Define deduction types
  - Tax treatment rules

- **Work Schedules**
  - Standard hours
  - Shift patterns

---

## System Administration

**Location:** `/admin/tenants`

**Access:** System Admin role only

### Tenant Management Features

#### Tenant List View

- View all registered tenants/companies
- Quick stats per tenant (employees, admins)
- Active/Inactive status
- Search and filter

#### Tenant Details Modal

- Company information display
- Employee count
- Admin user count
- List of admin users with roles

#### Admin User Management

- View existing admin users for each tenant
- Add new admin users to a tenant
- Assign admin roles:
  - HR Admin
  - HR Manager
  - Payroll Admin
  - Payroll Manager
  - Finance Approver

#### Create New Tenant

- Company registration form
- Legal name and trading name
- Registration number
- Physical address
- Initial admin user creation

### System Admin Navigation

System Admin users see a restricted navigation menu:
- **Tenants** - Manage all companies
- **Settings** - System-wide configuration

---

## Database Seeding

### Seed Data Feature

**Location:** Tenant Management page → "Seed Data" button

The seeder provides one-click database population for testing and development.

### What Gets Created

For each of 3 tenants (Speccon, Megro, Andebe):

| Entity | Count |
|--------|-------|
| Company | 1 |
| Branches | 1 (Head Office) |
| Departments | 5 (Executive, HR, Finance, Operations, IT) |
| Job Titles | 4 (Manager, Specialist, Assistant, Officer) |
| Employees | 6 |
| Users | 6 (with Firebase Auth) |
| Leave Types | 6 (default types) |

### User Roles Created Per Tenant

| Role | Count | Email Pattern |
|------|-------|---------------|
| HR Admin | 1 | hradmin1.1@{domain} |
| HR Manager | 1 | hrmanager1.1@{domain} |
| Line Manager | 1 | manager1.1@{domain} |
| Employee | 3 | user1.1@{domain}, user2.1@{domain}, user3.1@{domain} |

### Seed Behavior

1. **Clears all existing data** from Firestore collections
2. **Creates fresh data** for all 3 tenants
3. **Creates Firebase Auth users** (or reuses existing)
4. **Links users to employees** and company profiles

### Collections Cleared

- companies
- employees
- users
- departments
- branches
- jobTitles
- jobGrades
- costCentres
- leaveTypes
- leaveRequests
- leaveBalances
- payrollPeriods
- payRuns
- payElements
- irCases
- warnings
- hearings
- publicHolidays
- workSchedules

---

## Test Credentials

### Default Password

All seeded users have the same password: **`Password123!`**

### Login Accounts

#### System Admin
| Email | Password | Notes |
|-------|----------|-------|
| (your admin email) | (your password) | Created manually |

#### Speccon Holdings (S)
| Email | Password | Role |
|-------|----------|------|
| hradmin1.1@speccon.co.za | Password123! | HR Admin |
| hrmanager1.1@speccon.co.za | Password123! | HR Manager |
| manager1.1@speccon.co.za | Password123! | Line Manager |
| user1.1@speccon.co.za | Password123! | Employee |
| user2.1@speccon.co.za | Password123! | Employee |
| user3.1@speccon.co.za | Password123! | Employee |

#### Megro Holdings (M)
| Email | Password | Role |
|-------|----------|------|
| hradmin1.1@megro.co.za | Password123! | HR Admin |
| hrmanager1.1@megro.co.za | Password123! | HR Manager |
| manager1.1@megro.co.za | Password123! | Line Manager |
| user1.1@megro.co.za | Password123! | Employee |

#### Andebe Holdings (A)
| Email | Password | Role |
|-------|----------|------|
| hradmin1.1@andebe.co.za | Password123! | HR Admin |
| hrmanager1.1@andebe.co.za | Password123! | HR Manager |
| manager1.1@andebe.co.za | Password123! | Line Manager |
| user1.1@andebe.co.za | Password123! | Employee |

---

## UI Components

### Design System

Custom CSS-based design system with consistent:
- Color palette (Speccon blue primary)
- Typography scale
- Spacing system
- Border radius
- Shadow depths

### Core Components

| Component | Description |
|-----------|-------------|
| Button | Primary, secondary, outline, danger variants; sm/md/lg sizes |
| Card | Content container with header, body, footer |
| Input | Text, email, password, number, date inputs |
| Select | Dropdown selection with search |
| Modal | Overlay dialog with header, body, actions |
| Table | Sortable, filterable data tables |
| Badge | Status indicators and labels |
| Alert | Success, error, warning, info messages |
| Tabs | Tabbed content navigation |
| Pagination | Page-based data navigation |

### Layout Components

| Component | Description |
|-----------|-------------|
| MainLayout | App shell with sidebar and header |
| Sidebar | Collapsible navigation menu |
| Header | Top bar with user menu and search |
| PageHeader | Page title with breadcrumbs and actions |

---

## Firebase Configuration

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null;
    }

    // Company data isolated by companyId
    match /{collection}/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Required Indexes

Composite indexes for efficient queries:

```
Collection: employees
Fields: companyId (Asc), status (Asc)

Collection: employees
Fields: companyId (Asc), departmentId (Asc)

Collection: users
Fields: companyId (Asc), role (Asc)

Collection: leaveRequests
Fields: companyId (Asc), status (Asc)

Collection: departments
Fields: companyId (Asc), isActive (Asc)
```

---

## Deployment

### Build Command

```bash
npm run build
```

### Deploy to Firebase

```bash
npx firebase deploy --only hosting
```

### Environment Variables

Create `.env` file with:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

---

## Future Enhancements

### Planned Features

- [ ] Email notifications for leave approvals
- [ ] PDF payslip generation and download
- [ ] Employee document storage (contracts, IDs)
- [ ] Org chart visualization
- [ ] Advanced reporting and analytics
- [ ] Mobile responsive optimization
- [ ] Bulk employee import (CSV/Excel)
- [ ] API integrations (accounting software)
- [ ] Audit logging
- [ ] Two-factor authentication

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial release with core HR modules |

---

## Support

For issues and feature requests, contact the development team.

**Project Repository:** (internal)
**Firebase Console:** https://console.firebase.google.com/project/hr-system-9dfae
