
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AddICUDialogProps {
    onICUAdded: () => void;
}

const AddICUDialog = ({ onICUAdded }: AddICUDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        icu_name: "",
        location: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("http://localhost:3000/api/icus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add ICU");
            }

            toast.success("ICU added successfully");
            setFormData({ icu_name: "", location: "" });
            setOpen(false);
            onICUAdded();
        } catch (error: any) {
            console.error("Error adding ICU:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all rounded-full gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Add ICU
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Add New ICU
                    </DialogTitle>
                    <DialogDescription>
                        Create a new Intensive Care Unit to manage patients.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="icu_name" className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                ICU Name
                            </Label>
                            <Input
                                id="icu_name"
                                name="icu_name"
                                placeholder="e.g. General ICU, Cardiac ICU"
                                value={formData.icu_name}
                                onChange={handleChange}
                                required
                                className="bg-white/50 border-input focus:border-primary/50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location" className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                Location
                            </Label>
                            <Input
                                id="location"
                                name="location"
                                placeholder="e.g. Floor 2, Building A"
                                value={formData.location}
                                onChange={handleChange}
                                className="bg-white/50 border-input focus:border-primary/50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                            {loading ? "Creating..." : "Create ICU"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddICUDialog;
