
'use client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

import type {
  Clinic,
  ClinicGroup,
  Patient,
  Advertisement,
  Consultation,
  PatientHistoryEntry,
  Cabin,
  User,
} from './types';

// This is a temporary solution. In a real app, you'd have a more robust way to get the db instance.
const { firestore: db } = initializeFirebase();

// --- API Functions ---

// Clinics
export const getClinics = async (): Promise<Clinic[]> => {
  const clinicsCol = collection(db, 'groups'); // Assuming clinics are groups with type 'Clinic'
  const q = query(clinicsCol, where('type', '==', 'Clinic'));
  const snapshot = await getDocs(q);
  const clinics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic));
  return clinics;
};

export const getClinicById = async (
  id: string
): Promise<Clinic | undefined> => {
  const docRef = doc(db, 'groups', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().type === 'Clinic') {
    return { id: docSnap.id, ...docSnap.data() } as Clinic;
  }
  // Fallback for mock data - This can be removed once seeding is robust
  const mockClinics = [
      { id: 'clinic_01', name: 'City Care Clinic', location: 'Maharashtra, Mumbai' },
      { id: 'clinic_02', name: 'Health Plus Clinic', location: 'Maharashtra, Pune' },
  ];
  return mockClinics.find(c => c.id === id);
};

// Cabins
export const getCabinsByClinicId = async (
  clinicId: string
): Promise<Cabin[]> => {
  const cabinsCol = collection(db, 'groups');
  const q = query(
    cabinsCol,
    where('type', '==', 'Cabin'),
    where('clinicId', '==', clinicId)
  );
  const snapshot = await getDocs(q);
  const cabins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cabin));
  return cabins;
};

// Clinic Groups
export const getClinicGroups = async (
  clinicId?: string
): Promise<ClinicGroup[]> => {
  let q;
  if (clinicId) {
    q = query(
      collection(db, 'groups'),
      where('clinicId', '==', clinicId),
      where('type', '==', 'Doctor')
    );
  } else {
    q = query(collection(db, 'groups'), where('type', '==', 'Doctor'));
  }
  const snapshot = await getDocs(q);
  const groups = snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as ClinicGroup)
  );
  return groups;
};

export const getClinicGroupById = async (
  id: string
): Promise<ClinicGroup | undefined> => {
  const docRef = doc(db, 'groups', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ClinicGroup;
  }
  return undefined;
};

// Patients
export const getAllPatients = async (): Promise<Patient[]> => {
  const patientsCol = collection(db, 'patients');
  const snapshot = await getDocs(patientsCol);
  const patients = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        registeredAt: (data.registeredAt as Timestamp).toDate().toISOString(),
    } as Patient
  });
  return patients;
};

export const getPatientByToken = async (
  token: string
): Promise<Patient | undefined> => {
  const q = query(collection(db, 'patients'), where('tokenNumber', '==', token));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return undefined;
  }
  const doc = snapshot.docs[0];
  const data = doc.data();
  return { ...data, id: doc.id, registeredAt: (data.registeredAt as Timestamp).toDate().toISOString() } as Patient;
};

export const getPatientsByClinicId = async (
  clinicId: string
): Promise<Patient[]> => {
  const q = query(
    collection(db, 'patients'),
    where('clinicId', '==', clinicId)
  );
  const snapshot = await getDocs(q);
  const patients = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        registeredAt: (data.registeredAt as Timestamp).toDate().toISOString(),
    } as Patient
  });
  return patients;
};

export const getPatientsByGroupId = async (
  groupId: string
): Promise<Patient[]> => {
  const q = query(collection(db, 'patients'), where('groupId', '==', groupId));
  const snapshot = await getDocs(q);
    const patients = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        registeredAt: (data.registeredAt as Timestamp).toDate().toISOString(),
    } as Patient
  });
  return patients;
};

export const addPatient = async (
  data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'registeredAt'>
): Promise<Patient> => {
  const clinicGroup = await getClinicGroupById(data.groupId);
  if (!clinicGroup) {
    throw new Error('Clinic group not found');
  }
  const prefix = clinicGroup.tokenInitial;

  const patientsInGroupQuery = query(collection(db, 'patients'), where('groupId', '==', data.groupId));
  const patientsInGroupSnapshot = await getDocs(patientsInGroupQuery);
  const lastToken = patientsInGroupSnapshot.docs
    .map(doc => parseInt(doc.data().tokenNumber.replace(prefix, ''), 10))
    .filter(num => !isNaN(num))
    .sort((a, b) => b - a)[0] || 100;
  
  const newPatientData = {
    ...data,
    tokenNumber: `${prefix}${lastToken + 1}`,
    status: 'waiting',
    registeredAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'patients'), newPatientData);

  return {
    ...newPatientData,
    id: docRef.id,
    registeredAt: newPatientData.registeredAt.toDate().toISOString(),
  } as Patient;
};


