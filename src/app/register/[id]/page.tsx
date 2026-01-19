
'use client';

import { useActionState, useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { registerPatient } from '@/lib/actions';
import { Loader } from 'lucide-react';
import { getClinicGroupById, getClinicById } from '@/lib/data';
import type { Group, Clinic } from '@/lib/types';
import { Logo } from '@/components/logo';
import Image from 'next/image';

function SubmitButton() {
  // `pending` is not available in useActionState, so we can't show a loading state based on it easily without useTransition
  return <Button type="submit" className="w-full">Get Token</Button>;
}

export default function RegistrationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = use(params);
  const [state, formAction] = useActionState(registerPatient, null);
  const [group, setGroup] = useState<Group | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    getClinicGroupById(id).then(groupData => {
        setGroup(groupData || null)
        if (groupData) {
            getClinicById(groupData.clinicId).then(clinicData => {
                setClinic(clinicData || null);
            });
        }
    });
  }, [id]);

  useEffect(() => {
    if (state?.success && state.tokenNumber) {
      router.push(`/register/success/${state.tokenNumber}`);
    }
  }, [state, router]);

  if (!group || !clinic) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8 h-10 flex items-center justify-center">
          {clinic.logoUrl ? (
              <Image src={clinic.logoUrl} alt={clinic.name} width={120} height={40} className="object-contain h-10" />
          ) : (
              <Logo className="justify-center"/>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Register for {group.name}</CardTitle>
            <CardDescription>
              Fill in your details to get a token for {group.doctors.map(d => d.name).join(', ')}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="groupId" value={group.id} />
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="e.g., Jane Smith" required />
                {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="contactNumber">Phone Number</Label>
                    <Input id="contactNumber" name="contactNumber" type="tel" placeholder="e.g., 9876543210" required />
                    {state?.errors?.contactNumber && <p className="text-sm text-destructive">{state.errors.contactNumber[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email Address</Label>
                    <Input id="emailAddress" name="emailAddress" type="email" placeholder="Optional" />
                    {state?.errors?.emailAddress && <p className="text-sm text-destructive">{state.errors.emailAddress[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" placeholder="e.g., 35" required />
                    {state?.errors?.age && <p className="text-sm text-destructive">{state.errors.age[0]}</p>}
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <Label>Gender</Label>
                    <RadioGroup name="gender" defaultValue="female" className="flex items-center gap-4 h-10">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male" className="font-normal">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female" className="font-normal">Female</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other" className="font-normal">Other</Label>
                        </div>
                    </RadioGroup>
                    {state?.errors?.gender && <p className="text-sm text-destructive">{state.errors.gender[0]}</p>}
                </div>
              </div>

              {state?.message && !state.success && (
                <p className="text-sm text-destructive text-center">{state.message}</p>
              )}
              
              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
