
import 'server-only';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { initializeServerFirebase } from '@/firebase/server-init';

import type {
  Clinic,
  ClinicGroup,
} from './types';

// This is a temporary solution. In a real app, you'd have a more robust way to get the db instance.
const { firestore: db } = initializeServerFirebase();


// Clinics
export const getClinics = async (): Promise<Clinic[]> => {
  const clinicsCol = collection(db, 'groups'); // Assuming clinics are groups with type 'Clinic'
  const q = query(clinicsCol, where('type', '==', 'Clinic'));
  const snapshot = await getDocs(q);
  const clinics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic));
  
  if (clinics.length > 0) return clinics;

  // Mock fallback
  return [
      { id: 'clinic_01', name: 'City Care Clinic', location: 'Maharashtra, Mumbai' },
      { id: 'clinic_02', name: 'Health Plus Clinic', location: 'Maharashtra, Pune' },
  ];
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

  if (groups.length > 0) return groups;

  // Mock fallback
  return [
    {
      id: 'grp_cardiology_01',
      clinicId: 'clinic_01',
      name: 'Cardiology',
      tokenInitial: 'CARD',
      location: 'Wing A, Floor 2',
      specialties: ['Cardiology'],
      contact: '555-0101',
      doctors: [{ id: 'doc_ashish', name: 'Dr. Ashish' }],
      assistants: [{ id: 'asst_sunita', name: 'Sunita' }],
      cabins: [{ id: 'cab_01', name: 'Consultation Room 1', clinicId: 'clinic_01' }],
      screens: [{ id: 'scr_main_hall', name: 'Main Hall Display' }],
    },
    {
      id: 'grp_ortho_01',
      clinicId: 'clinic_02',
      name: 'Orthopedics',
      tokenInitial: 'ORTH',
      location: 'Building B, Floor 1',
      specialties: ['Orthopedics', 'Sports Medicine'],
      contact: '555-0102',
      doctors: [{ id: 'doc_vijay', name: 'Dr. Vijay' }],
      assistants: [{ id: 'asst_rajesh', name: 'Rajesh' }],
      cabins: [{ id: 'cab_03', name: 'Wellness Cabin A', clinicId: 'clinic_02' }],
      screens: [{ id: 'scr_ortho_wait', name: 'Ortho Waiting Area' }],
    },
  ];
};

export const getClinicGroupById = async (
  id: string
): Promise<ClinicGroup | undefined> => {
  const docRef = doc(db, 'groups', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ClinicGroup;
  }
  // Mock fallback
  const groups = await getClinicGroups();
  return groups.find(g => g.id === id);
};
