import React from "react";
import { useState } from "react";
import { Tournament } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface DeleteTournamentDialogProps {
  open: boolean;
  onClose: () => void;
  tournament: Tournament | null;
}

export default function DeleteTournamentDialog({
  open,
  onClose,
  tournament,
}: DeleteTournamentDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!tournament) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Tournament deletion moved to admin app
      toast({
        title: "Feature Unavailable",
        description: "Tournament deletion is only available in the admin app.",
        variant: "destructive",
      });
      
      onClose();
    } catch (error) {
      console.error("Error deleting tournament:", error);
      toast({
        title: "Error",
        description: "Failed to delete tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-dark-card border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{tournament.title}&quot;? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-dark-lighter border-gray-700"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Tournament"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 