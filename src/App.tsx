import type { ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BrandProvider } from './brand/BrandProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { Settings } from './pages/settings/Settings';
import { EmployeeList, EmployeeForm, EmployeeDetail } from './pages/employees';
import { LeaveList, LeaveRequestForm, LeaveBalances } from './pages/leave';
import { PayRunList, PayRunDetail, PayRunForm, PayElements } from './pages/payroll';
import { IRCaseList, IRCaseDetail, IRCaseForm, WarningsList } from './pages/ir';
import { ESSHome, MyPayslips, PayslipDetail, MyProfile, MyLeave, LeaveApplication } from './pages/ess';
import { ReportsHome, EmployeeReports, LeaveReports, IRReports } from './pages/reports';
import './App.css';

// Protected Route Component
function PrivateRoute({ children }: { children: ReactElement }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <BrandProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <PrivateRoute>
                  <EmployeeList />
                </PrivateRoute>
              }
            />
            <Route
              path="/employees/new"
              element={
                <PrivateRoute>
                  <EmployeeForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <PrivateRoute>
                  <EmployeeDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <PrivateRoute>
                  <EmployeeForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/leave"
              element={
                <PrivateRoute>
                  <LeaveList />
                </PrivateRoute>
              }
            />
            <Route
              path="/leave/request"
              element={
                <PrivateRoute>
                  <LeaveRequestForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/leave/request/:id"
              element={
                <PrivateRoute>
                  <LeaveRequestForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/leave/balances"
              element={
                <PrivateRoute>
                  <LeaveBalances />
                </PrivateRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <PrivateRoute>
                  <PayRunList />
                </PrivateRoute>
              }
            />
            <Route
              path="/payroll/runs/new"
              element={
                <PrivateRoute>
                  <PayRunForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/payroll/runs/:id"
              element={
                <PrivateRoute>
                  <PayRunDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/payroll/elements"
              element={
                <PrivateRoute>
                  <PayElements />
                </PrivateRoute>
              }
            />
            <Route
              path="/ir"
              element={
                <PrivateRoute>
                  <IRCaseList />
                </PrivateRoute>
              }
            />
            <Route
              path="/ir/cases/new"
              element={
                <PrivateRoute>
                  <IRCaseForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/ir/cases/:id"
              element={
                <PrivateRoute>
                  <IRCaseDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/ir/cases/:id/edit"
              element={
                <PrivateRoute>
                  <IRCaseForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/ir/warnings"
              element={
                <PrivateRoute>
                  <WarningsList />
                </PrivateRoute>
              }
            />
            {/* ESS Routes */}
            <Route
              path="/ess"
              element={
                <PrivateRoute>
                  <ESSHome />
                </PrivateRoute>
              }
            />
            <Route
              path="/ess/payslips"
              element={
                <PrivateRoute>
                  <MyPayslips />
                </PrivateRoute>
              }
            />
            <Route
              path="/ess/payslips/:id"
              element={
                <PrivateRoute>
                  <PayslipDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/ess/profile"
              element={
                <PrivateRoute>
                  <MyProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/ess/leave"
              element={
                <PrivateRoute>
                  <MyLeave />
                </PrivateRoute>
              }
            />
            <Route
              path="/ess/leave/new"
              element={
                <PrivateRoute>
                  <LeaveApplication />
                </PrivateRoute>
              }
            />
            {/* Reports Routes */}
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <ReportsHome />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports/employee"
              element={
                <PrivateRoute>
                  <EmployeeReports />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports/employee/:reportType"
              element={
                <PrivateRoute>
                  <EmployeeReports />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports/leave"
              element={
                <PrivateRoute>
                  <LeaveReports />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports/leave/:reportType"
              element={
                <PrivateRoute>
                  <LeaveReports />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports/payroll"
              element={
                <PrivateRoute>
                  <ReportsHome />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports/ir"
              element={
                <PrivateRoute>
                  <IRReports />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports/ir/:reportType"
              element={
                <PrivateRoute>
                  <IRReports />
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrandProvider>
    </Router>
  );
}

export default App;
