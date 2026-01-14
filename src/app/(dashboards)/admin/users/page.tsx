
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
import { Edit, Trash2, KeyRound, ArrowUp, ArrowDown, Search, Loader, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Clinic, User, Role } from '@/lib/types';
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, writeBatch, getDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';


const badgeColors = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
];

const roleColorMap: Record<string, string> = {
  'Central Admin': badgeColors[0],
  'Clinic Admin': badgeColors[1],
  'Doctor': badgeColors[2],
  'Assistant': badgeColors[3],
  'Display': badgeColors[4],
  'Advertiser': badgeColors[5],
};

function UserForm({
  isOpen,
  onClose,
  user,
  onConfirm,
  clinics,
  roles
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (formData: Omit<User, 'id'> & {password?: string}, authUserId?: string) => void;
  clinics: Clinic[];
  roles: Role[];
}) {
  const { toast } = useToast();
  const isEditMode = !!user;
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      roleId: '',
      affiliation: '',
      phone: '',
      specialty: '',
      password: '',
      confirmPassword: ''
  });

  const selectedRole = useMemo(() => roles.find(r => r.id === formData.roleId), [roles, formData.roleId]);

  useEffect(() => {
    if (isOpen) {
      if(user) {
        setFormData({
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            affiliation: user.affiliation,
            phone: user.phone || '',
            specialty: user.specialty || '',
            password: '',
            confirmPassword: '',
        });
      } else {
        setFormData({
            name: '', email: '', roleId: '', affiliation: '', phone: '', specialty: '', password: '', confirmPassword: ''
        })
      }
    }
  }, [isOpen, user]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
      const newFormData = {...formData, [field]: value};
      const role = roles.find(r => r.id === value);
      if (field === 'roleId' && role?.name === 'central-admin') {
        newFormData.affiliation = 'Omni Platform';
      }
      setFormData(newFormData);
  }

  const handleConfirm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match.' });
      return;
    }
    onConfirm(formData, user?.id);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            {isEditMode ? 'EDIT USER' : 'REGISTER USER'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <div className="space-y-1">
              <Label htmlFor="role" className="text-[10px] font-semibold text-gray-600">ROLE</Label>
               <Select value={formData.roleId} onValueChange={(value) => handleInputChange('roleId', value)}>
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id} className="text-[11px] capitalize">{role.name.replace('-', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {selectedRole?.name !== 'central-admin' && (
              <div className="space-y-1">
                <Label htmlFor="affiliation" className="text-[10px] font-semibold text-gray-600">AFFILIATION</Label>
                <Select value={formData.affiliation} onValueChange={(value) => handleInputChange('affiliation', value)}>
                  <SelectTrigger className="h-7 text-[11px]">
                      <SelectValue placeholder="Select Affiliation..."/>
                  </SelectTrigger>
                  <SelectContent>
                      {clinics.map(clinic => (
                          <SelectItem key={clinic.id} value={clinic.name} className="text-[11px]">{clinic.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="userName" className="text-[10px] font-semibold text-gray-600">FULL NAME</Label>
              <Input id="userName" className="h-7 text-[11px]" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-semibold text-gray-600">EMAIL</Label>
              <Input id="email" type="email" className="h-7 text-[11px]" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} disabled={isEditMode} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-[10px] font-semibold text-gray-600">PHONE</Label>
              <Input id="phone" type="tel" className="h-7 text-[11px]" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
            </div>
            {selectedRole?.name === 'doctor' && (
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
              <Label htmlFor="password">{isEditMode ? 'NEW PASSWORD (OPTIONAL)' : 'PASSWORD'}</Label>
              <Input id="password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className="h-7 text-[11px]" />
            </div>
             <div className="space-y-1">
              <Label htmlFor="confirmPassword">{isEditMode ? 'CONFIRM NEW PASSWORD' : 'CONFIRM PASSWORD'}</Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className="h-7 text-[11px]" />
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

function PasswordResetForm({
  isOpen,
  onClose,
  user,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (password: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleConfirm = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "The new password and confirm password fields do not match.",
      });
      return;
    }
    if (!newPassword) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter a new password.",
      });
      return;
    }
    setIsSubmitting(true);
    await onConfirm(newPassword);
    setIsSubmitting(false);
    onClose();
  };
  
  useEffect(() => {
    if (isOpen) {
        setNewPassword('');
        setConfirmPassword('');
    }
  }, [isOpen]);

  if (!user) return null;

  return (
     <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-bold tracking-normal">
            RESET PASSWORD
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Set a new password for <span className="font-semibold">{user.name}</span>.
          </p>
          <div className="space-y-1">
            <Label htmlFor="newPassword" className="text-[10px] font-semibold text-gray-600">NEW PASSWORD</Label>
            <Input id="newPassword" type="password" className="h-7 text-[11px]" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-[10px] font-semibold text-gray-600">CONFIRM PASSWORD</Label>
            <Input id="confirmPassword" type="password" className="h-7 text-[11px]" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2 rounded-b-lg">
          <Button variant="destructive" onClick={onClose} size="xs" disabled={isSubmitting}>
            CANCEL
          </Button>
          <Button onClick={handleConfirm} size="xs" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "CONFIRM"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
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
            This action cannot be undone. This will permanently delete the user account for "{userName}". This does not delete the Firebase Auth user.
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
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();

  const usersRef = useMemoFirebase(() => {
    if (!authUser) return null;
    return collection(firestore, 'users')
  }, [firestore, authUser]);
  
  const rolesRef = useMemoFirebase(() => {
    if (!authUser) return null;
    return collection(firestore, 'roles')
  }, [firestore, authUser]);
  
  const { data: allUsers, isLoading: usersLoading, refetch: refetchUsers } = useCollection<User>(usersRef);
  const { data: allRoles, isLoading: rolesLoading } = useCollection<Role>(rolesRef);

  const clinicsQuery = useMemoFirebase(() => {
    if (!authUser) return null;
    return query(collection(firestore, 'groups'), where('type', '==', 'Clinic'))
  }, [firestore, authUser]);
  const { data: clinicsData, isLoading: clinicsLoading } = useCollection<Clinic>(clinicsQuery);
  
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const clinics = clinicsData || [];
  const roles = allRoles || [];

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name.replace('-', ' ') || 'Unknown';
  }

  useEffect(() => {
    let sourceUsers = allUsers || [];
    let filteredData = [...sourceUsers];

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(user => 
            user.name.toLowerCase().includes(lowercasedQuery) ||
            user.email.toLowerCase().includes(lowercasedQuery) ||
            user.affiliation.toLowerCase().includes(lowercasedQuery)
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
  
  const openPasswordResetModal = (user: User) => {
    setUserToResetPassword(user);
    setIsPasswordModalOpen(true);
  };

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
      const docRef = doc(firestore, 'users', userToDelete.id);
      deleteDocumentNonBlocking(docRef);
      closeDeleteDialog();
    }
  }

  const handleFormConfirm = async (formData: Omit<User, 'id'> & {password?: string}, authUserId?: string) => {
    if (authUserId) { // Edit mode
        const userRef = doc(firestore, 'users', authUserId);
        const { password, ...userData } = formData;
        setDocumentNonBlocking(userRef, userData, { merge: true });
        toast({ title: "User updated successfully."});
        if (password) {
            toast({ title: "Password change requires re-authentication", description: "This functionality is not yet implemented for security reasons."});
        }

    } else { // Create mode
        if (!formData.password) {
            toast({ variant: "destructive", title: "Password is required for new users."});
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const newAuthUser = userCredential.user;
            const { password, confirmPassword, ...userData } = formData;
            
            const userDocRef = doc(firestore, "users", newAuthUser.uid);
            
            const batch = writeBatch(firestore);
            batch.set(userDocRef, { ...userData, id: newAuthUser.uid });

            const role = roles.find(r => r.id === formData.roleId);
            if(role?.name === 'central-admin') {
                const adminRoleRef = doc(firestore, "roles_admin", newAuthUser.uid);
                batch.set(adminRoleRef, { uid: newAuthUser.uid });
            }
            await batch.commit();

            toast({ title: "User created successfully."});

        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Failed to create user", description: error.message });
        }
    }
    closeModal();
  };
  
  const handlePasswordResetConfirm = async (password: string) => {
      if (!userToResetPassword || !authUser) return;

      toast({
        title: "Admin Password Reset",
        description: `This feature is for demonstration. In a production app, direct password modification by admins is a security risk. Re-authenticating the admin would be required.`,
      });

      // This is a simplified flow. A real app would require the admin to re-authenticate.
      // try {
      //   const adminCredential = EmailAuthProvider.credential(authUser.email!, 'ADMIN_PASSWORD_HERE');
      //   await reauthenticateWithCredential(authUser, adminCredential);
      //   // Now you could potentially use an admin SDK function, but that's server-side.
      //   // Client-side, there's no direct way to change another user's password.
      //   // The code below will fail without Admin SDK.
      //   // await admin.auth().updateUser(userToResetPassword.id, { password: password });
      // } catch (error: any) {
      //   toast({ variant: "destructive", title: "Password Reset Failed", description: error.message });
      // }
      
      setIsPasswordModalOpen(false);
      setUserToResetPassword(null);
  }

  const fixUserUids = async () => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Admin user not signed in.' });
      return;
    }

    // This function requires administrative privileges and direct server-side access to Firebase Admin SDK
    // which is not available on the client. As a workaround, we demonstrate the logic
    // but cannot execute it fully from the browser. The ideal solution is a Cloud Function.
    toast({
        variant: "destructive",
        title: "Feature Not Available",
        description: "This client-side implementation cannot securely fix UIDs. This requires a server-side Admin SDK. The logic has been corrected for future server-side implementation."
    });

    console.log("Attempting to fix UIDs (client-side simulation)...");
    
    // In a real scenario, you would call a Cloud Function here.
    // The simulation below demonstrates the logic.
    try {
        const querySnapshot = await getDocs(collection(firestore, "users"));
        const batch = writeBatch(firestore);
        let changesMade = 0;

        querySnapshot.forEach(userDoc => {
            const userData = userDoc.data() as User;
            // In a real Admin SDK environment, you'd use admin.auth().getUserByEmail()
            // We cannot do that here, so this is just for show.
            const assumedAuthUid = `simulated-uid-for-${userData.email}`; 

            if (userDoc.id !== userData.id) {
                console.log(`Mismatch found for ${userData.email}: DocID ${userDoc.id} vs DataID ${userData.id}`);
                const correctDocRef = doc(firestore, 'users', userData.id);
                batch.set(correctDocRef, userData);
                batch.delete(userDoc.ref);
                changesMade++;
            }
        });

        if (changesMade > 0) {
            // await batch.commit(); // This would be called in a real scenario
            toast({ title: 'UIDs checked.', description: `${changesMade} potential mismatches found. Commit skipped on client.` });
        } else {
            toast({ title: 'No UID mismatches found.' });
        }
        refetchUsers();
    } catch(e) {
        console.error("Error during simulated UID fix: ", e);
        toast({variant: 'destructive', title: "Error during simulation."});
    }

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

  const isLoading = isUserLoading || usersLoading || clinicsLoading || rolesLoading;

  if (!authUser) {
     return (
      <div className="flex items-center justify-center h-full">
        <p>Please log in to manage users.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
     <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Platform Users</h1>
        <div className="flex gap-2">
            <Button onClick={fixUserUids} variant="outline">Fix UIDs</Button>
            <Button onClick={openCreateModal}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Register User
            </Button>
        </div>
      </div>
     <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search users..." 
                        className="pl-9 h-9" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
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
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('affiliation')}>
                    Affiliation
                    {getSortIcon('affiliation')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('roleId')}>
                    Role
                    {getSortIcon('roleId')}
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
                <TableCell className="py-2 text-xs">{user.affiliation}</TableCell>
                <TableCell className="py-2 text-xs">
                  <Badge variant="secondary" className={cn("text-[10px] border-transparent capitalize", roleColorMap[getRoleName(user.roleId) as string])}>{getRoleName(user.roleId) || 'Unknown'}</Badge>
                </TableCell>
                <TableCell className="flex gap-2 py-2">
                  <Button variant="ghost" size="icon-xs" onClick={() => openPasswordResetModal(user)}>
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
            {!isLoading && filteredUsers.length === 0 && (
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
    <UserForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        user={userToEdit}
        onConfirm={handleFormConfirm}
        clinics={clinics}
        roles={roles}
    />
    <PasswordResetForm 
      isOpen={isPasswordModalOpen}
      onClose={() => setIsPasswordModalOpen(false)}
      user={userToResetPassword}
      onConfirm={handlePasswordResetConfirm}
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

    