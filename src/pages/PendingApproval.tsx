// ============================================================
// PENDING APPROVAL PAGE
// Displays status message for users with pending or rejected access requests
// ============================================================

import { Link, useLocation } from "react-router-dom";
import { SpecconLogo } from "../components/Logo/SpecconLogo";
import "./PendingApproval.css";

interface LocationState {
    status?: 'pending' | 'rejected';
    email?: string;
}

export function PendingApproval() {
    const location = useLocation();
    const state = location.state as LocationState | null;
    const status = state?.status || 'pending';

    return (
        <div className="pending-approval-page">
            <div className="pending-approval-container">
                {/* Logo */}
                <div className="pending-approval-logo">
                    <SpecconLogo />
                </div>

                {/* Status Card */}
                <div className="pending-approval-card animate-scale-in">
                    {status === 'pending' ? (
                        <>
                            {/* Pending Icon */}
                            <div className="pending-approval-icon pending-approval-icon--pending">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>

                            {/* Pending Title */}
                            <h1 className="pending-approval-title">Request Pending</h1>

                            {/* Pending Message */}
                            <p className="pending-approval-message">
                                Your request is being reviewed. You will be notified once your request has been processed by an administrator.
                            </p>

                            {/* Info Box */}
                            <div className="pending-approval-info">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                                <span>This process typically takes 1-2 business days.</span>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Rejected Icon */}
                            <div className="pending-approval-icon pending-approval-icon--rejected">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>

                            {/* Rejected Title */}
                            <h1 className="pending-approval-title pending-approval-title--rejected">
                                Request Not Approved
                            </h1>

                            {/* Rejected Message */}
                            <p className="pending-approval-message">
                                Your access request was not approved. Please contact the administrator for more information.
                            </p>

                            {/* Contact Info */}
                            <div className="pending-approval-contact">
                                <p>Need assistance?</p>
                                <a href="mailto:hr@speccon.co.za">hr@speccon.co.za</a>
                            </div>
                        </>
                    )}

                    {/* Return to Login Button */}
                    <Link to="/login" className="pending-approval-button">
                        Return to Login
                    </Link>
                </div>

                {/* Footer */}
                <div className="pending-approval-footer">
                    <p>SpecCon Holdings HR Management System</p>
                </div>
            </div>
        </div>
    );
}
