// ============================================================
// INDUSTRIAL RELATIONS (IR) / EMPLOYEE RELATIONS TYPES
// ============================================================

export type IRCaseType =
    | 'misconduct'
    | 'poor_performance'
    | 'incapacity'
    | 'grievance'
    | 'abscondment'
    | 'dispute'
    | 'ccma'
    | 'retrenchment';

export type IRCaseStatus =
    | 'draft'
    | 'investigation'
    | 'hearing_scheduled'
    | 'hearing_in_progress'
    | 'awaiting_outcome'
    | 'appeal'
    | 'closed'
    | 'withdrawn';

export type IRCasePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IRCase {
    id: string;
    companyId: string;
    caseNumber: string;         // Auto-generated

    // Case details
    caseType: IRCaseType;
    status: IRCaseStatus;
    priority: IRCasePriority;

    // Employee
    employeeId: string;
    employeeName?: string;
    employeeNumber?: string;
    departmentId?: string;
    departmentName?: string;

    // Incident details
    incidentDate: Date;
    incidentLocation?: string;
    incidentSummary: string;
    policyReference?: string;   // Which policy was breached

    // Classification
    misconductCategory?: MisconductCategory;
    performanceCategory?: PerformanceCategory;
    grievanceCategory?: GrievanceCategory;

    // Assignment
    assignedToId: string;
    assignedToName?: string;
    initiatorId?: string;
    initiatorName?: string;

    // Access control
    isConfidential: boolean;
    accessList?: string[];      // User IDs with access

    // Dates
    dateOpened: Date;
    targetResolutionDate?: Date;
    dateClosed?: Date;

    // Outcome
    outcome?: IROutcome;
    outcomeDate?: Date;
    outcomeNotes?: string;

    // Related
    relatedCaseIds?: string[];
    previousWarningIds?: string[];

    // Metadata
    tags?: string[];
    notes?: string;

    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
}

export type MisconductCategory =
    | 'attendance'
    | 'insubordination'
    | 'dishonesty'
    | 'theft'
    | 'damage_to_property'
    | 'harassment'
    | 'substance_abuse'
    | 'safety_violation'
    | 'breach_of_policy'
    | 'gross_negligence'
    | 'other';

export type PerformanceCategory =
    | 'quality_of_work'
    | 'productivity'
    | 'skills_gap'
    | 'failure_to_meet_targets'
    | 'communication'
    | 'other';

export type GrievanceCategory =
    | 'unfair_treatment'
    | 'harassment'
    | 'discrimination'
    | 'working_conditions'
    | 'management'
    | 'policy_dispute'
    | 'interpersonal'
    | 'other';

export type IROutcome =
    | 'no_action'
    | 'verbal_warning'
    | 'written_warning'
    | 'final_written_warning'
    | 'demotion'
    | 'suspension_without_pay'
    | 'dismissal'
    | 'resignation'
    | 'grievance_upheld'
    | 'grievance_dismissed'
    | 'pip_initiated'
    | 'pip_completed'
    | 'pip_failed'
    | 'settlement'
    | 'ccma_award'
    | 'reinstatement';

// ============================================================
// IR CASE EVENTS / TIMELINE
// ============================================================

export type IREventType =
    | 'case_created'
    | 'investigation_started'
    | 'evidence_added'
    | 'witness_statement'
    | 'meeting_held'
    | 'notice_issued'
    | 'hearing_scheduled'
    | 'hearing_held'
    | 'hearing_postponed'
    | 'outcome_recorded'
    | 'warning_issued'
    | 'appeal_lodged'
    | 'appeal_hearing'
    | 'appeal_outcome'
    | 'case_closed'
    | 'status_changed'
    | 'note_added'
    | 'document_generated'
    | 'access_granted'
    | 'ccma_referral';

export interface IRCaseEvent {
    id: string;
    caseId: string;
    eventType: IREventType;
    eventDate: Date;

    title: string;
    description?: string;
    notes?: string;

    // Participants
    participantIds?: string[];
    participantNames?: string[];

    // Documents
    documentIds?: string[];

    // Outcome (for hearings/meetings)
    outcome?: string;
    nextSteps?: string;
    nextActionDate?: Date;

    createdBy: string;
    createdAt: Date;
}

// ============================================================
// INVESTIGATION
// ============================================================

export interface InvestigationChecklist {
    id: string;
    caseId: string;

    items: InvestigationChecklistItem[];

    investigatorId: string;
    investigatorName?: string;

    startDate: Date;
    completedDate?: Date;
    findingsSummary?: string;
    recommendation?: string;

    createdAt: Date;
    updatedAt?: Date;
}

