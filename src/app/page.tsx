
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, writeBatch, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { getRedirectUrlForRole, UserRole } from '@/lib/roles';
import type { User, Role, Clinic } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { setCustomClaim } from '@/ai/flows/set-custom-claims';

const sampleCredentials = [
    { role: 'Central Admin', email: 'admin@omni.com' },
    { role: 'Clinic Admin (City)', email: 'clinic-admin-city@omni.com' },
    { role: 'Clinic Admin (Health)', email: 'clinic-admin-health@omni.com' },
    { role: 'Doctor (Dr. Ashish)', email: 'doc_ashish@omni.com' },
    { role: 'Assistant (Sunita)', email: 'asst_sunita@omni.com' },
    { role: 'Advertiser', email: 'advertiser@omni.com' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const clinicsQuery = useMemoFirebase(() => collection(firestore, 'groups'), [firestore]);
  const { data: clinics, isLoading: clinicsLoading } = useCollection<Clinic>(clinicsQuery);
  

  const bootstrapFirstAdmin = async (adminAuthUser: FirebaseAuthUser): Promise<void> => {
    const userDocRef = doc(firestore, 'users', adminAuthUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        toast({ description: 'Creating admin user profile and setting role...' });
        
        // 1. Create the user document in Firestore
        await setDoc(userDocRef, {
            uid: adminAuthUser.uid,
            name: 'Central Admin',
            email: adminAuthUser.email,
            role: 'central-admin',
        });

        // 2. Set the custom claim via the Genkit flow
        const claimResult = await setCustomClaim({ uid: adminAuthUser.uid, role: 'central-admin' });
        if (!claimResult.success) {
            throw new Error(claimResult.message || 'Failed to set custom claim for admin.');
        }

        toast({ title: 'Admin Account Created!', description: 'Role assigned. You can now log in.' });
    }
  }

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Firebase not initialized correctly.',
      });
      setLoading(false);
      return;
    }

    try {
      let userCredential;
      try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
          if (error.code === 'auth/user-not-found' && email === 'admin@omni.com') {
              toast({ title: 'First-time Login Detected', description: 'Setting up the admin account...' });
              const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
              await bootstrapFirstAdmin(newUserCredential.user);
              // After bootstrapping, we sign in again to get the user credential for the next step.
              userCredential = await signInWithEmailAndPassword(auth, email, password);
          } else {
              throw error; // Re-throw other errors
          }
      }

      const firebaseUser = userCredential.user;
      if (!firebaseUser) throw new Error("Could not get user.");
      
      // Force a refresh of the token to get the latest custom claims.
      let idTokenResult = await firebaseUser.getIdTokenResult(true);
      let userRole = (idTokenResult.claims.role as UserRole) || null;

      if (!userRole) {
        // This is a final check. If the role is still not there, something is wrong with the claim setting process.
        throw new Error('User role not found. Please try logging in again or contact an administrator.');
      }
      
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error('User profile not found. Please contact an administrator.');
      }
      
      const userData = userDocSnap.data() as User;
      
      let affiliationId = firebaseUser.uid;
      if (userRole !== 'central-admin' && clinics && userData.affiliation) {
         const affiliatedClinic = clinics.find(c => c.name === userData.affiliation && c.type === 'Clinic');
         if (affiliatedClinic) {
           affiliationId = affiliatedClinic.id;
         }
      }

      const redirectUrl = getRedirectUrlForRole(userRole, affiliationId);
      if (!redirectUrl) throw new Error("Could not determine redirect for your role.");
      router.push(redirectUrl);

    } catch (error: any) {
      console.error(error);
      let description = 'An unknown error occurred during login.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        description = 'Invalid email or password. Please try again.';
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <header className="flex justify-between items-center py-8">
            <h1 className="text-2xl font-bold">Portal Login</h1>
            <Button variant="link" asChild>
                <Link href="/register/select-group">Patient Portal</Link>
            </Button>
        </header>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <form onSubmit={onLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@omni.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='password'
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-lg">Sample Credentials</CardTitle>
                <CardDescription>Use "password" as the password for all sample accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Email</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sampleCredentials.map((cred) => (
                            <TableRow key={cred.email}>
                                <TableCell className="font-medium py-2 text-xs">{cred.role}</TableCell>
                                <TableCell className="py-2 text-xs">{cred.email}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <footer className="text-center text-muted-foreground text-sm mt-8">
            &copy; 2024 OMNITOKEN
        </footer>
      </div>
    </div>
  );
}
