// ============================================================
// TAKE-ON SHEET LIST PAGE
// Page for viewing all take-on sheets
// ============================================================

import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { TakeOnSheetList } from '../components/TakeOnSheet/TakeOnSheetList';
import { Button } from '../components/Button/Button';
import { useAuth } from '../contexts/AuthContext';
import './TakeOnSheetListPage.css';

export function TakeOnSheetListPage() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const canCreate = userProfile && (
        userProfile.role === 'Line Manager' ||
        userProfile.role === 'HR Admin' ||
        userProfile.role === 'HR Manager' ||
        userProfile.role === 'System Admin'
    );

    const handleCreateNew = () => {
        navigate('/take-on-sheets/new');
    };

    if (!userProfile) {
        return null;
    }

    return (
        <MainLayout>
            <div className="tos-list-page">
                <div className="tos-list-page__header">
                    <div className="tos-list-page__header-content">
                        <h1 className="tos-list-page__title">Take-On Sheets</h1>
                        <p className="tos-list-page__subtitle">
                            Manage employee onboarding documentation and system access setup
                        </p>
                    </div>
                    {canCreate && (
                        <Button variant="primary" onClick={handleCreateNew}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Take-On Sheet
                        </Button>
                    )}
                </div>

                <TakeOnSheetList companyId={userProfile.companyId || ''} />
            </div>
        </MainLayout>
    );
}
