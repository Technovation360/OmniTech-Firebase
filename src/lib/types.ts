
import type { UserRole } from './roles';

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contactNumber: string;
  emailAddress: string;
  tokenNumber: string;
  status: 'waiting' | 'in-consultation' | 'consultation-done' | 'no-show' | 'called';
  groupId: string; // The ID of the group (e.g. Cardiology Department) within a clinic
  clinicId: string;
  registeredAt: string; // ISO 8601 date string
};

export type Doctor = {
  id: string;
  name: string;
};

export type Cabin = {
  id: string;
  name: string;
};

export type Assistant = {
  id: string;
  name: string;
};

export type Screen = {
  id: string;
  name: string;
};

// Represents a top-level Clinic
export type Clinic = {
  id: string;
  name: string;
  location: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  specialties?: string[];
};

// Represents a department or a group within a clinic (e.g. Cardiology)
export type ClinicGroup = {
  id: string;
  clinicId: string;
  name: string;
  type: 'Doctor'; // Indicates this is a group of doctors/department
  tokenInitial: string;
  location: string;
  specialties: string[];
  contact: string;
  doctors: Doctor[];
  assistants: Assistant[];
  cabins: Cabin[];
  screens: Screen[];
};

export type Advertisement = {
  id: string;
  advertiser: string;
  campaign: string;
  videoUrl: string;
  impressions: number;
};

export type Consultation = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO 8601 date string
  notes: string;
  summary: string;
};

export type PatientHistoryEntry = {
    tokenNumber: string;
    clinicName: string;
    groupName: string;
    doctorName: string;
    issuedAt: string; // ISO 8601 date string
    startTime?: string; // ISO 8601 date string
    endTime?: string; // ISO 8601 date string
    status: Patient['status'];
}

export type Role = {
    id: string;
    name: UserRole;
}

export type User = {
    id: string; // Document ID
    uid: string; // Firebase Auth User ID
    name: string;
    email: string;
    role: UserRole;
    affiliation?: string;
    phone?: string;
    specialty?: string;
};
