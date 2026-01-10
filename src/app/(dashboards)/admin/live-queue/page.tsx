'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPatientsByClinicId, getClinicGroups } from '@/lib/data';
import type { Patient, ClinicGroup } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


const badgeColors: Record<Patient['status'], string> = {
    'waiting': "bg-blue-100 text-blue-800",
    'called': "bg-orange-100 text-orange-800",
    'in-consultation': "bg-green-100 text-green-800",
    'consultation-done': "bg-gray-100 text-gray-800",
    'no-show': "bg-red-100 text-red-800",
};


export default function LiveQueuePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinics, setClinics] = useState<ClinicGroup[]>([]);

  useEffect(() => {
    getClinicGroups().then(allClinics => {
        setClinics(allClinics);
        // Fetch patients from all clinics
        Promise.all(allClinics.map(c => getPatientsByClinicId(c.id))).then(patientArrays => {
            const allPatients = patientArrays.flat()
                .filter(p => p.status === 'waiting' || p.status === 'called' || p.status === 'in-consultation')
                .sort((a,b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
            setPatients(allPatients);
        })
    });
  }, []);

  const getClinicName = (clinicId: string) => {
    return clinics.find(c => c.id === clinicId)?.name || 'Unknown';
  }

  const getDoctorName = (clinicId: string) => {
      return clinics.find(c => c.id === clinicId)?.doctor.name || 'Unknown';
  }

  return (
     <Card>
      <CardHeader>
        <CardTitle>Live Queue</CardTitle>
        <CardDescription>A real-time overview of all patient queues across all clinics.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Issued At</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-bold py-2 text-xs">{patient.tokenNumber}</TableCell>
                <TableCell className="py-2 text-xs">{patient.name}</TableCell>
                <TableCell className="py-2 text-xs">{getClinicName(patient.clinicId)}</TableCell>
                <TableCell className="py-2 text-xs">{getDoctorName(patient.clinicId)}</TableCell>
                <TableCell className="py-2 text-xs">{format(new Date(patient.registeredAt), 'hh:mm a')}</TableCell>
                <TableCell className="py-2 text-xs">
                   <Badge variant={'secondary'} className={cn("text-[10px] border-transparent capitalize", badgeColors[patient.status])}>
                        {patient.status.replace('-', ' ')}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
             {patients.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-2 text-xs">
                        No active patients in any queue.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
