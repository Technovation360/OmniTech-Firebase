
import type { UserRole } from './roles';

export type PatientMaster = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contactNumber: string;
  emailAddress: string;
};

export type PatientTransaction = {
  id: string; // transaction id
  contactNumber: string; // Patient's phone number, links to patient_master
  tokenNumber: string;
  status: 'waiting' | 'calling' | 'consulting' | 'no-show' | 'consultation-done';
  groupId: string;
  clinicId: string;
  registeredAt: string; // ISO 8601 date string
  cabinId?: string;
  consultingStartTime?: string;
  consultingEndTime?: string;
};

// Represents the joined data of a transaction and its master record
export type EnrichedPatient = PatientTransaction & Omit<PatientMaster, 'id'>;

// Kept for backward compatibility in UI components, now represents the enriched view
export type Patient = EnrichedPatient;

export type Doctor = {
  id: string;
  name: string;
};

export type Cabin = {
  id: string;
  name: string;
  clinicId: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  patientInCabinId?: string;
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
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  specialties?: string[];
};

// Represents a department or a group within a clinic (e.g. Cardiology)
export type Group = {
  id: string;
  clinicId: string;
  name: string;
  tokenInitial: string;
  location: string;
  specialties: string[];
  contact: string;
  doctors: Doctor[];
  assistants: Assistant[];
  cabins: {id: string, name: string}[];
  screens: Screen[];
  lastTokenNumber?: number;
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
    status: PatientTransaction['status'];
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

    