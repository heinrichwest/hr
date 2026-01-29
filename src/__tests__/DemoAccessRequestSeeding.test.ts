// ============================================================
// DEMO ACCESS REQUEST SEEDING TESTS
// Tests for seeding 3 demo pending access requests
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Demo Access Request Seeding', () => {
    // Mock Firestore functions
    const mockGetDocs = vi.fn();
    const mockSetDoc = vi.fn();
    const mockDoc = vi.fn();
    const mockCollection = vi.fn();
    const mockQuery = vi.fn();
    const mockWhere = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock implementations
        mockGetDocs.mockResolvedValue({ size: 0, docs: [] });
        mockDoc.mockReturnValue({ id: 'mock-doc-id' });
        mockCollection.mockReturnValue({});
        mockQuery.mockReturnValue({});
        mockWhere.mockReturnValue({});
        mockSetDoc.mockResolvedValue(undefined);

        // Mock Firestore module
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

        // Mock firebase db
        vi.doMock('../firebase', () => ({
            db: {}
        }));
    });

    it('should create demo requests with pending status', async () => {
        // Import Seeder after mocks are set up
        const { Seeder } = await import('../services/seeder');

        await Seeder.seedDemoAccessRequests();

        // Verify setDoc was called 3 times (once for each demo request)
        expect(mockSetDoc).toHaveBeenCalledTimes(3);

        // Verify all created requests have pending status
        for (let i = 0; i < 3; i++) {
            const callArgs = mockSetDoc.mock.calls[i][1];
            expect(callArgs.status).toBe('pending');
        }
    });

    it('should skip creation if @example.com requests already exist', async () => {
        // Mock existing demo requests
        mockGetDocs.mockResolvedValueOnce({
            size: 2,
            docs: [
                { data: () => ({ email: 'test1@example.com' }) },
                { data: () => ({ email: 'test2@example.com' }) }
            ]
        });

        const { Seeder } = await import('../services/seeder');

        await Seeder.seedDemoAccessRequests();

        // Verify setDoc was NOT called
        expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should apply varied timestamps (today, -2 days, -3 days)', async () => {
        const { Seeder } = await import('../services/seeder');

        // Capture the current time before seeding
        const now = Date.now();
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

        await Seeder.seedDemoAccessRequests();

        // Get the createdAt timestamps from the mock calls
        const timestamps = mockSetDoc.mock.calls.map(call => call[1].createdAt.toMillis());

        // Verify we have 3 timestamps
        expect(timestamps).toHaveLength(3);

        // Verify timestamp 1 is approximately today (within 1 minute tolerance)
        expect(Math.abs(timestamps[0] - now)).toBeLessThan(60000);

        // Verify timestamp 2 is approximately 2 days ago (within 1 minute tolerance)
        expect(Math.abs(timestamps[1] - (now - twoDaysInMs))).toBeLessThan(60000);

        // Verify timestamp 3 is approximately 3 days ago (within 1 minute tolerance)
        expect(Math.abs(timestamps[2] - (now - threeDaysInMs))).toBeLessThan(60000);
    });

    it('should enforce name uniqueness across all 3 requests', async () => {
        const { Seeder } = await import('../services/seeder');

        await Seeder.seedDemoAccessRequests();

        // Extract full names from the mock calls
        const names = mockSetDoc.mock.calls.map(call => {
            const data = call[1];
            return `${data.firstName} ${data.lastName}`;
        });

        // Verify we have 3 unique names
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(3);
    });

    it('should generate emails with @example.com domain in lowercase', async () => {
        const { Seeder } = await import('../services/seeder');

        await Seeder.seedDemoAccessRequests();

        // Verify all emails are lowercase and use @example.com domain
        for (let i = 0; i < 3; i++) {
            const callArgs = mockSetDoc.mock.calls[i][1];
            const email = callArgs.email;

            // Check email is lowercase
            expect(email).toBe(email.toLowerCase());

            // Check email ends with @example.com
            expect(email).toMatch(/@example\.com$/);

            // Check email pattern matches firstname.lastname@example.com
            expect(email).toMatch(/^[a-z]+\.[a-z]+@example\.com$/);
        }
    });
});
