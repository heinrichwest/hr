// ============================================================
// REPORTS MANAGEMENT INTERFACE
// System Admin dashboard for browsing and running reports
// Updated to match Labournet-style interface with tabs and filters
// ============================================================

import { useState } from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { ReportGenerationModal } from '../../components/reports/ReportGenerationModal';
import './ReportsManagement.css';

type ReportCategory =
    | 'all'
    | 'favourites'
    | 'audit-notification'
    | 'company-organization'
    | 'customisable-templates'
    | 'employee-maintenance'
    | 'employee-relations'
    | 'extracts'
    | 'forms-attachments'
    | 'funds'
    | 'headcount-employment'
    | 'leave'
    | 'loans-savings'
    | 'management-statistics'
    | 'misconducts-grievances'
    | 'myreports'
    | 'payroll'
    | 'performance-management'
    | 'statutory'
    | 'training';

type TabType = 'reports-extracts' | 'queued-reports' | 'auto-run';

interface Report {
    id: string;
    name: string;
    category: ReportCategory[];
    isFavourite: boolean;
    description: string;
}

// Sample reports data
const SAMPLE_REPORTS: Report[] = [
    {
        id: 'ui-19',
        name: 'UI-19 Unemployment Insurance Contributions',
        category: ['statutory', 'payroll'],
        isFavourite: false,
        description: 'Monthly UI-19 return for UIF contributions'
    },
    {
        id: 'basic-employee-info',
        name: 'Basic Employee Information',
        category: ['employee-maintenance', 'headcount-employment'],
        isFavourite: false,
        description: 'Complete employee information report'
    },
    {
        id: 'workforce-profile',
        name: 'Workforce Profile Analysis',
        category: ['management-statistics', 'headcount-employment'],
        isFavourite: false,
        description: 'Workforce demographics and statistics'
    },
    {
        id: 'leave-movement',
        name: 'Leave Movement Report',
        category: ['leave', 'management-statistics'],
        isFavourite: false,
        description: 'Leave taken, accrued, and balances'
    },
    {
        id: 'payroll-summary',
        name: 'Payroll Summary Report',
        category: ['payroll', 'management-statistics'],
        isFavourite: false,
        description: 'Summary of payroll costs and distributions'
    },
    {
        id: 'training-records',
        name: 'Training Records',
        category: ['training', 'management-statistics'],
        isFavourite: false,
        description: 'Employee training history and compliance'
    },
    {
        id: 'ir-cases',
        name: 'Industrial Relations Cases',
        category: ['employee-relations', 'misconducts-grievances'],
        isFavourite: false,
        description: 'Active and resolved IR cases'
    },
];

const CATEGORY_LABELS: Record<ReportCategory, string> = {
    'all': 'All',
    'favourites': 'Favourites',
    'audit-notification': 'Audit & Notification',
    'company-organization': 'Company & Organization',
    'customisable-templates': 'Customisable & Templates',
    'employee-maintenance': 'Employee Maintenance',
    'employee-relations': 'Employee Relations',
    'extracts': 'Extracts',
    'forms-attachments': 'Forms & Attachments',
    'funds': 'Funds',
    'headcount-employment': 'Headcount & Employment',
    'leave': 'Leave',
    'loans-savings': 'Loans, Savings & Garnishees',
    'management-statistics': 'Management & Statistics',
    'misconducts-grievances': 'Misconducts & Grievances',
    'myreports': 'myReports',
    'payroll': 'Payroll',
    'performance-management': 'Performance Management',
    'statutory': 'Statutory',
    'training': 'Training',
};

