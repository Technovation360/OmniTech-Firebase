'use client';

import { use, useState, useEffect } from 'react';
import { getPatientsByClinicId } from '@/lib/data';
import type { Patient } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader } from 'lucide-react';

const badgeColors: Record<Patient['status'], string> = {
    'waiting': "bg-blue-100 text-blue-800",
    'called': "bg-orange-100 text-orange-800",
    'in-consultation': "bg-green-100 text-green-800",
    'consultation-done': "bg-gray-100 text-gray-800",
    'no-show': "bg-red-100 text-red-800",
};

export default function DoctorLiveQueuePage({ params }: { params: { id: string } }) {
  const { id: doctorId } = use(params);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clinicId = doctorId === 'doc_ashish' ? 'grp_cardiology_01' : 'grp_ortho_01';
    getPatientsByClinicId(clinicId).then(data => {
      setPatients(data.filter(p => ['waiting', 'called', 'in-consultation'].includes(p.status)));
      setLoading(false);
    });
  }, [doctorId]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Patient Queue</CardTitle>
        <CardDescription>A real-time view of patients in your queue.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length > 0 ? patients.map(patient => (
              <TableRow key={patient.id}>
                <TableCell className="font-bold">{patient.tokenNumber}</TableCell>
                <TableCell>{patient.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn("capitalize", badgeColors[patient.status])}>
                    {patient.status.replace('-', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">No patients in the queue.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
