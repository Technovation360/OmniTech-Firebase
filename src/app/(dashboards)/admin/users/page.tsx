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

type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    affiliation: string;
};

const mockUsers: User[] = [
    { id: 'user_1', name: 'Admin', email: 'admin@omni.com', role: 'central-admin', affiliation: 'Omni Platform'},
    { id: 'user_2', name: 'Clinic Admin', email: 'clinic-admin@omni.com', role: 'clinic-admin', affiliation: 'Omni Platform'},
    { id: 'user_3', name: 'Dr. Ashish', email: 'doc_ashish@omni.com', role: 'doctor', affiliation: 'Cardiology Dept.'},
    { id: 'user_4', name: 'Dr. Vijay', email: 'doc_vijay@omni.com', role: 'doctor', affiliation: 'Orthopedics Dept.' },
    { id: 'user_5', name: 'Sunita', email: 'asst_sunita@omni.com', role: 'assistant', affiliation: 'Cardiology Dept.' },
    { id: 'user_6', name: 'Rajesh', email: 'asst_rajesh@omni.com', role: 'assistant', affiliation: 'Orthopedics Dept.' },
    { id: 'user_7', name: 'Display User', email: 'display@omni.com', role: 'display', affiliation: 'Main Hall Display' },
    { id: 'user_8', name: 'Advertiser User', email: 'advertiser@omni.com', role: 'advertiser', affiliation: 'HealthPlus Insurance' },
];

const roleLabels: Record<UserRole, string> = {
  'central-admin': 'Central Admin',
  'clinic-admin': 'Clinic Admin',
  'doctor': 'Doctor',
  'assistant': 'Assistant',
  'display': 'Display',
  'advertiser': 'Advertiser',
}

function UserForm({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}) {
  const isEditMode = !!user;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT USER' : 'REGISTER USER'}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <div className="space-y-1">
              <Label htmlFor="userName" className="text-[10px] font-semibold text-gray-600">USER NAME</Label>
              <Input id="userName" className="h-7 text-xs" defaultValue={user?.name} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-semibold text-gray-600">EMAIL</Label>
              <Input id="email" type="email" className="h-7 text-xs" defaultValue={user?.email} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="affiliation" className="text-[10px] font-semibold text-gray-600">AFFILIATION</Label>
              <Input id="affiliation" className="h-7 text-xs" defaultValue={user?.affiliation} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role" className="text-[10px] font-semibold text-gray-600">ROLE</Label>
               <Select defaultValue={user?.role}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <SelectItem key={role} value={role} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
          <Button variant="destructive" onClick={onClose} size="xs">
            CANCEL
          </Button>
          <Button size="xs">CONFIRM</Button>
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


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    // In a real app, this would fetch user data from an API
    setUsers(mockUsers);
  }, []);
  
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

  return (
    <>
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Platform Users</CardTitle>
          <CardDescription className="text-xs">Manage user accounts and roles.</CardDescription>
        </div>
        <Button onClick={openCreateModal} size="sm">Register User</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Affiliation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="py-2 text-xs">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell className="py-2 text-xs">{user.affiliation}</TableCell>
                <TableCell className="py-2 text-xs">
                  <Badge variant="secondary">{roleLabels[user.role as UserRole] || 'Unknown'}</Badge>
                </TableCell>
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <UserForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        user={userToEdit}
    />
    <DeleteUserDialog 
        isOpen={!!userToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        userName={userToDelete?.name || ''}
    />
    </>
  )
}
