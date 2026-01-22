// ============================================================
// CREATE TAKE-ON SHEET PAGE
// Page for creating a new take-on sheet
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { TakeOnSheetForm } from '../components/TakeOnSheet/TakeOnSheetForm';
import { CompanyService } from '../services/companyService';
import { EmployeeService } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import type { JobTitle, Department } from '../types/company';
import type { Employee } from '../types/employee';
import './CreateTakeOnSheetPage.css';

interface EmployeeOption {
    id: string;
    firstName: string;
    lastName: string;
}

export function CreateTakeOnSheetPage() {
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile) {
            loadData();
        }
    }, [userProfile]);

    const loadData = async () => {
        if (!userProfile) return;

        try {
            setLoading(true);
            setError(null);

            // Load job titles, departments, and employees in parallel
            const compId = userProfile.companyId || '';
            const [jt, dept, emp] = await Promise.all([
                CompanyService.getJobTitles(compId),
                CompanyService.getDepartments(compId),
                EmployeeService.getEmployees(compId),
            ]);

            setJobTitles(jt);
            setDepartments(dept);
            setEmployees(emp.map((e: Employee) => ({
                id: e.id,
                firstName: e.firstName,
                lastName: e.lastName,
            })));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/take-on-sheets');
    };

    if (!userProfile || !currentUser) {
        return null;
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="create-tos-page create-tos-page--loading">
                    <div className="create-tos-page__loader">Loading...</div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="create-tos-page">
                <div className="create-tos-page__header">
                    <button className="create-tos-page__back" onClick={handleCancel}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back to List
                    </button>
                    <h1 className="create-tos-page__title">New Take-On Sheet</h1>
                    <p className="create-tos-page__subtitle">
                        Create a new employee take-on sheet to start the onboarding process
                    </p>
                </div>

                {error && (
                    <div className="create-tos-page__error">
                        <span>{error}</span>
                        <button onClick={() => setError(null)}>&times;</button>
                    </div>
                )}

                <TakeOnSheetForm
                    companyId={userProfile.companyId || ''}
                    userId={currentUser.uid}
                    userRole={userProfile.role}
                    jobTitles={jobTitles}
                    departments={departments}
                    employees={employees}
                    onCancel={handleCancel}
                />
            </div>
        </MainLayout>
    );
}
