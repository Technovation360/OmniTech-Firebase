'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

type Specialty = {
  id: string;
  name: string;
  forClinic: boolean;
  forDoctor: boolean;
};

const initialSpecialties: Specialty[] = [
  { id: 'spec_1', name: 'General Medicine', forClinic: true, forDoctor: true },
  { id: 'spec_2', name: 'Cardiology', forClinic: true, forDoctor: true },
  { id: 'spec_3', name: 'Pediatrics', forClinic: true, forDoctor: true },
  { id: 'spec_4', name: 'Dermatology', forClinic: true, forDoctor: true },
  { id: 'spec_5', name: 'Orthopedics', forClinic: true, forDoctor: true },
  { id: 'spec_6', name: 'Neurology', forClinic: true, forDoctor: true },
  { id: 'spec_7', name: 'Radiology', forClinic: true, forDoctor: true },
];

function SpecialtyForm({
  isOpen,
  onClose,
  specialty,
}: {
  isOpen: boolean;
  onClose: () => void;
  specialty: Specialty | null;
}) {
  const isEditMode = !!specialty;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Specialty' : 'Add Specialty'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="specialtyName">Specialty Name</Label>
            <Input id="specialtyName" defaultValue={specialty?.name || ''} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="forClinic" defaultChecked={specialty?.forClinic ?? true} />
            <Label htmlFor="forClinic">For Clinic</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="forDoctor" defaultChecked={specialty?.forDoctor ?? true} />
            <Label htmlFor="forDoctor">For Doctors</Label>
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onClose}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSpecialtyDialog({
    isOpen,
    onClose,
    onConfirm,
    specialtyName,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    specialtyName: string;
  }) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the specialty "{specialtyName}".
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

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>(initialSpecialties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialtyToEdit, setSpecialtyToEdit] = useState<Specialty | null>(null);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<Specialty | null>(null);


  const openEditModal = (specialty: Specialty) => {
    setSpecialtyToEdit(specialty);
    setIsModalOpen(true);
  }

  const openCreateModal = () => {
    setSpecialtyToEdit(null);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setSpecialtyToEdit(null);
  }

  const openDeleteDialog = (specialty: Specialty) => {
    setSpecialtyToDelete(specialty);
  }

  const closeDeleteDialog = () => {
    setSpecialtyToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (specialtyToDelete) {
      setSpecialties(specialties.filter(s => s.id !== specialtyToDelete.id));
      closeDeleteDialog();
    }
  }


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Medical Specialties</CardTitle>
            <CardDescription className="text-xs">Manage medical specialties for clinics and doctors.</CardDescription>
          </div>
          <Button onClick={openCreateModal} size="sm">ADD SPECIALTY</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specialty Name</TableHead>
                <TableHead>For Clinic</TableHead>
                <TableHead>For Doctors</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialties.map((specialty) => (
                <TableRow key={specialty.id}>
                  <TableCell className="font-medium py-2 text-xs">{specialty.name}</TableCell>
                  <TableCell className="py-2 text-xs">
                    {specialty.forClinic && <Badge variant="secondary" className="bg-green-100 text-green-800">YES</Badge>}
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    {specialty.forDoctor && <Badge variant="secondary" className="bg-blue-100 text-blue-800">YES</Badge>}
                  </TableCell>
                  <TableCell className="flex gap-2 py-2">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(specialty)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(specialty)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SpecialtyForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        specialty={specialtyToEdit}
      />
       <DeleteSpecialtyDialog 
        isOpen={!!specialtyToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        specialtyName={specialtyToDelete?.name || ''}
      />
    </>
  );
}
