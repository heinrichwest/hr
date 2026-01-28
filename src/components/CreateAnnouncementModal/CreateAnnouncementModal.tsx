// ============================================================
// CREATE ANNOUNCEMENT MODAL
// Modal for System Admin to create announcements
// ============================================================

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { NotificationService } from '../../services/notificationService';
import { CompanyService } from '../../services/companyService';
import type { UserRole } from '../../types/user';
import type { Company } from '../../types/company';

interface CreateAnnouncementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type RecipientType = 'all' | 'role' | 'department';

const AVAILABLE_ROLES: UserRole[] = [
    'HR Admin',
    'HR Manager',
    'Payroll Admin',
    'Payroll Manager',
    'Finance Approver',
    'Finance Read-Only',
    'Line Manager',
    'IR Officer',
    'IR Manager',
    'Employee'
];

export function CreateAnnouncementModal({
    open,
    onOpenChange,
    onSuccess
}: CreateAnnouncementModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [recipientType, setRecipientType] = useState<RecipientType>('all');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load companies for department selection
    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const allCompanies = await CompanyService.getCompanies();
                setCompanies(allCompanies);
            } catch (err) {
                console.error('Failed to load companies:', err);
            }
        };

        if (open && recipientType === 'department') {
            loadCompanies();
        }
    }, [open, recipientType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        if (!description.trim()) {
            setError('Description is required');
            return;
        }

        if (recipientType === 'role' && !selectedRole) {
            setError('Please select a role');
            return;
        }

        if (recipientType === 'department' && (!selectedCompanyId || !selectedDepartment)) {
            setError('Please select a company and department');
            return;
        }

        setLoading(true);

        try {
            // Determine company ID for the announcement
            const companyId = recipientType === 'department' ? selectedCompanyId : null;

            // Create announcement using NotificationService
            await NotificationService.createAnnouncement(
                companyId,
                title.trim(),
                description.trim(),
                recipientType,
                recipientType === 'role' ? selectedRole : selectedDepartment
            );

            // Reset form
            setTitle('');
            setDescription('');
            setRecipientType('all');
            setSelectedRole('');
            setSelectedDepartment('');
            setSelectedCompanyId('');

            // Close modal and call success callback
            onOpenChange(false);
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error('Failed to create announcement:', err);
            setError('Failed to create announcement. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form
        setTitle('');
        setDescription('');
        setRecipientType('all');
        setSelectedRole('');
        setSelectedDepartment('');
        setSelectedCompanyId('');
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>
                        Create a new announcement to broadcast to users or target specific roles/departments.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Title Input */}
                        <div className="grid gap-2">
                            <Label htmlFor="title">
                                Title <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Enter announcement title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Description Textarea */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                Description <span className="text-red-600">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Enter announcement description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>

                        {/* Recipient Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="recipientType">
                                Recipients <span className="text-red-600">*</span>
                            </Label>
                            <Select
                                value={recipientType}
                                onValueChange={(value) => setRecipientType(value as RecipientType)}
                            >
                                <SelectTrigger id="recipientType">
                                    <SelectValue placeholder="Select recipients" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="role">Specific Role</SelectItem>
                                    <SelectItem value="department">Specific Department</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Role Selection (conditionally shown) */}
                        {recipientType === 'role' && (
                            <div className="grid gap-2">
                                <Label htmlFor="role">
                                    Role <span className="text-red-600">*</span>
                                </Label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={setSelectedRole}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_ROLES.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Department Selection (conditionally shown) */}
                        {recipientType === 'department' && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="company">
                                        Company <span className="text-red-600">*</span>
                                    </Label>
                                    <Select
                                        value={selectedCompanyId}
                                        onValueChange={setSelectedCompanyId}
                                    >
                                        <SelectTrigger id="company">
                                            <SelectValue placeholder="Select a company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="department">
                                        Department <span className="text-red-600">*</span>
                                    </Label>
                                    <Input
                                        id="department"
                                        placeholder="Enter department ID"
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        disabled={!selectedCompanyId}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Note: Department selection will be improved with a dropdown in future updates
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Announcement'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
