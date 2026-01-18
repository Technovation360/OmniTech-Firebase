import { getPatientByToken, getClinicById } from '@/lib/server-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Ticket } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Image from 'next/image';

export default async function SuccessPage({ params }: { params: { token: string } }) {
  const patient = await getPatientByToken(params.token);
  let clinic = null;
  if (patient) {
    clinic = await getClinicById(patient.clinicId);
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-8 h-10 flex items-center justify-center">
          {clinic?.logoUrl ? (
            <Image src={clinic.logoUrl} alt={clinic.name} width={120} height={40} className="object-contain h-10" />
          ) : (
            <Logo className="justify-center" />
          )}
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl">Registration Successful!</CardTitle>
            <CardDescription>
              Thank you, {patient?.name}. Please wait for your token to be called.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary text-primary-foreground p-6 rounded-lg flex flex-col items-center justify-center">
              <p className="text-lg font-medium">Your Token Number is</p>
              <p className="text-7xl font-bold tracking-widest my-2">{patient?.tokenNumber || 'N/A'}</p>
              <div className="flex items-center gap-2 opacity-80">
                <Ticket className="h-4 w-4"/>
                <p className="text-sm">Please remember your token</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You can now close this window. Your token will be displayed on the main screen when it's your turn.
            </p>
            <Button asChild variant="outline">
                <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