export interface InvestigationChecklistItem {
    id: string;
    name: string;
    description?: string;
    isRequired: boolean;
    isCompleted: boolean;
    completedDate?: Date;
    notes?: string;
    documentIds?: string[];
    sortOrder: number;
}

// ============================================================
// HEARINGS
// ============================================================

export type HearingType = 'disciplinary' | 'grievance' | 'appeal' | 'incapacity' | 'ccma';

export type HearingStatus =
    | 'scheduled'
    | 'postponed'
    | 'in_progress'
    | 'completed'
    | 'cancelled';

export interface Hearing {
    id: string;
    caseId: string;
    companyId: string;

    hearingType: HearingType;
    hearingNumber: number;      // 1st, 2nd hearing etc.
    status: HearingStatus;

    // Schedule
    scheduledDate: Date;
    scheduledTime: string;
    location: string;
    estimatedDuration?: number; // Minutes

    // Rescheduling
    originalDate?: Date;
    postponementReason?: string;

    // Participants
    chairpersonId?: string;
    chairpersonName?: string;
    initiatorId?: string;
    initiatorName?: string;
    employeeRepId?: string;
    employeeRepName?: string;
    interpreterId?: string;
    interpreterName?: string;
    witnessIds?: string[];
    witnessNames?: string[];

    // Notices
    noticeIssuedDate?: Date;
    noticeDeliveryMethod?: 'email' | 'hand_delivered' | 'registered_mail';
    noticeReceivedDate?: Date;
    noticeDocumentId?: string;

    // Minutes & Outcome
    minutesDocumentId?: string;
    outcome?: IROutcome;
    outcomeDate?: Date;
    outcomeNotes?: string;
    outcomeDocumentId?: string;

    // Sanction details (if applicable)
    sanctionType?: IROutcome;
    sanctionEffectiveDate?: Date;
    suspensionDays?: number;

    // Appeal
    appealLodged?: boolean;
    appealDeadline?: Date;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// WARNINGS
// ============================================================

export type WarningType = 'verbal' | 'written' | 'final_written';

export interface Warning {
    id: string;
    employeeId: string;
    employeeName?: string;
    companyId: string;
    caseId?: string;
    hearingId?: string;

    warningType: WarningType;
    warningNumber: string;      // Auto-generated

    issueDate: Date;
    expiryDate: Date;
    validityMonths: number;

    offenceCategory: string;
    offenceDescription: string;

    issuedById: string;
    issuedByName?: string;

    // Documents
    warningLetterDocumentId?: string;
    acknowledgementDocumentId?: string;
    acknowledgementDate?: Date;

    // Status
    isActive: boolean;
    isExpired: boolean;
    isSuperseded: boolean;      // Replaced by higher warning
    supersededById?: string;

    notes?: string;

    createdAt: Date;
    updatedAt?: Date;
}

// Default warning validity periods (configurable)
export const DEFAULT_WARNING_VALIDITY = {
    verbal: 3,          // months
    written: 6,         // months
    final_written: 12,  // months
} as const;

// ============================================================
// GRIEVANCES
// ============================================================

export interface Grievance {
    id: string;
    caseId: string;
    companyId: string;
    employeeId: string;

    grievanceCategory: GrievanceCategory;
    grievanceAgainst?: string;      // Manager/Employee name
    grievanceAgainstId?: string;

    submissionDate: Date;
    acknowledgedDate?: Date;

    stages: GrievanceStage[];

    resolution?: string;
    resolutionDate?: Date;
    isSatisfactory?: boolean;

    createdAt: Date;
    updatedAt?: Date;
}

export interface GrievanceStage {
    id: string;
    stageNumber: number;
    stageName: string;          // e.g., "Stage 1: Line Manager"
    startDate: Date;
    endDate?: Date;
    meetingDate?: Date;
    attendees?: string[];
    outcome?: string;
    escalated: boolean;
    notes?: string;
    documentIds?: string[];
}

// ============================================================
// PERFORMANCE IMPROVEMENT PLAN (PIP)
// ============================================================

export type PIPStatus =
    | 'draft'
    | 'active'
    | 'extended'
    | 'completed_successful'
    | 'completed_unsuccessful'
    | 'terminated';

export interface PerformanceImprovementPlan {
    id: string;
    caseId?: string;
    companyId: string;
    employeeId: string;
    employeeName?: string;

    status: PIPStatus;

    startDate: Date;
    endDate: Date;
    originalEndDate?: Date;     // If extended
    extensionReason?: string;

    performanceAreas: PIPArea[];
    reviewMeetings: PIPReview[];

    supervisorId: string;
    supervisorName?: string;
    hrContactId?: string;
    hrContactName?: string;

