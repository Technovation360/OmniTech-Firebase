
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
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowUp, ArrowDown, Search, Loader } from 'lucide-react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type Specialty = {
  id: string;
  name: string;
  forClinic: boolean;
  forDoctor: boolean;
};

const seedSpecialties = [
    { name: 'Cardiology', forClinic: true, forDoctor: true },
    { name: 'Orthopedics', forClinic: true, forDoctor: true },
    { name: 'Pediatrics', forClinic: true, forDoctor: true },
    { name: 'General Medicine', forClinic: true, forDoctor: true },
    { name: 'Neurology', forClinic: false, forDoctor: true },
    { name: 'Oncology', forClinic: true, forDoctor: false },
]

function SpecialtyForm({
  isOpen,
  onClose,
  specialty,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  specialty: Specialty | null;
  onConfirm: (formData: Omit<Specialty, 'id'>) => void;
}) {
  const isEditMode = !!specialty;
  const [formData, setFormData] = useState({
      name: '',
      forClinic: true,
      forDoctor: true,
  });

  useEffect(() => {
      if (specialty) {
          setFormData({
              name: specialty.name,
              forClinic: specialty.forClinic,
              forDoctor: specialty.forDoctor,
          });
      } else {
          setFormData({ name: '', forClinic: true, forDoctor: true });
      }
  }, [specialty]);

  const handleConfirm = () => {
    if (formData.name) {
        onConfirm(formData);
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT SPECIALTY' : 'ADD SPECIALTY'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4">
            <div className="space-y-1">
                <Label htmlFor="specialtyName" className="text-[10px] font-semibold text-gray-600">SPECIALTY NAME</Label>
                <Input id="specialtyName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="mt-4 flex gap-4">
                <div className="flex items-center gap-2">
                    <Checkbox id="forClinic" checked={formData.forClinic} onCheckedChange={(checked) => setFormData({...formData, forClinic: !!checked})} />
                    <Label htmlFor="forClinic" className="text-xs font-normal">For Clinic</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox id="forDoctor" checked={formData.forDoctor} onCheckedChange={(checked) => setFormData({...formData, forDoctor: !!checked})} />
                    <Label htmlFor="forDoctor" className="text-xs font-normal">For Doctors</Label>
                </div>
            </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
            <Button variant="destructive" onClick={onClose} size="xs">CANCEL</Button>
            <Button onClick={handleConfirm} size="xs">CONFIRM</Button>
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
  const firestore = useFirestore();
  const specialtiesRef = useMemoFirebase(() => collection(firestore, 'specialties'), [firestore]);
  const { data: allSpecialties, isLoading } = useCollection<Specialty>(specialtiesRef);
  
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialtyToEdit, setSpecialtyToEdit] = useState<Specialty | null>(null);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<Specialty | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Specialty; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSeeded, setHasSeeded] = useState(false);
  
  useEffect(() => {
    if (!isLoading && allSpecialties && allSpecialties.length === 0 && !hasSeeded) {
        console.log("No specialties found, seeding...");
        setHasSeeded(true);
        for(const specialty of seedSpecialties) {
            addDocumentNonBlocking(collection(firestore, 'specialties'), specialty);
        }
    }
  }, [allSpecialties, isLoading, hasSeeded, firestore]);

  useEffect(() => {
    if (!allSpecialties) {
        setFilteredSpecialties([]);
        return;
    };
    
    let filteredData = [...allSpecialties];
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allSpecialties.filter(specialty =>
            specialty.name.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredSpecialties(sorted);
    } else {
        setFilteredSpecialties(filteredData);
    }

  }, [searchQuery, allSpecialties, sortConfig]);

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
      deleteDocumentNonBlocking(doc(firestore, 'specialties', specialtyToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<Specialty, 'id'>) => {
    if (specialtyToEdit) {
        setDocumentNonBlocking(doc(firestore, 'specialties', specialtyToEdit.id), formData, { merge: true });
    } else {
        addDocumentNonBlocking(collection(firestore, 'specialties'), formData);
    }
    closeModal();
  };

  const handleSort = (key: keyof Specialty) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Specialty) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };


  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Medical Specialties</h1>
        <Button onClick={openCreateModal}>ADD SPECIALTY</Button>
      </div>
      <Card>
        <CardHeader>
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                            placeholder="Search by name..." 
                            className="pl-9 h-9" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                    Specialty Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="text-xs">For Clinic</TableHead>
                <TableHead className="text-xs">For Doctors</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={4} className="text-center"><Loader className="animate-spin mx-auto" /></TableCell></TableRow>}
              {!isLoading && filteredSpecialties && filteredSpecialties.map((specialty) => (
                <TableRow key={specialty.id}>
                  <TableCell className="font-medium py-2 text-xs">{specialty.name}</TableCell>
                  <TableCell className="py-2 text-xs">
                    <Checkbox checked={specialty.forClinic} disabled />
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    <Checkbox checked={specialty.forDoctor} disabled />
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
              {!isLoading && (!filteredSpecialties || filteredSpecialties.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No specialties found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SpecialtyForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        specialty={specialtyToEdit}
        onConfirm={handleFormConfirm}
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
