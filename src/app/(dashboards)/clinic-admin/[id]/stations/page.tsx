
'use client';
import { useState, useEffect, use } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Edit, Trash2, Search, ArrowUp, ArrowDown, PlusCircle } from 'lucide-react';
import { getCabinsByClinicId } from '@/lib/data';
import type { Cabin } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown } from 'lucide-react';

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
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="space-y-1 w-full sm:w-auto">
                <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground">SEARCH STATION</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cabin name..."
                    className="pl-9 h-10 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <p className="text-xs font-medium text-muted-foreground text-right">{filteredCabins.length} TOTAL STATIONS</p>
                <Button onClick={openCreateModal} className="h-10">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    ADD STATION
                </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
          <CardHeader>
            <div className="grid grid-cols-12 font-semibold text-xs text-muted-foreground">
                <div className="col-span-6">STATION NAME</div>
                <div className="col-span-3 text-center">STATUS</div>
                <div className="col-span-3 text-center">ACTIONS</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible>
                {filteredCabins.map((cabin) => (
                    <AccordionItem value={cabin.id} key={cabin.id} className="border-b last:border-b-0">
                          <div className="grid grid-cols-12 items-center group">
                              <div className="col-span-6 p-4">
                                  <AccordionTrigger className="hover:no-underline p-0 w-full">
                                      <div className="flex items-center gap-3">
                                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:-rotate-180" />
                                          <div>
                                              <p className="font-semibold text-sm text-card-foreground">{cabin.name}</p>
                                          </div>
                                      </div>
                                  </AccordionTrigger>
                              </div>
                              <div className="col-span-3 py-0 px-2 text-center">
                                 <p className="text-xs text-green-600 font-semibold">VACANT</p>
                              </div>
                              <div className="col-span-3 p-4 flex justify-center gap-1">
                                <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(cabin)}>
                                    <Edit className="h-4 w-4 text-muted-foreground"/>
                                </Button>
                                <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(cabin)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                              </div>
                        </div>
                        <AccordionContent className="bg-muted/30 p-6">
                            <p className="text-center text-xs text-muted-foreground">No further details for this station.</p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                  {filteredCabins.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                      No stations found.
                    </div>
                  )}
            </Accordion>
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
    </div>
  );
}
