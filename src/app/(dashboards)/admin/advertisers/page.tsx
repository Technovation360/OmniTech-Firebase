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
import { Switch } from '@/components/ui/switch';
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
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type Advertiser = {
  id: string;
  name: string;
  campaigns: number;
  status: 'active' | 'inactive';
  campaignsLimit?: number;
};

function AdvertiserForm({
  isOpen,
  onClose,
  advertiser,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  advertiser: Advertiser | null;
  onConfirm: (formData: Omit<Advertiser, 'id' | 'campaigns'>) => void;
}) {
  const isEditMode = !!advertiser;
  const [formData, setFormData] = useState({ name: '', status: 'inactive' as 'active' | 'inactive', campaignsLimit: 0 });

  useEffect(() => {
      if (advertiser) {
          setFormData({ name: advertiser.name, status: advertiser.status, campaignsLimit: advertiser.campaignsLimit || 0 });
      } else {
          setFormData({ name: '', status: 'inactive', campaignsLimit: 0 });
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
        <div className="p-4 pb-4 space-y-4">
            <div className="space-y-1">
                <Label htmlFor="advertiserName" className="text-[10px] font-semibold text-gray-600">ADVERTISER NAME</Label>
                <Input id="advertiserName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="campaignsLimit" className="text-[10px] font-semibold text-gray-600">CAMPAIGNS LIMIT</Label>
                <Input id="campaignsLimit" type="number" className="h-7 text-[11px]" value={formData.campaignsLimit} onChange={(e) => setFormData(prev => ({...prev, campaignsLimit: parseInt(e.target.value, 10) || 0}))} />
            </div>
            {isEditMode && (
                <div className="flex items-center space-x-2 pt-2">
                    <Switch
                        id="status"
                        checked={formData.status === 'active'}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                            ...prev,
                            status: checked ? 'active' : 'inactive',
                            }))
                        }
                    />
                    <Label htmlFor="status" className="text-xs">
                        {formData.status === 'active' ? 'Active' : 'Inactive'}
                    </Label>
                </div>
            )}
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
  const firestore = useFirestore();
  const advertisersQuery = useMemoFirebase(() => collection(firestore, 'advertisers'), [firestore]);
  const { data: allAdvertisers, isLoading } = useCollection<Advertiser>(advertisersQuery);

  const [filteredAdvertisers, setFilteredAdvertisers] = useState<Advertiser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advertiserToEdit, setAdvertiserToEdit] = useState<Advertiser | null>(null);
  const [advertiserToDelete, setAdvertiserToDelete] = useState<Advertiser | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let sourceData = allAdvertisers || [];
    let filteredData = [...sourceData];
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(advertiser =>
            advertiser.name.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        let aVal: any, bVal: any;

        switch(sortConfig.key) {
            case 'availableLimit':
                aVal = (a.campaignsLimit || 0) - a.campaigns;
                bVal = (b.campaignsLimit || 0) - b.campaigns;
                break;
            default:
                aVal = a[sortConfig.key as keyof Advertiser];
                bVal = b[sortConfig.key as keyof Advertiser];
        }
        
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
      deleteDocumentNonBlocking(doc(firestore, 'advertisers', advertiserToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<Advertiser, 'id' | 'campaigns'>) => {
    if (advertiserToEdit) {
        setDocumentNonBlocking(doc(firestore, 'advertisers', advertiserToEdit.id), formData, { merge: true });
    } else {
        const newAdvertiser: Omit<Advertiser, 'id'> = {
            ...formData,
            campaigns: 0,
        };
        addDocumentNonBlocking(collection(firestore, 'advertisers'), newAdvertiser);
    }
    closeModal();
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };


  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Advertisers</h1>
        <Button onClick={openCreateModal}>ADD ADVERTISER</Button>
      </div>
      <Card>
        <CardHeader>
            <div className="flex items-center">
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
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('campaignsLimit')}>
                        Limit
                        {getSortIcon('campaignsLimit')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('availableLimit')}>
                        Available
                        {getSortIcon('availableLimit')}
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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredAdvertisers.map((advertiser) => (
                <TableRow key={advertiser.id}>
                  <TableCell className="font-medium py-2 text-xs">{advertiser.name}</TableCell>
                  <TableCell className="py-2 text-xs text-center">{advertiser.campaigns}</TableCell>
                  <TableCell className="py-2 text-xs text-center">{advertiser.campaignsLimit || 0}</TableCell>
                  <TableCell className="py-2 text-xs text-center">{(advertiser.campaignsLimit || 0) - advertiser.campaigns}</TableCell>
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
               {!isLoading && filteredAdvertisers.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-4">No advertisers found.</TableCell>
                 </TableRow>
              )}
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
