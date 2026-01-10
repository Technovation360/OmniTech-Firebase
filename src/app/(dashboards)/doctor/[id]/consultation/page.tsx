'use client';

import { useState, useEffect, use } from 'react';
import {
  getPatientsByClinicId,
  getClinicGroupById,
} from '@/lib/data';
import type { Patient, ClinicGroup, Doctor } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  CheckSquare,
  XCircle,
  Loader,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DoctorPageProps = {
  params: { id: string };
};

type FetchedData = {
  clinicGroup: ClinicGroup | undefined;
  patients: Patient[];
};

export default function DoctorConsultationPageLoader({ params }: DoctorPageProps) {
  const { id } = use(params);
  const [data, setData] = useState<FetchedData | null>(null);

  useEffect(() => {
    const clinicId = id === 'doc_ashish' ? 'grp_cardiology_01' : 'grp_ortho_01';
    Promise.all([
      getClinicGroupById(clinicId),
      getPatientsByClinicId(clinicId),
    ]).then(([clinicGroup, patients]) => {
      setData({ clinicGroup, patients });
    });
  }, [id]);

  if (!data || !data.clinicGroup) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <DoctorConsultationDashboard clinicGroup={data.clinicGroup} initialPatients={data.patients} />;
}


function DoctorConsultationDashboard({
  clinicGroup,
  initialPatients,
}: {
  clinicGroup: ClinicGroup;
  initialPatients: Patient[];
}) {
  const totalPatients = initialPatients.length;
  const inQueue = initialPatients.filter(p => p.status === 'waiting' || p.status === 'called').length;
  const attended = initialPatients.filter(p => p.status === 'consultation-done').length;
  const noShows = initialPatients.filter(p => p.status === 'no-show').length;

  const stats = [
    { title: 'TOTAL PATIENTS', value: totalPatients, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
    { title: 'IN QUEUE', value: inQueue, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'ATTENDED', value: attended, icon: CheckSquare, color: 'bg-green-100 text-green-600' },
    { title: 'NO SHOWS', value: noShows, icon: XCircle, color: 'bg-red-100 text-red-600' },
  ];
  
  const consultationRooms = ['Consultation Room 1', 'Consultation Room 2', 'Consultation Room 3', 'Consultation Room 4'];
  const nextToken = initialPatients.find(p => p.status === 'waiting')?.tokenNumber;


  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Button>General Medicine <Badge className="ml-2 bg-white text-primary">10</Badge></Button>
            <Button variant="ghost">Pediatrics <Badge className="ml-2">10</Badge></Button>
        </div>
        {nextToken && (
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">NEXT:</span>
                <Badge variant="outline" className="text-base font-bold border-primary text-primary">{nextToken}</Badge>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {consultationRooms.map(room => (
            <Card key={room}>
                <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30">
                    <CardTitle className="text-sm font-semibold">{room.toUpperCase()}</CardTitle>
                    <Button size="xs" className="bg-green-600 hover:bg-green-700 h-7">ASSIGN</Button>
                </CardHeader>
                <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center">
                   <div className="p-3 bg-yellow-100 rounded-full mb-2">
                     <Lock className="h-6 w-6 text-yellow-500" />
                   </div>
                   <p className="text-sm font-semibold text-muted-foreground">ASSIGN ROOM</p>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
