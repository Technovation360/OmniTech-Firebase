
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
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { getClinicGroups } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';


export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ClinicGroup[]>([]);

  useEffect(() => {
    getClinicGroups().then(setClinics);
  }, []);

  return (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Clinics Management</CardTitle>
          <CardDescription>Onboard, edit, and manage clinic groups.</CardDescription>
        </div>
        <Button>Onboard Clinic</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clinic Name</TableHead>
              <TableHead>Primary Doctor</TableHead>
              <TableHead>Cabin</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinics.map((clinic) => (
              <TableRow key={clinic.id}>
                <TableCell className="font-medium">{clinic.name}</TableCell>
                <TableCell>{clinic.doctor.name}</TableCell>
                <TableCell>{clinic.cabin.name}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
