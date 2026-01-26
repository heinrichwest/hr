// ============================================================
// UI-19 REPORT VIEWER COMPONENT
// Task Group 5: Display UI-19 UIF Employer's Declaration report
// Updated to match official government template exactly
// ============================================================

import type { UI19Report } from '../../types/ui19';
import { TERMINATION_REASON_LABELS, NON_CONTRIBUTOR_REASON_LABELS } from '../../types/ui19';
import { Button } from '../Button/Button';
import './UI19ReportViewer.css';

interface UI19ReportViewerProps {
    report: UI19Report;
    onExportExcel?: () => void;
    onExportCSV?: () => void;
}

export function UI19ReportViewer({ report, onExportExcel, onExportCSV }: UI19ReportViewerProps) {
    // Format date as DD/MM/YY (two-digit year as per official form)
    const formatDate = (date: Date | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };

    // Split date into individual digit boxes for DD MM YY format
    const formatDateBoxes = (date: Date | undefined): string[] => {
        if (!date) return Array(6).fill('');
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return [...day.split(''), ...month.split(''), ...year.split('')];
    };

    // Format reference numbers with individual boxes
    const formatReferenceBoxes = (ref: string): string[] => {
        return ref.replace(/\s/g, '').split('');
    };

    // Format currency with R and C columns
    const formatCurrencyParts = (amount: number): { rands: string; cents: string } => {
        const fixed = amount.toFixed(2);
        const [rands, cents] = fixed.split('.');
        return { rands, cents };
    };

    // Get month name and year for header
    const getPeriodDisplay = (): string => {
        const monthName = new Date(2000, report.reportingPeriod.month - 1, 1).toLocaleString('default', { month: 'long' });
        return `${monthName} ${report.reportingPeriod.year}`;
    };

    return (
        <div className="ui19-report-viewer">
            {/* Export Actions - Top (outside form template) */}
            <div className="export-actions-bar">
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
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Export to CSV
                </Button>
            </div>

            {/* Official UI-19 Form Template */}
            <div className="ui19-form-template">
                {/* Government Header */}
                <div className="form-header">
                    <div className="header-logos">
                        <div className="dept-logo">
                            <span className="logo-text">employment & labour</span>
                            <span className="dept-text">Department: Employment and Labour</span>
                            <span className="republic-text">REPUBLIC OF SOUTH AFRICA</span>
                        </div>
                    </div>

                    <div className="form-title-section">
                        <h1 className="form-number">UI-19</h1>
                        <div className="uif-logo">
                            <span className="uif-brand">UIF</span>
                            <span className="uif-tagline">WORKING FOR YOU</span>
                        </div>
                    </div>

                    <div className="form-subtitle-section">
                        <h2 className="act-reference">UNEMPLOYMENT INSURANCE Act 63 of 2001 as amended</h2>
                        <div className="declaration-header">
                            <h3 className="declaration-title">Employer's Declaration of Employees for the month</h3>
                            <div className="period-box">{getPeriodDisplay()}</div>
                        </div>
                        <p className="submission-info">
                            Information to be submitted in terms of Section 56 (1&3) read with Regulation 13 (1&2)
                        </p>
                    </div>

                    <p className="instructions">
                        An employer must by the seventh day of each month inform the Commissioner with all the information during the previous month regarding the employer's contact details or employees' remuneration details including
                        new appointments and termination of service. The employer must forward this form to the Unemployment Insurance Fund at (012)337-1947/44 or 337-1580/81/82 or submit same at any labour centre countrywide. The
                        completed form can also be faxed to any of the following numbers: <strong>Pretoria</strong> (012) 309 5142/5286; <strong>Johannesburg</strong> (011) 497 3293; <strong>Durban</strong> (031) 366 2156; <strong>Polokwane</strong> (015)290 1670; <strong>Mmabatho</strong> (018) 384 2658; <strong>East London</strong> (043)701 3263;
                        <strong>Bloemfontein</strong> (051)4479353); <strong>Cape Town</strong> (021)441 8024; <strong>Witbank</strong> (013)656 0233; <strong>Port Elizabeth</strong> (041)506 5142; <strong>Germiston</strong> (011)873 2219; <strong>George</strong> (044)873 2568; <strong>Pietermaritzburg</strong> (033)394 5069 Or mail to: <a href="mailto:uif.declarations@labour.gov.za">uif.declarations@labour.gov.za</a>
                    </p>
                </div>

                {/* Section 1: EMPLOYER'S DETAILS */}
                <section className="employer-details-section">
                    <h3 className="section-heading">1. EMPLOYER'S DETAILS</h3>

                    <div className="employer-details-grid">
                        {/* Row 1: UIF Reference and PAYE Reference */}
                        <div className="detail-row row-split">
                            <div className="detail-field">
                                <label className="field-label">1.1 UIF Employer Reference No.</label>
                                <div className="reference-boxes">
                                    {formatReferenceBoxes(report.employerDetails.uifEmployerReference).map((digit, idx) => (
                                        <span key={idx} className="digit-box">{digit}</span>
                                    ))}
                                    <span className="branch-separator">/</span>
                                    <span className="digit-box">0</span>
                                </div>
                                <label className="field-label-inline">Branch No.</label>
                            </div>

                            <div className="detail-field">
                                <label className="field-label">
                                    1.2 PAYE Reference No (If registered with SARS)
                                </label>
                                <div className="reference-boxes">
                                    {report.employerDetails.payeReference &&
                                        formatReferenceBoxes(report.employerDetails.payeReference).map((digit, idx) => (
                                            <span key={idx} className="digit-box">{digit}</span>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Trading name and Physical address */}
                        <div className="detail-row row-split">
                            <div className="detail-field">
                                <label className="field-label">1.3 Trading name of business</label>
                                <div className="field-value">{report.employerDetails.tradingName}</div>
                            </div>

                            <div className="detail-field">
                                <label className="field-label">1.4 Physical address:</label>
                                <div className="field-value">
                                    {report.employerDetails.physicalAddress.line1}
                                    {report.employerDetails.physicalAddress.line2 && `, ${report.employerDetails.physicalAddress.line2}`}
                                    {report.employerDetails.physicalAddress.suburb && `, ${report.employerDetails.physicalAddress.suburb}`}
                                    {report.employerDetails.physicalAddress.city && ` ${report.employerDetails.physicalAddress.city}`}
                                    {report.employerDetails.physicalAddress.postalCode && ` ${report.employerDetails.physicalAddress.postalCode}`}
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Different work address */}
                        <div className="detail-row">
                            <div className="detail-field">
                                <label className="field-label">
                                    1.5 Address where employees listed in item 2 work (if different from the address listed in 1.4)
                                </label>
                                <div className="field-value field-empty"></div>
                            </div>
                        </div>

                        {/* Row 4: Postal address and Co. Reg. No */}
                        <div className="detail-row row-split">
                            <div className="detail-field">
                                <label className="field-label">1.6 Postal address:</label>
                                <div className="field-value">
                                    {report.employerDetails.postalAddress ? (
                                        <>
                                            {report.employerDetails.postalAddress.line1}
                                            {report.employerDetails.postalAddress.suburb && ` ${report.employerDetails.postalAddress.suburb}`}
                                            {report.employerDetails.postalAddress.city && ` ${report.employerDetails.postalAddress.city}`}
                                            {report.employerDetails.postalAddress.postalCode && ` ${report.employerDetails.postalAddress.postalCode}`}
                                        </>
                                    ) : (
                                        'Same as physical address'
                                    )}
                                </div>
                            </div>

                            <div className="detail-field">
                                <label className="field-label">1.7 Co. Reg. No. (CIPRO No)</label>
                                <div className="reference-boxes">
                                    {formatReferenceBoxes(report.employerDetails.companyRegistrationNumber).map((digit, idx) => (
                                        <span key={idx} className="digit-box">{digit}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Row 5: Email, Fax, Phone, Authorised person */}
                        <div className="detail-row row-triple">
                            <div className="detail-field">
                                <label className="field-label">1.8 E-mail:</label>
                                <div className="field-value">{report.employerDetails.email || ''}</div>
                            </div>

                            <div className="detail-field">
                                <label className="field-label">1.9 Fax no:</label>
                                <div className="field-value">{report.employerDetails.fax || ''}</div>
                            </div>
                        </div>

                        <div className="detail-row row-split">
                            <div className="detail-field">
                                <label className="field-label">1.10 Phone number:</label>
                                <div className="field-value">{report.employerDetails.phone || ''}</div>
                            </div>

                            <div className="detail-field">
                                <label className="field-label">1.11 Authorised person **</label>
                                <div className="field-value">{report.employerDetails.authorisedPersonName || ''}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: EMPLOYEE DETAILS */}
                <section className="employee-details-section">
                    <h3 className="section-heading">2. EMPLOYEE DETAILS</h3>

                    <div className="employee-table-container">
                        <table className="ui19-employee-table">
                            <thead>
                                <tr>
                                    <th className="col-a">
                                        <div className="col-letter">A</div>
                                        <div className="col-title">Surname</div>
                                    </th>
                                    <th className="col-b">
                                        <div className="col-letter">B</div>
                                        <div className="col-title">Initials</div>
                                    </th>
                                    <th className="col-c">
                                        <div className="col-letter">C</div>
                                        <div className="col-title">Identity Document Number</div>
                                    </th>
                                    <th className="col-d">
                                        <div className="col-letter">D*</div>
                                        <div className="col-title">Total (Gross) Remuneration paid to Employee Per Month</div>
                                        <div className="col-subcols">
                                            <span>R</span>
                                            <span>C</span>
                                        </div>
                                    </th>
                                    <th className="col-e">
                                        <div className="col-letter">E</div>
                                        <div className="col-title">Total hours worked during the month</div>
                                    </th>
                                    <th className="col-f">
                                        <div className="col-letter">F</div>
                                        <div className="col-title">Commencement date of Employment</div>
                                        <div className="date-format">D D M M Y Y</div>
                                    </th>
                                    <th className="col-g">
                                        <div className="col-letter">G</div>
                                        <div className="col-title">Termination Date</div>
                                        <div className="date-format">D D M M Y Y</div>
                                    </th>
                                    <th className="col-h">
                                        <div className="col-letter">H</div>
                                        <div className="col-title">Reasons for termination (use termination codes as supplied at the bottom of the page)</div>
                                    </th>
                                    <th className="col-i">
                                        <div className="col-letter">I</div>
                                        <div className="col-title">Indicate whether contributor or non-contributor (YES OR NO)</div>
                                    </th>
                                    <th className="col-j">
                                        <div className="col-letter">J***</div>
                                        <div className="col-title">If non-Contributor state reason (use codes as supplied at the bottom of the page)</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.employees.map((employee) => {
                                    const currency = formatCurrencyParts(employee.grossRemuneration);
                                    const commencementBoxes = formatDateBoxes(employee.commencementDate);
                                    const terminationBoxes = formatDateBoxes(employee.terminationDate);
                                    const idBoxes = formatReferenceBoxes(employee.idNumber);

                                    return (
                                        <tr key={employee.employeeId}>
                                            <td className="col-a">{employee.surname}</td>
                                            <td className="col-b">{employee.initials}</td>
                                            <td className="col-c">
                                                <div className="id-boxes">
                                                    {idBoxes.map((digit, idx) => (
                                                        <span key={idx} className="id-digit">{digit}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="col-d">
                                                <div className="currency-split">
                                                    <span className="rands">{currency.rands}</span>
                                                    <span className="cents">{currency.cents}</span>
                                                </div>
                                            </td>
                                            <td className="col-e">{employee.hoursWorked}</td>
                                            <td className="col-f">
                                                <div className="date-boxes">
                                                    {commencementBoxes.map((digit, idx) => (
                                                        <span key={idx} className="date-digit">{digit}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="col-g">
                                                <div className="date-boxes">
                                                    {terminationBoxes.map((digit, idx) => (
                                                        <span key={idx} className="date-digit">{digit}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="col-h">{employee.terminationReasonCode || ''}</td>
                                            <td className="col-i">{employee.isContributor ? 'Yes' : 'No'}</td>
                                            <td className="col-j">{employee.nonContributorReasonCode || ''}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Declaration Section */}
                <section className="declaration-section">
                    <p className="declaration-text">
                        I, <span className="declaration-name">{report.declaration.authorisedPersonName}</span> (Name of Employer), ID No. <span className="declaration-id">{report.employerDetails.authorisedPersonIdNumber || '_________________________'}</span>, declare that the above information is true and correct. I understand that it is an offence to make a false statement.
                    </p>

                    <div className="signature-line">
                        <div className="signature-field">
                            <span className="field-label-bold">EMPLOYER SIGNATURE</span>
                            <div className="signature-underline">_______________________________________________________</div>
                        </div>
                        <div className="date-field">
                            <span className="field-label-bold">DATE</span>
                            <div className="date-underline">_______________________</div>
                        </div>
                    </div>
                </section>

                {/* Page 2: Code Reference Tables */}
                <div className="page-break"></div>

                <section className="codes-reference-section">
                    <h2 className="codes-page-title">UI-19</h2>

                    {/* Footnotes Table */}
                    <div className="footnotes-table">
                        <table className="footnotes">
                            <tbody>
                                <tr>
                                    <td className="footnote-marker">**</td>
                                    <td className="footnote-text">
                                        If the employer is not a resident in the RSA, or is a body corporate not
                                        registered in the RSA, an authorised person must carry out the duties of
                                        the employer in terms of this Act.
                                    </td>
                                    <td className="footnote-marker">1</td>
                                    <td className="footnote-text">Temporary employees</td>
                                    <td className="employer-stamp">Employer's stamp (if available)</td>
                                </tr>
                                <tr>
                                    <td className="footnote-marker">D*</td>
                                    <td className="footnote-text">
                                        Remuneration means actual basic salary plus payment in kind (Declare
                                        actual gross salary)
                                    </td>
                                    <td className="footnote-marker">2</td>
                                    <td className="footnote-text">Employees who earn commission only</td>
                                    <td rowSpan={3}></td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td></td>
                                    <td className="footnote-marker">3</td>
                                    <td className="footnote-text">No income paid for the payroll period</td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td className="footnote-text">
                                        If paid weekly, convert wages to monthly salary (weekly wages X 52/12)
                                    </td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td className="footnote-marker">E*</td>
                                    <td className="footnote-text">
                                        Total hours worked, i.e. actual hours worked during the month.
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td className="footnote-text">
                                        Employers may also submit these details electronically from payrolls or
                                        on the UIF's website at www.labour.org.za
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td className="footnote-marker">*</td>
                                    <td className="footnote-text">
                                        Only applicable for commercial employers. Domestic employers - provide
                                        surname and initials
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td className="footnote-marker">***</td>
                                    <td className="footnote-text">
                                        Constructive dismissal can only be determined by the CCMA: Bargaining
                                        Council or Labour Court
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Termination Reason Codes */}
                    <div className="termination-codes">
                        <h4 className="codes-heading">Reason for termination codes</h4>
                        <div className="codes-grid">
                            <div className="code-item"><span className="code-num">2</span> Deceased</div>
                            <div className="code-item"><span className="code-num">6</span> Resigned</div>
                            <div className="code-item"><span className="code-num">10</span> Illness/Medically boarded</div>
                            <div className="code-item"><span className="code-num">14</span> Business closed</div>
                            <div className="code-item"><span className="code-num">18</span> Commissioning Parental</div>
                            <div className="code-item"><span className="code-num">3</span> Retired</div>
                            <div className="code-item"><span className="code-num">7</span> Constructive dismissal***</div>
                            <div className="code-item"><span className="code-num">11</span> Retrenched/Staff reduction</div>
                            <div className="code-item"><span className="code-num">15</span> Death of Domestic Employer</div>
                            <div className="code-item"><span className="code-num">19</span> Parental Leave</div>
                            <div className="code-item"><span className="code-num">4</span> Dismissed</div>
                            <div className="code-item"><span className="code-num">8</span> Insolvency/Liquidation</div>
                            <div className="code-item"><span className="code-num">12</span> Transfer to another Branch</div>
                            <div className="code-item"><span className="code-num">16</span> Voluntary severance package</div>
                            <div className="code-item"></div>
                            <div className="code-item"><span className="code-num">5</span> Contract expired</div>
                            <div className="code-item"><span className="code-num">9</span> Maternity/Adoption</div>
                            <div className="code-item"><span className="code-num">13</span> Absconded</div>
                            <div className="code-item"><span className="code-num">17</span> Reduced Work Time</div>
                            <div className="code-item"></div>
                        </div>
                    </div>
                </section>

                {/* Government Footer */}
                <div className="government-footer">
                    <div className="footer-brand">
                        <span className="footer-uif">UIF</span>
                        <span className="footer-tagline">WORKING FOR YOU</span>
                    </div>
                    <div className="footer-contact">
                        <p>
                            <strong>POSTAL ADDRESS:</strong> P.O.Box 1851, Pretoria, 0001 <strong>PHYSICAL ADDRESS:</strong> 230 Lillian Ngoyi, Absa Towers, Pretoria <strong>TEL:</strong> (012) 337 1680
                        </p>
                    </div>
                </div>
            </div>

            {/* Export Actions - Bottom */}
            <div className="export-actions-bar">
                <div className="export-note">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                        This is a browser preview only. Not for official submission to the Department of Employment and Labour.
                        Please export to Excel for official submission.
                    </span>
                </div>
                <div className="export-buttons">
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
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Export to CSV
                    </Button>
                </div>
            </div>
        </div>
    );
}
