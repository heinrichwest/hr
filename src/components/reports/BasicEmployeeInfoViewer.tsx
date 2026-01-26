// ============================================================
// BASIC EMPLOYEE INFORMATION VIEWER COMPONENT
// Task Group 6: Display basic employee demographics and employment details
// ============================================================

import { useState } from 'react';
import type { BasicEmployeeInfoReport } from '../../types/adminReports';
import { Button } from '../Button/Button';
import './BasicEmployeeInfoViewer.css';

interface BasicEmployeeInfoViewerProps {
    report: BasicEmployeeInfoReport;
    onExportExcel?: () => void;
    onExportCSV?: () => void;
}

export function BasicEmployeeInfoViewer({ report, onExportExcel, onExportCSV }: BasicEmployeeInfoViewerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortColumn, setSortColumn] = useState<string>('employeeNumber');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Format date
    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-ZA');
    };

    // Calculate age from date of birth
    const calculateAge = (dob: Date): number => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Filter and search employees
    const filteredEmployees = report.employees.filter(emp => {
        const matchesSearch = searchTerm === '' ||
            emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.idNumber.includes(searchTerm);

        const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
        const matchesStatus = filterStatus === 'all' || emp.employmentStatus === filterStatus;

        return matchesSearch && matchesDepartment && matchesStatus;
    });

    // Sort employees
    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        const aValue = a[sortColumn as keyof typeof a];
        const bValue = b[sortColumn as keyof typeof b];

        if (aValue === undefined || bValue === undefined) return 0;

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (aValue instanceof Date && bValue instanceof Date) {
            comparison = aValue.getTime() - bValue.getTime();
        } else {
            comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Handle column sort
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Get unique departments
    const departments = Array.from(new Set(report.employees.map(e => e.department))).sort();
    const statuses = Array.from(new Set(report.employees.map(e => e.employmentStatus))).sort();

    return (
        <div className="basic-employee-info-viewer">
            {/* Report Header */}
            <div className="report-header">
                <div className="report-header-content">
                    <h2 className="report-title">Basic Employee Information</h2>
                    <div className="report-meta">
                        <div className="meta-item">
                            <span className="meta-label">Company:</span>
                            <span className="meta-value">{report.metadata.companyName}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Generated:</span>
                            <span className="meta-value">
                                {new Date(report.metadata.generatedAt).toLocaleDateString('en-ZA')}
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Total Employees:</span>
                            <span className="meta-value">{report.summary.totalEmployees}</span>
                        </div>
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="report-actions">
                    <Button
                        variant="primary"
                        onClick={onExportExcel}
                        disabled={!onExportExcel}
                        aria-label="Export to Excel"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Export to Excel
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onExportCSV}
                        disabled={!onExportCSV}
                        aria-label="Export to CSV"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Export to CSV
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="report-filters">
                <div className="filter-row">
                    <div className="search-field">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name, employee number, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Statuses</option>
                        {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-summary">
                    Showing {sortedEmployees.length} of {report.employees.length} employees
                </div>
            </div>

            {/* Employee Table */}
            <div className="report-content">
                <div className="table-container">
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('employeeNumber')} className="sortable">
                                    Employee No. {sortColumn === 'employeeNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('fullName')} className="sortable">
                                    Full Name {sortColumn === 'fullName' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('idNumber')} className="sortable">
                                    ID Number {sortColumn === 'idNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Contact</th>
                                <th onClick={() => handleSort('dateOfBirth')} className="sortable">
                                    Date of Birth {sortColumn === 'dateOfBirth' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('department')} className="sortable">
                                    Department {sortColumn === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('jobTitle')} className="sortable">
                                    Job Title {sortColumn === 'jobTitle' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Manager</th>
                                <th onClick={() => handleSort('employmentStatus')} className="sortable">
                                    Status {sortColumn === 'employmentStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('contractType')} className="sortable">
                                    Contract Type {sortColumn === 'contractType' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('startDate')} className="sortable">
                                    Start Date {sortColumn === 'startDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEmployees.map(employee => (
                                <tr key={employee.employeeId}>
                                    <td className="emp-number">{employee.employeeNumber}</td>
                                    <td className="emp-name">{employee.fullName}</td>
                                    <td className="emp-id">{employee.idNumber}</td>
                                    <td className="emp-contact">
                                        <div>{employee.email}</div>
                                        <div className="contact-secondary">{employee.phone}</div>
                                    </td>
                                    <td className="emp-dob">
                                        {formatDate(employee.dateOfBirth)}
                                        <span className="age-badge">{calculateAge(employee.dateOfBirth)}y</span>
                                    </td>
                                    <td className="emp-department">{employee.department}</td>
                                    <td className="emp-job-title">{employee.jobTitle}</td>
                                    <td className="emp-manager">{employee.managerName || '-'}</td>
                                    <td className="emp-status">
                                        <span className={`status-badge status-${employee.employmentStatus.toLowerCase()}`}>
                                            {employee.employmentStatus}
                                        </span>
                                    </td>
                                    <td className="emp-contract">{employee.contractType}</td>
                                    <td className="emp-start-date">
                                        {formatDate(employee.startDate)}
                                        <span className="years-badge">{employee.yearsOfService}y</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Export Buttons - Bottom */}
            <div className="report-footer-actions">
                <Button
                    variant="primary"
                    onClick={onExportExcel}
                    disabled={!onExportExcel}
                >
                    Export to Excel
                </Button>
                <Button
                    variant="secondary"
                    onClick={onExportCSV}
                    disabled={!onExportCSV}
                >
                    Export to CSV
                </Button>
            </div>
        </div>
    );
}
