
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface AddPatientDialogProps {
    onPatientAdded: () => void;
    icuId?: number;
}

const AddPatientDialog = ({ onPatientAdded, icuId }: AddPatientDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        patient_name: '',
        age: '',
        gender: '',
        diagnosis: '',
        admission_date: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Ensure ICU ID is available
        if (!icuId) {
            toast.error("ICU context is missing. Please select an ICU first.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    age: parseInt(formData.age),
                    icu_id: icuId
                }),
            });

            if (response.ok) {
                toast.success('Patient added successfully!', {
                    description: `${formData.patient_name} has been added to the system.`,
                });
                setOpen(false);
                setFormData({
                    patient_name: '',
                    age: '',
                    gender: '',
                    diagnosis: '',
                    admission_date: new Date().toISOString().split('T')[0],
                });
                onPatientAdded();
            } else {
                const error = await response.json();
                toast.error('Failed to add patient', {
                    description: error.message || 'Please try again.',
                });
            }
        } catch (error) {
            console.error('Error adding patient:', error);
            toast.error('Failed to add patient', {
                description: 'Network error. Please check your connection.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#0066CC] hover:bg-[#0052A3] text-white shadow-md">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add New Patient
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Add New Patient</DialogTitle>
                    <DialogDescription>
                        Enter patient details to create a new record in the current ICU.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="patient_name" className="font-semibold">
                                Patient Name *
                            </Label>
                            <Input
                                id="patient_name"
                                placeholder="John Doe"
                                value={formData.patient_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, patient_name: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="age" className="font-semibold">
                                    Age *
                                </Label>
                                <Input
                                    id="age"
                                    type="number"
                                    placeholder="45"
                                    min="0"
                                    max="150"
                                    value={formData.age}
                                    onChange={(e) =>
                                        setFormData({ ...formData, age: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="gender" className="font-semibold">
                                    Gender *
                                </Label>
                                <select
                                    id="gender"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.gender}
                                    onChange={(e) =>
                                        setFormData({ ...formData, gender: e.target.value })
                                    }
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="diagnosis" className="font-semibold">
                                Diagnosis *
                            </Label>
                            <Input
                                id="diagnosis"
                                placeholder="Hypertension"
                                value={formData.diagnosis}
                                onChange={(e) =>
                                    setFormData({ ...formData, diagnosis: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admission_date" className="font-semibold">
                                Admission Date *
                            </Label>
                            <Input
                                id="admission_date"
                                type="date"
                                value={formData.admission_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, admission_date: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#0066CC] hover:bg-[#0052A3]"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Patient'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPatientDialog;
