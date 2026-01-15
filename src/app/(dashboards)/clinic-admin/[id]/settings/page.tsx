
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
import { Camera, X, PlusCircle, Loader } from 'lucide-react';
import type { Clinic } from '@/lib/types';
import Image from 'next/image';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function ClinicDetails({ clinicId }: { clinicId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const clinicRef = useMemoFirebase(() => doc(firestore, 'clinics', clinicId), [firestore, clinicId]);
  const { data: clinic, isLoading, error } = useDoc<Clinic>(clinicRef);

  const [formData, setFormData] = useState<Partial<Clinic>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    specialties: [],
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        address: clinic.address || '',
        city: clinic.city || '',
        state: clinic.state || '',
        pincode: clinic.pincode || '',
        specialties: clinic.specialties || [],
      });
    }
  }, [clinic]);

  const handleInputChange = (field: keyof typeof formData, value: string | string[]) => {
      setFormData(prev => ({...prev, [field]: value}));
  }
  
  const handleSpecialtyRemove = (specialtyToRemove: string) => {
    setFormData(prev => ({
        ...prev,
        specialties: prev.specialties?.filter(s => s !== specialtyToRemove)
    }));
  };

  const handleSave = () => {
    setDocumentNonBlocking(clinicRef, formData, { merge: true });
    toast({
      title: "Settings Saved",
      description: "Your clinic profile has been updated.",
    });
  }

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-64">
              <Loader className="h-8 w-8 animate-spin" />
          </div>
      )
  }
  
  if (error) {
    return <p className="text-destructive">Error loading clinic settings: {error.message}</p>
  }
  
  if (!clinic) {
    return <p>Clinic not found.</p>
  }


  return (
    <Card>
        <CardHeader>
            <CardTitle>Clinic Profile</CardTitle>
            <CardDescription>Manage your clinic's public information and branding.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div>
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
               <div>
                <Label className="text-xs font-semibold">CLINICAL SPECIALTIES</Label>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    {formData.specialties?.map(spec => (
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
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="clinicName" className="text-xs font-semibold">CLINIC NAME</Label>
                  <Input id="clinicName" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactNo" className="text-xs font-semibold">PUBLIC CONTACT NO.</Label>
                  <Input id="contactNo" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                </div>
              </div>

               <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold">PUBLIC EMAIL ADDRESS</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
              </div>

               <div className="space-y-1">
                <Label htmlFor="address" className="text-xs font-semibold">PHYSICAL ADDRESS</Label>
                <Textarea id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-xs font-semibold">CITY</Label>
                  <Input id="city" value={formData.city} onChange={e => handleInputChange('city', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state" className="text-xs font-semibold">STATE / REGION</Label>
                  <Input id="state" value={formData.state} onChange={e => handleInputChange('state', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="zip" className="text-xs font-semibold">PINCODE / ZIP</Label>
                  <Input id="zip" value={formData.pincode} onChange={e => handleInputChange('pincode', e.target.value)} />
                </div>
              </div>
              
              <div className="flex justify-start pt-4">
                <Button size="lg" onClick={handleSave}>SAVE PROFILE CHANGES</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}


export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
     <div className="space-y-6">
        <ClinicDetails clinicId={resolvedParams.id} />
    </div>
  );
}

    