    finalOutcome?: 'successful' | 'unsuccessful';
    finalOutcomeDate?: Date;
    finalOutcomeNotes?: string;

    documentIds?: string[];

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface PIPArea {
    id: string;
    areaName: string;
    currentPerformance: string;
    expectedPerformance: string;
    actions: string;
    resources?: string;
    measurementCriteria: string;
    targetDate?: Date;
    status: 'pending' | 'in_progress' | 'achieved' | 'not_achieved';
    notes?: string;
}

export interface PIPReview {
    id: string;
    reviewDate: Date;
    reviewType: 'weekly' | 'fortnightly' | 'monthly' | 'final';
    attendees: string[];
    progress: string;
    concerns?: string;
    actions?: string;
    overallRating?: 'improving' | 'on_track' | 'below_expectations';
    documentId?: string;
}

// ============================================================
// CCMA / DISPUTES
// ============================================================

export type DisputeStatus =
    | 'referral_received'
    | 'conciliation_scheduled'
    | 'conciliation_held'
    | 'certificate_issued'
    | 'arbitration_scheduled'
    | 'arbitration_held'
    | 'award_issued'
    | 'settled'
    | 'withdrawn'
    | 'review_application';

export interface CCMADispute {
    id: string;
    caseId: string;
    companyId: string;
    employeeId: string;

    // CCMA details
    ccmaCaseNumber: string;
    referralDate: Date;
    disputeType: string;        // e.g., "Unfair dismissal", "Unfair labour practice"

    status: DisputeStatus;

    // Conciliation
    conciliationDate?: Date;
    conciliatorName?: string;
    conciliationOutcome?: string;
    certificateDate?: Date;

    // Arbitration
    arbitrationDate?: Date;
    commissionerName?: string;
    arbitrationVenue?: string;

    // Outcome
    awardDate?: Date;
    awardType?: 'reinstatement' | 'compensation' | 'dismissed' | 'settled';
    awardAmount?: number;
    awardNotes?: string;

    // Settlement
    settlementDate?: Date;
    settlementAmount?: number;
    settlementTerms?: string;

    // Documents
    evidencePackDocumentId?: string;

    // Legal representation
    companyRepresentative?: string;
    employeeRepresentative?: string;

    notes?: string;

    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

// ============================================================
// IR EVIDENCE
// ============================================================

export type EvidenceCategory =
    | 'document'
    | 'witness_statement'
    | 'cctv'
    | 'email'
    | 'photograph'
    | 'audio'
    | 'system_record'
    | 'other';

export interface IREvidence {
    id: string;
    caseId: string;
    companyId: string;

    category: EvidenceCategory;
    title: string;
    description?: string;

    // File details
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;

    // Source
    source?: string;            // e.g., "Witness: John Smith"
    sourceDate?: Date;          // When evidence was created/obtained

    // Chain of custody
    obtainedBy: string;
    obtainedDate: Date;
    chainOfCustodyNotes?: string;

    // Access
    isRestricted: boolean;
    accessList?: string[];

    // Verification
    isVerified: boolean;
    verifiedBy?: string;
    verifiedDate?: Date;

    uploadedBy: string;
    uploadedAt: Date;
}

// ============================================================
// IR TEMPLATES
// ============================================================

export type IRTemplateCategory =
    | 'hearing_notice'
    | 'outcome_letter'
    | 'warning_letter'
    | 'grievance_acknowledgement'
    | 'grievance_outcome'
    | 'pip_document'
    | 'appeal_acknowledgement'
    | 'suspension_letter'
    | 'termination_letter'
    | 'ccma_bundle_cover';

export interface IRTemplate {
    id: string;
    companyId: string;

    name: string;
    category: IRTemplateCategory;
    description?: string;

    // Template content
    content: string;            // Rich text with merge fields
    mergeFields: string[];      // Available merge fields

    version: number;
    isActive: boolean;
    isDefault: boolean;

    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
}

// Available merge fields for templates
export const IR_MERGE_FIELDS = [
    '{{employee_name}}',
    '{{employee_number}}',
    '{{employee_id_number}}',
    '{{employee_job_title}}',
    '{{employee_department}}',
    '{{employee_start_date}}',
    '{{case_number}}',
    '{{incident_date}}',
    '{{incident_summary}}',
    '{{policy_reference}}',
    '{{hearing_date}}',
    '{{hearing_time}}',
    '{{hearing_venue}}',
    '{{chairperson_name}}',
    '{{warning_type}}',
    '{{warning_expiry_date}}',
    '{{outcome}}',
    '{{company_name}}',
    '{{current_date}}',
    '{{issuer_name}}',
    '{{issuer_title}}',
] as const;
