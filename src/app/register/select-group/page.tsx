
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
import { Group } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';


export default function SelectGroupPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const groupsQuery = useMemoFirebase(() => {
    return collection(firestore, 'groups')
  }, [firestore]);

  const { data: groups, isLoading } = useCollection<Group>(groupsQuery);

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
            {!isLoading && !isUserLoading && groups?.map((group) => (
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
             {!isLoading && !isUserLoading && groups?.length === 0 && (
                <p className="text-center text-muted-foreground">No departments available.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
