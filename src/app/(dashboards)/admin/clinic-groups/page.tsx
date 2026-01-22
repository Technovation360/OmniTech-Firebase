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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Search, Loader, PlusCircle } from 'lucide-react';
import type { AdvertiserClinicGroup, Clinic, Category, User } from '@/lib/types';
import { collection, doc, query, getDocs, where } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type Advertiser = { id: string, name: string };

function ClinicGroupForm({
  isOpen,
  onClose,
  clinicGroup,
  onConfirm,
  clinics,
  advertisers,
  categories,
  currentUser
}: {
  isOpen: boolean;
  onClose: () => void;
  clinicGroup: AdvertiserClinicGroup | null;
  onConfirm: (formData: Omit<AdvertiserClinicGroup, 'id'>) => void;
  clinics: MultiSelectOption[];
  advertisers: Advertiser[];
  categories: Category[];
  currentUser: User | null;
}) {
  const isEditMode = !!clinicGroup;
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    advertiserId: '',
    clinicIds: [] as string[],
    categoryId: '',
  });

  useEffect(() => {
    if (clinicGroup) {
      setFormData({
        name: clinicGroup.name,
        advertiserId: clinicGroup.advertiserId,
        clinicIds: clinicGroup.clinicIds || [],
        categoryId: clinicGroup.categoryId || '',
      });
    } else {
      setFormData({ name: '', advertiserId: '', clinicIds: [], categoryId: '' });
    }
  }, [clinicGroup]);

  const handleInputChange = (field: string, value: string | string[]) => {
      setFormData(prev => ({ ...prev, [field]: value}));
  }

  const handleConfirm = () => {
    if (!formData.name || (currentUser?.role !== 'advertiser' && !formData.advertiserId) || formData.clinicIds.length === 0 || !formData.categoryId) {
        toast({ variant: 'destructive', title: "All fields are required."});
        return;
    }
    const category = categories.find(c => c.id === formData.categoryId);
    onConfirm({ ...formData, categoryName: category?.name || '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{isEditMode ? 'Edit Clinic Group' : 'Create Clinic Group'}</DialogTitle>
          <DialogDescription>
            Group clinics together and assign them to an advertiser for targeted campaigns.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            <div className="col-span-2 space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input id="groupName" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
            </div>
            {currentUser?.role !== 'advertiser' && (
              <div className="space-y-2">
                  <Label htmlFor="advertiser">Advertiser</Label>
                   <Select value={formData.advertiserId} onValueChange={(value) => handleInputChange('advertiserId', value)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Select an advertiser..." />
                      </SelectTrigger>
                      <SelectContent>
                          {advertisers.map(ad => <SelectItem key={ad.id} value={ad.id}>{ad.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="col-span-2 space-y-2">
                <Label htmlFor="clinics">Clinics</Label>
                <MultiSelect
                    options={clinics}
                    selected={formData.clinicIds}
                    onChange={(selected) => handleInputChange('clinicIds', selected)}
                    placeholder="Select clinics..."
                />
            </div>
        </div>
        <DialogFooter className="bg-muted/50 px-6 py-4 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteClinicGroupDialog({
  isOpen,
  onClose,
  onConfirm,
  groupName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDesc>
            This action cannot be undone. This will permanently delete the clinic group "{groupName}".
          </AlertDialogDesc>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function ClinicGroupsPage() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [advertiserId, setAdvertiserId] = useState<string | null>(null);

  useEffect(() => {
    if (authUser && !isUserLoading) {
      const userDocRef = doc(firestore, 'users', authUser.uid);
      getDoc(userDocRef).then(snap => {
        if (snap.exists()) {
          const userData = snap.data() as User;
          setCurrentUserData(userData);
          if (userData.role === 'advertiser' && userData.affiliation) {
            const advQuery = query(collection(firestore, 'advertisers'), where('name', '==', userData.affiliation));
            getDocs(advQuery).then((advSnap) => {
              if (!advSnap.empty) {
                setAdvertiserId(advSnap.docs[0].id);
              }
            });
          }
        }
      });
    }
  }, [authUser, isUserLoading, firestore]);
  
  const clinicGroupsQuery = useMemoFirebase(() => {
    if (!currentUserData) return null;
    const baseQuery = collection(firestore, 'advertiser_clinic_groups');
    if (currentUserData.role === 'central-admin') {
      return query(baseQuery);
    }
    if (currentUserData.role === 'advertiser' && advertiserId) {
      return query(baseQuery, where('advertiserId', '==', advertiserId));
    }
    return null;
  }, [firestore, currentUserData, advertiserId]);

  const { data: allClinicGroups, isLoading: groupsLoading } = useCollection<AdvertiserClinicGroup>(clinicGroupsQuery);
  
  const advertisersQuery = useMemoFirebase(() => query(collection(firestore, 'advertisers')), [firestore]);
  const { data: advertisers, isLoading: advertisersLoading } = useCollection<Advertiser>(advertisersQuery);
  
  const clinicsQuery = useMemoFirebase(() => query(collection(firestore, 'clinics')), [firestore]);
  const { data: clinics, isLoading: clinicsLoading } = useCollection<Clinic>(clinicsQuery);
  
  const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categories')), [firestore]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  const [filteredClinicGroups, setFilteredClinicGroups] = useState<AdvertiserClinicGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<AdvertiserClinicGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<AdvertiserClinicGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const clinicOptions = useMemo(() => {
    if (!clinics) return [];
    return clinics.map(c => ({ value: c.id, label: c.name }));
  }, [clinics]);

  const advertiserMap = useMemo(() => {
    if (!advertisers) return new Map();
    return new Map(advertisers.map(a => [a.id, a.name]));
  }, [advertisers]);
  
  const categoryMap = useMemo(() => {
    if (!categories) return new Map();
    return new Map(categories.map(c => [c.id, c.name]));
  }, [categories]);

  useEffect(() => {
    let sourceData = allClinicGroups ? [...allClinicGroups] : [];
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        sourceData = sourceData.filter(group => 
            group.name.toLowerCase().includes(lowercasedQuery) ||
            (advertiserMap.get(group.advertiserId) || '').toLowerCase().includes(lowercasedQuery) ||
            (categoryMap.get(group.categoryId) || '').toLowerCase().includes(lowercasedQuery)
        );
    }
    setFilteredClinicGroups(sourceData);
  }, [searchQuery, allClinicGroups, advertiserMap, categoryMap]);
  
  const openEditModal = (group: AdvertiserClinicGroup) => {
    setGroupToEdit(group);
    setIsModalOpen(true);
  }

  const openCreateModal = () => {
    setGroupToEdit(null);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setGroupToEdit(null);
  }
  
  const openDeleteDialog = (group: AdvertiserClinicGroup) => {
    setGroupToDelete(group);
  }

  const closeDeleteDialog = () => {
    setGroupToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (groupToDelete) {
      deleteDocumentNonBlocking(doc(firestore, 'advertiser_clinic_groups', groupToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<AdvertiserClinicGroup, 'id'>) => {
    const dataToSave = { ...formData };
    if (currentUserData?.role === 'advertiser' && advertiserId) {
        dataToSave.advertiserId = advertiserId;
    }
    if (groupToEdit) {
      setDocumentNonBlocking(doc(firestore, 'advertiser_clinic_groups', groupToEdit.id), dataToSave, { merge: true });
    } else {
      addDocumentNonBlocking(collection(firestore, 'advertiser_clinic_groups'), dataToSave);
    }
    closeModal();
  };

  const isLoading = isUserLoading || groupsLoading || advertisersLoading || clinicsLoading || categoriesLoading;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Advertiser Clinic Groups</h1>
        <Button onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>
      <Card>
        <CardHeader>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by group, advertiser, category..." 
                    className="pl-9 h-9" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Advertiser</TableHead>
                <TableHead>Category</TableHead>
                <TableHead># Clinics</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredClinicGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium py-2 text-xs">{group.name}</TableCell>
                  <TableCell className="py-2 text-xs">{advertiserMap.get(group.advertiserId) || 'Unknown'}</TableCell>
                  <TableCell className="py-2 text-xs">{categoryMap.get(group.categoryId) || 'N/A'}</TableCell>
                  <TableCell className="py-2 text-xs">
                    <Badge variant="secondary">{group.clinicIds.length}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-2 py-2">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(group)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(group)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && filteredClinicGroups.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No clinic groups found.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ClinicGroupForm
        isOpen={isModalOpen}
        onClose={closeModal}
        clinicGroup={groupToEdit}
        onConfirm={handleFormConfirm}
        clinics={clinicOptions}
        advertisers={advertisers || []}
        categories={categories || []}
        currentUser={currentUserData}
      />
      <DeleteClinicGroupDialog 
        isOpen={!!groupToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        groupName={groupToDelete?.name || ''}
      />
    </>
  )
}
