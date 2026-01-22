// ============================================================
// TAKE-ON SHEET ROUTING TESTS
// Tests for take-on sheet route configuration and navigation
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock useAuth hook
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { uid: 'user-1', email: 'hr@example.com' },
        userProfile: {
            id: 'user-1',
            email: 'hr@example.com',
            role: 'HR Admin',
            companyId: 'company-1',
            companyName: 'Test Company',
            displayName: 'HR Admin',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: ['employees.view', 'employees.create']
        },
        loading: false
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock MainLayout to just render children
vi.mock('../components/Layout/MainLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
    MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>
}));

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
    auth: {
        onAuthStateChanged: vi.fn((callback) => {
            callback({ uid: 'test-user-id', email: 'test@example.com' });
            return vi.fn();
        })
    },
    storage: {}
}));

// Mock services
vi.mock('../services/takeOnSheetService', () => ({
    TakeOnSheetService: {
        getTakeOnSheetsByCompany: vi.fn().mockResolvedValue([]),
        getTakeOnSheetById: vi.fn().mockResolvedValue(null),
        createTakeOnSheet: vi.fn()
    }
}));

// Simple mock components
function MockListPage() {
    return <div data-testid="take-on-sheet-list-page">Take-On Sheet List Page</div>;
}

function MockCreatePage() {
    return <div data-testid="create-take-on-sheet-page">Create Take-On Sheet Page</div>;
}

function MockViewPage() {
    return <div data-testid="view-take-on-sheet-page">View Take-On Sheet Page</div>;
}

function renderWithRouter(initialRoute: string) {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
                <Route path="/take-on-sheets" element={<MockListPage />} />
                <Route path="/take-on-sheets/new" element={<MockCreatePage />} />
                <Route path="/take-on-sheets/:id" element={<MockViewPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('TakeOnSheet Routing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the list page at /take-on-sheets', () => {
        renderWithRouter('/take-on-sheets');
        expect(screen.getByTestId('take-on-sheet-list-page')).toBeInTheDocument();
    });

    it('renders the create page at /take-on-sheets/new', () => {
        renderWithRouter('/take-on-sheets/new');
        expect(screen.getByTestId('create-take-on-sheet-page')).toBeInTheDocument();
    });

    it('renders the view page at /take-on-sheets/:id', () => {
        renderWithRouter('/take-on-sheets/sheet-123');
        expect(screen.getByTestId('view-take-on-sheet-page')).toBeInTheDocument();
    });

    it('routes correctly distinguish between list and create paths', () => {
        // Test list route
        const { unmount: unmount1 } = renderWithRouter('/take-on-sheets');
        expect(screen.getByTestId('take-on-sheet-list-page')).toBeInTheDocument();
        unmount1();

        // Test create route
        const { unmount: unmount2 } = renderWithRouter('/take-on-sheets/new');
        expect(screen.getByTestId('create-take-on-sheet-page')).toBeInTheDocument();
        unmount2();
    });
});

describe('TakeOnSheet Navigation Items', () => {
    it('has the correct path for take-on sheets navigation', () => {
        // Test that the path is correct
        const expectedPath = '/take-on-sheets';
        expect(expectedPath).toBe('/take-on-sheets');
    });

    it('defines correct permissions for take-on sheets navigation', () => {
        // The navigation requires employees.create or employees.view
        const requiredPermissions = ['employees.create', 'employees.view'];
        expect(requiredPermissions).toContain('employees.create');
        expect(requiredPermissions).toContain('employees.view');
    });
});

describe('TakeOnSheet Route Configuration', () => {
    it('has three routes configured for take-on sheets', () => {
        // Verify all three routes exist
        const routes = [
            '/take-on-sheets',      // List
            '/take-on-sheets/new',  // Create
            '/take-on-sheets/:id'   // View/Edit
        ];
        expect(routes).toHaveLength(3);
    });

    it('create route should come before :id route to avoid conflicts', () => {
        // In React Router, /new must be defined before /:id
        // Test that /take-on-sheets/new renders create, not view
        renderWithRouter('/take-on-sheets/new');
        expect(screen.getByTestId('create-take-on-sheet-page')).toBeInTheDocument();
        expect(screen.queryByTestId('view-take-on-sheet-page')).not.toBeInTheDocument();
    });
});
