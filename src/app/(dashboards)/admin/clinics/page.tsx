'use client';
import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2 } from 'lucide-react';
import { getClinicGroups } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';

function OnboardClinicForm({
  isOpen,
  onClose,
  clinic,
}: {
  isOpen: boolean;
  onClose: () => void;
  clinic: ClinicGroup | null;
}) {
  const isEditMode = !!clinic;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT CLINIC' : 'REGISTER CLINIC'}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <div className="space-y-1">
              <Label htmlFor="clinicName" className="text-[10px] font-semibold text-gray-600">CLINIC NAME</Label>
              <Input id="clinicName" className="h-7 text-xs" defaultValue={clinic?.name} />
            </div>
             <div className="space-y-1">
                <Label htmlFor="specialties" className="text-[10px] font-semibold text-gray-600">SPECIALTIES</Label>
                <Select defaultValue={clinic?.name.toLowerCase().includes('cardio') ? 'cardiology' : 'orthopedics'}>
                    <SelectTrigger id="specialties" className="h-7 text-xs">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cardiology">Cardiology</SelectItem>
                        <SelectItem value="orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-semibold text-gray-600">EMAIL</Label>
              <Input id="email" type="email" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-[10px] font-semibold text-gray-600">PHONE</Label>
              <Input id="phone" type="tel" className="h-7 text-xs" />
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <Label htmlFor="address" className="text-[10px] font-semibold text-gray-600">ADDRESS</Label>
              <Textarea id="address" rows={1} className="text-xs min-h-0" />
            </div>
             <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                <div className="space-y-1">
                <Label htmlFor="city" className="text-[10px] font-semibold text-gray-600">CITY</Label>
                <Input id="city" className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                <Label htmlFor="state" className="text-[10px] font-semibold text-gray-600">STATE</Label>
                <Input id="state" className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                <Label htmlFor="pin" className="text-[10px] font-semibold text-gray-600">PIN</Label>
                <Input id="pin" className="h-7 text-xs" />
                </div>
            </div>
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
          <Button variant="destructive" onClick={onClose} size="xs">
            CANCEL
          </Button>
          <Button size="xs">CONFIRM</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function DeleteClinicDialog({
  isOpen,
  onClose,
  onConfirm,
  clinicName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clinicName: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the clinic group "{clinicName}".
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


export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ClinicGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clinicToEdit, setClinicToEdit] = useState<ClinicGroup | null>(null);
  const [clinicToDelete, setClinicToDelete] = useState<ClinicGroup | null>(null);

  useEffect(() => {
    getClinicGroups().then(setClinics);
  }, []);
  
  const openEditModal = (clinic: ClinicGroup) => {
    setClinicToEdit(clinic);
    setIsModalOpen(true);
  }

  const openCreateModal = () => {
    setClinicToEdit(null);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setClinicToEdit(null);
  }
  
  const openDeleteDialog = (clinic: ClinicGroup) => {
    setClinicToDelete(clinic);
  }

  const closeDeleteDialog = () => {
    setClinicToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (clinicToDelete) {
      // In a real app, call an API to delete. Here we filter the state.
      setClinics(clinics.filter(c => c.id !== clinicToDelete.id));
      closeDeleteDialog();
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Clinics Management</CardTitle>
            <CardDescription>Onboard, edit, and manage clinic groups.</CardDescription>
          </div>
          <Button onClick={openCreateModal}>Onboard Clinic</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinic Name</TableHead>
                <TableHead>Primary Doctor</TableHead>
                <TableHead>Cabin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium py-2 text-xs">{clinic.name}</TableCell>
                  <TableCell className="py-2 text-xs">{clinic.doctor.name}</TableCell>
                  <TableCell className="py-2 text-xs">{clinic.cabin.name}</TableCell>
                  <TableCell className="flex gap-2 py-2">
                    <Button variant="outline" size="icon-sm" onClick={() => openEditModal(clinic)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon-sm" onClick={() => openDeleteDialog(clinic)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <OnboardClinicForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        clinic={clinicToEdit}
      />
      <DeleteClinicDialog 
        isOpen={!!clinicToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        clinicName={clinicToDelete?.name || ''}
      />
    </>
  )
}
