
'use client';
import { useState, useEffect, use } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, X, PlusCircle } from 'lucide-react';
import { getClinicById } from '@/lib/data';
import type { Clinic } from '@/lib/types';
import Image from 'next/image';

function ClinicDetails({ clinic }: { clinic: Clinic }) {
  const [formData, setFormData] = useState({
    name: '',
    contact: 'contact@example.com',
    phone: '',
    location: '',
    city: '',
    state: '',
    zip: '',
    specialties: [] as string[],
  });

  useEffect(() => {
    if (clinic) {
      const [state, city] = clinic.location.split(', ');
      setFormData({
          name: clinic.name,
          contact: `contact@${clinic.name.toLowerCase().replace(/\s/g, '')}.com`,
          phone: '555-0199', // mock
          location: '123 Health Blvd', // mock
          city: city || 'Metro City', // mock
          state: state || 'California', // mock
          zip: '90001', // mock
          specialties: ['General Medicine', 'Cardiology'], // mock
      });
    }
  }, [clinic]);

  const handleSpecialtyRemove = (specialtyToRemove: string) => {
    setFormData(prev => ({
        ...prev,
        specialties: prev.specialties.filter(s => s !== specialtyToRemove)
    }));
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Clinic Profile</CardTitle>
            <CardDescription>Manage your clinic's public information and branding.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">CLINIC BRANDING</h3>
               <Card className="relative aspect-square w-full max-w-xs mx-auto flex items-center justify-center bg-muted/30">
                <div className="text-center text-muted-foreground">
                    <Image src="https://picsum.photos/seed/logo/200" alt="Clinic Logo" width={100} height={100} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">NO LOGO</p>
                </div>
                <Button size="icon" className="absolute bottom-4 right-4 rounded-full">
                    <Camera className="h-5 w-5" />
                </Button>
               </Card>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="clinicName" className="text-xs font-semibold">CLINIC NAME</Label>
                  <Input id="clinicName" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactNo" className="text-xs font-semibold">PUBLIC CONTACT NO.</Label>
                  <Input id="contactNo" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

               <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold">PUBLIC EMAIL ADDRESS</Label>
                <Input id="email" type="email" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>

               <div className="space-y-1">
                <Label htmlFor="address" className="text-xs font-semibold">PHYSICAL ADDRESS</Label>
                <Textarea id="address" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-xs font-semibold">CITY</Label>
                  <Input id="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state" className="text-xs font-semibold">STATE / REGION</Label>
                  <Input id="state" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="zip" className="text-xs font-semibold">PINCODE / ZIP</Label>
                  <Input id="zip" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} />
                </div>
              </div>
              
              <div>
                <Label className="text-xs font-semibold">CLINICAL SPECIALTIES</Label>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    {formData.specialties.map(spec => (
                        <Badge key={spec} variant="outline" className="pl-3 pr-2 py-1 text-sm bg-blue-100 border-blue-200 text-blue-800">
                           {spec}
                           <button onClick={() => handleSpecialtyRemove(spec)} className="ml-2 rounded-full hover:bg-black/10 p-0.5">
                            <X className="h-3 w-3" />
                           </button>
                        </Badge>
                    ))}
                     <Button variant="ghost" size="sm" className="gap-1 text-primary">
                        <PlusCircle className="h-4 w-4" />
                        Add
                    </Button>
                </div>
              </div>
              
              <div className="flex justify-start pt-4">
                <Button size="lg">SAVE PROFILE CHANGES</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}


export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    getClinicById(clinicId).then((data) => {
      if (data) {
        setClinic(data);
      }
    });
  }, [clinicId]);
  
  if (!clinic) {
    return <div>Loading...</div>;
  }

  return (
     <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Clinic Settings</h1>
        <p className="text-muted-foreground">Manage overall settings for {clinic.name}.</p>
        <ClinicDetails clinic={clinic} />
    </div>
  );
}
