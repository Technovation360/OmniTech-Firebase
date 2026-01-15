
import 'server-only';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { initializeServerFirebase } from '@/firebase/server-init';

import type {
  Clinic,
  ClinicDepartment,
  Patient,
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

// Clinic Departments
export const getClinicDepartments = async (
  clinicId?: string
): Promise<ClinicDepartment[]> => {
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
  const departments = snapshot.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as ClinicDepartment)
  );
  return departments;
};

export const getClinicDepartmentById = async (
  id: string
): Promise<ClinicDepartment | undefined> => {
  const docRef = doc(db, 'clinics', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ClinicDepartment;
  }
  return undefined;
};
