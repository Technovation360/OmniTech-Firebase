
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
import { getClinicGroups, getClinicById } from '@/lib/data';
import type { ClinicGroup, Doctor } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


function GroupForm({
  isOpen,
  onClose,
  group,
  onConfirm,
  doctors
}: {
  isOpen: boolean;
  onClose: () => void;
  group: ClinicGroup | null;
  onConfirm: (formData: any) => void;
  doctors: Doctor[];
}) {
  const isEditMode = !!group;
  const [formData, setFormData] = useState({ name: '', doctorId: '' });

  useEffect(() => {
    if (group) {
      setFormData({ name: group.name, doctorId: group.doctor.id });
    } else {
      setFormData({ name: '', doctorId: '' });
    }
  }, [group]);

  const handleConfirm = () => {
    if (formData.name && formData.doctorId) {
      onConfirm(formData);
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT GROUP' : 'CREATE GROUP'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4 space-y-4">
            <div className="space-y-1">
                <Label htmlFor="groupName" className="text-[10px] font-semibold text-gray-600">GROUP NAME</Label>
                <Input id="groupName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="doctor" className="text-[10px] font-semibold text-gray-600">ASSIGN DOCTOR</Label>
                <Select value={formData.doctorId} onValueChange={(value) => setFormData({...formData, doctorId: value})}>
                  <SelectTrigger className="h-7 text-[11px]">
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doc => (
                      <SelectItem key={doc.id} value={doc.id} className="text-[11px]">{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
  const [allGroups, setAllGroups] = useState<(ClinicGroup & { resources?: any; cabins?: any[] })[]>([]);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<ClinicGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<ClinicGroup | null>(null);
  // In a real app, this would be fetched
  const availableDoctors: Doctor[] = [
    { id: 'doc_ashish', name: 'Dr. Ashish' },
    { id: 'doc_vijay', name: 'Dr. Vijay' },
    { id: 'doc_mehta', name: 'Dr. Mehta' },
    { id: 'doc_gupta', name: 'Dr. Gupta' },
    { id: 'doc_singh', name: 'Dr. Singh' },
    { id: 'doc_joshi', name: 'Dr. Joshi' },
  ];

  useEffect(() => {
    getClinicGroups(clinicId).then(allGroupsData => {
        const groupsWithResources = allGroupsData.map((group) => ({
            ...group,
            resources: {
                docs: [group.doctor].length, 
                asst: group.assistants.length,
                displays: 1, 
                cabins: 4, 
            },
            cabins: [
              {id: 'cab_1', name: 'Consultation Room 1'},
              {id: 'cab_2', name: 'Consultation Room 2'},
              {id: 'cab_3', name: 'Consultation Room 3'},
              {id: 'cab_4', name: 'Consultation Room 4'},
            ]
        }));
        setAllGroups(groupsWithResources);
        if (groupsWithResources.length > 0) {
            setActiveAccordionItem(groupsWithResources[0].id);
        }
    })
  }, [clinicId]);

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

  const handleFormConfirm = (formData: { name: string, doctorId: string }) => {
    const doctor = availableDoctors.find(d => d.id === formData.doctorId);
    if (!doctor) return;

    if (groupToEdit) {
      // Update existing group
      setAllGroups(allGroups.map(g => g.id === groupToEdit.id ? { ...groupToEdit, name: formData.name, doctor: doctor } : g));
    } else {
      // Add new group
      getClinicById(clinicId).then(clinic => {
        if (!clinic) return;
        const newGroup: ClinicGroup = {
          id: `grp_${Date.now()}`,
          clinicId: clinicId,
          name: formData.name,
          location: clinic.location,
          specialties: [],
          contact: `contact@${clinic.name.toLowerCase().replace(/\s/g, '')}.com`,
          doctor: doctor,
          assistants: [],
          cabin: { id: 'cab_new', name: 'New Cabin'},
          screen: { id: 'scr_main_hall', name: 'Main Hall Display'},
        };
        setAllGroups(prev => [newGroup, ...prev]);
      });
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
                  <div className="col-span-4">GROUP NAME</div>
                  <div className="col-span-4">RESOURCES</div>
                  <div className="col-span-2">REGISTRATION FORM</div>
                  <div className="col-span-2 text-center">ACTIONS</div>
              </div>
              <Accordion type="single" value={activeAccordionItem || ""} onValueChange={setActiveAccordionItem} collapsible>
                  {allGroups.map((group) => (
                      <AccordionItem value={group.id} key={group.id} className="border-b last:border-b-0">
                          <div className="grid grid-cols-12 p-4 items-center hover:bg-muted/50 transition-colors group">
                            <AccordionTrigger className="col-span-4 text-left flex items-center gap-3 hover:no-underline">
                                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                  <div>
                                      <p className="font-semibold text-sm text-card-foreground">{group.name}</p>
                                      <p className="text-xs text-muted-foreground">Initial: {getInitials(group.name)}</p>
                                  </div>
                            </AccordionTrigger>
                              <div className="col-span-4">
                                  <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">{group.resources?.docs || 0} Docs</Badge>
                                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{group.resources?.asst || 0} Asst</Badge>
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">{group.resources?.displays || 0} Displays</Badge>
                                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">{group.resources?.cabins || 0} Cabins</Badge>
                                  </div>
                              </div>
                              <div className="col-span-2 flex items-center gap-2">
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
                              <div className="col-span-2 flex justify-center gap-2">
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
                                          <li>{group.doctor.name}</li>
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
                                        <li>{group.screen.name} (Display User)</li>
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
        doctors={availableDoctors}
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
