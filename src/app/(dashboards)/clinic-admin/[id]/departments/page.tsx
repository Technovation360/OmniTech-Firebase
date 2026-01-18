
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
  ChevronDown,
  PlusCircle,
  Search,
} from 'lucide-react';
import { getClinicGroups, getClinicById, mockUsers, getCabinsByClinicId } from '@/lib/data';
import type { Clinic, ClinicGroup, User, Cabin } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';


function DepartmentForm({
  isOpen,
  onClose,
  department,
  onConfirm,
  doctors,
  assistants,
  screens,
  cabins,
}: {
  isOpen: boolean;
  onClose: () => void;
  department: ClinicGroup | null;
  onConfirm: (formData: any) => void;
  doctors: User[];
  assistants: User[];
  screens: User[];
  cabins: Cabin[];
}) {
  const isEditMode = !!department;
  const [formData, setFormData] = useState({ 
    name: '', 
    tokenInitial: '',
    doctorIds: [] as string[],
    assistantIds: [] as string[],
    screenIds: [] as string[],
    cabinIds: [] as string[],
  });

  useEffect(() => {
    if (department) {
      setFormData({ 
        name: department.name, 
        tokenInitial: department.tokenInitial,
        doctorIds: department.doctors.map(d => d.id),
        assistantIds: department.assistants.map(a => a.id),
        screenIds: department.screens.map(s => s.id),
        cabinIds: department.cabins.map(c => c.id),
      });
    } else {
      setFormData({ name: '', tokenInitial: '', doctorIds: [], assistantIds: [], screenIds: [], cabinIds: [] });
    }
  }, [department]);

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
            {isEditMode ? 'EDIT DEPARTMENT' : 'CREATE DEPARTMENT'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label htmlFor="departmentName" className="text-[10px] font-semibold text-gray-600">DEPARTMENT NAME</Label>
                <Input id="departmentName" className="h-7 text-[11px]" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
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

function DeleteDepartmentDialog({
  isOpen,
  onClose,
  onConfirm,
  departmentName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  departmentName: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the department "{departmentName}".
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


export default function DepartmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [allDepartments, setAllDepartments] = useState<ClinicGroup[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<ClinicGroup[]>([]);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<ClinicGroup | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<ClinicGroup | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getClinicById(clinicId).then(clinicData => {
      setClinic(clinicData || null);
      if(clinicData) {
        setUsers(mockUsers.filter(u => u.affiliation === clinicData.name));
        getCabinsByClinicId(clinicId).then(setCabins);
      }
    });

    getClinicGroups(clinicId).then(setAllDepartments);
  }, [clinicId]);

  useEffect(() => {
    let filteredData = allDepartments;
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allDepartments.filter(department => 
            department.name.toLowerCase().includes(lowercasedQuery) ||
            department.tokenInitial.toLowerCase().includes(lowercasedQuery)
        );
    }
    setFilteredDepartments(filteredData);
  }, [searchQuery, allDepartments]);

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

  const openEditModal = (department: ClinicGroup) => {
    setDepartmentToEdit(department);
    setIsModalOpen(true);
  }

  const openCreateModal = () => {
    setDepartmentToEdit(null);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setDepartmentToEdit(null);
  }

  const openDeleteDialog = (department: ClinicGroup) => {
    setDepartmentToDelete(department);
  }

  const closeDeleteDialog = () => {
    setDepartmentToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (departmentToDelete) {
      setAllDepartments(allDepartments.filter(g => g.id !== departmentToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: { name: string, tokenInitial: string, doctorIds: string[], assistantIds: string[], screenIds: string[], cabinIds: string[] }) => {
    if (!clinic) return;

    const selectedDoctors = formData.doctorIds.map(id => doctors.find(d => d.id === id)).filter(Boolean) as User[];
    const selectedAssistants = formData.assistantIds.map(id => assistants.find(a => a.id === id)).filter(Boolean) as User[];
    const selectedScreens = formData.screenIds.map(id => screens.find(s => s.id === id)).filter(Boolean) as User[];
    const selectedCabins = formData.cabinIds.map(id => cabins.find(c => c.id === id)).filter(Boolean) as Cabin[];
    
    if (selectedDoctors.length === 0) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please assign at least one doctor.",
        });
        return;
    }

    if (departmentToEdit) {
      // Update existing department
      setAllDepartments(allDepartments.map(g => g.id === departmentToEdit.id ? { 
        ...departmentToEdit, 
        name: formData.name,
        tokenInitial: formData.tokenInitial,
        doctors: selectedDoctors.map(d => ({ id: d.id, name: d.name })),
        assistants: selectedAssistants.map(a => ({ id: a.id, name: a.name })),
        screens: selectedScreens.map(s => ({ id: s.id, name: s.name })),
        cabins: selectedCabins,
      } : g));
    } else {
      // Add new department
        const newDepartment: ClinicGroup = {
          id: `dept_${Date.now()}`,
          clinicId: clinic.id,
          name: formData.name,
          type: 'Doctor',
          tokenInitial: formData.tokenInitial,
          location: clinic.location,
          specialties: [],
          contact: `contact@${clinic.name.toLowerCase().replace(/\s/g, '')}.com`,
          doctors: selectedDoctors.map(d => ({ id: d.id, name: d.name })),
          assistants: selectedAssistants.map(a => ({ id: a.id, name: a.name })),
          cabins: selectedCabins,
          screens: selectedScreens.map(s => ({ id: s.id, name: s.name })),
        };
        setAllDepartments(prev => [newDepartment, ...prev]);
    }
    closeModal();
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="space-y-1 w-full sm:w-auto">
                      <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground">SEARCH DEPARTMENT</Label>
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
                  <p className="text-xs font-medium text-muted-foreground text-right">{filteredDepartments.length} TOTAL DEPARTMENTS</p>
                  <Button onClick={openCreateModal} className="h-10">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      CREATE DEPARTMENT
                  </Button>
                </div>
              </div>
            </CardHeader>
        </Card>

          <Card>
            <CardHeader>
              <div className="grid grid-cols-12 font-semibold text-xs text-muted-foreground">
                  <div className="col-span-3">DEPARTMENT NAME</div>
                  <div className="col-span-3">RESOURCES</div>
                  <div className="col-span-3 text-center">REGISTRATION</div>
                  <div className="col-span-3 text-center">ACTIONS</div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                  {filteredDepartments.map((department) => (
                      <AccordionItem value={department.id} key={department.id} className="border-b last:border-b-0">
                           <div className="grid grid-cols-12 items-center department">
                                <div className="col-span-3 p-4">
                                    <AccordionTrigger className="hover:no-underline p-0 w-full">
                                        <div className="flex items-center gap-3">
                                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 department-data-[state=open]:-rotate-180" />
                                            <div>
                                                <p className="font-semibold text-sm text-card-foreground">{department.name}</p>
                                                <p className="text-xs text-muted-foreground">Initial: {department.tokenInitial}</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                </div>
                                <div className="col-span-3 py-0 px-2">
                                  <div className="grid grid-cols-2 gap-1">
                                      <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-tight bg-blue-100 text-blue-800">{department.doctors.length} Docs</Badge>
                                      <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-tight bg-yellow-100 text-yellow-800">{department.assistants.length} Asst</Badge>
                                      <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-tight bg-green-100 text-green-800">{department.screens.length} Displays</Badge>
                                      <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-tight bg-purple-100 text-purple-800">{department.cabins.length} Cabins</Badge>
                                  </div>
                                </div>
                                <div className="col-span-3 p-4 flex items-center justify-center gap-1">
                                    <Button variant="outline" size="icon-xs" asChild>
                                        <Link href={`/register/${department.id}`}>
                                            <ExternalLink className="h-4 w-4"/>
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="icon-xs" asChild>
                                        <Link href={`/clinic-admin/${clinicId}/departments/qr-code?departmentId=${department.id}`}>
                                            <QrCode className="h-4 w-4"/>
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="icon-xs" onClick={() => copyToClipboard(`${window.location.origin}/register/${department.id}`)}>
                                        <LinkIcon className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <div className="col-span-3 p-4 flex justify-start gap-1">
                                  <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(department)}>
                                      <Edit className="h-4 w-4 text-muted-foreground"/>
                                  </Button>
                                  <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(department)}>
                                      <Trash2 className="h-4 w-4 text-destructive"/>
                                  </Button>
                                </div>
                          </div>
                          <AccordionContent className="bg-muted/30 p-6">
                              <div className="grid grid-cols-4 gap-6 text-xs">
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">DOCTORS</h4>
                                      <ul className="space-y-1">
                                          {department.doctors.map(d => <li key={d.id}>{d.name}</li>)}
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">ASSISTANTS</h4>
                                      <ul className="space-y-1">
                                          {department.assistants.map(a => <li key={a.id}>{a.name}</li>)}
                                          {department.assistants.length === 0 && <li className="text-muted-foreground">No assistants assigned</li>}
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">DISPLAYS</h4>
                                      <ul className="space-y-1">
                                        {department.screens.map(s => <li key={s.id}>{s.name}</li>)}
                                        {department.screens.length === 0 && <li className="text-muted-foreground">No displays assigned</li>}
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold text-muted-foreground mb-2">CABINS</h4>
                                      <ul className="space-y-1">
                                          {department.cabins?.map(c => <li key={c.id}>{c.name}</li>)}
                                          {department.cabins.length === 0 && <li className="text-muted-foreground">No cabins assigned</li>}
                                      </ul>
                                  </div>
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                  ))}
                   {filteredDepartments.length === 0 && (
                     <div className="text-center text-muted-foreground p-8">
                        No departments found.
                     </div>
                   )}
              </Accordion>
            </CardContent>
          </Card>
      </div>
      <DepartmentForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        department={departmentToEdit}
        onConfirm={handleFormConfirm}
        doctors={doctors}
        assistants={assistants}
        screens={screens}
        cabins={cabins}
      />
      <DeleteDepartmentDialog
        isOpen={!!departmentToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        departmentName={departmentToDelete?.name || ''}
      />
    </>
  );
}
