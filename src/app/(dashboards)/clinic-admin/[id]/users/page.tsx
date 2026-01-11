
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
import { Edit, Trash2, KeyRound, ArrowUp, ArrowDown, Search, PlusCircle } from 'lucide-react';
import type { UserRole } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { getClinicById } from '@/lib/data';
import type { Clinic } from '@/lib/types';


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
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  
  useEffect(() => {
    getClinicById(clinicId).then(clinicData => {
        setClinic(clinicData || null);
        if (clinicData) {
            // Filter mock users by clinic affiliation
            const clinicUsers = mockUsers.filter(u => u.affiliation === clinicData.name);
            setAllUsers(clinicUsers);
        }
    })
  }, [clinicId]);

  useEffect(() => {
    let filteredData = allUsers;
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allUsers.filter(user => 
            user.name.toLowerCase().includes(lowercasedQuery) ||
            user.email.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredUsers(sorted);
    } else {
        setFilteredUsers(filteredData);
    }

  }, [searchQuery, allUsers, sortConfig]);


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
      setAllUsers(allUsers.filter(u => u.id !== userToDelete.id));
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = (formData: Omit<User, 'id'>) => {
    if (userToEdit) {
      setAllUsers(allUsers.map(u => u.id === userToEdit.id ? { ...userToEdit, ...formData } : u));
    } else {
      const newUser: User = {
        ...formData,
        id: `user_${Date.now()}`
      };
      setAllUsers([newUser, ...allUsers]);
    }
    closeModal();
  };

  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof User) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="space-y-1 w-full sm:w-auto">
              <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground">SEARCH USER</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, email..."
                  className="pl-9 h-10 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">{filteredUsers.length} TOTAL USERS</p>
              <Button onClick={openCreateModal} className="h-10 w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                ONBOARD STAFF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    
     <Card>
      <CardHeader>
        <CardTitle className="text-lg">Staff Users</CardTitle>
        <CardDescription className="text-xs mt-1">Manage user accounts for your clinic.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                    Name
                    {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('email')}>
                    Email
                    {getSortIcon('email')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('role')}>
                    Role
                    {getSortIcon('role')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('specialty')}>
                    Specialty
                    {getSortIcon('specialty')}
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="py-2 text-xs font-medium">{user.name}</TableCell>
                <TableCell className="py-2 text-xs text-muted-foreground">{user.email}</TableCell>
                <TableCell className="py-2 text-xs">
                  <Badge variant="secondary" className={cn("text-[10px] border-transparent font-semibold", roleColorMap[user.role as UserRole])}>{roleLabels[user.role as UserRole] || 'Unknown'}</Badge>
                </TableCell>
                <TableCell className="py-2 text-xs">{user.specialty || '-'}</TableCell>
                <TableCell className="flex gap-2 py-2">
                   <Button variant="ghost" size="icon-xs">
                    <KeyRound className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(user)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openDeleteDialog(user)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-sm">
                        No users found.
                    </TableCell>
                </TableRow>
             )}
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
    </div>
  )
}
