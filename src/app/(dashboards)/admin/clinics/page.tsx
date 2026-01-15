
'use client';
import { useState, useEffect, useMemo } from 'react';
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
import { Edit, Trash2, ArrowUp, ArrowDown, Search, Loader, PlusCircle } from 'lucide-react';
import type { Clinic } from '@/lib/types';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';


function OnboardClinicForm({
  isOpen,
  onClose,
  clinic,
  onConfirm,
  specialties
}: {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic | null;
  onConfirm: (formData: Omit<Clinic, 'id'>) => void;
  specialties: MultiSelectOption[];
}) {
  const isEditMode = !!clinic;
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    specialties: [] as string[],
    location: '',
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name,
        phone: clinic.phone || '',
        email: clinic.email || '',
        address: clinic.address || '',
        city: clinic.city || '',
        state: clinic.state || '',
        pincode: clinic.pincode || '',
        specialties: clinic.specialties || [],
        location: clinic.location,
      });
    } else {
        setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', specialties: [], location: '' });
    }
  }, [clinic]);

  const handleInputChange = (field: string, value: string | string[]) => {
      setFormData(prev => ({ ...prev, [field]: value}));
  }

  const handleConfirm = () => {
    // A more complete version would have validation here
    if (formData.name && formData.state && formData.city) {
        onConfirm({...formData, location: `${formData.city}, ${formData.state}`});
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT CLINIC' : 'ONBOARD CLINIC'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-2 pb-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="clinicName" className="text-[10px] font-semibold text-gray-600">CLINIC NAME</Label>
            <Input id="clinicName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-[10px] font-semibold text-gray-600">PHONE NUMBER</Label>
            <Input id="phone" type="tel" className="h-7 text-[11px]" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[10px] font-semibold text-gray-600">EMAIL</Label>
            <Input id="email" type="email" className="h-7 text-[11px]" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="address" className="text-[10px] font-semibold text-gray-600">ADDRESS</Label>
            <Textarea id="address" className="text-[11px] min-h-[60px]" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="city" className="text-[10px] font-semibold text-gray-600">CITY</Label>
            <Input id="city" className="h-7 text-[11px]" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="state" className="text-[10px] font-semibold text-gray-600">STATE</Label>
            <Input id="state" className="h-7 text-[11px]" value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pincode" className="text-[10px] font-semibold text-gray-600">PINCODE</Label>
            <Input id="pincode" className="h-7 text-[11px]" value={formData.pincode} onChange={(e) => handleInputChange('pincode', e.target.value)} />
          </div>
           <div className="space-y-1">
            <Label htmlFor="specialties" className="text-[10px] font-semibold text-gray-600">SPECIALTIES</Label>
            <MultiSelect
                options={specialties}
                selected={formData.specialties}
                onChange={(selected) => handleInputChange('specialties', selected)}
                className="text-[11px]"
                placeholder="Select specialties..."
            />
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
            <Button variant="destructive" onClick={onClose} size="xs" className="h-7">CANCEL</Button>
            <Button size="xs" onClick={handleConfirm} className="h-7">CONFIRM</Button>
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
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  const clinicsQuery = useMemoFirebase(() => {
    if (!currentUserData) return null;
    const { role, affiliation } = currentUserData;
    const clinicsCol = collection(firestore, 'clinics');
    
    if (role === 'central-admin') {
      return query(clinicsCol, where('type', '==', 'Clinic'));
    }
    if (role === 'clinic-admin' && affiliation) {
      return query(clinicsCol, where('type', '==', 'Clinic'), where('name', '==', affiliation));
    }
    return null;
  }, [firestore, currentUserData]);
  
  const { data: allClinics, isLoading: clinicsLoading } = useCollection<Clinic>(clinicsQuery);
  
  const specialtiesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'specialties'), where('forClinic', '==', true));
  }, [firestore, user]);
  const { data: specialtiesData, isLoading: specialtiesLoading } = useCollection<{id: string, name: string}>(specialtiesQuery);
  
  useEffect(() => {
    if(user && !isUserLoading) {
        getDoc(doc(firestore, 'users', user.uid)).then(snap => {
            if(snap.exists()) {
                setCurrentUserData(snap.data());
            }
        });
    }
  }, [user, isUserLoading, firestore]);

  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clinicToEdit, setClinicToEdit] = useState<Clinic | null>(null);
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Clinic; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc'});
  const [searchQuery, setSearchQuery] = useState('');
  
  const specialtyOptions = useMemo(() => {
    if (!specialtiesData) return [];
    return specialtiesData.map(s => ({ value: s.name, label: s.name }));
  }, [specialtiesData]);

  useEffect(() => {
    let sourceData = allClinics ? [...allClinics] : [];
    
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        sourceData = sourceData.filter(clinic => 
            clinic.name.toLowerCase().includes(lowercasedQuery) ||
            clinic.location.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      sourceData.sort((a, b) => {
        const valA = (a as any)[sortConfig.key]?.toLowerCase() || '';
        const valB = (b as any)[sortConfig.key]?.toLowerCase() || '';

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } 
    setFilteredClinics(sourceData);

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
      const docRef = doc(firestore, 'clinics', clinicToDelete.id);
      deleteDocumentNonBlocking(docRef);
      // Data will be removed from state by useCollection hook automatically
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<Clinic, 'id'>) => {
    if (clinicToEdit) {
      const docRef = doc(firestore, 'clinics', clinicToEdit.id);
      setDocumentNonBlocking(docRef, formData, { merge: true });
    } else {
      addDocumentNonBlocking(collection(firestore, 'clinics'), { ...formData, type: 'Clinic' });
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

  const isLoading = isUserLoading || !currentUserData || clinicsLoading || specialtiesLoading;
  
  if (isLoading && !allClinics) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Clinics Management</h1>
        {currentUserData?.role === 'central-admin' && (
          <Button onClick={openCreateModal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Onboard Clinic
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or location..." 
                        className="pl-9 h-9" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
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
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('pincode')}>
                        Pincode
                        {getSortIcon('pincode')}
                    </Button>
                </TableHead>
                <TableHead>
                    Specialties
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <Loader className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredClinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium py-2 text-xs">{clinic.name}</TableCell>
                  <TableCell className="py-2 text-xs">{clinic.pincode || '-'}</TableCell>
                  <TableCell className="py-2 text-xs">
                    <div className="flex flex-wrap gap-1">
                        {(clinic.specialties || []).map(spec => (
                            <Badge key={spec} variant="secondary" className="text-[10px]">{spec}</Badge>
                        ))}
                    </div>
                  </TableCell>
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
              {!isLoading && filteredClinics.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No clinics found.</TableCell>
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
        specialties={specialtyOptions}
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

    