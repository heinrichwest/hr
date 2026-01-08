import { useEffect, useState } from 'react';
import { CompanyService } from '../../services/companyService';
import { Seeder } from '../../services/seeder';
import type { Company } from '../../types/company';
import { Button } from '../../components/Button/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import './TenantManagement.css';

export function TenantManagement() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    // Form State
    const [newCompany, setNewCompany] = useState({
        legalName: '',
        registrationNumber: '',
        defaultCurrency: 'ZAR',
        defaultPayFrequency: 'monthly',
        financialYearEnd: 2
    });

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const fetchedCompanies = await CompanyService.getAllCompanies();
            setCompanies(fetchedCompanies);
        } catch (error) {
            console.error("Failed to load companies", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const companyData: Omit<Company, 'id' | 'createdAt'> = {
                legalName: newCompany.legalName,
                registrationNumber: newCompany.registrationNumber,
                defaultCurrency: newCompany.defaultCurrency,
                defaultPayFrequency: newCompany.defaultPayFrequency as any,
                financialYearEnd: newCompany.financialYearEnd,
                physicalAddress: {
                    line1: '',
                    city: '',
                    province: '',
                    postalCode: '',
                    country: 'South Africa'
                },
                isActive: true
            };

            const companyId = await CompanyService.createCompany(companyData);
            await CompanyService.initializeCompanyDefaults(companyId);

            setIsCreateModalOpen(false);
            setNewCompany({
                legalName: '',
                registrationNumber: '',
                defaultCurrency: 'ZAR',
                defaultPayFrequency: 'monthly',
                financialYearEnd: 2
            });
            loadCompanies();
        } catch (error) {
            console.error("Failed to create company", error);
            alert("Failed to create company");
        }
    };

    const handleSeedData = async () => {
        if (!confirm('Are you sure you want to seed the database? This will create dummy tenants and data.')) return;

        setIsSeeding(true);
        try {
            await Seeder.seedDatabase();
            await loadCompanies();
            alert('Database seeded successfully!');
        } catch (error) {
            console.error('Seeding failed:', error);
            alert('Failed to seed database');
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <MainLayout>
            <div className="tenants-header animate-slide-down">
                <div className="tenants-header-content">
                    <h1 className="tenants-title">Tenant Management</h1>
                    <p className="tenants-subtitle">Manage system tenants (companies)</p>
                </div>
                <div className="tenants-header-actions">
                    <Button variant="secondary" onClick={handleSeedData} disabled={isSeeding}>
                        {isSeeding ? 'Seeding...' : 'Seed Data'}
                    </Button>
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Tenant
                    </Button>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="tenants-grid animate-scale-in">
                    {companies.map(company => (
                        <div key={company.id} className="tenant-card">
                            <div className="tenant-card-header">
                                <div>
                                    <h3 className="tenant-name">{company.legalName}</h3>
                                    <p className="tenant-reg">{company.registrationNumber}</p>
                                </div>
                                <span className={`tenant-status ${company.isActive ? 'tenant-status--active' : 'tenant-status--inactive'}`}>
                                    {company.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="tenant-actions">
                                <Button variant="secondary" size="sm">
                                    Manage
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New Tenant</h2>
                            <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCompany}>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newCompany.legalName}
                                    onChange={e => setNewCompany({ ...newCompany, legalName: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Registration Number</label>
                                <input
                                    type="text"
                                    required
                                    value={newCompany.registrationNumber}
                                    onChange={e => setNewCompany({ ...newCompany, registrationNumber: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">Create Tenant</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
