
'use client';

import { useActionState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { registerPatient } from '@/lib/actions';
import type { Group, User } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Loader } from 'lucide-react';


function SubmitButton() {
  return <Button type="submit" className="w-full">Register Patient</Button>;
}

export default function AssistantPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const assistantUserRef = useMemoFirebase(() => {
    return doc(firestore, 'users', id);
  }, [firestore, id]);
  const { data: assistantUser, isLoading: assistantUserLoading } = useDoc<User>(assistantUserRef);

  const groupsQuery = useMemoFirebase(() => {
      if (!assistantUser) return null;
      return query(collection(firestore, "groups"), where("assistants", "array-contains", { id: id, name: assistantUser.name }));
  }, [firestore, id, assistantUser]);

  const { data: groups, isLoading: groupsLoading } = useCollection<Group>(groupsQuery);
  const [state, formAction] = useActionState(registerPatient, null);


  useEffect(() => {
    if (state?.success && state.tokenNumber) {
      toast({
        title: 'Patient Registered',
        description: `Token number ${state.tokenNumber} has been assigned.`,
      });
      router.refresh(); 
    } else if (state?.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: state.message,
      });
    }
  }, [state, toast, router]);

  if (isUserLoading || assistantUserLoading || groupsLoading) {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <Loader className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Assistant Dashboard</h1>
        <p className="text-muted-foreground">Create tokens for walk-in patients.</p>
      </div>
      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>New Patient Registration</CardTitle>
            <CardDescription>Fill in the details to add a patient to the queue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupId">Clinic Group</Label>
                <Select name="groupId" required>
                  <SelectTrigger className="h-7">
                    <SelectValue placeholder="Select a Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.doctors.map(d => `Dr. ${d.name}`).join(', ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Patient Name</Label>
                  <Input id="name" name="name" placeholder="e.g., John Doe" required className="h-7" />
                  {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" placeholder="e.g., 42" required className="h-7" />
                  {state?.errors?.age && <p className="text-sm text-destructive">{state.errors.age[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="contactNumber">Phone Number</Label>
                    <Input id="contactNumber" name="contactNumber" placeholder="e.g., 9876543210" required className="h-7" />
                    {state?.errors?.contactNumber && <p className="text-sm text-destructive">{state.errors.contactNumber[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email</Label>
                    <Input id="emailAddress" name="emailAddress" type="email" placeholder="Optional" className="h-7" />
                    {state?.errors?.emailAddress && <p className="text-sm text-destructive">{state.errors.emailAddress[0]}</p>}
                </div>
              </div>


              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup name="gender" defaultValue="male" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
                {state?.errors?.gender && <p className="text-sm text-destructive">{state.errors.gender[0]}</p>}
              </div>

              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
