import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Button } from "../components/Button/Button";
import { Input } from "../components/Input/Input";
import { SpecconLogo } from "../components/Logo/SpecconLogo";
import { useNavigate, Link } from "react-router-dom";
import { UserService } from "../services/userService";
import { checkAccessRequestStatus } from "../contexts/AuthContext";
import "./Login.css";

export function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Check access request status before attempting Firebase auth
            const accessRequestStatus = await checkAccessRequestStatus(email);

            if (accessRequestStatus === "pending") {
                // Redirect to pending approval page
                navigate("/pending-approval", { state: { status: "pending", email } });
                return;
            }

            if (accessRequestStatus === "rejected") {
                // Show rejection message
                setError("Your access request was not approved. Please contact the administrator.");
                setLoading(false);
                return;
            }

            // If no access request or approved, proceed with normal login
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (err: any) {
            console.error(err);
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        try {
            await UserService.initializeSystem();
            alert("System Initialized with Roles and SpecCon Users!");
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Left Banner Side */}
                <div className="login-banner">
                    <div className="login-banner-bg" />
                    <div className="login-banner-pattern" />

                    <div className="login-banner-content">
                        <div className="login-banner-logo">
                            <SpecconLogo variant="reversed" className="login-banner-logo-img" />
                        </div>

                        <h1 className="login-banner-title">
                            Streamline your <span>HR operations</span>
                        </h1>
                        <p className="login-banner-subtitle">
                            A comprehensive human resources management system built for SpecCon Holdings.
                        </p>
                    </div>

                    <div className="login-banner-features">
                        <div className="login-banner-feature">
                            <div className="login-banner-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="login-banner-feature-text">
                                <span className="login-banner-feature-title">Employee Management</span>
                                <span className="login-banner-feature-desc">Manage your team efficiently</span>
                            </div>
                        </div>

                        <div className="login-banner-feature">
                            <div className="login-banner-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <div className="login-banner-feature-text">
                                <span className="login-banner-feature-title">Leave Tracking</span>
                                <span className="login-banner-feature-desc">Handle leave requests with ease</span>
                            </div>
                        </div>

                        <div className="login-banner-feature">
                            <div className="login-banner-feature-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <div className="login-banner-feature-text">
                                <span className="login-banner-feature-title">Role-Based Access</span>
                                <span className="login-banner-feature-desc">Secure permission controls</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form Side */}
                <div className="login-form-side">
                    <div className="login-container animate-scale-in">
                        {/* Header */}
                        <div className="login-header">
                            <h1 className="login-title">Welcome back</h1>
                            <p className="login-subtitle">Sign in to your account to continue</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="login-error animate-slide-down">
                                <svg className="login-error-icon" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="login-form">
                            <Input
                                label="Email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@speccon.co.za"
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
                                placeholder="Enter your password"
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
                                Sign In
                            </Button>
                        </form>

                        {/* Request Access Link */}
                        <div className="login-signup-link">
                            <p>Do not have an account?{" "}
                                <Link to="/signup" className="login-signup-anchor">
                                    Request Access
                                </Link>
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="login-footer">
                            <p className="login-footer-text">
                                SpecCon Holdings HR Management System
                            </p>
                        </div>

                        {/* Dev Tools */}
                        <details className="login-dev-tools">
                            <summary className="login-dev-summary">Developer Tools</summary>
                            <div className="login-dev-content">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleInitialize}
                                >
                                    Initialize System & Roles
                                </Button>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
