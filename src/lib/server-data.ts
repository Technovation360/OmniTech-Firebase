
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
} from 'firebase/firestore';
import { initializeServerFirebase } from '@/firebase/server-init';

import type {
  Clinic,
  ClinicGroup,
  Patient,
  Consultation,
} from './types';

const { firestore: db } = initializeServerFirebase();

// This file is for SERVER-SIDE data fetching.
// For client-side, use lib/data.ts

// Clinics
export const getClinics = async (): Promise<Clinic[]> => {
  const clinicsCol = collection(db, 'clinics');
  const q = query(clinicsCol, where('type', '==', 'Clinic'));
  const snapshot = await getDocs(q);
  const clinics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic));
  return clinics;
};

export const getClinicById = async (
  id: string
): Promise<Clinic | undefined> => {
  const docRef = doc(db, 'clinics', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().type === 'Clinic') {
    return { id: docSnap.id, ...docSnap.data() } as Clinic;
  }
  return undefined;
};

export const getPatients = async (): Promise<Patient[]> => {
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

// Clinic Groups (Departments)
export const getClinicGroups = async (
  clinicId?: string
): Promise<ClinicGroup[]> => {
  let q;
  if (clinicId) {
    q = query(
      collection(db, 'clinics'),
      where('clinicId', '==', clinicId),
      where('type', '==', 'Doctor')
    );
  } else {
    q = query(collection(db, 'clinics'), where('type', '==', 'Doctor'));
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
  const docRef = doc(db, 'clinics', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ClinicGroup;
  }
  return undefined;
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

export const addConsultation = async (
  data: Omit<Consultation, 'id'>
): Promise<Consultation> => {
  const docRef = await addDoc(collection(db, 'consultations'), data);
  return { id: docRef.id, ...data } as Consultation;
};
