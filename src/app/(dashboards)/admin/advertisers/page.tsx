
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
import { getAdvertisements } from '@/lib/data';

type Advertiser = {
  id: string;
  name: string;
  campaigns: number;
  status: 'active' | 'inactive';
};

const initialAdvertisers: Advertiser[] = [
    { id: 'adv_1', name: 'HealthCare Insurance', campaigns: 1, status: 'active'},
    { id: 'adv_2', name: 'PharmaCure', campaigns: 1, status: 'active'},
    { id: 'adv_3', name: 'Wellness Now', campaigns: 0, status: 'inactive'},
]


function AdvertiserForm({
  isOpen,
  onClose,
  advertiser,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  advertiser: Advertiser | null;
  onConfirm: (formData: Omit<Advertiser, 'id' | 'campaigns' | 'status'>) => void;
}) {
  const isEditMode = !!advertiser;
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
      if (advertiser) {
          setFormData({ name: advertiser.name });
      } else {
          setFormData({ name: ''});
      }
  }, [advertiser]);

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
            {isEditMode ? 'EDIT ADVERTISER' : 'ADD ADVERTISER'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4">
            <div className="space-y-1">
                <Label htmlFor="advertiserName" className="text-[10px] font-semibold text-gray-600">ADVERTISER NAME</Label>
                <Input id="advertiserName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => setFormData({ name: e.target.value})} />
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

function DeleteAdvertiserDialog({
    isOpen,
    onClose,
    onConfirm,
    advertiserName,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    advertiserName: string;
  }) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the advertiser "{advertiserName}".
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

export default function AdvertisersPage() {
  const [allAdvertisers, setAllAdvertisers] = useState<Advertiser[]>(initialAdvertisers);
  const [filteredAdvertisers, setFilteredAdvertisers] = useState<Advertiser[]>(initialAdvertisers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advertiserToEdit, setAdvertiserToEdit] = useState<Advertiser | null>(null);
  const [advertiserToDelete, setAdvertiserToDelete] = useState<Advertiser | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Advertiser; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let filteredData = allAdvertisers;
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allAdvertisers.filter(advertiser =>
            advertiser.name.toLowerCase().includes(lowercasedQuery)
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
      setFilteredAdvertisers(sorted);
    } else {
        setFilteredAdvertisers(filteredData);
    }

  }, [searchQuery, allAdvertisers, sortConfig]);

  const openEditModal = (advertiser: Advertiser) => {
    setAdvertiserToEdit(advertiser);
    setIsModalOpen(true);
  }

  const openCreateModal = () => {
    setAdvertiserToEdit(null);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setAdvertiserToEdit(null);
  }

  const openDeleteDialog = (advertiser: Advertiser) => {
    setAdvertiserToDelete(advertiser);
  }

  const closeDeleteDialog = () => {
    setAdvertiserToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (advertiserToDelete) {
      setAllAdvertisers(allAdvertisers.filter(s => s.id !== advertiserToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<Advertiser, 'id' | 'campaigns' | 'status'>) => {
    if (advertiserToEdit) {
        setAllAdvertisers(allAdvertisers.map(s => s.id === advertiserToEdit.id ? { ...advertiserToEdit, ...formData } : s));
    } else {
        const newAdvertiser: Advertiser = {
            ...formData,
            id: `adv_${Date.now()}`,
            campaigns: 0,
            status: 'inactive'
        };
        setAllAdvertisers([newAdvertiser, ...allAdvertisers]);
    }
    closeModal();
  };

  const handleSort = (key: keyof Advertiser) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Advertiser) => {
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
                    <CardTitle className="text-lg">Advertisers</CardTitle>
                    <CardDescription className="text-xs mt-1">Manage advertisers on the platform.</CardDescription>
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
                    <Button onClick={openCreateModal} size="sm" className="w-auto sm:w-auto flex-shrink-0">ADD ADVERTISER</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                    Advertiser Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('campaigns')}>
                        Campaigns
                        {getSortIcon('campaigns')}
                    </Button>
                </TableHead>
                 <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('status')}>
                        Status
                        {getSortIcon('status')}
                    </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvertisers.map((advertiser) => (
                <TableRow key={advertiser.id}>
                  <TableCell className="font-medium py-2 text-xs">{advertiser.name}</TableCell>
                  <TableCell className="py-2 text-xs text-center">{advertiser.campaigns}</TableCell>
                  <TableCell className="py-2 text-xs">
                     <Badge variant={advertiser.status === 'active' ? 'default' : 'secondary'} className={advertiser.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                        {advertiser.status}
                     </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2 py-2">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(advertiser)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(advertiser)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AdvertiserForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        advertiser={advertiserToEdit}
        onConfirm={handleFormConfirm}
      />
       <DeleteAdvertiserDialog 
        isOpen={!!advertiserToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        advertiserName={advertiserToDelete?.name || ''}
      />
    </>
  );
}
