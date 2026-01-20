
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
  documentId,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

import type {
  Clinic,
  Group,
  Patient,
  PatientTransaction,
  PatientMaster,
  Advertisement,
  Consultation,
  PatientHistoryEntry,
  Cabin,
  User,
  EnrichedPatient,
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
export const getAllPatients = async (): Promise<EnrichedPatient[]> => {
  const transactionsCol = collection(db, 'patient_transactions');
  const transactionsSnapshot = await getDocs(transactionsCol);
  if (transactionsSnapshot.empty) return [];

  const transactions = transactionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      registeredAt: (data.registeredAt as Timestamp).toDate().toISOString(),
    } as PatientTransaction;
  });
  
  const contactNumbers = [...new Set(transactions.map(t => t.contactNumber))].filter(Boolean);
  if (contactNumbers.length === 0) return []; 

  const mastersCol = collection(db, 'patient_master');
  const mastersQuery = query(mastersCol, where('contactNumber', 'in', contactNumbers));
  const mastersSnapshot = await getDocs(mastersQuery);

  const mastersMap = new Map<string, PatientMaster>();
  mastersSnapshot.docs.forEach(doc => {
    const data = doc.data() as Omit<PatientMaster, 'id'>;
    mastersMap.set(data.contactNumber, { id: doc.id, ...data});
  });

  return transactions.map(t => {
      const masterData = mastersMap.get(t.contactNumber);
      if (!masterData) return null;
      return {...masterData, ...t };
  }).filter((p): p is EnrichedPatient => p !== null);
};

export const getPatientByToken = async (
  token: string
): Promise<EnrichedPatient | undefined> => {
  const q = query(collection(db, 'patient_transactions'), where('tokenNumber', '==', token));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return undefined;
  }
  const transactionDoc = snapshot.docs[0];
  const transactionData = transactionDoc.data() as PatientTransaction;
  
  if (!transactionData.contactNumber) return undefined;
  
  const mastersQuery = query(collection(db, 'patient_master'), where('contactNumber', '==', transactionData.contactNumber));
  const masterSnapshot = await getDocs(mastersQuery);
  if (masterSnapshot.empty) return undefined;
  const masterDoc = masterSnapshot.docs[0];

  const enrichedData = {
      ...masterDoc.data(),
      ...transactionData,
      id: transactionDoc.id,
      registeredAt: (transactionData.registeredAt as any as Timestamp).toDate().toISOString(),
  } as EnrichedPatient;

  return enrichedData;
};

export const getPatientsByClinicId = async (
  clinicId: string
): Promise<EnrichedPatient[]> => {
  const q = query(
    collection(db, 'patient_transactions'),
    where('clinicId', '==', clinicId)
  );
  const snapshot = await getDocs(q);
  const transactions = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        registeredAt: (data.registeredAt as Timestamp).toDate().toISOString(),
    } as PatientTransaction
  });
  
  const contactNumbers = [...new Set(transactions.map(t => t.contactNumber))].filter(Boolean);
  if (contactNumbers.length === 0) return [];
  
  const mastersQuery = query(collection(db, 'patient_master'), where('contactNumber', 'in', contactNumbers));
  const mastersSnapshot = await getDocs(mastersQuery);
  const mastersMap = new Map(mastersSnapshot.docs.map(d => [d.data().contactNumber, {id: d.id, ...d.data()} as PatientMaster]));
  
  return transactions.map(t => {
      const masterData = mastersMap.get(t.contactNumber);
      if (!masterData) return null;
      return {...masterData, ...t };
  }).filter((p): p is EnrichedPatient => p !== null);
};

export const getPatientsByGroupId = async (
  groupId: string
): Promise<EnrichedPatient[]> => {
  const q = query(collection(db, 'patient_transactions'), where('groupId', '==', groupId));
  const snapshot = await getDocs(q);
  const transactions = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        registeredAt: (data.registeredAt as Timestamp).toDate().toISOString(),
    } as PatientTransaction
  });
  
  const contactNumbers = [...new Set(transactions.map(t => t.contactNumber))].filter(Boolean);
  if (contactNumbers.length === 0) return [];

  const mastersQuery = query(collection(db, 'patient_master'), where('contactNumber', 'in', contactNumbers));
  const mastersSnapshot = await getDocs(mastersQuery);
  const mastersMap = new Map(mastersSnapshot.docs.map(d => [d.data().contactNumber, {id: d.id, ...d.data()} as PatientMaster]));
  
  return transactions.map(t => {
      const masterData = mastersMap.get(t.contactNumber);
      if (!masterData) return null;
      return {...masterData, ...t };
  }).filter((p): p is EnrichedPatient => p !== null);
};

export const getPatientHistory = async (
  transactionId: string
): Promise<PatientHistoryEntry[]> => {
  const transactionDocRef = doc(db, 'patient_transactions', transactionId);
  const transactionDocSnap = await getDoc(transactionDocRef);
  if (!transactionDocSnap.exists()) return [];

  const { contactNumber } = transactionDocSnap.data() as PatientTransaction;
  if (!contactNumber) return [];

  const historyQuery = query(
    collection(db, 'patient_transactions'),
    where('contactNumber', '==', contactNumber)
  );

  const patientVisitsSnapshot = await getDocs(historyQuery);
  if (patientVisitsSnapshot.empty) return [];

  const patientVisits = patientVisitsSnapshot.docs.map(
    (d) => ({ ...d.data(), id: d.id } as PatientTransaction)
  );

  const historyPromises = patientVisits.map(async (visit) => {
    // This part remains inefficient but is kept to preserve original functionality
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

    return {
      tokenNumber: visit.tokenNumber,
      clinicName,
      groupName: groupData?.name || 'N/A',
      doctorName: groupData?.doctors[0]?.name || 'N/A',
      issuedAt: visit.registeredAt,
      startTime: consultation?.date
        ? new Date(new Date(consultation.date).getTime() - 10 * 60000).toISOString()
        : undefined,
      endTime: consultation?.date,
      status: visit.status,
    } as PatientHistoryEntry;
  });

  const history = await Promise.all(historyPromises);
  return history.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
};

export const getQueueInfoByScreenId = async (screenId: string, allGroups: Group[], allPatients: EnrichedPatient[]) => {
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

    