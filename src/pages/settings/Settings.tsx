import { useState } from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { CompanyProfile } from './CompanyProfile';
import { OrganizationStructure } from './OrganizationStructure';
import { PayElements } from './PayElements';
import { PublicHolidays } from './PublicHolidays';
import { WorkSchedules } from './WorkSchedules';
import './Settings.css';

type SettingsTab = 'company' | 'organization' | 'pay-elements' | 'holidays' | 'schedules';

interface TabConfig {
    id: SettingsTab;
    label: string;
    icon: React.ComponentType;
    description: string;
}

const tabs: TabConfig[] = [
    {
        id: 'company',
        label: 'Company Profile',
        icon: CompanyIcon,
        description: 'Legal details, tax references, addresses'
    },
    {
        id: 'organization',
        label: 'Organization',
        icon: OrgIcon,
        description: 'Branches, departments, job titles, grades'
    },
    {
        id: 'pay-elements',
        label: 'Pay Elements',
        icon: PayElementsIcon,
        description: 'Earnings, deductions, contributions'
    },
    {
        id: 'holidays',
        label: 'Public Holidays',
        icon: HolidaysIcon,
        description: 'SA public holidays and company days'
    },
    {
        id: 'schedules',
        label: 'Work Schedules',
        icon: SchedulesIcon,
        description: 'Work hours, overtime rates'
    }
];

export function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('company');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'company':
                return <CompanyProfile />;
            case 'organization':
                return <OrganizationStructure />;
            case 'pay-elements':
                return <PayElements />;
            case 'holidays':
                return <PublicHolidays />;
            case 'schedules':
                return <WorkSchedules />;
            default:
                return null;
        }
    };

    return (
        <MainLayout>
            <div className="settings-page">
                {/* Page Header */}
                <div className="settings-header animate-slide-down">
                    <div className="settings-header-content">
                        <h1 className="settings-title">Settings</h1>
                        <p className="settings-subtitle">
                            Configure your company profile, organization structure, and system settings
                        </p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="settings-tabs animate-slide-down">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon />
                            <div className="settings-tab-content">
                                <span className="settings-tab-label">{tab.label}</span>
                                <span className="settings-tab-desc">{tab.description}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="settings-content animate-scale-in">
                    {renderTabContent()}
                </div>
            </div>
        </MainLayout>
    );
}

// Tab Icons
function CompanyIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}

function OrgIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function PayElementsIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

function HolidaysIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function SchedulesIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
