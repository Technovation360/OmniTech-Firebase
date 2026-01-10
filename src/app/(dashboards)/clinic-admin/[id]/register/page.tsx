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
import { useToast } from '@/hooks/use-toast';
import { registerPatient } from '@/lib/actions';
import { getClinicGroupById } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';
import { Loader } from 'lucide-react';

function SubmitButton() {
  return <Button type="submit" className="w-full">Register Patient & Get Token</Button>;
}

export default function ClinicAdminRegisterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [clinicGroup, setClinicGroup] = useState<ClinicGroup | null>(null);
  const [state, formAction] = useActionState(registerPatient, null);

  useEffect(() => {
    getClinicGroupById(params.id).then(setClinicGroup);
  }, [params.id]);

  useEffect(() => {
    if (state?.success && state.tokenNumber) {
      toast({
        title: 'Patient Registered',
        description: `Token number ${state.tokenNumber} has been assigned.`,
      });
      // A full page reload might not be what you want.
      // Consider clearing the form instead.
      router.refresh(); 
    } else if (state?.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: state.message,
      });
    }
  }, [state, toast, router]);

  if (!clinicGroup) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Patient Registration</h1>
        <p className="text-muted-foreground">Create tokens for walk-in patients for {clinicGroup.name}.</p>
      </div>
      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>New Patient Registration</CardTitle>
            <CardDescription>Fill in the details to add a patient to the queue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
                <input type="hidden" name="clinicId" value={params.id} />
                
              <div className="space-y-2">
                <Label htmlFor="name">Patient Name</Label>
                <Input id="name" name="name" placeholder="e.g., John Doe" required />
                {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" type="number" placeholder="e.g., 42" required />
                {state?.errors?.age && <p className="text-sm text-destructive">{state.errors.age[0]}</p>}
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
