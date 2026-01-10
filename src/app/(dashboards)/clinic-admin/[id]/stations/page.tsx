'use client';
import { useState, useEffect, use } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2 } from 'lucide-react';
import { getClinicGroupById } from '@/lib/data';
import type { Cabin } from '@/lib/types';

function CabinForm({
  isOpen,
  onClose,
  cabin,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  cabin: Cabin | null;
  onConfirm: (formData: { name: string }) => void;
}) {
  const isEditMode = !!cabin;
  const [name, setName] = useState('');

  useEffect(() => {
    if (cabin) {
      setName(cabin.name);
    } else {
      setName('');
    }
  }, [cabin]);

  const handleConfirm = () => {
    if (name) {
      onConfirm({ name });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Cabin' : 'Add Cabin'}</DialogTitle>
        </DialogHeader>
        <div>
          <div className="p-4">
            <Label htmlFor="cabinName">Cabin Name</Label>
            <Input
              id="cabinName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Consultation Room 1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCabinDialog({
  isOpen,
  onClose,
  onConfirm,
  cabinName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cabinName: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the cabin
            "{cabinName}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function StationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cabinToEdit, setCabinToEdit] = useState<Cabin | null>(null);
  const [cabinToDelete, setCabinToDelete] = useState<Cabin | null>(null);

  useEffect(() => {
    getClinicGroupById(clinicId).then((clinic) => {
      if (clinic) {
        // In a real app, you would fetch all cabins for a clinic.
        // For this mock, we'll just use the one from the group and add a few more.
        setCabins([
          clinic.cabin,
          { id: 'cab_102', name: 'Consultation Room 2' },
          { id: 'cab_103', name: 'Consultation Room 3' },
          { id: 'cab_104', name: 'Consultation Room 4' },
        ]);
      }
    });
  }, [clinicId]);

  const openEditModal = (cabin: Cabin) => {
    setCabinToEdit(cabin);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCabinToEdit(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCabinToEdit(null);
  };

  const openDeleteDialog = (cabin: Cabin) => {
    setCabinToDelete(cabin);
  };

  const closeDeleteDialog = () => {
    setCabinToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (cabinToDelete) {
      setCabins(cabins.filter((c) => c.id !== cabinToDelete.id));
      closeDeleteDialog();
    }
  };

  const handleFormConfirm = (formData: { name: string }) => {
    if (cabinToEdit) {
      setCabins(
        cabins.map((c) =>
          c.id === cabinToEdit.id ? { ...c, name: formData.name } : c
        )
      );
    } else {
      const newCabin: Cabin = {
        id: `cab_${Date.now()}`,
        name: formData.name,
      };
      setCabins([...cabins, newCabin]);
    }
    closeModal();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clinic Stations</CardTitle>
          <Button onClick={openCreateModal}>ADD CABIN</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cabins.map((cabin) => (
                <TableRow key={cabin.id}>
                  <TableCell className="font-medium">{cabin.name}</TableCell>
                  <TableCell>VACANT</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(cabin)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(cabin)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CabinForm
        isOpen={isModalOpen}
        onClose={closeModal}
        cabin={cabinToEdit}
        onConfirm={handleFormConfirm}
      />
      <DeleteCabinDialog
        isOpen={!!cabinToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        cabinName={cabinToDelete?.name || ''}
      />
    </>
  );
}
