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
import { Badge } from '@/components/ui/badge';
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
import { Edit, Trash2, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { getClinicGroups } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';
import { cn } from '@/lib/utils';

function OnboardClinicForm({
  isOpen,
  onClose,
  clinic,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  clinic: ClinicGroup | null;
  onConfirm: (formData: Omit<ClinicGroup, 'id' | 'doctor' | 'assistants' | 'cabin' | 'screen'>) => void;
}) {
  const isEditMode = !!clinic;
  const [formData, setFormData] = useState({
    name: '',
    specialties: [] as string[],
    contact: '',
    location: ''
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name,
        specialties: clinic.specialties,
        contact: clinic.contact,
        location: clinic.location,
      });
    } else {
        setFormData({ name: '', specialties: [], contact: '', location: '' });
    }
  }, [clinic]);

  const handleInputChange = (field: string, value: string | string[]) => {
      setFormData(prev => ({ ...prev, [field]: value}));
  }

  const handleConfirm = () => {
    // A more complete version would have validation here
    onConfirm(formData);
    onClose();
  };

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
              <Input id="clinicName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
            </div>
             <div className="space-y-1">
                <Label htmlFor="specialties" className="text-[10px] font-semibold text-gray-600">SPECIALTIES</Label>
                <Select value={formData.specialties[0]} onValueChange={(val) => handleInputChange('specialties', [val])}>
                    <SelectTrigger className="h-7 text-[11px]">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cardiology" className="text-[11px]">Cardiology</SelectItem>
                        <SelectItem value="Orthopedics" className="text-[11px]">Orthopedics</SelectItem>
                        <SelectItem value="Pediatrics" className="text-[11px]">Pediatrics</SelectItem>
                        <SelectItem value="General Medicine" className="text-[11px]">General Medicine</SelectItem>
                        <SelectItem value="Dermatology" className="text-[11px]">Dermatology</SelectItem>
                        <SelectItem value="Neurology" className="text-[11px]">Neurology</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-semibold text-gray-600">EMAIL</Label>
              <Input id="email" type="email" className="h-7 text-[11px]" value={formData.contact} onChange={(e) => handleInputChange('contact', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-[10px] font-semibold text-gray-600">PHONE</Label>
              <Input id="phone" type="tel" className="h-7 text-[11px]" defaultValue={''} />
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <Label htmlFor="address" className="text-[10px] font-semibold text-gray-600">ADDRESS</Label>
              <Textarea id="address" rows={2} className="text-[11px]" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-x-4 col-span-1 md:col-span-2">
                <div className="space-y-1">
                    <Label htmlFor="city" className="text-[10px] font-semibold text-gray-600">CITY</Label>
                    <Input id="city" className="h-7 text-[11px]" defaultValue={''} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="state" className="text-[10px] font-semibold text-gray-600">STATE</Label>
                    <Input id="state" className="h-7 text-[11px]" defaultValue={''} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="pin" className="text-[10px] font-semibold text-gray-600">PIN</Label>
                    <Input id="pin" className="h-7 text-[11px]" defaultValue={''} />
                </div>
            </div>
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
          <Button variant="destructive" onClick={onClose} size="xs">
            CANCEL
          </Button>
          <Button size="xs" onClick={handleConfirm}>CONFIRM</Button>
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

const badgeColors = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
];


export default function ClinicsPage() {
  const [allClinics, setAllClinics] = useState<ClinicGroup[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<ClinicGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clinicToEdit, setClinicToEdit] = useState<ClinicGroup | null>(null);
  const [clinicToDelete, setClinicToDelete] = useState<ClinicGroup | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ClinicGroup; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc'});
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    getClinicGroups().then(data => {
        setAllClinics(data);
        setFilteredClinics(data);
    });
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filteredData = allClinics.filter(clinic => 
        clinic.name.toLowerCase().includes(lowercasedQuery) ||
        clinic.contact.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredClinics(filteredData);
    // Reset sort when searching
    if (searchQuery) {
        setSortConfig(null);
    } else {
        handleSort('name'); // Or your default sort
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allClinics]);
  
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
      setAllClinics(allClinics.filter(c => c.id !== clinicToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<ClinicGroup, 'id' | 'doctor' | 'assistants' | 'cabin' | 'screen'>) => {
    if (clinicToEdit) {
      // Update existing clinic
      setAllClinics(allClinics.map(c => c.id === clinicToEdit.id ? { ...clinicToEdit, ...formData } : c));
    } else {
      // Add new clinic
      const newClinic: ClinicGroup = {
        ...formData,
        id: `grp_${Date.now()}`,
        doctor: { id: 'doc_new', name: 'New Doctor' }, // Dummy data
        assistants: [],
        cabin: { id: 'cab_new', name: 'New Cabin'},
        screen: { id: 'scr_main_hall', name: 'Main Hall Display'},
      };
      setAllClinics([newClinic, ...allClinics]);
    }
    closeModal();
  };

  const handleSort = (key: keyof ClinicGroup) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedClinics = [...filteredClinics].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (Array.isArray(aVal) && Array.isArray(bVal)) {
         const aFirst = aVal[0] || '';
         const bFirst = bVal[0] || '';
         if (aFirst < bFirst) return direction === 'asc' ? -1 : 1;
         if (aFirst > bFirst) return direction === 'asc' ? 1 : -1;
         return 0;
      }

      // Handle string or number sorting
      const valA = typeof aVal === 'string' ? aVal.toLowerCase() : aVal;
      const valB = typeof bVal === 'string' ? bVal.toLowerCase() : bVal;

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredClinics(sortedClinics);
  };
  
  const getSortIcon = (key: keyof ClinicGroup) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-lg">Clinics Management</CardTitle>
                    <CardDescription className="text-xs mt-1">Onboard, edit, and manage clinic groups.</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                            placeholder="Search by name or email..." 
                            className="pl-9 h-9" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={openCreateModal} size="sm" className="w-auto sm:w-auto flex-shrink-0">Onboard Clinic</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                   <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                        Clinic Name
                        {getSortIcon('name')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('location')}>
                        Location
                        {getSortIcon('location')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('specialties')}>
                        Specialties
                        {getSortIcon('specialties')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('contact')}>
                        Contact
                        {getSortIcon('contact')}
                    </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium py-2 text-xs">{clinic.name}</TableCell>
                  <TableCell className="py-2 text-xs">{clinic.location}</TableCell>
                   <TableCell className="py-2 text-xs">
                    <div className="flex gap-1">
                      {clinic.specialties.map((specialty, index) => (
                        <Badge key={specialty} variant="secondary" className={cn("text-[10px] border-transparent", badgeColors[index % badgeColors.length])}>{specialty}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs">{clinic.contact}</TableCell>
                  <TableCell className="flex gap-2 py-2">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(clinic)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(clinic)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
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
        onConfirm={handleFormConfirm}
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
