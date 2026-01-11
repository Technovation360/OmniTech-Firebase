
'use client';
import { useState, useEffect, use } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Edit, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { getCabinsByClinicId } from '@/lib/data';
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
    if (isOpen) {
      if (cabin) {
        setName(cabin.name);
      } else {
        setName('');
      }
    }
  }, [cabin, isOpen]);

  const handleConfirm = () => {
    if (name) {
      onConfirm({ name });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT CABIN' : 'ADD CABIN'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4">
          <div className="space-y-1">
            <Label
              htmlFor="cabinName"
              className="text-[10px] font-semibold text-gray-600"
            >
              CABIN NAME
            </Label>
            <Input
              id="cabinName"
              className="h-7 text-[11px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Consultation Room 1"
            />
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
          <Button variant="destructive" onClick={onClose} size="xs">
            CANCEL
          </Button>
          <Button onClick={handleConfirm} size="xs">
            CONFIRM
          </Button>
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
  const [allCabins, setAllCabins] = useState<Cabin[]>([]);
  const [filteredCabins, setFilteredCabins] = useState<Cabin[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cabinToEdit, setCabinToEdit] = useState<Cabin | null>(null);
  const [cabinToDelete, setCabinToDelete] = useState<Cabin | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Cabin; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    getCabinsByClinicId(clinicId).then(setAllCabins);
  }, [clinicId]);

  useEffect(() => {
    let filteredData = allCabins;
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allCabins.filter(cabin =>
            cabin.name.toLowerCase().includes(lowercasedQuery)
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
      setFilteredCabins(sorted);
    } else {
        setFilteredCabins(filteredData);
    }
  }, [searchQuery, allCabins, sortConfig]);

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
      setAllCabins(allCabins.filter((c) => c.id !== cabinToDelete.id));
      closeDeleteDialog();
    }
  };

  const handleFormConfirm = (formData: { name: string }) => {
    if (cabinToEdit) {
      setAllCabins(
        allCabins.map((c) =>
          c.id === cabinToEdit.id ? { ...c, name: formData.name } : c
        )
      );
    } else {
      const newCabin: Cabin = {
        id: `cab_${Date.now()}`,
        name: formData.name,
        clinicId: clinicId,
      };
      setAllCabins([...allCabins, newCabin]);
    }
    closeModal();
  };

  const handleSort = (key: keyof Cabin) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof Cabin) => {
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
                    <CardTitle className="text-lg">Clinic Stations</CardTitle>
                    <CardDescription className="text-xs mt-1">Manage consultation cabins for your clinic.</CardDescription>
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
                    <Button onClick={openCreateModal} size="sm" className="w-auto sm:w-auto flex-shrink-0">ADD CABIN</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead>
                  <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                    Cabin Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCabins.map((cabin) => (
                <TableRow key={cabin.id}>
                  <TableCell className="font-medium py-2 text-xs">{cabin.name}</TableCell>
                  <TableCell className="py-2 text-xs">VACANT</TableCell>
                  <TableCell className="flex gap-2 py-2">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditModal(cabin)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openDeleteDialog(cabin)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
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

