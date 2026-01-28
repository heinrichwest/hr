// ============================================================
// DEMO ACCESS REQUEST EDGE CASES TESTS
// Additional strategic tests for edge cases and comprehensive coverage
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { Seeder } from '../services/seeder';

describe('Demo Access Request Edge Cases', () => {
    it('should handle password hashing correctly for all demo requests', async () => {
        // Mock Firestore functions
        const mockGetDocs = vi.fn();
        const mockSetDoc = vi.fn();
        const mockDoc = vi.fn();
        const mockCollection = vi.fn();
        const mockQuery = vi.fn();
        const mockWhere = vi.fn();

        mockGetDocs.mockResolvedValue({ size: 0, docs: [] });
        mockDoc.mockReturnValue({ id: 'mock-id' });
        mockCollection.mockReturnValue({});
        mockQuery.mockReturnValue({});
        mockWhere.mockReturnValue({});
        mockSetDoc.mockResolvedValue(undefined);

        vi.doMock('firebase/firestore', () => ({
            collection: mockCollection,
            getDocs: mockGetDocs,
            query: mockQuery,
            where: mockWhere,
            Timestamp: {
                fromMillis: (millis: number) => ({ toMillis: () => millis })
            },
            setDoc: mockSetDoc,
            doc: mockDoc
        }));

        vi.doMock('../firebase', () => ({
            db: {}
        }));

        await Seeder.seedDemoAccessRequests();

        // Verify all passwords are hashed (not plain text)
        for (let i = 0; i < 3; i++) {
            const callArgs = mockSetDoc.mock.calls[i][1];
            const passwordHash = callArgs.passwordHash;

            // Verify password hash exists and is not empty
            expect(passwordHash).toBeDefined();
            expect(passwordHash.length).toBeGreaterThan(0);

            // Verify hash is not the plain text password
            expect(passwordHash).not.toBe('DemoPassword123!');

            // Verify hash is a valid SHA-256 hex string (64 characters)
            expect(passwordHash).toMatch(/^[a-f0-9]{64}$/);
        }
    });

    it('should create exactly 3 requests (no more, no less)', async () => {
        // Mock Firestore functions
        const mockGetDocs = vi.fn();
        const mockSetDoc = vi.fn();
        const mockDoc = vi.fn();
        const mockCollection = vi.fn();
        const mockQuery = vi.fn();
        const mockWhere = vi.fn();

        mockGetDocs.mockResolvedValue({ size: 0, docs: [] });
        mockDoc.mockReturnValue({ id: 'mock-id' });
        mockCollection.mockReturnValue({});
        mockQuery.mockReturnValue({});
        mockWhere.mockReturnValue({});
        mockSetDoc.mockResolvedValue(undefined);

        vi.doMock('firebase/firestore', () => ({
            collection: mockCollection,
            getDocs: mockGetDocs,
            query: mockQuery,
            where: mockWhere,
            Timestamp: {
                fromMillis: (millis: number) => ({ toMillis: () => millis })
            },
            setDoc: mockSetDoc,
            doc: mockDoc
        }));

        vi.doMock('../firebase', () => ({
            db: {}
        }));

        await Seeder.seedDemoAccessRequests();

        // Verify exactly 3 setDoc calls (no more, no less)
        expect(mockSetDoc).toHaveBeenCalledTimes(3);
    });

    it('should use South African names from predefined arrays', async () => {
        // Mock Firestore functions
        const mockGetDocs = vi.fn();
        const mockSetDoc = vi.fn();
        const mockDoc = vi.fn();
        const mockCollection = vi.fn();
        const mockQuery = vi.fn();
        const mockWhere = vi.fn();

        mockGetDocs.mockResolvedValue({ size: 0, docs: [] });
        mockDoc.mockReturnValue({ id: 'mock-id' });
        mockCollection.mockReturnValue({});
        mockQuery.mockReturnValue({});
        mockWhere.mockReturnValue({});
        mockSetDoc.mockResolvedValue(undefined);

        vi.doMock('firebase/firestore', () => ({
            collection: mockCollection,
            getDocs: mockGetDocs,
            query: mockQuery,
            where: mockWhere,
            Timestamp: {
                fromMillis: (millis: number) => ({ toMillis: () => millis })
            },
            setDoc: mockSetDoc,
            doc: mockDoc
        }));

        vi.doMock('../firebase', () => ({
            db: {}
        }));

        // Define expected name lists (matching seeder.ts)
        const SA_FIRST_NAMES = [
            'Thabo', 'Nomsa', 'Sipho', 'Zanele', 'Mpho', 'Lindiwe', 'Bongani', 'Thandi',
            'Karabo', 'Lerato', 'Tshepo', 'Naledi', 'Kagiso', 'Palesa', 'Mandla', 'Noma',
            'Trevor', 'Sarah', 'David', 'Michelle', 'James', 'Nicole', 'Andrew', 'Jessica',
            'Fatima', 'Ahmed', 'Zainab', 'Ibrahim', 'Ayesha', 'Muhammad',
            'Priya', 'Raj', 'Anita', 'Kumar', 'Deepak', 'Sanjay'
        ];

        const SA_LAST_NAMES = [
            'Khumalo', 'Nkosi', 'Dlamini', 'Ndlovu', 'Mthembu', 'Sithole', 'Zulu', 'Mokoena',
            'Molefe', 'Nhlapo', 'Maseko', 'Mabaso', 'Cele', 'Buthelezi', 'Radebe', 'Naidoo',
            'Van der Merge', 'Botha', 'De Klerk', 'Pretorius', 'Du Plessis', 'Swart', 'Nel',
            'Patel', 'Pillay', 'Govender', 'Chetty', 'Reddy', 'Naicker',
            'Abrahams', 'Jacobs', 'Williams', 'Adams', 'Peterson', 'Smith'
        ];

        await Seeder.seedDemoAccessRequests();

        // Verify all names come from predefined arrays
        for (let i = 0; i < 3; i++) {
            const callArgs = mockSetDoc.mock.calls[i][1];
            const firstName = callArgs.firstName;
            const lastName = callArgs.lastName;

            expect(SA_FIRST_NAMES).toContain(firstName);
            expect(SA_LAST_NAMES).toContain(lastName);
        }
    });

    it('should sort demo requests by createdAt descending when displayed', async () => {
        // Mock Firestore functions
        const mockGetDocs = vi.fn();
        const mockSetDoc = vi.fn();
        const mockDoc = vi.fn();
        const mockCollection = vi.fn();
        const mockQuery = vi.fn();
        const mockWhere = vi.fn();

        mockGetDocs.mockResolvedValue({ size: 0, docs: [] });
        mockDoc.mockReturnValue({ id: 'mock-id' });
        mockCollection.mockReturnValue({});
        mockQuery.mockReturnValue({});
        mockWhere.mockReturnValue({});
        mockSetDoc.mockResolvedValue(undefined);

        vi.doMock('firebase/firestore', () => ({
            collection: mockCollection,
            getDocs: mockGetDocs,
            query: mockQuery,
            where: mockWhere,
            Timestamp: {
                fromMillis: (millis: number) => ({ toMillis: () => millis })
            },
            setDoc: mockSetDoc,
            doc: mockDoc
        }));

        vi.doMock('../firebase', () => ({
            db: {}
        }));

        await Seeder.seedDemoAccessRequests();

        // Extract timestamps from created requests
        const timestamps = mockSetDoc.mock.calls.map(call => call[1].createdAt.toMillis());

        // Verify timestamps are in descending order (newest first)
        // Request 0: today (largest timestamp)
        // Request 1: 2 days ago
        // Request 2: 3 days ago (smallest timestamp)
        expect(timestamps[0]).toBeGreaterThan(timestamps[1]);
        expect(timestamps[1]).toBeGreaterThan(timestamps[2]);
    });
});
