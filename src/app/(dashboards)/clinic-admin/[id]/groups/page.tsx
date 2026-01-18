
'use client';
import { useState, useEffect, use, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  ExternalLink,
  QrCode,
  Link as LinkIcon,
  ChevronDown,
  PlusCircle,
  Search,
  Loader,
} from 'lucide-react';
import type { Clinic, Group, User, Cabin } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


function GroupForm({
  isOpen,
  onClose,
  group,
  onConfirm,
  doctors,
  assistants,
  screens,
  cabins,
}: {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  onConfirm: (formData: any) => void;
  doctors: User[];
  assistants: User[];
  screens: User[];
  cabins: Cabin[];
}) {
  const isEditMode = !!group;
  const [formData, setFormData] = useState({
    name: '',
    tokenInitial: '',
    doctorIds: [] as string[],
    assistantIds: [] as string[],
    screenIds: [] as string[],
    cabinIds: [] as string[],
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        tokenInitial: group.tokenInitial,
        doctorIds: group.doctors.map(d => d.id),
        assistantIds: group.assistants.map(a => a.id),
        screenIds: group.screens.map(s => s.id),
        cabinIds: group.cabins.map(c => c.id),
      });
    } else {
      setFormData({ name: '', tokenInitial: '', doctorIds: [], assistantIds: [], screenIds: [], cabinIds: [] });
    }
  }, [group]);

  const handleInputChange = (field: keyof typeof formData, value: string | string[]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (formData.name && formData.tokenInitial && formData.doctorIds.length > 0) {
      onConfirm(formData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT GROUP' : 'CREATE GROUP'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label htmlFor="groupName" className="text-[10px] font-semibold text-gray-600">GROUP NAME</Label>
                <Input id="groupName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
            </div>
             <div className="space-y-1">
                <Label htmlFor="tokenInitial" className="text-[10px] font-semibold text-gray-600">TOKEN INITIALS</Label>
                <Input id="tokenInitial" maxLength={3} className="h-7 text-[11px]" value={formData.tokenInitial} onChange={(e) => handleInputChange('tokenInitial', e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="doctor" className="text-[10px] font-semibold text-gray-600">ASSIGN DOCTORS</Label>
                <MultiSelect
                    options={doctors.map(d => ({ value: d.id, label: d.name }))}
                    selected={formData.doctorIds}
                    onChange={(selected) => handleInputChange('doctorIds', selected)}
                    className="text-xs"
                    placeholder="Select doctors..."
                    badgeClassName="bg-blue-100 text-blue-800"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="assistant" className="text-[10px] font-semibold text-gray-600">ASSIGN ASSISTANTS</Label>
                <MultiSelect
                    options={assistants.map(a => ({ value: a.id, label: a.name }))}
                    selected={formData.assistantIds}
                    onChange={(selected) => handleInputChange('assistantIds', selected)}
                    className="text-xs"
                    placeholder="Select assistants..."
                    badgeClassName="bg-yellow-100 text-yellow-800"
                />
            </div>
             <div className="space-y-1">
                <Label htmlFor="screen" className="text-[10px] font-semibold text-gray-600">ASSIGN SCREENS</Label>
                 <MultiSelect
                    options={screens.map(s => ({ value: s.id, label: s.name }))}
                    selected={formData.screenIds}
                    onChange={(selected) => handleInputChange('screenIds', selected)}
                    className="text-xs"
                    placeholder="Select screens..."
                    badgeClassName="bg-green-100 text-green-800"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="cabin" className="text-[10px] font-semibold text-gray-600">ASSIGN CABINS</Label>
                 <MultiSelect
                    options={cabins.map(c => ({ value: c.id, label: c.name }))}
                    selected={formData.cabinIds}
                    onChange={(selected) => handleInputChange('cabinIds', selected)}
                    className="text-xs"
                    placeholder="Select cabins..."
                    badgeClassName="bg-purple-100 text-purple-800"
                />
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

function DeleteGroupDialog({
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
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the group "{groupName}".
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


export default function GroupsPage({ params }: { params: { id: string } }) {
  const { id: clinicId } = use(params);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const clinicRef = useMemoFirebase(() => doc(firestore, 'clinics', clinicId), [firestore, clinicId]);
  const { data: clinic, isLoading: clinicLoading } = useDoc<Clinic>(clinicRef);

  const doctorsQuery = useMemoFirebase(() => {
    if (!clinic) return null;
    return query(collection(firestore, 'users'), where('affiliation', '==', clinic.name), where('role', '==', 'doctor'));
  }, [firestore, clinic]);
  const { data: doctors, isLoading: doctorsLoading } = useCollection<User>(doctorsQuery);

  const assistantsQuery = useMemoFirebase(() => {
    if (!clinic) return null;
    return query(collection(firestore, 'users'), where('affiliation', '==', clinic.name), where('role', '==', 'assistant'));
  }, [firestore, clinic]);
  const { data: assistants, isLoading: assistantsLoading } = useCollection<User>(assistantsQuery);

  const screensQuery = useMemoFirebase(() => {
    if (!clinic) return null;
    return query(collection(firestore, 'users'), where('affiliation', '==', clinic.name), where('role', '==', 'display'));
  }, [firestore, clinic]);
  const { data: screens, isLoading: screensLoading } = useCollection<User>(screensQuery);

  const cabinsQuery = useMemoFirebase(() => {
      return query(collection(firestore, 'cabins'), where('clinicId', '==', clinicId));
  }, [firestore, clinicId]);
  const { data: cabins, isLoading: cabinsLoading } = useCollection<Cabin>(cabinsQuery);

  const groupsQuery = useMemoFirebase(() => {
      return query(collection(firestore, 'groups'), where('clinicId', '==', clinicId));
  }, [firestore, clinicId]);
  const { data: allGroups, isLoading: groupsLoading } = useCollection<Group>(groupsQuery);

  useEffect(() => {
    if (!allGroups) {
      setFilteredGroups([]);
      return;
    }
    let filteredData = [...allGroups];
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allGroups.filter(group =>
            group.name.toLowerCase().includes(lowercasedQuery) ||
            group.tokenInitial.toLowerCase().includes(lowercasedQuery)
        );
    }
    setFilteredGroups(filteredData);
  }, [searchQuery, allGroups]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({
            title: "Link Copied!",
            description: "The registration link has been copied to your clipboard.",
        });
    }, (err) => {
        toast({
            variant: "destructive",
            title: "Failed to copy",
            description: "Could not copy the link to your clipboard.",
        });
    });
  };

  const openEditModal = (group: Group) => {
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

  const openDeleteDialog = (group: Group) => {
    setGroupToDelete(group);
  }

  const closeDeleteDialog = () => {
    setGroupToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (groupToDelete) {
      deleteDocumentNonBlocking(doc(firestore, 'groups', groupToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: { name: string, tokenInitial: string, doctorIds: string[], assistantIds: string[], screenIds: string[], cabinIds: string[] }) => {
    if (!clinic) return;

    const selectedDoctors = formData.doctorIds.map(id => (doctors || []).find(d => d.id === id)).filter(Boolean) as User[];
    const selectedAssistants = formData.assistantIds.map(id => (assistants || []).find(a => a.id === id)).filter(Boolean) as User[];
    const selectedScreens = formData.screenIds.map(id => (screens || []).find(s => s.id === id)).filter(Boolean) as User[];
    const selectedCabins = formData.cabinIds.map(id => (cabins || []).find(c => c.id === id)).filter(Boolean) as Cabin[];

    if (selectedDoctors.length === 0) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please assign at least one doctor.",
        });
        return;
    }

    const groupData = {
      clinicId: clinic.id,
      name: formData.name,
      tokenInitial: formData.tokenInitial,
      location: clinic.location,
      specialties: [],
      contact: `contact@${clinic.name.toLowerCase().replace(/\s/g, '')}.com`,
      doctors: selectedDoctors.map(d => ({ id: d.id, name: d.name })),
      assistants: selectedAssistants.map(a => ({ id: a.id, name: a.name })),
      cabins: selectedCabins,
      screens: selectedScreens.map(s => ({ id: s.id, name: s.name })),
    };

    if (groupToEdit) {
      setDocumentNonBlocking(doc(firestore, 'groups', groupToEdit.id), groupData, { merge: true });
    } else {
      addDocumentNonBlocking(collection(firestore, 'groups'), groupData);
    }
    closeModal();
  };

  const isLoading = clinicLoading || doctorsLoading || assistantsLoading || screensLoading || cabinsLoading || groupsLoading;

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader className="animate-spin h-8 w-8" /></div>
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="space-y-1 w-full sm:w-auto">
                      <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground">SEARCH GROUP</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Name, initials..."
                          className="pl-9 h-10 w-full sm:w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                 </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs font-medium text-muted-foreground text-right">{filteredGroups.length} TOTAL GROUPS</p>
                  <Button onClick={openCreateModal} className="h-10">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      CREATE GROUP
                  </Button>
                </div>
              </div>
            </CardHeader>
        </Card>

          <Card>
            <CardHeader>
              <div className="grid grid-cols-12 font-semibold text-xs text-muted-foreground">
                  <div className="col-span-3">GROUP NAME</div>
                  <div className="col-span-3">RESOURCES</div>
                  <div className="col-span-3 text-center">REGISTRATION</div>
                  <div className="col-span-3 text-center">ACTIONS</div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                  {filteredGroups.map((group) => (
                      <AccordionItem value={group.id} key={group.id} className="border-b last:border-b-0">
                           <div className="grid grid-cols-12 items-center group">
                                <div className="col-span-3 p-4">
                                    <AccordionTrigger className="hover:no-underline p-0 w-full">
                                        <div className="flex items-center gap-3">
                                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:-rotate-180" />
                                            <div>
                                                <p className="font-semibold text-sm text-card-foreground">{group.name}</p>
                                                <p className="text-xs text-muted-foreground">Initial: {group.tokenInitial}</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                </div>
                                <div className="col-span-3 py-0 px-2">
                                  <div className="grid grid-cols-2 gap-1">
                                      <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-tight bg-blue-100 text-blue-800">{group.doctors.length} Docs</Badge>
                                      <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-tight bg-yellow-100 text-yellow-800">{group.assistants.length} Asst</Badge>
                                      <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-tight bg-green-100 text-green-800">{group.screens.length} Displays</Badge>
                                      <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-tight bg-purple-100 text-purple-800">{group.cabins.length} Cabins</Badge>
                                  </div>
                                </div>
                                <div className="col-span-3 p-4 flex items-center justify-center gap-1">
                                    <Button variant="outline" size="icon-xs" asChild>
                                        <Link href={`/register/${group.id}`}>
                                            <ExternalLink className="h-4 w-4"/>
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="icon-xs" asChild>
                                        <Link href={`/clinic-admin/${clinicId}/groups/qr-code?groupId=${group.id}`}>
                                            <QrCode className="h-4 w-4"/>
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="icon-xs" onClick={() => copyToClipboard(`${window.location.origin}/register/${group.id}`)}>
                                        <LinkIcon className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <div className="col-span-3 p-4 flex justify-start gap-1">
                                  <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(group)}>
                                      <Edit className="h-4 w-4 text-muted-foreground"/>
                                  </Button>
                                  <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(group)}>
                                      <Trash2 className="h-4 w-4 text-destructive"/>
                                  </Button>
                                </div>
                          </div>
                          <AccordionContent className="bg-muted/30 p-6">
                              <div className="grid grid-cols-4 gap-6 text-xs">
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">DOCTORS</h4>
                                      <ul className="space-y-1">
                                          {group.doctors.map(d => <li key={d.id}>{d.name}</li>)}
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">ASSISTANTS</h4>
                                      <ul className="space-y-1">
                                          {group.assistants.map(a => <li key={a.id}>{a.name}</li>)}
                                          {group.assistants.length === 0 && <li className="text-muted-foreground">No assistants assigned</li>}
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">DISPLAYS</h4>
                                      <ul className="space-y-1">
                                        {group.screens.map(s => <li key={s.id}>{s.name}</li>)}
                                        {group.screens.length === 0 && <li className="text-muted-foreground">No displays assigned</li>}
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">CABINS</h4>
                                      <ul className="space-y-1">
                                          {group.cabins?.map(c => <li key={c.id}>{c.name}</li>)}
                                          {group.cabins.length === 0 && <li className="text-muted-foreground">No cabins assigned</li>}
                                      </ul>
                                  </div>
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                  ))}
                   {filteredGroups.length === 0 && (
                     <div className="text-center text-muted-foreground p-8">
                        No groups found.
                     </div>
                   )}
              </Accordion>
            </CardContent>
          </Card>
      </div>
      <GroupForm
        isOpen={isModalOpen}
        onClose={closeModal}
        group={groupToEdit}
        onConfirm={handleFormConfirm}
        doctors={doctors || []}
        assistants={assistants || []}
        screens={screens || []}
        cabins={cabins || []}
      />
      <DeleteGroupDialog
        isOpen={!!groupToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        groupName={groupToDelete?.name || ''}
      />
    </>
  );
}
