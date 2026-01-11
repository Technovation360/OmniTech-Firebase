
'use client';

import { use, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getClinicGroups, getClinicById } from '@/lib/data';
import type { ClinicGroup, Clinic } from '@/lib/types';
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
  const { id: clinicId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialGroupId = searchParams.get('groupId');

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [groups, setGroups] = useState<ClinicGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ClinicGroup | null>(null);

  useEffect(() => {
    getClinicById(clinicId).then(setClinic);
    getClinicGroups(clinicId).then(clinicGroups => {
      setGroups(clinicGroups);
      if (initialGroupId) {
        setSelectedGroup(clinicGroups.find(g => g.id === initialGroupId) || clinicGroups[0] || null);
      } else if (clinicGroups.length > 0) {
        setSelectedGroup(clinicGroups[0]);
      }
    });
  }, [clinicId, initialGroupId]);

  if (groups.length === 0 || !selectedGroup || !clinic) {
    return <div>Loading...</div>;
  }
  
  const registrationUrl = `${window.location.origin}/register/${selectedGroup.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registrationUrl)}`;

  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        setSelectedGroup(group);
        // Update URL to reflect selected group
        router.push(`/clinic-admin/${clinicId}/groups/qr-code?groupId=${groupId}`);
    }
  };


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold font-headline">Group QR Codes</h1>
                <p className="text-muted-foreground">Display QR codes for patient self-registration.</p>
            </div>
            <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Group</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedGroup.id} onValueChange={handleGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
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
                    <p className="text-lg font-bold text-primary">{selectedGroup.name}</p>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-4">
                   <div className="bg-white p-2 border rounded-md">
                     <Image
                        src={qrCodeUrl}
                        alt={`QR Code for ${selectedGroup.name}`}
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
    return (
        <Suspense fallback={<div>Loading QR Codes...</div>}>
            <QRCodePageContent params={params} />
        </Suspense>
    )
}