export const updatePatientStatus = async (
  patientId: string,
  status: Patient['status']
): Promise<Patient | undefined> => {
  const patientRef = doc(db, 'patients', patientId);
  await updateDoc(patientRef, { status });
  const updatedDoc = await getDoc(patientRef);
    if (!updatedDoc.exists()) return undefined;
  const docData = updatedDoc.data();
  return { ...docData, id: updatedDoc.id, registeredAt: (docData.registeredAt as Timestamp).toDate().toISOString() } as Patient;
};

export const getPatientHistory = async (
  patientId: string
): Promise<PatientHistoryEntry[]> => {
  const patientDoc = await getDoc(doc(db, 'patients', patientId));
  if (!patientDoc.exists()) return [];

  // For simplicity, we are assuming one patient document means one visit.
  // A real implementation would query a `visits` collection for that patient.
  const visit = patientDoc.data() as Patient;
  const group = await getClinicGroupById(visit.groupId);
  const clinic = group ? await getClinicById(group.clinicId) : undefined;
  
  const consultationsQuery = query(collection(db, 'consultations'), where('patientId', '==', patientId));
  const consultationsSnapshot = await getDocs(consultationsQuery);
  const patientConsultations = consultationsSnapshot.docs.map(doc => doc.data() as Consultation);


  const history: PatientHistoryEntry[] = [{
    tokenNumber: visit.tokenNumber,
    clinicName: clinic?.name || 'Unknown Clinic',
    groupName: group?.name || 'Unknown Group',
    doctorName: group?.doctors[0]?.name || 'Unknown Doctor',
    issuedAt: (visit.registeredAt as any).toDate().toISOString(),
    startTime: patientConsultations[0] ? new Date(new Date(patientConsultations[0].date).getTime() - 10 * 60000).toISOString() : undefined,
    endTime: patientConsultations[0]?.date,
    status: visit.status,
  }];

  return history.sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  );
};


export const getQueueInfoByScreenId = async (screenId: string) => {
    const groupsQuery = query(collection(db, 'groups'), where('screens', 'array-contains', screenId));
    const groupsSnapshot = await getDocs(groupsQuery);
    if (groupsSnapshot.empty) {
        return { waiting: [], inConsultation: [], nowCalling: null };
    }

    const groupIds = groupsSnapshot.docs.map(d => d.id);
    const patientsQuery = query(collection(db, 'patients'), where('groupId', 'in', groupIds), where('status', 'in', ['waiting', 'called', 'in-consultation']));
    const patientsSnapshot = await getDocs(patientsQuery);
    
    const queuePatients = patientsSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Patient));

    const calledPatient = queuePatients.find(p => p.status === 'called');
    
    let calledPatientInfo = null;
    if (calledPatient) {
        const group = await getClinicGroupById(calledPatient.groupId);
        calledPatientInfo = {
            ...calledPatient,
            cabinName: group?.cabins[0]?.name || 'Consultation Room',
        }

        // After "calling" a patient, we set them back to 'in-consultation' after a delay so the notification disappears
        setTimeout(() => {
            updatePatientStatus(calledPatient.id, 'in-consultation');
        }, 15000); // 15 seconds to show notification
    }

    return {
        waiting: queuePatients.filter(p => p.status === 'waiting').sort((a, b) => a.tokenNumber.localeCompare(b.tokenNumber)),
        inConsultation: queuePatients.filter(p => p.status === 'in-consultation').sort((a, b) => a.tokenNumber.localeCompare(b.tokenNumber)),
        nowCalling: calledPatientInfo
    };
};

// Advertisements
export const getAdvertisements = async (): Promise<Advertisement[]> => {
  const snapshot = await getDocs(collection(db, 'advertisements'));
  return snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as Advertisement)
  );
};

// Consultations
export const getConsultationsByPatientId = async (
  patientId: string
): Promise<Consultation[]> => {
  const q = query(
    collection(db, 'consultations'),
    where('patientId', '==', patientId)
  );
  const snapshot = await getDocs(q);
  const consultations = snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as Consultation)
  );
  return consultations.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const addConsultation = async (
  data: Omit<Consultation, 'id'>
): Promise<Consultation> => {
  const docRef = await addDoc(collection(db, 'consultations'), data);
  return { id: docRef.id, ...data } as Consultation;
};

// Users - This would typically be more complex, fetching from a 'users' collection
export const mockUsers: User[] = [
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
