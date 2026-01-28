# Notification Triggers - Future Implementation

This document outlines placeholder notification triggers for future enhancement.

## Payroll Cutoff Reminder

**Location:** `src/services/payrollService.ts`

**Implementation:**

Implement a scheduled function (cron job) that triggers 3 days before month-end to create payroll cutoff reminder notifications.

**Steps:**
1. Create Firebase Cloud Function with scheduled trigger (e.g., daily at 9 AM)
2. Check if current date is 3 days before end of month
3. Query all companies (or use config for cutoff dates)
4. For each company, query users with roles: HR Admin, Payroll Admin, Payroll Manager, HR Manager
5. Create notification using `NotificationService.createNotification` with:
   - `type: 'payroll_cutoff'`
   - `priority: 'high'`
   - `title: "Payroll Cutoff Reminder"`
   - `description: "Submit all payroll changes by [cutoff date]"`

**Example code location:** `functions/src/scheduledNotifications.ts`
**Cron expression:** `'0 9 * * *'` (daily at 9 AM)

**Alternative approach:** Add a method in PayrollService to manually trigger cutoff reminders when a payroll period is created or nearing cutoff.

---

## Performance Evaluation Reminder

**Location:** `src/services/performanceService.ts` (not yet implemented)

See `src/services/performanceService.ts` for detailed TODO comments.

---

## Training Opportunity

**Location:** `src/services/trainingService.ts` (not yet implemented)

See `src/services/trainingService.ts` for detailed TODO comments.

---

## Attendance Alert

**Location:** `src/services/attendanceService.ts` (not yet implemented)

See `src/services/attendanceService.ts` for detailed TODO comments.
