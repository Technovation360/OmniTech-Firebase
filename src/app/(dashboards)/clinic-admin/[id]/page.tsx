
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  Stethoscope,
  Loader,
} from 'lucide-react';
import { getClinicGroupById, getPatientsByClinicId } from '@/lib/data';
import { useState, useEffect } from 'react';
import { ClinicGroup, Patient } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const stats = [
  { title: 'TOTAL PATIENTS', value: '30', icon: Users },
  { title: 'IN WAITING', value: '30', icon: Clock },
  { title: 'ATTENDED', value: '0', icon: CheckCircle },
  { title: 'SKIPPED', value: '0', icon: XCircle },
];

const nextInLineData = [
  { wing: 'GENERAL MEDICINE', token: 'GM-101', patient: 'John Doe' },
  { wing: 'CARDIOLOGY', token: 'CR-101', patient: 'Christopher Harris' },
  { wing: 'PEDIATRICS', token: 'PD-101', patient: 'Steven Walker' },
];

const stationActivityData = [
    { room: 'Consultation Room 1', doctor: '-', status: 'OFF', serving: '--' },
    { room: 'Consultation Room 2', doctor: '-', status: 'OFF', serving: '--' },
    { room: 'Consultation Room 3', doctor: '-', status: 'OFF', serving: '--' },
];

function InsightsTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-sm">
          <CardHeader className="pb-2 text-center">
             <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-4">
            <div className="p-3 bg-accent rounded-full">
               <stat.icon className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="text-4xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Filters() {
    return (
        <div className="flex items-center gap-2">
            <Button>
                <Users className="mr-2 h-4 w-4" />
                Aggregate View
            </Button>
            <Button variant="outline" className="bg-white">
                <Building className="mr-2 h-4 w-4 text-red-500" />
                General Medicine
            </Button>
            <Button variant="outline" className="bg-white">
                <Stethoscope className="mr-2 h-4 w-4 text-blue-500"/>
                Cardiology
            </Button>
            <Button variant="outline" className="bg-white">
                <Users className="mr-2 h-4 w-4 text-green-500"/>
                Pediatrics
            </Button>
        </div>
    )
}

function NextInLineTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Next in Line</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Wing</TableHead>
                            <TableHead>Token</TableHead>
                            <TableHead>Patient</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {nextInLineData.map(item => (
                            <TableRow key={item.token}>
                                <TableCell className="font-medium">{item.wing}</TableCell>
                                <TableCell className="text-primary font-semibold">{item.token}</TableCell>
                                <TableCell>{item.patient}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function StationActivityTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Station Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Room</TableHead>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Serving</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stationActivityData.map(item => (
                            <TableRow key={item.room}>
                                <TableCell className="font-medium">{item.room}</TableCell>
                                <TableCell>{item.doctor}</TableCell>
                                <TableCell>{item.status}</TableCell>
                                <TableCell>{item.serving}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export default function ClinicAdminPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [clinic, setClinic] = useState<ClinicGroup | null>(null);

  useEffect(() => {
    getClinicGroupById(id).then(setClinic);
  }, [id]);

  if (!clinic) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InsightsTab />
      <Filters />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NextInLineTable />
        <StationActivityTable />
      </div>
    </div>
  );
}
