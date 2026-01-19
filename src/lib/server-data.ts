
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
  Consultation,
  PatientMaster,
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

export const getPatients = async (): Promise<Patient[]> => {
  const patientsCol = collection(db, 'patient_transactions');
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
): Promise<Patient | undefined> => {
  const q = query(collection(db, 'patient_transactions'), where('tokenNumber', '==', token));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return undefined;
  }
  const doc = snapshot.docs[0];
  const data = doc.data();
  return { ...data, id: doc.id, registeredAt: (data.registeredAt as Timestamp).toDate().toISOString() } as Patient;
};

export const addPatient = async (
  data: Omit<Patient, 'id' | 'patientMasterId' | 'tokenNumber' | 'status' | 'registeredAt'>,
  clinicGroup: Group
): Promise<Patient> => {

  const patientMasterCol = collection(db, 'patient_master');
  const q = query(patientMasterCol, where('contactNumber', '==', data.contactNumber));
  const masterSnapshot = await getDocs(q);

  let patientMasterId: string;
  let patientMasterData: Omit<PatientMaster, 'id'>;

  if (masterSnapshot.empty) {
    // Create new patient master
    const newMasterDocRef = doc(patientMasterCol);
    patientMasterId = newMasterDocRef.id;
    patientMasterData = {
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
    patientMasterId = masterDoc.id;
     patientMasterData = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      contactNumber: data.contactNumber,
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

      const transactionData = {
        ...data,
        patientMasterId,
        tokenNumber: `${prefix}${newToken}`,
        status: 'waiting' as const,
        registeredAt: Timestamp.now(),
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
    } as Patient;
  } catch (error) {
    console.error('Token generation transaction failed: ', error);
    throw new Error('Failed to generate a unique token. Please try again.');
  }
};


export const updatePatientStatus = async (
  patientId: string,
  status: Patient['status']
): Promise<Patient | undefined> => {
  const patientRef = doc(db, 'patient_transactions', patientId);
  await updateDoc(patientRef, { status });
  const updatedDoc = await getDoc(patientRef);
    if (!updatedDoc.exists()) return undefined;
  const docData = updatedDoc.data();
  return { ...docData, id: updatedDoc.id, registeredAt: (docData.registeredAt as Timestamp).toDate().toISOString() } as Patient;
};

export const addConsultation = async (
  data: Omit<Consultation, 'id'>
): Promise<Consultation> => {
  const docRef = await addDoc(collection(db, 'consultations'), data);
  return { id: docRef.id, ...data } as Consultation;
};
