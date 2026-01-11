

'use client';
import { useState, useEffect, use } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { getClinicGroups, getClinicById, mockUsers, getCabinsByClinicId } from '@/lib/data';
import type { Clinic, ClinicGroup, User, Cabin } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MultiSelect } from '@/components/ui/multi-select';


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
  group: ClinicGroup | null;
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

  const handleConfirm = () => {
    if (formData.name && formData.tokenInitial && formData.doctorIds.length > 0 && formData.assistantIds.length > 0 && formData.screenIds.length > 0 && formData.cabinIds.length > 0) {
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
                <Input id="groupName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
             <div className="space-y-1">
                <Label htmlFor="tokenInitial" className="text-[10px] font-semibold text-gray-600">TOKEN INITIALS</Label>
                <Input id="tokenInitial" maxLength={3} className="h-7 text-[11px]" value={formData.tokenInitial} onChange={(e) => setFormData({...formData, tokenInitial: e.target.value.toUpperCase()})} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="doctor" className="text-[10px] font-semibold text-gray-600">ASSIGN DOCTORS</Label>
                <MultiSelect
                    options={doctors.map(d => ({ value: d.id, label: d.name }))}
                    selected={formData.doctorIds}
                    onChange={(selected) => setFormData({...formData, doctorIds: selected})}
                    className="text-xs"
                    placeholder="Select doctors..."
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="assistant" className="text-[10px] font-semibold text-gray-600">ASSIGN ASSISTANTS</Label>
                <MultiSelect
                    options={assistants.map(a => ({ value: a.id, label: a.name }))}
                    selected={formData.assistantIds}
                    onChange={(selected) => setFormData({...formData, assistantIds: selected})}
                    className="text-xs"
                    placeholder="Select assistants..."
                />
            </div>
             <div className="space-y-1">
                <Label htmlFor="screen" className="text-[10px] font-semibold text-gray-600">ASSIGN SCREENS</Label>
                 <MultiSelect
                    options={screens.map(s => ({ value: s.id, label: s.name }))}
                    selected={formData.screenIds}
                    onChange={(selected) => setFormData({...formData, screenIds: selected})}
                    className="text-xs"
                    placeholder="Select screens..."
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="cabin" className="text-[10px] font-semibold text-gray-600">ASSIGN CABINS</Label>
                 <MultiSelect
                    options={cabins.map(c => ({ value: c.id, label: c.name }))}
                    selected={formData.cabinIds}
                    onChange={(selected) => setFormData({...formData, cabinIds: selected})}
                    className="text-xs"
                    placeholder="Select cabins..."
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


export default function GroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [allGroups, setAllGroups] = useState<ClinicGroup[]>([]);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<ClinicGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<ClinicGroup | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cabins, setCabins] = useState<Cabin[]>([]);

  useEffect(() => {
    getClinicById(clinicId).then(clinicData => {
      setClinic(clinicData || null);
      if(clinicData) {
        setUsers(mockUsers.filter(u => u.affiliation === clinicData.name));
        getCabinsByClinicId(clinicId).then(setCabins);
      }
    });

    getClinicGroups(clinicId).then(setAllGroups);
  }, [clinicId]);

  const doctors = users.filter(u => u.role === 'doctor');
  const assistants = users.filter(u => u.role === 'assistant');
  const screens = users.filter(u => u.role === 'display');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }
  
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

  const openEditModal = (group: ClinicGroup) => {
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

  const openDeleteDialog = (group: ClinicGroup) => {
    setGroupToDelete(group);
  }

  const closeDeleteDialog = () => {
    setGroupToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (groupToDelete) {
      setAllGroups(allGroups.filter(g => g.id !== groupToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: { name: string, tokenInitial: string, doctorIds: string[], assistantIds: string[], screenIds: string[], cabinIds: string[] }) => {
    const selectedDoctors = formData.doctorIds.map(id => doctors.find(d => d.id === id)).filter(Boolean) as User[];
    const selectedAssistants = formData.assistantIds.map(id => assistants.find(a => a.id === id)).filter(Boolean) as User[];
    const selectedScreens = formData.screenIds.map(id => screens.find(s => s.id === id)).filter(Boolean) as User[];
    const selectedCabins = formData.cabinIds.map(id => cabins.find(c => c.id === id)).filter(Boolean) as Cabin[];
    
    if (selectedDoctors.length === 0 || selectedAssistants.length === 0 || selectedScreens.length === 0 || selectedCabins.length === 0 || !clinic) return;

    if (groupToEdit) {
      // Update existing group
      setAllGroups(allGroups.map(g => g.id === groupToEdit.id ? { 
        ...groupToEdit, 
        name: formData.name,
        tokenInitial: formData.tokenInitial,
        doctors: selectedDoctors.map(d => ({ id: d.id, name: d.name })),
        assistants: selectedAssistants.map(a => ({ id: a.id, name: a.name })),
        screens: selectedScreens.map(s => ({ id: s.id, name: s.name })),
        cabins: selectedCabins,
      } : g));
    } else {
      // Add new group
        const newGroup: ClinicGroup = {
          id: `grp_${Date.now()}`,
          clinicId: clinicId,
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
        setAllGroups(prev => [newGroup, ...prev]);
    }
    closeModal();
  };

  return (
    <>
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Clinic Groups</h1>
              <Button onClick={openCreateModal}>CREATE GROUP</Button>
          </div>

          <div className="bg-card rounded-2xl border">
              <div className="grid grid-cols-12 p-4 border-b font-semibold text-xs text-muted-foreground">
                  <div className="col-span-3">GROUP NAME</div>
                  <div className="col-span-4 pl-2">RESOURCES</div>
                  <div className="col-span-3 pl-2">REGISTRATION FORM</div>
                  <div className="col-span-2 text-center">ACTIONS</div>
              </div>
              <Accordion type="single" value={activeAccordionItem || ""} onValueChange={setActiveAccordionItem} collapsible>
                  {allGroups.map((group) => (
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
                                <div className="col-span-4 p-4 pl-2">
                                  <div className="flex items-center gap-1 flex-wrap">
                                      <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] leading-none bg-blue-100 text-blue-800">{group.doctors.length} Docs</Badge>
                                      <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] leading-none bg-yellow-100 text-yellow-800">{group.assistants.length} Asst</Badge>
                                      <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] leading-none bg-green-100 text-green-800">{group.screens.length} Displays</Badge>
                                      <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] leading-none bg-purple-100 text-purple-800">{group.cabins.length} Cabins</Badge>
                                  </div>
                                </div>
                                <div className="col-span-3 p-4 flex items-center gap-2 pl-6">
                                    <Button variant="outline" size="icon-xs" asChild>
                                        <Link href={`/register/${group.id}`} target="_blank">
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
                                <div className="col-span-2 p-4 flex justify-center gap-2">
                                  <Button variant="ghost" size="icon-sm" onClick={() => openEditModal(group)}>
                                      <Edit className="h-4 w-4 text-muted-foreground"/>
                                  </Button>
                                  <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(group)}>
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
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">CABINS</h4>
                                      <ul className="space-y-1">
                                          {group.cabins?.map(c => <li key={c.id}>{c.name}</li>)}
                                      </ul>
                                  </div>
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                  ))}
              </Accordion>
          </div>
      </div>
      <GroupForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        group={groupToEdit}
        onConfirm={handleFormConfirm}
        doctors={doctors}
        assistants={assistants}
        screens={screens}
        cabins={cabins}
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
