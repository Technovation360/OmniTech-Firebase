

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contactNumber: string;
  emailAddress: string;
  tokenNumber: string;
  status: 'waiting' | 'in-consultation' | 'consultation-done' | 'no-show' | 'called';
  groupId: string;
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
  clinicId: string;
};

export type Assistant = {
  id: string;
  name: string;
};

export type Screen = {
  id: string;
  name: string;
};

export type Clinic = {
  id: string;
  name: string;
  location: string;
  type?: 'Clinic';
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  specialties?: string[];
};

export type ClinicGroup = {
  id: string;
  clinicId: string;
  name: string;
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
    name: 'central-admin' | 'clinic-admin' | 'doctor' | 'assistant' | 'display' | 'advertiser';
}

export type User = {
    id: string;
    name: string;
    email: string;
    roleId: string;
    affiliation: string;
    phone?: string;
    specialty?: string;
};

    
    