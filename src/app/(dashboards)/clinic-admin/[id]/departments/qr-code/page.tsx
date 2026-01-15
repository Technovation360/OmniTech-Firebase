
'use client';

import { use, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getClinicDepartments, getClinicById } from '@/lib/data';
import type { ClinicDepartment, Clinic } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function QRCodePageContent({ params }: { params: { id: string } }) {
  const { id: clinicId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDepartmentId = searchParams.get('departmentId');

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [departments, setDepartments] = useState<ClinicDepartment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<ClinicDepartment | null>(null);

  useEffect(() => {
    getClinicById(clinicId).then(setClinic);
    getClinicDepartments(clinicId).then(clinicDepartments => {
      setDepartments(clinicDepartments);
      if (initialDepartmentId) {
        setSelectedDepartment(clinicDepartments.find(g => g.id === initialDepartmentId) || clinicDepartments[0] || null);
      } else if (clinicDepartments.length > 0) {
        setSelectedDepartment(clinicDepartments[0]);
      }
    });
  }, [clinicId, initialDepartmentId]);

  if (departments.length === 0 || !selectedDepartment || !clinic) {
    return <div>Loading...</div>;
  }
  
  const registrationUrl = `${window.location.origin}/register/${selectedDepartment.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registrationUrl)}`;

  const handleDepartmentChange = (departmentId: string) => {
    const department = departments.find(g => g.id === departmentId);
    if (department) {
        setSelectedDepartment(department);
        // Update URL to reflect selected department
        router.push(`/clinic-admin/${clinicId}/departments/qr-code?departmentId=${departmentId}`);
    }
  };


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold font-headline">Department QR Codes</h1>
                <p className="text-muted-foreground">Display QR codes for patient self-registration.</p>
            </div>
            <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Department</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDepartment.id} onValueChange={handleDepartmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(department => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
            <Card className="printable-area">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-base">{clinic.name}</CardTitle>
                    <CardDescription className="text-xs">Scan to Register for</CardDescription>
                    <p className="text-lg font-bold text-primary">{selectedDepartment.name}</p>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-4">
                   <div className="bg-white p-2 border rounded-md">
                     <Image
                        src={qrCodeUrl}
                        alt={`QR Code for ${selectedDepartment.name}`}
                        width={150}
                        height={150}
                        unoptimized
                    />
                   </div>
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                       Point your phone's camera at the code to open the registration link.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}


export default function QRCodePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return (
        <Suspense fallback={<div>Loading QR Codes...</div>}>
            <QRCodePageContent params={resolvedParams} />
        </Suspense>
    )
}
