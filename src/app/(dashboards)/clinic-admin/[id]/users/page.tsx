
'use client';
import { useState, useEffect, use } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, KeyRound } from 'lucide-react';
import type { UserRole } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { getClinicGroupById } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';


type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    affiliation: string;
    phone?: string;
    specialty?: string;
};

// This is mock data. In a real app, you'd fetch this from your backend based on clinicId
const mockUsers: User[] = [
    { id: 'user_3', name: 'Dr. Ashish', email: 'doc_ashish@omni.com', role: 'doctor', affiliation: 'City Care Clinic', specialty: 'Cardiology' },
    { id: 'user_5', name: 'Sunita', email: 'asst_sunita@omni.com', role: 'assistant', affiliation: 'City Care Clinic' },
    { id: 'user_7', name: 'Display User', email: 'display@omni.com', role: 'display', affiliation: 'City Care Clinic' },
    { id: 'user_4', name: 'Dr. Vijay', email: 'doc_vijay@omni.com', role: 'doctor', affiliation: 'Health Plus Clinic', specialty: 'Orthopedics' },
    { id: 'user_6', name: 'Rajesh', email: 'asst_rajesh@omni.com', role: 'assistant', affiliation: 'Health Plus Clinic' },
];

const roleLabels: Record<UserRole, string> = {
  'central-admin': 'Central Admin',
  'clinic-admin': 'Clinic Admin',
  'doctor': 'Doctor',
  'assistant': 'Assistant',
  'display': 'Display',
  'advertiser': 'Advertiser',
}

const badgeColors = [
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
];

const roleColorMap: Record<UserRole, string> = {
  'doctor': badgeColors[0],
  'assistant': badgeColors[1],
  'display': badgeColors[2],
  'clinic-admin': badgeColors[3],
  'central-admin': 'bg-gray-100 text-gray-800',
  'advertiser': 'bg-gray-100 text-gray-800',
};


function UserForm({
  isOpen,
  onClose,
  user,
  onConfirm,
  clinicName
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (formData: Omit<User, 'id'>) => void;
  clinicName: string;
}) {
  const isEditMode = !!user;
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
      name: '',
      email: '',
      role: 'assistant',
      affiliation: clinicName,
      phone: '',
      specialty: '',
  });

  useEffect(() => {
    if (isOpen) {
      if(user) {
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            affiliation: user.affiliation,
            phone: user.phone || '',
            specialty: user.specialty || '',
        });
      } else {
        setFormData({
            name: '', email: '', role: 'assistant', affiliation: clinicName, phone: '', specialty: ''
        })
      }
    }
  }, [isOpen, user, clinicName]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
      setFormData(prev => ({...prev, [field]: value}));
  }

  const handleConfirm = () => {
      onConfirm(formData);
      onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT USER' : 'ONBOARD STAFF'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
             <div className="space-y-1">
              <Label htmlFor="userName" className="text-[10px] font-semibold text-gray-600">FULL NAME</Label>
              <Input id="userName" className="h-7 text-[11px]" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role" className="text-[10px] font-semibold text-gray-600">ROLE</Label>
               <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as UserRole)}>
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels)
                    .filter(([role]) => ['doctor', 'assistant', 'display'].includes(role))
                    .map(([role, label]) => (
                    <SelectItem key={role} value={role} className="text-[11px]">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-semibold text-gray-600">EMAIL</Label>
              <Input id="email" type="email" className="h-7 text-[11px]" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
            </div>
             <div className="space-y-1">
              <Label htmlFor="phone" className="text-[10px] font-semibold text-gray-600">PHONE</Label>
              <Input id="phone" type="tel" className="h-7 text-[11px]" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
            </div>
            {formData.role === 'doctor' && (
               <div className="space-y-1">
                <Label htmlFor="specialties" className="text-[10px] font-semibold text-gray-600">SPECIALTY</Label>
                <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                    <SelectTrigger className="h-7 text-[11px]">
                        <SelectValue placeholder="Select..."/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cardiology" className="text-[11px]">Cardiology</SelectItem>
                        <SelectItem value="Orthopedics" className="text-[11px]">Orthopedics</SelectItem>
                        <SelectItem value="Pediatrics" className="text-[11px]">Pediatrics</SelectItem>
                        <SelectItem value="General Medicine" className="text-[11px]">General Medicine</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[10px] font-semibold text-gray-600">PASSWORD</Label>
              <Input id="password" type="password" className="h-7 text-[11px]" placeholder="Set new password"/>
            </div>
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
          <Button variant="destructive" onClick={onClose} size="xs">
            CANCEL
          </Button>
          <Button onClick={handleConfirm} size="xs">CONFIRM</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user account for "{userName}".
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


export default function UsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [clinic, setClinic] = useState<ClinicGroup | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  useEffect(() => {
    getClinicGroupById(clinicId).then(clinicData => {
        setClinic(clinicData || null);
        if (clinicData) {
            // Filter mock users by clinic affiliation
            const clinicUsers = mockUsers.filter(u => u.affiliation === clinicData.name);
            setUsers(clinicUsers);
        }
    })
  }, [clinicId]);


  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  }

  const openCreateModal = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
  }
  
  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
  }

  const closeDeleteDialog = () => {
    setUserToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<User, 'id'>) => {
    if (userToEdit) {
      setUsers(users.map(u => u.id === userToEdit.id ? { ...userToEdit, ...formData } : u));
    } else {
      const newUser: User = {
        ...formData,
        id: `user_${Date.now()}`
      };
      setUsers([newUser, ...users]);
    }
    closeModal();
  };

  return (
    <>
     <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Users</CardTitle>
          <Button onClick={openCreateModal}>ONBOARD STAFF</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>PHONE</TableHead>
              <TableHead>SPECIALTY</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="py-2 text-xs font-medium">{user.name}</TableCell>
                <TableCell className="py-2 text-xs">
                  <Badge variant="secondary" className={cn("text-[10px] border-transparent font-bold", roleColorMap[user.role as UserRole])}>{roleLabels[user.role as UserRole] || 'Unknown'}</Badge>
                </TableCell>
                <TableCell className="py-2 text-xs text-muted-foreground">{user.email}</TableCell>
                <TableCell className="py-2 text-xs">{user.phone || '-'}</TableCell>
                <TableCell className="py-2 text-xs">{user.specialty || '-'}</TableCell>
                <TableCell className="flex gap-2 py-2">
                   <Button variant="outline" size="icon-xs">
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon-xs" onClick={() => openEditModal(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon-xs" onClick={() => openDeleteDialog(user)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    {clinic && (
        <UserForm 
            isOpen={isModalOpen}
            onClose={closeModal}
            user={userToEdit}
            onConfirm={handleFormConfirm}
            clinicName={clinic.name}
        />
    )}
    <DeleteUserDialog 
        isOpen={!!userToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        userName={userToDelete?.name || ''}
    />
    </>
  )
}
