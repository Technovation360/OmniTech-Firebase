import type { ClinicGroup, Patient, Advertisement, Consultation } from './types';

let clinicGroups: ClinicGroup[] = [
  {
    id: 'grp_cardiology_01',
    name: 'Cardiology Dept.',
    location: 'Metro City, California',
    specialties: ['Cardiology', 'General Medicine'],
    contact: 'contact@citygeneral.com',
    doctor: { id: 'doc_ashish', name: 'Dr. Ashish' },
    assistants: [{ id: 'asst_sunita', name: 'Sunita' }],
    cabin: { id: 'cab_101', name: 'Cabin 101' },
    screen: { id: 'scr_main_hall', name: 'Main Hall Display' },
  },
  {
    id: 'grp_ortho_01',
    name: 'Orthopedics Dept.',
    location: 'Metro City, California',
    specialties: ['Orthopedics', 'Pediatrics'],
    contact: 'ortho@citygeneral.com',
    doctor: { id: 'doc_vijay', name: 'Dr. Vijay' },
    assistants: [{ id: 'asst_rajesh', name: 'Rajesh' }],
    cabin: { id: 'cab_102', name: 'Cabin 102' },
    screen: { id: 'scr_main_hall', name: 'Main Hall Display' },
  },
];

let patients: Patient[] = [
  { id: 'pat_001', name: 'Rohan Sharma', age: 34, gender: 'male', tokenNumber: 'A101', status: 'waiting', clinicId: 'grp_cardiology_01', registeredAt: new Date().toISOString() },
  { id: 'pat_002', name: 'Priya Patel', age: 28, gender: 'female', tokenNumber: 'B205', status: 'waiting', clinicId: 'grp_ortho_01', registeredAt: new Date().toISOString() },
  { id: 'pat_003', name: 'Amit Singh', age: 45, gender: 'male', tokenNumber: 'A102', status: 'waiting', clinicId: 'grp_cardiology_01', registeredAt: new Date().toISOString() },
];

let consultations: Consultation[] = [
    {
      id: 'cons_001',
      patientId: 'pat_001',
      doctorId: 'doc_ashish',
      date: '2023-10-26T10:00:00.000Z',
      notes: 'Patient reported chest pain and shortness of breath. ECG showed minor abnormalities. Recommended a stress test.',
      summary: 'Patient presented with chest pain; ECG had minor issues, stress test advised.',
    },
];

let advertisements: Advertisement[] = [
  { id: 'ad_01', advertiser: 'HealthPlus Insurance', campaign: 'Winter Shield 2024', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', impressions: 12534 },
  { id: 'ad_02', advertiser: 'PharmaCure', campaign: 'New Pain Reliever Launch', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', impressions: 8345 },
];


// --- API Functions ---

// Clinic Groups
export const getClinicGroups = async (): Promise<ClinicGroup[]> => {
  return Promise.resolve(clinicGroups);
};

export const getClinicGroupById = async (id: string): Promise<ClinicGroup | undefined> => {
  return Promise.resolve(clinicGroups.find(cg => cg.id === id));
};

// Patients
export const getPatientByToken = async (token: string): Promise<Patient | undefined> => {
  return Promise.resolve(patients.find(p => p.tokenNumber === token));
};

export const getPatientsByClinicId = async (clinicId: string): Promise<Patient[]> => {
  const filtered = patients.filter(p => p.clinicId === clinicId);
  return Promise.resolve(filtered);
};

export const addPatient = async (data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'registeredAt'>): Promise<Patient> => {
    const clinic = await getClinicGroupById(data.clinicId);
    const prefix = clinic ? clinic.name.substring(0,1).toUpperCase() : 'Z';
    const lastToken = patients
        .filter(p => p.clinicId === data.clinicId)
        .map(p => parseInt(p.tokenNumber.slice(1), 10))
        .sort((a,b) => b-a)[0] || 0;

    const newPatient: Patient = {
        ...data,
        id: `pat_${Date.now()}`,
        tokenNumber: `${prefix}${lastToken + 1}`,
        status: 'waiting',
        registeredAt: new Date().toISOString()
    };
    patients.push(newPatient);
    return Promise.resolve(newPatient);
}

export const updatePatientStatus = async (patientId: string, status: Patient['status']): Promise<Patient | undefined> => {
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if(patientIndex === -1) return undefined;

    patients[patientIndex].status = status;
    return Promise.resolve(patients[patientIndex]);
}


// Queue Info (for display screen)
export const getQueueInfoByScreenId = async (screenId: string) => {
    const relevantClinics = clinicGroups.filter(cg => cg.screen.id === screenId);
    const clinicIds = relevantClinics.map(rc => rc.id);
    const queuePatients = patients.filter(p => clinicIds.includes(p.clinicId) && (p.status === 'waiting' || p.status === 'called' || p.status === 'in-consultation'));

    const calledPatient = queuePatients.find(p => p.status === 'called');
    
    // Find the clinic, cabin for the called patient
    const calledPatientInfo = calledPatient ? {
        ...calledPatient,
        cabinName: clinicGroups.find(cg => cg.id === calledPatient.clinicId)?.cabin.name || '',
    } : null;

    // After "calling" a patient, we set them back to 'in-consultation' after a delay so the notification disappears
    if (calledPatient) {
        setTimeout(() => {
            updatePatientStatus(calledPatient.id, 'in-consultation');
        }, 15000); // 15 seconds to show notification
    }

    return Promise.resolve({
        waiting: queuePatients.filter(p => p.status === 'waiting').sort((a, b) => a.tokenNumber.localeCompare(b.tokenNumber)),
        inConsultation: queuePatients.filter(p => p.status === 'in-consultation').sort((a, b) => a.tokenNumber.localeCompare(b.tokenNumber)),
        nowCalling: calledPatientInfo
    });
};


// Advertisements
export const getAdvertisements = async (): Promise<Advertisement[]> => {
    return Promise.resolve(advertisements);
}

// Consultations
export const getConsultationsByPatientId = async (patientId: string): Promise<Consultation[]> => {
    return Promise.resolve(consultations.filter(c => c.patientId === patientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
}

export const addConsultation = async (data: Omit<Consultation, 'id'>): Promise<Consultation> => {
    const newConsultation: Consultation = {
        ...data,
        id: `cons_${Date.now()}`
    };
    consultations.push(newConsultation);
    return Promise.resolve(newConsultation);
}
