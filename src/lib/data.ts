
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
  Firestore,
} from 'firebase/firestore';
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
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const { firestore: db } = initializeFirebase();

// This file is for CLIENT-SIDE data fetching.
// For server-side, use lib/server-data.ts

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
  if (docSnap.exists() && docSnap.data().type === 'Doctor') {
    return { id: docSnap.id, ...docSnap.data() } as ClinicGroup;
  }
  return undefined;
};


// Clinics
export const getClinics = async (): Promise<Clinic[]> => {
  const clinicsCol = collection(db, 'groups');
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
  return undefined;
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
  data: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'registeredAt'>,
  clinicGroup: ClinicGroup
): Promise<Patient> => {

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
  patientId: string,
  clinics?: Clinic[]
): Promise<PatientHistoryEntry[]> => {
  
  const consultationsQuery = query(collection(db, 'consultations'), where('patientId', '==', patientId));
  const consultationsSnapshot = await getDocs(consultationsQuery);
  const patientConsultations = consultationsSnapshot.docs.map(doc => doc.data() as Consultation);

  const tokensQuery = query(collection(db, 'groups'), where('type', '==', 'Token'), where('patientId', '==', patientId));
  const tokensSnapshot = await getDocs(tokensQuery);
  
  const historyPromises = tokensSnapshot.docs.map(async (tokenDoc) => {
    const tokenData = tokenDoc.data();
    const groupDoc = await getDoc(doc(db, 'groups', tokenData.groupId));
    const groupData = groupDoc.data() as ClinicGroup;
    
    let clinicName = 'Unknown Clinic';
    if(clinics) {
        const clinic = clinics.find(c => c.id === groupData.clinicId);
        if(clinic) clinicName = clinic.name;
    } else {
        const clinicDoc = await getDoc(doc(db, 'groups', groupData.clinicId));
        if(clinicDoc.exists()) clinicName = (clinicDoc.data() as Clinic).name;
    }


    const consultation = patientConsultations.find(c => c.id === tokenData.consultationId);

    return {
      tokenNumber: tokenData.tokenNumber,
      clinicName: clinicName,
      groupName: groupData.name,
      doctorName: groupData.doctors[0]?.name || 'N/A',
      issuedAt: (tokenData.generationTime as Timestamp).toDate().toISOString(),
      startTime: consultation ? new Date(new Date(consultation.date).getTime() - 10 * 60000).toISOString() : undefined,
      endTime: consultation?.date,
      status: 'consultation-done', // This is a simplification
    }
  });

  const history = await Promise.all(historyPromises);

  return history.sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  );
};


export const getQueueInfoByScreenId = async (screenId: string, allGroups: ClinicGroup[], allPatients: Patient[]) => {
    const groupForScreen = allGroups.find(g => g.screens.some(s => s.id === screenId));
    
    if (!groupForScreen) {
        return { waiting: [], inConsultation: [], nowCalling: null };
    }
    
    const patients = allPatients.filter(p => p.groupId === groupForScreen.id);

    const queuePatients = patients.filter(p => ['waiting', 'called', 'in-consultation'].includes(p.status));
    
    const calledPatient = queuePatients.find(p => p.status === 'called');
    
    let calledPatientInfo = null;
    if (calledPatient) {
        calledPatientInfo = {
            ...calledPatient,
            cabinName: groupForScreen?.cabins[0]?.name || 'Consultation Room',
        }

        setTimeout(() => {
            updatePatientStatus(calledPatient.id, 'in-consultation');
        }, 15000); 
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
  const ads = snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as Advertisement)
  );
  return ads;
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

    