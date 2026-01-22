// ============================================================
// SIGN UP PAGE
// Self-service access request form for new users
// ============================================================

import { useState } from "react";
import { Button } from "../components/Button/Button";
import { Input } from "../components/Input/Input";
import { SpecconLogo } from "../components/Logo/SpecconLogo";
import { useNavigate, Link } from "react-router-dom";
import { AccessRequestService } from "../services/accessRequestService";
import "./SignUp.css";

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

/**
 * Simple password hash function using Web Crypto API
 * In production, consider using bcrypt via a backend service
 */
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function SignUp() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    /**
     * Validates all form fields
     * @returns true if all fields are valid
     */
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // First name validation
        if (!firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        // Last name validation
        if (!lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        // Email validation
        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!isValidEmail(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Password validation
        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        // Confirm password validation
        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handles form submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Hash password before storing
            const passwordHash = await hashPassword(password);

            // Create access request
            await AccessRequestService.createAccessRequest({
                email: email.trim().toLowerCase(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                passwordHash,
            });

            // Show success state
            setSuccess(true);

            // Navigate to pending approval page after brief delay
            setTimeout(() => {
                navigate("/pending-approval", { state: { status: "pending", email } });
            }, 2000);
        } catch (err: any) {
            console.error("Sign up error:", err);
            setSubmitError(err.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Success state view
    if (success) {
        return (
            <div className="signup-page">
                {/* Left Banner Side */}
                <div className="signup-banner">
                    <div className="signup-banner-bg" />
                    <div className="signup-banner-pattern" />

                    <div className="signup-banner-content">
                        <div className="signup-banner-logo">
                            <SpecconLogo variant="reversed" />
                        </div>

                        <h1 className="signup-banner-title">
                            Join the <span>SpecCon</span> team
                        </h1>
                        <p className="signup-banner-subtitle">
                            Request access to our comprehensive HR management system.
                        </p>
                    </div>

                    <div className="signup-banner-features">
                        <div className="signup-banner-feature">
                            <div className="signup-banner-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <div className="signup-banner-feature-text">
                                <span className="signup-banner-feature-title">Request Submitted</span>
                                <span className="signup-banner-feature-desc">Your request is being processed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form Side - Success State */}
                <div className="signup-form-side">
                    <div className="signup-container animate-scale-in">
                        <div className="signup-success">
                            <div className="signup-success-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h1 className="signup-success-title">Request Submitted!</h1>
                            <p className="signup-success-message">
                                Your access request has been received and is pending review.
                                You will be notified once your request has been processed.
                            </p>
                            <Link to="/login" className="signup-success-link">
                                Return to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="signup-page">
            {/* Left Banner Side */}
            <div className="signup-banner">
                <div className="signup-banner-bg" />
                <div className="signup-banner-pattern" />

                <div className="signup-banner-content">
                    <div className="signup-banner-logo">
                        <SpecconLogo variant="reversed" />
                    </div>

                    <h1 className="signup-banner-title">
                        Join the <span>SpecCon</span> team
                    </h1>
                    <p className="signup-banner-subtitle">
                        Request access to our comprehensive HR management system.
                    </p>
                </div>

                <div className="signup-banner-features">
                    <div className="signup-banner-feature">
                        <div className="signup-banner-feature-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <line x1="20" y1="8" x2="20" y2="14" />
                                <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                        </div>
                        <div className="signup-banner-feature-text">
                            <span className="signup-banner-feature-title">Request Access</span>
                            <span className="signup-banner-feature-desc">Submit your details for review</span>
                        </div>
                    </div>

                    <div className="signup-banner-feature">
                        <div className="signup-banner-feature-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="signup-banner-feature-text">
                            <span className="signup-banner-feature-title">Admin Review</span>
                            <span className="signup-banner-feature-desc">Your request will be reviewed promptly</span>
                        </div>
                    </div>

                    <div className="signup-banner-feature">
                        <div className="signup-banner-feature-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div className="signup-banner-feature-text">
                            <span className="signup-banner-feature-title">Get Approved</span>
                            <span className="signup-banner-feature-desc">Access your role-based dashboard</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Form Side */}
            <div className="signup-form-side">
                <div className="signup-container animate-scale-in">
                    {/* Header */}
                    <div className="signup-header">
                        <h1 className="signup-title">Request Access</h1>
                        <p className="signup-subtitle">Fill in your details to request system access</p>
                    </div>

                    {/* Error Alert */}
                    {submitError && (
                        <div className="signup-error animate-slide-down">
                            <svg className="signup-error-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* Sign Up Form */}
                    <form onSubmit={handleSubmit} className="signup-form">
                        <div className="signup-form-row">
                            <Input
                                label="First Name"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                placeholder="John"
                                error={errors.firstName}
                                leftIcon={
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                }
                            />
                            <Input
                                label="Last Name"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                placeholder="Doe"
                                error={errors.lastName}
                                leftIcon={
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                }
                            />
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@speccon.co.za"
                            error={errors.email}
                            leftIcon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            }
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Minimum 8 characters"
                            error={errors.password}
                            leftIcon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            }
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter your password"
                            error={errors.confirmPassword}
                            leftIcon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            }
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            size="lg"
                        >
                            Request Access
                        </Button>
                    </form>

                    {/* Login Link */}
                    <div className="signup-login-link">
                        <p>Already have an account?{" "}
                            <Link to="/login" className="signup-login-anchor">
                                Sign In
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="signup-footer">
                        <p className="signup-footer-text">
                            SpecCon Holdings HR Management System
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
