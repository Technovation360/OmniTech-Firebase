
'use client';

import { use, useState, useEffect } from 'react';
import {
  getPatientsByGroupId,
  getClinicGroupById,
} from '@/lib/data';
import type { Patient, ClinicGroup, Doctor } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Clock,
  CheckSquare,
  XCircle,
  Loader,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';

type DoctorPageProps = {
  params: { id: string };
};

type FetchedData = {
  clinicGroup: ClinicGroup | undefined;
  patients: Patient[];
};

export default function DoctorPageLoader({ params }: DoctorPageProps) {
  const { id } = use(params);
  const [data, setData] = useState<FetchedData | null>(null);

  useEffect(() => {
    const groupId = id === 'doc_ashish' ? 'grp_cardiology_01' : 'grp_ortho_01';
    Promise.all([
      getClinicGroupById(groupId),
      getPatientsByGroupId(groupId),
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

  return (
    <DoctorDashboard
      clinicGroup={data.clinicGroup}
      initialPatients={data.patients}
    />
  );
}

function DoctorDashboard({
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

  const nextToken = initialPatients.find(p => p.status === 'waiting');
  const doctor = clinicGroup.doctors[0];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
             <CardHeader>
                <div className="flex items-center gap-4">
                    <Button>ALL GROUPS</Button>
                    <Button variant="ghost">GENERAL MEDICINE</Button>
                    <Button variant="ghost">PEDIATRICS</Button>
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="text-lg font-bold">Performance Details</h3>
                <p className="text-sm text-muted-foreground mb-4">GROUP CONTEXT: ALL ASSIGNED WINGS</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">CURRENTLY ACTIVE AT</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold">Not logged into any rooms</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">QUEUE SUMMARY</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <div>
                                <p>Next Token:</p>
                                <p>Avg Wait Time:</p>
                            </div>
                             <div className="text-right">
                                <p className="font-bold text-primary">{nextToken?.tokenNumber || 'N/A'}</p>
                                <p className="font-bold text-primary">~15m</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/50 flex flex-col items-center justify-center">
                        <p className="text-3xl font-bold text-primary">0%</p>
                        <p className="text-xs text-muted-foreground">EFFICIENCY</p>
                    </Card>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-primary text-primary-foreground relative overflow-hidden h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90" asChild>
                <Link href={`/doctor/${doctor.id}/consultation`}>START CONSULTATIONS</Link>
              </Button>
              <div className="bg-primary-foreground/20 p-3 rounded-lg">
                <p className="font-bold text-white">Dr. {doctor.name}</p>
                <p className="text-xs text-primary-foreground/80">SPECIALTY: {clinicGroup.specialties.join(', ')}</p>
              </div>
            </CardContent>
            <Stethoscope className="absolute -right-8 -bottom-8 h-40 w-40 text-primary-foreground/10" />
          </Card>
        </div>
      </div>
    </div>
  );
}
