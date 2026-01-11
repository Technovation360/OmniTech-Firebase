

import type { Clinic, ClinicGroup, Patient, Advertisement, Consultation, PatientHistoryEntry, Cabin } from './types';

let clinics: Clinic[] = [
    { id: 'clinic_01', name: 'City Care Clinic', location: 'Maharashtra, Mumbai' },
    { id: 'clinic_02', name: 'Health Plus Clinic', location: 'Delhi, Delhi' },
];

let cabins: Cabin[] = [
    { id: 'cab_101', name: 'Cabin 101', clinicId: 'clinic_01' },
    { id: 'cab_102', name: 'Cabin 102', clinicId: 'clinic_01' },
    { id: 'cab_103', name: 'Cabin 103', clinicId: 'clinic_01' },
    { id: 'cab_104', name: 'Cabin 104', clinicId: 'clinic_01' },
    { id: 'cab_105', name: 'Cabin 105', clinicId: 'clinic_01' },
    { id: 'cab_201', name: 'Cabin 201', clinicId: 'clinic_02' },
    { id: 'cab_202', name: 'Cabin 202', clinicId: 'clinic_02' },
    { id: 'cab_203', name: 'Cabin 203', clinicId: 'clinic_02' },
];


let clinicGroups: ClinicGroup[] = [
  {
    id: 'grp_cardiology_01',
    clinicId: 'clinic_01',
    name: 'Cardiology',
    tokenInitial: 'CR',
    location: 'Maharashtra, Mumbai',
    specialties: ['Cardiology', 'General Medicine'],
    contact: 'contact@citycare.com',
    doctors: [{ id: 'user_3', name: 'Dr. Ashish' }],
    assistants: [{ id: 'user_5', name: 'Sunita' }],
    cabins: [{ id: 'cab_101', name: 'Cabin 101', clinicId: 'clinic_01' }],
    screens: [{ id: 'user_7', name: 'Display User' }],
  },
  {
    id: 'grp_gen_med_01',
    clinicId: 'clinic_01',
    name: 'General Medicine',
    tokenInitial: 'GM',
    location: 'Maharashtra, Mumbai',
    specialties: ['General Medicine'],
    contact: 'contact@citycare.com',
    doctors: [{ id: 'doc_mehta', name: 'Dr. Mehta' }],
    assistants: [{ id: 'asst_ravi', name: 'Ravi' }],
    cabins: [{ id: 'cab_103', name: 'Cabin 103', clinicId: 'clinic_01' }],
    screens: [{ id: 'scr_main_hall', name: 'Main Hall Display' }],
  },
  {
    id: 'grp_derma_01',
    clinicId: 'clinic_01',
    name: 'Dermatology',
    tokenInitial: 'DR',
    location: 'Maharashtra, Mumbai',
    specialties: ['Dermatology'],
    contact: 'contact@citycare.com',
    doctors: [{ id: 'doc_gupta', name: 'Dr. Gupta' }],
    assistants: [{ id: 'asst_leela', name: 'Leela' }],
    cabins: [{ id: 'cab_105', name: 'Cabin 105', clinicId: 'clinic_01' }],
    screens: [{ id: 'scr_main_hall', name: 'Main Hall Display' }],
  },
  {
    id: 'grp_ortho_01',
    clinicId: 'clinic_02',
    name: 'Orthopedics',
    tokenInitial: 'OR',
    location: 'Delhi, Delhi',
    specialties: ['Orthopedics'],
    contact: 'contact@healthplus.com',
    doctors: [{ id: 'user_4', name: 'Dr. Vijay' }],
    assistants: [{ id: 'user_6', name: 'Rajesh' }],
    cabins: [{ id: 'cab_201', name: 'Cabin 201', clinicId: 'clinic_02' }],
    screens: [{ id: 'scr_main_hall_hp', name: 'Main Hall Display HP' }],
  },
    {
    id: 'grp_pediatrics_01',
    clinicId: 'clinic_02',
    name: 'Pediatrics',
    tokenInitial: 'PD',
    location: 'Delhi, Delhi',
    specialties: ['Pediatrics'],
    contact: 'contact@healthplus.com',
    doctors: [{ id: 'doc_singh', name: 'Dr. Singh' }],
    assistants: [{ id: 'asst_kumar', name: 'Kumar' }],
    cabins: [{ id: 'cab_202', name: 'Cabin 202', clinicId: 'clinic_02' }],
    screens: [{ id: 'scr_main_hall_hp', name: 'Main Hall Display HP' }],
  },
   {
    id: 'grp_neurology_01',
    clinicId: 'clinic_02',
    name: 'Neurology',
    tokenInitial: 'NR',
    location: 'Delhi, Delhi',
    specialties: ['Neurology'],
    contact: 'contact@healthplus.com',
    doctors: [{ id: 'doc_joshi', name: 'Dr. Joshi' }],
    assistants: [{ id: 'asst_priya', name: 'Priya' }],
    cabins: [{ id: 'cab_203', name: 'Cabin 203', clinicId: 'clinic_02' }],
    screens: [{ id: 'scr_main_hall_hp', name: 'Main Hall Display HP' }],
  },
];

