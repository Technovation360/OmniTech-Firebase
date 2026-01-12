
'use client';
import { useState, useEffect } from 'react';
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
import { Edit, Trash2, ArrowUp, ArrowDown, Search, Loader } from 'lucide-react';
import type { Clinic } from '@/lib/types';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getClinics } from '@/lib/data';


function OnboardClinicForm({
  isOpen,
  onClose,
  clinic,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic | null;
  onConfirm: (formData: Omit<Clinic, 'id'>) => void;
}) {
  const isEditMode = !!clinic;
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name,
        location: clinic.location,
      });
    } else {
        setFormData({ name: '', location: '' });
    }
  }, [clinic]);

  const handleInputChange = (field: string, value: string | string[]) => {
      setFormData(prev => ({ ...prev, [field]: value}));
  }

  const handleConfirm = () => {
    // A more complete version would have validation here
    if (formData.name && formData.location) {
        onConfirm(formData);
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT CLINIC' : 'ONBOARD CLINIC'}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="clinicName" className="text-[10px] font-semibold text-gray-600">CLINIC NAME</Label>
            <Input id="clinicName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="location" className="text-[10px] font-semibold text-gray-600">LOCATION</Label>
            <Input id="location" className="h-7 text-[11px]" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="e.g. Maharashtra, Mumbai"/>
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
            This action cannot be undone. This will permanently delete the clinic "{clinicName}".
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
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);

  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clinicToEdit, setClinicToEdit] = useState<Clinic | null>(null);
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Clinic; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc'});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isUserLoading) {
      setClinicsLoading(true);
      return;
    }
    if (!user) {
      setAllClinics([]);
      setClinicsLoading(false);
      return;
    }

    const fetchAndSeedClinics = async () => {
      setClinicsLoading(true);
      const clinicsQuery = query(collection(firestore, 'groups'), where('type', '==', 'Clinic'));
      const querySnapshot = await getDocs(clinicsQuery);
      
      let clinicsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic));

      if (clinicsData.length === 0) {
        console.log("No clinics found, seeding database...");
        // If no clinics exist, seed them
        const sampleClinics: Omit<Clinic, 'id'>[] = [
          { name: 'City Care Clinic', location: 'Maharashtra, Mumbai', type: 'Clinic' },
          { name: 'Health Plus Clinic', location: 'Maharashtra, Pune', type: 'Clinic' },
        ];
        
        for (const clinicData of sampleClinics) {
            await addDoc(collection(firestore, "groups"), clinicData);
        }
        
        // Re-fetch after seeding
        const seededSnapshot = await getDocs(clinicsQuery);
        clinicsData = seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic));
      }

      setAllClinics(clinicsData);
      setClinicsLoading(false);
    };

    fetchAndSeedClinics();

  }, [user, isUserLoading, firestore]);


  useEffect(() => {
    if (!allClinics) {
      setFilteredClinics([]);
      return;
    };
    
    let filteredData = allClinics;

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(clinic => 
            clinic.name.toLowerCase().includes(lowercasedQuery) ||
            clinic.location.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        const valA = (a as any)[sortConfig.key]?.toLowerCase() || '';
        const valB = (b as any)[sortConfig.key]?.toLowerCase() || '';

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredClinics(sorted);
    } else {
        setFilteredClinics(filteredData);
    }
  }, [searchQuery, allClinics, sortConfig]);
  
  const openEditModal = (clinic: Clinic) => {
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
  
  const openDeleteDialog = (clinic: Clinic) => {
    setClinicToDelete(clinic);
  }

  const closeDeleteDialog = () => {
    setClinicToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (clinicToDelete) {
      const docRef = doc(firestore, 'groups', clinicToDelete.id);
      deleteDocumentNonBlocking(docRef);
      setAllClinics(prev => prev.filter(c => c.id !== clinicToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<Clinic, 'id'>) => {
    if (clinicToEdit) {
      const docRef = doc(firestore, 'groups', clinicToEdit.id);
      setDocumentNonBlocking(docRef, formData, { merge: true });
      setAllClinics(prev => prev.map(c => c.id === clinicToEdit.id ? { ...c, ...formData } : c));
    } else {
      addDocumentNonBlocking(collection(firestore, 'groups'), { ...formData, type: 'Clinic' }).then(docRef => {
        if(docRef) {
          const newClinic = { ...formData, id: docRef.id };
          setAllClinics(prev => [newClinic, ...prev]);
        }
      });
    }
    closeModal();
  };

  const handleSort = (key: keyof Clinic) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof Clinic) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Clinics Management</h1>
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                            placeholder="Search by name or location..." 
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(clinicsLoading) && <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>}
              {!clinicsLoading && filteredClinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium py-2 text-xs">{clinic.name}</TableCell>
                  <TableCell className="py-2 text-xs">{clinic.location}</TableCell>
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
              {!clinicsLoading && filteredClinics.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No clinics found.</TableCell>
                 </TableRow>
              )}
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
