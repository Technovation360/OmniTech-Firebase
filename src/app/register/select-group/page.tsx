
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Stethoscope, Loader } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { ClinicGroup } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';


export default function SelectGroupPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const clinicGroupsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'groups'), where('type', '==', 'Doctor'))
  }, [firestore]);

  const { data: clinicGroups, isLoading } = useCollection<ClinicGroup>(clinicGroupsQuery);

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <Logo className="justify-center"/>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Select a Department</CardTitle>
            <CardDescription>
              Choose the department you want to register for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isLoading || isUserLoading) && <div className="flex justify-center py-4"><Loader className="animate-spin" /></div>}
            {!isLoading && !isUserLoading && clinicGroups?.map((group) => (
              <Button asChild key={group.id} variant="outline" className="w-full justify-between h-16 text-left">
                <Link href={`/register/${group.id}`}>
                    <div className="flex items-center gap-4">
                        <Stethoscope className="h-6 w-6 text-primary"/>
                        <div>
                            <p className="font-semibold">{group.name}</p>
                            <p className="text-sm text-muted-foreground">{group.doctors.map(d => d.name).join(', ')}</p>
                        </div>
                    </div>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            ))}
             {!isLoading && !isUserLoading && clinicGroups?.length === 0 && (
                <p className="text-center text-muted-foreground">No departments available.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
