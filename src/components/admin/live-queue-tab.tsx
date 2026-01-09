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


export function LiveQueueTab() {
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
                <TableCell className="font-bold">{patient.tokenNumber}</TableCell>
                <TableCell>{patient.name}</TableCell>
                <TableCell>{getClinicName(patient.clinicId)}</TableCell>
                <TableCell>{getDoctorName(patient.clinicId)}</TableCell>
                <TableCell>{format(new Date(patient.registeredAt), 'hh:mm a')}</TableCell>
                <TableCell>
                   <Badge variant={
                       patient.status === 'in-consultation' ? 'default' 
                       : patient.status === 'called' ? 'destructive' 
                       : 'secondary'
                    }>
                        {patient.status}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
             {patients.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
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
