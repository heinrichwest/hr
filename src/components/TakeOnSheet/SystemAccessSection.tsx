// ============================================================
// SYSTEM ACCESS SECTION
// Form section for system access checkboxes in take-on sheet
// ============================================================

import type { SystemAccess } from '../../types/takeOnSheet';
import './TakeOnSheetSections.css';

interface SystemAccessSectionProps {
    data: SystemAccess;
    onChange: (data: Partial<SystemAccess>) => void;
    isEditable: boolean;
}

interface SystemAccessOption {
    key: keyof SystemAccess;
    label: string;
    description: string;
}

const ACCESS_GROUPS: { title: string; options: SystemAccessOption[] }[] = [
    {
        title: 'HR Systems',
        options: [
            { key: 'ess', label: 'ESS', description: 'Employee Self Service portal' },
            { key: 'mss', label: 'MSS', description: 'Manager Self Service portal' },
        ],
    },
    {
        title: 'Business Applications',
        options: [
            { key: 'zoho', label: 'ZOHO', description: 'ZOHO business applications suite' },
            { key: 'lms', label: 'LMS', description: 'Learning Management System' },
        ],
    },
    {
        title: 'Security',
        options: [
            { key: 'sophos', label: 'SOPHOS', description: 'SOPHOS security software' },
            { key: 'mimecast', label: 'Mimecast', description: 'Email security and archiving' },
        ],
    },
    {
        title: 'Productivity',
        options: [
            { key: 'msOffice', label: 'MS Office', description: 'Microsoft Office suite' },
            { key: 'email', label: 'Email', description: 'Corporate email account' },
            { key: 'teams', label: 'Microsoft Teams', description: 'Collaboration and communication' },
            { key: 'bizvoip', label: 'Bizvoip', description: 'Business phone system' },
        ],
    },
];

export function SystemAccessSection({
    data,
    onChange,
    isEditable,
}: SystemAccessSectionProps) {
    const handleToggle = (key: keyof SystemAccess) => {
        onChange({ [key]: !data[key] });
    };

    const selectedCount = Object.values(data).filter(Boolean).length;
    const totalCount = Object.keys(data).length;

    return (
        <div className="tos-section">
            <div className="tos-section__header">
                <h3 className="tos-section__title">System Access Requirements</h3>
                <span className="tos-section__progress">
                    {selectedCount} of {totalCount} selected
                </span>
            </div>

            <p className="tos-section__description">
                Select the systems and applications this employee will need access to.
                IT will provision these accounts based on the selections below.
            </p>

            <div className="tos-access-groups">
                {ACCESS_GROUPS.map((group) => (
                    <div key={group.title} className="tos-access-group">
                        <h4 className="tos-access-group__title">{group.title}</h4>
                        <div className="tos-access-group__options">
                            {group.options.map((option) => (
                                <label
                                    key={option.key}
                                    className={`tos-access-option ${data[option.key] ? 'tos-access-option--selected' : ''} ${!isEditable ? 'tos-access-option--disabled' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={data[option.key]}
                                        onChange={() => handleToggle(option.key)}
                                        disabled={!isEditable}
                                        className="tos-access-option__checkbox"
                                    />
                                    <div className="tos-access-option__content">
                                        <span className="tos-access-option__label">{option.label}</span>
                                        <span className="tos-access-option__description">{option.description}</span>
                                    </div>
                                    <span className="tos-access-option__indicator">
                                        {data[option.key] ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20,6 9,17 4,12" />
                                            </svg>
                                        ) : null}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {!isEditable && (
                <p className="tos-section__readonly-notice">
                    System access is configured by HR and IT. View only.
                </p>
            )}
        </div>
    );
}
