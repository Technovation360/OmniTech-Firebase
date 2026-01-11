
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
import { Edit, Trash2, ArrowUp, ArrowDown, Search } from 'lucide-react';
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
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>(initialSpecialties);
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>(initialSpecialties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialtyToEdit, setSpecialtyToEdit] = useState<Specialty | null>(null);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<Specialty | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Specialty; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Initial sort
    handleSort('name');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filteredData = allSpecialties;
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
      setAllSpecialties(allSpecialties.filter(s => s.id !== specialtyToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<Specialty, 'id'>) => {
    if (specialtyToEdit) {
        setAllSpecialties(allSpecialties.map(s => s.id === specialtyToEdit.id ? { ...specialtyToEdit, ...formData } : s));
    } else {
        const newSpecialty: Specialty = {
            ...formData,
            id: `spec_${Date.now()}`
        };
        setAllSpecialties([newSpecialty, ...allSpecialties]);
    }
    closeModal();
  };

  const handleSort = (key: keyof Specialty) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    // The sorting logic is now inside useEffect
  };

  const getSortIcon = (key: keyof Specialty) => {
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
                    <CardTitle className="text-lg">Medical Specialties</CardTitle>
                </div>
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
                    <Button onClick={openCreateModal} size="sm" className="w-auto sm:w-auto flex-shrink-0">ADD SPECIALTY</Button>
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
              {filteredSpecialties.map((specialty) => (
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

    

    
