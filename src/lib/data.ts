'use client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

import type {
  Clinic,
  Group,
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

// Clinic Groups (Departments)
export const getClinicGroups = async (
  clinicId?: string
): Promise<Group[]> => {
  let q;
  if (clinicId) {
    q = query(
      collection(db, 'groups'),
      where('clinicId', '==', clinicId)
    );
  } else {
    q = query(collection(db, 'groups'));
  }
  const snapshot = await getDocs(q);
  const groups = snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as Group)
  );
  return groups;
};

export const getClinicGroupById = async (
  id: string
): Promise<Group | undefined> => {
  const docRef = doc(db, 'groups', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Group;
  }
  return undefined;
};


// Clinics
export const getClinics = async (): Promise<Clinic[]> => {
  const clinicsCol = collection(db, 'clinics');
  const q = query(clinicsCol);
  const snapshot = await getDocs(q);
  const clinics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic));
  return clinics;
};

export const getClinicById = async (
  id: string
): Promise<Clinic | undefined> => {
  const docRef = doc(db, 'clinics', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Clinic;
  }
  return undefined;
};


// Cabins
export const getCabinsByClinicId = async (
  clinicId: string
): Promise<Cabin[]> => {
  const cabinsCol = collection(db, 'cabins');
  const q = query(
    cabinsCol,
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

export const getPatientHistory = async (
  patientId: string,
  clinicId?: string
): Promise<PatientHistoryEntry[]> => {
  const patientDocRef = doc(db, 'patients', patientId);
  const patientDocSnap = await getDoc(patientDocRef);
  if (!patientDocSnap.exists()) {
    return [];
  }
  const currentPatientData = patientDocSnap.data() as Patient;

  let patientHistoryQuery;

  // Base queries to find the person
  const queries: any[] = [];
  if (currentPatientData.contactNumber) {
    queries.push(where('contactNumber', '==', currentPatientData.contactNumber));
  } else if (currentPatientData.emailAddress) {
    queries.push(where('emailAddress', '==', currentPatientData.emailAddress));
  } else {
    // If no unique identifier, just use the current patient doc ID
    queries.push(where('__name__', '==', patientId));
  }

  // Add clinic filter if provided
  if (clinicId) {
    queries.push(where('clinicId', '==', clinicId));
  }

  patientHistoryQuery = query(collection(db, 'patients'), ...queries);

  const patientVisitsSnapshot = await getDocs(patientHistoryQuery);
  if (patientVisitsSnapshot.empty) {
    return [];
  }

  const patientVisits = patientVisitsSnapshot.docs.map(
    (d) => ({ ...d.data(), id: d.id } as Patient)
  );

  const historyPromises = patientVisits.map(async (visit) => {
    const consultationsQuery = query(
      collection(db, 'consultations'),
      where('patientId', '==', visit.id)
    );
    const consultationsSnapshot = await getDocs(consultationsQuery);
    const consultation = consultationsSnapshot.docs.length > 0
      ? (consultationsSnapshot.docs[0].data() as Consultation)
      : undefined;

    const groupDoc = await getDoc(doc(db, 'groups', visit.groupId));
    const groupData = groupDoc.exists() ? (groupDoc.data() as Group) : null;

    let clinicName = 'Unknown Clinic';
    if (groupData) {
      const clinicDoc = await getDoc(doc(db, 'clinics', groupData.clinicId));
      if (clinicDoc.exists()) {
        clinicName = (clinicDoc.data() as Clinic).name;
      }
    }

    const registeredAt =
      (visit.registeredAt as any) instanceof Timestamp
        ? (visit.registeredAt as any).toDate().toISOString()
        : visit.registeredAt;

    return {
      tokenNumber: visit.tokenNumber,
      clinicName: clinicName,
      groupName: groupData?.name || 'N/A',
      doctorName: groupData?.doctors[0]?.name || 'N/A',
      issuedAt: registeredAt,
      startTime: consultation?.date
        ? new Date(
            new Date(consultation.date).getTime() - 10 * 60000
          ).toISOString()
        : undefined,
      endTime: consultation?.date,
      status: visit.status,
    } as PatientHistoryEntry;
  });

  const history = await Promise.all(historyPromises);

  return history.sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  );
};


export const getQueueInfoByScreenId = async (screenId: string, allGroups: Group[], allPatients: Patient[]) => {
    const groupForScreen = allGroups.find(g => g.screens.some(s => s.id === screenId));
    
    if (!groupForScreen) {
        return { waiting: [], inConsultation: [], nowCalling: null };
    }
    
    const patients = allPatients.filter(p => p.groupId === groupForScreen.id);

    const queuePatients = patients.filter(p => ['waiting', 'calling', 'consulting'].includes(p.status));
    
    const callingPatient = queuePatients.find(p => p.status === 'calling');
    
    let calledPatientInfo = null;
    if (callingPatient) {
        calledPatientInfo = {
            ...callingPatient,
            cabinName: groupForScreen?.cabins[0]?.name || 'Consultation Room',
        }
    }

    return {
        waiting: queuePatients.filter(p => p.status === 'waiting').sort((a, b) => a.tokenNumber.localeCompare(b.tokenNumber)),
        inConsultation: queuePatients.filter(p => p.status === 'consulting').sort((a, b) => a.tokenNumber.localeCompare(b.tokenNumber)),
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
