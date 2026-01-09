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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2 } from 'lucide-react';
import { getClinicGroups } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';

function OnboardClinicForm({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold tracking-normal">
            REGISTER CLINIC
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="clinicName" className="font-semibold text-gray-600">CLINIC NAME</Label>
              <Input id="clinicName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-gray-600">EMAIL</Label>
              <Input id="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold text-gray-600">PHONE</Label>
              <Input id="phone" type="tel" />
            </div>
             <div className="space-y-2 col-span-2">
                <Label htmlFor="specialties" className="font-semibold text-gray-600">SPECIALTIES</Label>
                <Select>
                    <SelectTrigger id="specialties">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cardiology">Cardiology</SelectItem>
                        <SelectItem value="orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address" className="font-semibold text-gray-600">ADDRESS</Label>
              <Textarea id="address" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="font-semibold text-gray-600">CITY</Label>
              <Input id="city" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="font-semibold text-gray-600">STATE</Label>
              <Input id="state" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin" className="font-semibold text-gray-600">PIN</Label>
              <Input id="pin" />
            </div>
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            CANCEL
          </Button>
          <Button>CONFIRM</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ClinicGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getClinicGroups().then(setClinics);
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clinics Management</CardTitle>
            <CardDescription>Onboard, edit, and manage clinic groups.</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>Onboard Clinic</Button>
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
      <OnboardClinicForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
