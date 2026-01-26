// ============================================================
// REPORTS CARD - System Admin Dashboard
// Clickable card to navigate to Reports Management Interface
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminReportService } from '../../services/adminReportService';

interface ReportsCardProps {
    companyId?: string;
}

export function ReportsCard({ companyId }: ReportsCardProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

    // Available report types count
    const TOTAL_REPORT_TYPES = 4;

    useEffect(() => {
        const loadLastGenerated = async () => {
            try {
                const history = await AdminReportService.getReportHistory(companyId, undefined);
                if (history.length > 0) {
                    setLastGenerated(history[0].generatedAt);
                }
            } catch (error) {
                console.error('Failed to load report history:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLastGenerated();
    }, [companyId]);

    const handleClick = () => {
        navigate('/admin/reports');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    const formatLastGenerated = (date: Date | null) => {
        if (!date) return 'Never';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div
            className={`stat-card stat-card--clickable ${loading ? 'stat-card--loading' : ''}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="View reports management"
        >
            <div className="stat-icon stat-icon--secondary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            </div>
            <div className="stat-content">
                <span className="stat-value">
                    {loading ? <span className="stat-skeleton" /> : TOTAL_REPORT_TYPES}
                </span>
                <span className="stat-label">Reports</span>
                {!loading && lastGenerated && (
                    <span className="stat-meta" style={{
                        fontSize: '12px',
                        color: 'hsl(220, 10%, 60%)',
                        marginTop: '4px'
                    }}>
                        Last: {formatLastGenerated(lastGenerated)}
                    </span>
                )}
            </div>
        </div>
    );
}
