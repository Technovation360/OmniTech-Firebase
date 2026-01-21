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
import type { Campaign, Advertisement, AdvertiserClinicGroup, User } from '@/lib/types';
import { collection, doc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MultiSelect } from '@/components/ui/multi-select';
import { useToast } from '@/hooks/use-toast';

function CampaignForm({
  isOpen,
  onClose,
  campaign,
  onConfirm,
  advertisements,
  clinicGroups,
}: {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onConfirm: (formData: Omit<Campaign, 'id'>) => void;
  advertisements: Advertisement[];
  clinicGroups: AdvertiserClinicGroup[];
}) {
  const isEditMode = !!campaign;
  const [formData, setFormData] = useState({
    name: '',
    advertisementIds: [] as string[],
    clinicGroupIds: [] as string[],
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        advertisementIds: campaign.advertisementIds || [],
        clinicGroupIds: campaign.clinicGroupIds || [],
      });
    } else {
      setFormData({ name: '', advertisementIds: [], clinicGroupIds: [] });
    }
  }, [campaign]);

  const handleConfirm = () => {
    if (formData.name) {
      onConfirm(formData as Omit<Campaign, 'id'>);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advertisements">Advertisements</Label>
            <MultiSelect
              options={advertisements.map(ad => ({ value: ad.id, label: ad.campaign }))}
              selected={formData.advertisementIds}
              onChange={(selected) => setFormData({ ...formData, advertisementIds: selected })}
              placeholder="Select advertisements..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groups">Clinic Groups</Label>
            <MultiSelect
              options={clinicGroups.map(group => ({ value: group.id, label: group.name }))}
              selected={formData.clinicGroupIds}
              onChange={(selected) => setFormData({ ...formData, clinicGroupIds: selected })}
              placeholder="Select clinic groups..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CampaignsPage() {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [advertiserId, setAdvertiserId] = useState<string | null>(null);
  const { toast } = useToast();

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
  
  const campaignsQuery = useMemoFirebase(() => {
      if (!currentUserData) return null;
      if (currentUserData.role === 'central-admin') {
          return collection(firestore, 'campaigns');
      }
      if (currentUserData.role === 'advertiser' && advertiserId) {
          return query(collection(firestore, 'campaigns'), where('advertiserId', '==', advertiserId));
      }
      return null;
  }, [firestore, currentUserData, advertiserId]);

  const { data: campaigns, isLoading: campaignsLoading } = useCollection<Campaign>(campaignsQuery);
  const { data: advertisements, isLoading: adsLoading } = useCollection<Advertisement>(useMemoFirebase(() => collection(firestore, 'advertisements'), [firestore]));
  
  const clinicGroupsQuery = useMemoFirebase(() => {
    if (!currentUserData) return null;
    if (currentUserData.role === 'central-admin') {
      return collection(firestore, 'advertiser_clinic_groups');
    }
    if (currentUserData.role === 'advertiser' && advertiserId) {
      return query(collection(firestore, 'advertiser_clinic_groups'), where('advertiserId', '==', advertiserId));
    }
    return null;
  }, [firestore, currentUserData, advertiserId]);
  const { data: clinicGroups, isLoading: groupsLoading } = useCollection<AdvertiserClinicGroup>(clinicGroupsQuery);


  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (campaigns) {
      const filtered = campaigns.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredCampaigns(filtered);
    }
  }, [campaigns, searchQuery]);

  const handleFormConfirm = (formData: Omit<Campaign, 'id'>) => {
    let dataToSave = { ...formData };
    if (currentUserData?.role === 'advertiser' && advertiserId) {
        dataToSave = { ...dataToSave, advertiserId: advertiserId };
    }

    if (campaignToEdit) {
      setDocumentNonBlocking(doc(firestore, 'campaigns', campaignToEdit.id), dataToSave, { merge: true });
      toast({ title: 'Campaign updated!' });
    } else {
      addDocumentNonBlocking(collection(firestore, 'campaigns'), dataToSave);
      toast({ title: 'Campaign created!' });
    }
    setIsModalOpen(false);
    setCampaignToEdit(null);
  };
  
  const handleDeleteConfirm = () => {
    if (campaignToDelete) {
      deleteDocumentNonBlocking(doc(firestore, 'campaigns', campaignToDelete.id));
      setCampaignToDelete(null);
      toast({ title: 'Campaign deleted.' });
    }
  };

  const isLoading = isUserLoading || campaignsLoading || adsLoading || groupsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Button onClick={() => { setCampaignToEdit(null); setIsModalOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead># Advertisements</TableHead>
                <TableHead># Clinic Groups</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Loader className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No campaigns found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.advertisementIds?.length || 0}</TableCell>
                    <TableCell>{campaign.clinicGroupIds?.length || 0}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="icon-xs" onClick={() => { setCampaignToEdit(campaign); setIsModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setCampaignToDelete(campaign)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CampaignForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={campaignToEdit}
        onConfirm={handleFormConfirm}
        advertisements={advertisements || []}
        clinicGroups={clinicGroups || []}
      />
      
      <AlertDialog open={!!campaignToDelete} onOpenChange={() => setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign "{campaignToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    