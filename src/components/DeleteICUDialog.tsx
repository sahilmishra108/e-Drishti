
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface DeleteICUDialogProps {
    icuId: number;
    icuName: string;
    onICUDeleted: () => void;
}

const DeleteICUDialog = ({ icuId, icuName, onICUDeleted }: DeleteICUDialogProps) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/icus/${icuId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success(`ICU "${icuName}" deleted successfully`);
                onICUDeleted();
            } else {
                const error = await response.json();
                toast.error(`Failed to delete ICU: ${error.error}`);
            }
        } catch (error) {
            console.error("Error deleting ICU:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete <b>{icuName}</b> and all associated data, including bed assignments. Patients currently in this ICU will be unassigned.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        disabled={loading}
                    >
                        {loading ? "Deleting..." : "Delete ICU"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteICUDialog;
