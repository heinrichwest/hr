// ============================================================
// STATUS WORKFLOW INDICATOR
// Visual stepper showing take-on sheet workflow progress
// ============================================================

import React from 'react';
import type { TakeOnSheetStatus } from '../../types/takeOnSheet';
import './TakeOnSheetSections.css';

interface StatusWorkflowIndicatorProps {
    currentStatus: TakeOnSheetStatus;
}

const WORKFLOW_STEPS: { status: TakeOnSheetStatus; label: string; description: string }[] = [
    {
        status: 'draft',
        label: 'Draft',
        description: 'Initial creation by manager',
    },
    {
        status: 'pending_hr_review',
        label: 'HR Review',
        description: 'Pending HR review and documents',
    },
    {
        status: 'pending_it_setup',
        label: 'IT Setup',
        description: 'Pending IT system access setup',
    },
    {
        status: 'complete',
        label: 'Complete',
        description: 'Ready for employee creation',
    },
];

const STATUS_ORDER: TakeOnSheetStatus[] = ['draft', 'pending_hr_review', 'pending_it_setup', 'complete'];

export function StatusWorkflowIndicator({ currentStatus }: StatusWorkflowIndicatorProps) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);

    const getStepState = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div className="tos-workflow">
            <div className="tos-workflow__steps">
                {WORKFLOW_STEPS.map((step, index) => {
                    const state = getStepState(index);
                    const isLast = index === WORKFLOW_STEPS.length - 1;

                    return (
                        <React.Fragment key={step.status}>
                            <div className={`tos-workflow__step tos-workflow__step--${state}`}>
                                <div className="tos-workflow__step-indicator">
                                    {state === 'completed' ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20,6 9,17 4,12" />
                                        </svg>
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                <div className="tos-workflow__step-content">
                                    <span className="tos-workflow__step-label">{step.label}</span>
                                    <span className="tos-workflow__step-description">{step.description}</span>
                                </div>
                            </div>
                            {!isLast && (
                                <div className={`tos-workflow__connector tos-workflow__connector--${state === 'completed' ? 'completed' : 'pending'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
