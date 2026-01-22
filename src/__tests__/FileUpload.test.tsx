// ============================================================
// FILE UPLOAD COMPONENT TESTS
// Tests for reusable FileUpload component
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from '../components/FileUpload/FileUpload';
import type { TakeOnDocument } from '../types/takeOnSheet';

describe('FileUpload Component', () => {
    const defaultProps = {
        accept: '.pdf,.jpg,.jpeg,.png',
        maxSize: 10 * 1024 * 1024,
        onUpload: vi.fn(),
        onDelete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('drag-and-drop file selection', () => {
        it('should trigger onChange when file is dropped', async () => {
            const mockOnUpload = vi.fn();
            render(<FileUpload {...defaultProps} onUpload={mockOnUpload} />);

            const dropZone = screen.getByTestId('file-upload-dropzone');

            // Create a mock file
            const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

            // Simulate drag and drop
            fireEvent.dragOver(dropZone);
            fireEvent.drop(dropZone, {
                dataTransfer: {
                    files: [file],
                },
            });

            expect(mockOnUpload).toHaveBeenCalledWith(file);
        });
    });

    describe('click-to-browse file selection', () => {
        it('should allow file selection via click', () => {
            const mockOnUpload = vi.fn();
            render(<FileUpload {...defaultProps} onUpload={mockOnUpload} />);

            const input = screen.getByTestId('file-upload-input');
            const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });

            fireEvent.change(input, { target: { files: [file] } });

            expect(mockOnUpload).toHaveBeenCalledWith(file);
        });
    });

    describe('file validation', () => {
        it('should show error message for invalid file type', () => {
            const mockOnUpload = vi.fn();
            render(
                <FileUpload
                    {...defaultProps}
                    onUpload={mockOnUpload}
                    accept=".pdf"
                />
            );

            const input = screen.getByTestId('file-upload-input');
            const invalidFile = new File(['test'], 'document.txt', { type: 'text/plain' });

            fireEvent.change(input, { target: { files: [invalidFile] } });

            // Should show error message
            expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
            // Should not call upload
            expect(mockOnUpload).not.toHaveBeenCalled();
        });
    });

    describe('uploaded file display', () => {
        it('should display uploaded file with delete option', () => {
            const mockOnDelete = vi.fn();
            const existingFile: TakeOnDocument = {
                fileName: 'existing-document.pdf',
                storagePath: '/path/to/file',
                uploadedAt: new Date(),
                uploadedBy: 'user-123',
                fileSize: 1024 * 500, // 500KB
                mimeType: 'application/pdf',
                downloadUrl: 'https://example.com/file.pdf',
            };

            render(
                <FileUpload
                    {...defaultProps}
                    value={existingFile}
                    onDelete={mockOnDelete}
                />
            );

            // Should display file name
            expect(screen.getByText('existing-document.pdf')).toBeInTheDocument();

            // Should have delete button
            const deleteButton = screen.getByRole('button', { name: /delete/i });
            expect(deleteButton).toBeInTheDocument();

            // Click delete should trigger onDelete
            fireEvent.click(deleteButton);
            expect(mockOnDelete).toHaveBeenCalled();
        });
    });
});
