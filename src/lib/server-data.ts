
import 'server-only';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
  updateDoc,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { initializeServerFirebase } from '@/firebase/server-init';

import type {
  Clinic,
  Group,
  Patient,
  PatientTransaction,
  Consultation,
  PatientMaster,
  EnrichedPatient,
} from './types';

const { firestore: db } = initializeServerFirebase();

// This file is for SERVER-SIDE data fetching.
// For client-side, use lib/data.ts

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

export const getPatients = async (): Promise<EnrichedPatient[]> => {
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
  
  if (contactNumbers.length === 0) {
      return []; 
  }

  // Firestore 'in' query is limited to 30 values in a single query.
  // Chunking is needed for larger sets. For this prototype, we assume fewer than 30.
  const mastersCol = collection(db, 'patient_master');
  const mastersQuery = query(mastersCol, where('contactNumber', 'in', contactNumbers));
  const mastersSnapshot = await getDocs(mastersQuery);

  const mastersMap = new Map<string, PatientMaster>();
  mastersSnapshot.docs.forEach(doc => {
    const masterData = { id: doc.id, ...doc.data() } as PatientMaster;
    mastersMap.set(masterData.contactNumber, masterData);
  });

  const enrichedPatients = transactions.map(transaction => {
    const masterData = mastersMap.get(transaction.contactNumber);
    if (!masterData) return null; 
    return { ...masterData, ...transaction };
  }).filter(p => p !== null) as EnrichedPatient[];

  return enrichedPatients;
};

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
  const masterDocSnap = masterSnapshot.docs[0];

  const masterData = masterDocSnap.data() as Omit<PatientMaster, 'id'>;

  return {
      ...masterData,
      ...transactionData,
      id: transactionDoc.id,
      registeredAt: (transactionData.registeredAt as any as Timestamp).toDate().toISOString(),
  };
};

export const addPatient = async (
  data: Omit<PatientMaster, 'id'> & { groupId: string },
  clinicGroup: Group
): Promise<PatientTransaction> => {

  const patientMasterCol = collection(db, 'patient_master');
  const q = query(patientMasterCol, where('contactNumber', '==', data.contactNumber));
  const masterSnapshot = await getDocs(q);

  if (masterSnapshot.empty) {
    // Create new patient master
    const newMasterDocRef = doc(patientMasterCol);
    const patientMasterData: Omit<PatientMaster, 'id'> = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      contactNumber: data.contactNumber,
      emailAddress: data.emailAddress,
    };
    await setDoc(newMasterDocRef, patientMasterData);
  } else {
    // Patient master exists, update it
    const masterDoc = masterSnapshot.docs[0];
    const patientMasterData: Partial<PatientMaster> = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      emailAddress: data.emailAddress,
    };
    await updateDoc(masterDoc.ref, patientMasterData);
  }
  
  const groupRef = doc(db, 'groups', clinicGroup.id);

  try {
    const newTransactionData = await runTransaction(db, async (transaction) => {
      const groupDoc = await transaction.get(groupRef);
      if (!groupDoc.exists()) {
        throw new Error('Group document does not exist!');
      }

      const groupData = groupDoc.data();
      const prefix = groupData.tokenInitial;
      const currentToken = groupData.lastTokenNumber || 100;
      const newToken = currentToken + 1;

      const newTransactionDocRef = doc(collection(db, 'patient_transactions'));

      const transactionData: Omit<PatientTransaction, 'id'> = {
        contactNumber: data.contactNumber,
        clinicId: clinicGroup.clinicId,
        groupId: clinicGroup.id,
        tokenNumber: `${prefix}${newToken}`,
        status: 'waiting',
        registeredAt: (Timestamp.now() as any), // Cast to avoid type mismatch
      };

      transaction.set(newTransactionDocRef, transactionData);
      transaction.update(groupRef, { lastTokenNumber: newToken });

      return {
        id: newTransactionDocRef.id,
        ...transactionData,
      };
    });

    return {
      ...newTransactionData,
      registeredAt: (newTransactionData.registeredAt as Timestamp).toDate().toISOString(),
    } as PatientTransaction;
  } catch (error) {
    console.error('Token generation transaction failed: ', error);
    throw new Error('Failed to generate a unique token. Please try again.');
  }
};


export const updatePatientStatus = async (
  patientId: string,
  status: PatientTransaction['status']
): Promise<PatientTransaction | undefined> => {
  const patientRef = doc(db, 'patient_transactions', patientId);
  await updateDoc(patientRef, { status });
  const updatedDoc = await getDoc(patientRef);
    if (!updatedDoc.exists()) return undefined;
  const docData = updatedDoc.data();
  return { ...docData, id: updatedDoc.id, registeredAt: (docData.registeredAt as Timestamp).toDate().toISOString() } as PatientTransaction;
};

export const addConsultation = async (
  data: Omit<Consultation, 'id'>
): Promise<Consultation> => {
  const docRef = await addDoc(collection(db, 'consultations'), data);
  return { id: docRef.id, ...data } as Consultation;
};

    