export function ReportsManagement() {
    const [activeTab, setActiveTab] = useState<TabType>('reports-extracts');
    const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>(['all']);
    const [searchTerm, setSearchTerm] = useState('');
    const [favouriteReports, setFavouriteReports] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    // Handle category filter toggle
    const handleCategoryToggle = (category: ReportCategory) => {
        setSelectedCategories(prev => {
            // If "All" is clicked
            if (category === 'all') {
                return ['all'];
            }

            // Remove "All" if another category is selected
            const filtered = prev.filter(c => c !== 'all');

            // Toggle the selected category
            if (filtered.includes(category)) {
                const updated = filtered.filter(c => c !== category);
                // If no categories selected, default to "All"
                return updated.length === 0 ? ['all'] : updated;
            } else {
                return [...filtered, category];
            }
        });
    };

    // Handle favourite toggle
    const toggleFavourite = (reportId: string) => {
        setFavouriteReports(prev => {
            const updated = new Set(prev);
            if (updated.has(reportId)) {
                updated.delete(reportId);
            } else {
                updated.add(reportId);
            }
            return updated;
        });
    };

    // Handle Generate button click
    const handleGenerateClick = (report: Report) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedReport(null);
    };

    // Handle report generation
    const handleGenerateReport = (tenantIds: string[], employeeIds: string[]) => {
        console.log('Generating report:', selectedReport?.name);
        console.log('Tenants:', tenantIds);
        console.log('Employees:', employeeIds);
        // TODO: Implement actual report generation logic
        // This will be connected to the existing report services
    };

    // Filter reports based on selected categories and search
    const filteredReports = SAMPLE_REPORTS.filter(report => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
            report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Category filter
        if (selectedCategories.includes('all')) {
            return matchesSearch;
        }

        if (selectedCategories.includes('favourites')) {
            return matchesSearch && favouriteReports.has(report.id);
        }

        const matchesCategory = report.category.some(cat =>
            selectedCategories.includes(cat)
        );

        return matchesSearch && matchesCategory;
    });

    // Render category checkboxes in 4-column grid
    const renderCategoryFilters = () => {
        const categories: ReportCategory[] = [
            'all',
            'favourites',
            'audit-notification',
            'company-organization',
            'customisable-templates',
            'employee-maintenance',
            'employee-relations',
            'extracts',
            'forms-attachments',
            'funds',
            'headcount-employment',
            'leave',
            'loans-savings',
            'management-statistics',
            'misconducts-grievances',
            'myreports',
            'payroll',
            'performance-management',
            'statutory',
            'training',
        ];

        return (
            <div className="category-grid">
                {categories.map(category => (
                    <label key={category} className="category-checkbox">
                        <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => handleCategoryToggle(category)}
                        />
                        <span className="category-label">{CATEGORY_LABELS[category]}</span>
                    </label>
                ))}
            </div>
        );
    };

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="page-header animate-slide-down">
                <div className="page-header-content">
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Generate and manage reports for your organization</p>
                </div>
            </div>

            {/* Reports Container */}
            <div className="reports-container animate-slide-up">
                {/* Tabs */}
                <div className="reports-tabs">
                    <button
                        className={`reports-tab ${activeTab === 'reports-extracts' ? 'reports-tab--active' : ''}`}
                        onClick={() => setActiveTab('reports-extracts')}
                    >
                        Reports And Extracts
                    </button>
                    <button
                        className={`reports-tab ${activeTab === 'queued-reports' ? 'reports-tab--active' : ''}`}
                        onClick={() => setActiveTab('queued-reports')}
                    >
                        Queued Reports
                    </button>
                    <button
                        className={`reports-tab ${activeTab === 'auto-run' ? 'reports-tab--active' : ''}`}
                        onClick={() => setActiveTab('auto-run')}
                    >
                        Auto Run MyReports
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'reports-extracts' && (
                    <div className="reports-content">
                        {/* Choose Your Report Section */}
                        <div className="report-selector-section">
                            <h2 className="report-selector-title">Choose your Report</h2>

                            {/* Category Filters */}
                            {renderCategoryFilters()}
                        </div>

                        {/* Reports Table */}
                        <div className="reports-table-section">
                            <div className="reports-table-header">
                                <div className="reports-search">
                                    <input
                                        type="text"
                                        placeholder="Search reports by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="reports-search-input"
                                    />
                                </div>
                                <div className="reports-count">
                                    Showing {filteredReports.length} of {SAMPLE_REPORTS.length} reports
                                </div>
                            </div>

                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th className="col-favourite">Favourite</th>
                                        <th className="col-name">Name</th>
                                        <th className="col-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="empty-state">
                                                No reports found matching your criteria
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredReports.map(report => (
                                            <tr key={report.id}>
                                                <td className="col-favourite">
                                                    <button
                                                        className={`favourite-btn ${favouriteReports.has(report.id) ? 'favourite-btn--active' : ''}`}
                                                        onClick={() => toggleFavourite(report.id)}
                                                        aria-label={favouriteReports.has(report.id) ? 'Remove from favourites' : 'Add to favourites'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill={favouriteReports.has(report.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                        </svg>
                                                    </button>
                                                </td>
                                                <td className="col-name">
                                                    <div className="report-info">
                                                        <span className="report-name">{report.name}</span>
                                                        <span className="report-description">{report.description}</span>
                                                    </div>
                                                </td>
                                                <td className="col-actions">
                                                    <button
                                                        className="btn btn--small btn--primary"
                                                        onClick={() => handleGenerateClick(report)}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                        Generate
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'queued-reports' && (
                    <div className="reports-content">
                        <div className="empty-state-container">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <circle cx="12" cy="18" r="2" />
                                <polyline points="12 12 12 16" />
                            </svg>
                            <h3>No Queued Reports</h3>
                            <p>Reports you generate will appear here while they are being processed.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'auto-run' && (
                    <div className="reports-content">
                        <div className="empty-state-container">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <h3>No Scheduled Reports</h3>
                            <p>Set up automatic report generation to run on a schedule.</p>
                            <button className="btn btn--primary" style={{ marginTop: '16px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Schedule Report
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Report Generation Modal */}
            {selectedReport && (
                <ReportGenerationModal
                    isOpen={isModalOpen}
                    reportName={selectedReport.name}
                    onClose={handleModalClose}
                    onGenerate={handleGenerateReport}
                />
            )}
        </MainLayout>
    );
}