let patients: Patient[] = [
  { id: 'pat_001', name: 'Rohan Sharma', age: 34, gender: 'male', contactNumber: '+91 9876543210', emailAddress: 'rohan.sharma@example.com', tokenNumber: 'CR101', status: 'waiting', groupId: 'grp_cardiology_01', clinicId: 'clinic_01', registeredAt: new Date().toISOString() },
  { id: 'pat_002', name: 'Priya Patel', age: 28, gender: 'female', contactNumber: '+91 9876543211', emailAddress: 'priya.patel@example.com', tokenNumber: 'OR205', status: 'waiting', groupId: 'grp_ortho_01', clinicId: 'clinic_02', registeredAt: new Date().toISOString() },
  { id: 'pat_003', name: 'Amit Singh', age: 45, gender: 'male', contactNumber: '+91 9876543212', emailAddress: 'amit.singh@example.com', tokenNumber: 'CR102', status: 'waiting', groupId: 'grp_cardiology_01', clinicId: 'clinic_01', registeredAt: new Date().toISOString() },
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
  { id: 'ad_01', advertiser: 'HealthCare Insurance', campaign: 'Winter Shield 2024', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', impressions: 12534 },
  { id: 'ad_02', advertiser: 'PharmaCure', campaign: 'New Pain Reliever Launch', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', impressions: 8345 },
];

export const mockUsers = [
    { id: 'user_1', name: 'Admin', email: 'admin@omni.com', role: 'central-admin', affiliation: 'Omni Platform'},
    { id: 'user_2', name: 'Priya Sharma', email: 'clinic-admin-city@omni.com', role: 'clinic-admin', affiliation: 'City Care Clinic'},
    { id: 'user_9', name: 'Rahul Verma', email: 'clinic-admin-health@omni.com', role: 'clinic-admin', affiliation: 'Health Plus Clinic'},
    { id: 'user_3', name: 'Dr. Ashish', email: 'doc_ashish@omni.com', role: 'doctor', affiliation: 'City Care Clinic', specialty: 'Cardiology' },
    { id: 'user_4', name: 'Dr. Vijay', email: 'doc_vijay@omni.com', role: 'doctor', affiliation: 'Health Plus Clinic', specialty: 'Orthopedics' },
    { id: 'user_5', name: 'Sunita', email: 'asst_sunita@omni.com', role: 'assistant', affiliation: 'City Care Clinic' },
    { id: 'user_6', name: 'Rajesh', email: 'asst_rajesh@omni.com', role: 'assistant', affiliation: 'Health Plus Clinic' },
    { id: 'user_7', name: 'Display User', email: 'display@omni.com', role: 'display', affiliation: 'City Care Clinic' },
    { id: 'user_8', name: 'Advertiser User', email: 'advertiser@omni.com', role: 'advertiser', affiliation: 'HealthCare Insurance' },
];


// --- API Functions ---

// Clinics
export const getClinics = async (): Promise<Clinic[]> => {
    return Promise.resolve(clinics);
}

export const getClinicById = async (id: string): Promise<Clinic | undefined> => {
    return Promise.resolve(clinics.find(c => c.id === id));
}

// Cabins
export const getCabinsByClinicId = async (clinicId: string): Promise<Cabin[]> => {
    return Promise.resolve(cabins.filter(c => c.clinicId === clinicId));
}


// Clinic Groups
export const getClinicGroups = async (clinicId?: string): Promise<ClinicGroup[]> => {
  if (clinicId) {
    return Promise.resolve(clinicGroups.filter(cg => cg.clinicId === clinicId));
  }
  return Promise.resolve(clinicGroups);
};

export const getClinicGroupById = async (id: string): Promise<ClinicGroup | undefined> => {
  return Promise.resolve(clinicGroups.find(cg => cg.id === id));
};

// Patients
export const getAllPatients = async (): Promise<Patient[]> => {
    return Promise.resolve(patients);
}

export const getPatientByToken = async (token: string): Promise<Patient | undefined> => {
  return Promise.resolve(patients.find(p => p.tokenNumber === token));
};

export const getPatientsByClinicId = async (clinicId: string): Promise<Patient[]> => {
  const filtered = patients.filter(p => p.clinicId === clinicId);
  return Promise.resolve(filtered);
};

export const getPatientsByGroupId = async (groupId: string): Promise<Patient[]> => {
  const filtered = patients.filter(p => p.groupId === groupId);
  return Promise.resolve(filtered);
};


export const addPatient = async (data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'registeredAt' | 'clinicId'> & { groupId: string }): Promise<Patient> => {
    const clinicGroup = await getClinicGroupById(data.groupId);
    if (!clinicGroup) {
      throw new Error('Clinic group not found');
    }
    const prefix = clinicGroup.tokenInitial;
    const lastToken = patients
        .filter(p => p.groupId === data.groupId)
        .map(p => parseInt(p.tokenNumber.replace(prefix, ''), 10))
        .sort((a,b) => b-a)[0] || 100;

    const newPatient: Patient = {
        ...data,
        id: `pat_${Date.now()}`,
        tokenNumber: `${prefix}${lastToken + 1}`,
        status: 'waiting',
        clinicId: clinicGroup.clinicId,
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

export const getPatientHistory = async (patientId: string): Promise<PatientHistoryEntry[]> => {
    const patientVisits = patients.filter(p => p.id === patientId);
    const history = patientVisits.map(visit => {
        const clinic = clinicGroups.find(cg => cg.id === visit.groupId);
        const consultation = consultations.find(c => c.patientId === visit.id);
        const startTime = consultation ? new Date(new Date(consultation.date).getTime() - 10 * 60000).toISOString() : undefined; // apx 10 mins before end time
        const endTime = consultation ? consultation.date : undefined;
        return {
            tokenNumber: visit.tokenNumber,
            clinicName: clinics.find(c => c.id === clinic?.clinicId)?.name || 'Unknown Clinic',
            groupName: clinic?.name || 'Unknown Group',
            doctorName: clinic?.doctors[0].name || 'Unknown Doctor',
            issuedAt: visit.registeredAt,
            startTime,
            endTime,
            status: visit.status,
        };
    });
    return Promise.resolve(history.sort((a,b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()));
}


// Queue Info (for display screen)
export const getQueueInfoByScreenId = async (screenId: string) => {
    const relevantClinics = clinicGroups.filter(cg => cg.screens.some(s => s.id === screenId));
    const groupIds = relevantClinics.map(rc => rc.id);
    const queuePatients = patients.filter(p => groupIds.includes(p.groupId) && (p.status === 'waiting' || p.status === 'called' || p.status === 'in-consultation'));

    const calledPatient = queuePatients.find(p => p.status === 'called');
    
    // Find the clinic, cabin for the called patient
    const calledPatientInfo = calledPatient ? {
        ...calledPatient,
        cabinName: clinicGroups.find(cg => cg.id === calledPatient.groupId)?.cabins[0].name || '',
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
