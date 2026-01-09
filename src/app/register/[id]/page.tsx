'use client';

import { useActionState, useEffect, useState } from 'react';
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
import { getClinicGroupById } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';
import { Logo } from '@/components/logo';

function SubmitButton() {
  // `pending` is not available in useActionState, so we can't show a loading state based on it easily without useTransition
  return <Button type="submit" className="w-full">Get Token</Button>;
}

export default function RegistrationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [state, formAction] = useActionState(registerPatient, null);
  const [clinicGroup, setClinicGroup] = useState<ClinicGroup | null>(null);

  useEffect(() => {
    getClinicGroupById(params.id).then(group => setClinicGroup(group || null));
  }, [params.id]);

  useEffect(() => {
    if (state?.success && state.tokenNumber) {
      router.push(`/register/success/${state.tokenNumber}`);
    }
  }, [state, router]);

  if (!clinicGroup) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <Logo className="justify-center"/>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Register for {clinicGroup.name}</CardTitle>
            <CardDescription>
              Fill in your details to get a token for Dr. {clinicGroup.doctor.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              <input type="hidden" name="clinicId" value={clinicGroup.id} />
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="e.g., Jane Smith" required />
                {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" type="number" placeholder="e.g., 35" required />
                {state?.errors?.age && <p className="text-sm text-destructive">{state.errors.age[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup name="gender" defaultValue="female" className="flex gap-4">
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

              {state?.message && !state.success && (
                <p className="text-sm text-destructive text-center">{state.message}</p>
              )}

              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
