
'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import {
  getPatientsByClinicId,
  getClinicGroupById,
  getConsultationsByPatientId,
} from '@/lib/data';
import type { Patient, ClinicGroup, Consultation, Doctor } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Badge } from '@/components/ui/badge';
import {
  PhoneCall,
  Play,
  Square,
  UserX,
  History,
  FileText,
  Loader,
  Sparkles,
  Save,
  ArrowUp, 
  ArrowDown
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { handlePatientAction, createConsultationSummary } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const badgeColors: Record<'waiting' | 'called', string> = {
    'waiting': "bg-blue-100 text-blue-800",
    'called': "bg-orange-100 text-orange-800",
};

type DoctorPageProps = {
  params: { id: string };
};

type FetchedData = {
  clinicGroup: ClinicGroup | undefined;
  patients: Patient[];
};

// A simple client component to fetch initial data on the client side
export default function DoctorPageLoader({ params: { id } }: DoctorPageProps) {
  const [data, setData] = useState<FetchedData | null>(null);

  useEffect(() => {
    Promise.all([
      getClinicGroupById(id === 'doc_ashish' ? 'grp_cardiology_01' : 'grp_ortho_01'),
      getPatientsByClinicId(id === 'doc_ashish' ? 'grp_cardiology_01' : 'grp_ortho_01'),
    ]).then(([clinicGroup, patients]) => {
      setData({ clinicGroup, patients });
    });
  }, [id]);

  if (!data || !data.clinicGroup) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <DoctorDashboard clinicGroup={data.clinicGroup} initialPatients={data.patients} />;
}

function PatientActions({ patient }: { patient: Patient }) {
  const [isPending, startTransition] = useTransition();

  const callPatient = () => startTransition(() => handlePatientAction(patient.id, 'call'));
  const startConsultation = () => startTransition(() => handlePatientAction(patient.id, 'start'));

  if (patient.status === 'waiting') {
    return (
      <Button size="sm" onClick={callPatient} disabled={isPending}>
        <PhoneCall className="mr-2 h-4 w-4" /> Call
      </Button>
    );
  }
  if (patient.status === 'called') {
    return (
      <Button size="sm" onClick={startConsultation} disabled={isPending}>
        <Play className="mr-2 h-4 w-4" /> Start
      </Button>
    );
  }
  return null;
}

function ConsultationPad({
  patient,
  doctor,
  onConsultationEnd,
}: {
  patient: Patient;
  doctor: Doctor;
  onConsultationEnd: () => void;
}) {
  const { toast } = useToast();
  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [pastConsultations, setPastConsultations] = useState<Consultation[]>([]);
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');

  const [formState, formAction, isSummarizing] = useActionState(createConsultationSummary, { message: "" });
  
  const handleShowHistory = async () => {
    setHistoryVisible(!isHistoryVisible);
    if (!isHistoryVisible && pastConsultations.length === 0) {
      const history = await getConsultationsByPatientId(patient.id);
      setPastConsultations(history);
    }
  };

  const endConsultationAction = async () => {
    await handlePatientAction(patient.id, 'end');
    onConsultationEnd();
  }

  const noShowAction = async () => {
    await handlePatientAction(patient.id, 'no-show');
    onConsultationEnd();
  }
  
  useEffect(() => {
    if (formState.success) {
      toast({ title: "Success", description: "Consultation saved successfully." });
      onConsultationEnd();
    }
  }, [formState, onConsultationEnd, toast]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Consultation: {patient.name} ({patient.tokenNumber})</CardTitle>
            <CardDescription>
              {patient.age} years old, {patient.gender}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShowHistory}>
              <History className="mr-2 h-4 w-4" /> {isHistoryVisible ? 'Hide' : 'Show'} History
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isHistoryVisible && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Past Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                {pastConsultations.length > 0 ? (
                  pastConsultations.map((c, index) => (
                    <div key={c.id}>
                      <p className="font-semibold text-sm">
                        {format(new Date(c.date), 'PPP')}
                      </p>
                      <p className="text-xs text-muted-foreground">Notes: {c.notes}</p>
                      <p className="text-xs text-accent-foreground font-medium mt-1">Summary: {c.summary}</p>
                      {index < pastConsultations.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No past consultations found.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="patientId" value={patient.id} />
          <input type="hidden" name="doctorId" value={doctor.id} />
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Consultation Notes
            </label>
            <Textarea
              id="notes"
              name="notes"
              rows={6}
              placeholder="Start typing patient notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isSummarizing || notes.length < 10}>
              {isSummarizing ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Summarize & Save
            </Button>
          </div>
          
          {formState?.message && !formState.success && <p className="text-sm text-destructive">{formState.message}</p>}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
         <Button variant="destructive" size="sm" onClick={noShowAction}>
              <UserX className="mr-2 h-4 w-4" /> Mark as No-Show
            </Button>
            <Button variant="secondary" size="sm" onClick={endConsultationAction}>
              <Square className="mr-2 h-4 w-4" /> End Without Saving
            </Button>
      </CardFooter>
    </Card>
  );
}

function DoctorDashboard({
  clinicGroup,
  initialPatients,
}: {
  clinicGroup: ClinicGroup;
  initialPatients: Patient[];
}) {
  const [patients, setPatients] = useState(initialPatients.filter((p) => ['waiting', 'called'].includes(p.status)));
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    initialPatients.find(p => p.status === 'in-consultation') || null
  );
  const [sortConfig, setSortConfig] = useState<{ key: keyof Patient; direction: 'asc' | 'desc' } | null>({ key: 'tokenNumber', direction: 'asc' });


  const handleConsultationEnd = () => {
    setSelectedPatient(null);
    // This would typically re-fetch, but here we just clear the selection
  }
  
  const handleAction = (patient: Patient) => {
    if (patient.status === 'called') {
        setSelectedPatient(patient);
    }
  }

  const handleSort = (key: keyof Patient) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedPatients = [...patients].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setPatients(sortedPatients);
  };
  
  const getSortIcon = (key: keyof Patient) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dr. {clinicGroup.doctor.name}'s Dashboard</h1>
        <p className="text-muted-foreground">Managing patients for {clinicGroup.name}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Patient Queue</CardTitle>
            <CardDescription>Patients waiting for consultation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('tokenNumber')}>
                        Token
                        {getSortIcon('tokenNumber')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                        Name
                        {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('status')}>
                        Status
                        {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <TableRow key={patient.id} onClick={() => handleAction(patient)} className={patient.status === 'called' ? 'bg-accent/50 cursor-pointer' : ''}>
                      <TableCell className="font-bold py-2 text-xs">{patient.tokenNumber}</TableCell>
                      <TableCell className="py-2 text-xs">{patient.name}</TableCell>
                      <TableCell className="py-2 text-xs">
                        <Badge variant={'secondary'} className={cn("text-[10px] border-transparent capitalize", badgeColors[patient.status as 'waiting' | 'called'])}>
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        <PatientActions patient={patient} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-2 text-xs">
                      No patients in the queue.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedPatient ? (
          <ConsultationPad patient={selectedPatient} doctor={clinicGroup.doctor} onConsultationEnd={handleConsultationEnd} />
        ) : (
          <Card className="col-span-1 lg:col-span-2 flex items-center justify-center border-dashed">
            <div className="text-center p-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Active Consultation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Call a patient from the queue to start a consultation.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
