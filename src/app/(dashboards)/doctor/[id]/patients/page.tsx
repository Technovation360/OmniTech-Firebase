'use client';

import { use, useState, useEffect } from 'react';
import { getPatientsByClinicId } from '@/lib/data';
import type { Patient } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorPatientsPage({ params }: { params: { id: string } }) {
  const { id: doctorId } = use(params);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clinicId = doctorId === 'doc_ashish' ? 'grp_cardiology_01' : 'grp_ortho_01';
    getPatientsByClinicId(clinicId).then(data => {
      setPatients(data);
      setLoading(false);
    });
  }, [doctorId]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Patients</CardTitle>
        <CardDescription>A list of all patients assigned to your clinic group.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length > 0 ? patients.map(patient => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">{patient.name}</TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell className="capitalize">{patient.gender}</TableCell>
                <TableCell>{format(new Date(patient.registeredAt), 'PPP')}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No patients found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
