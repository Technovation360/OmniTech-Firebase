'use server';

import { z } from 'zod';
import { addPatient, addConsultation, updatePatientStatus, getClinicGroupById } from './server-data';
import { summarizeConsultationNotes } from '@/ai/flows/summarize-consultation-notes';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const PatientSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  age: z.coerce.number().min(0, 'Age must be a positive number.'),
  gender: z.enum(['male', 'female', 'other']),
  groupId: z.string(),
  contactNumber: z.string().optional(),
  emailAddress: z.string().email("Please enter a valid email.").or(z.literal('')).optional(),
});

export async function registerPatient(prevState: any, formData: FormData) {
  const validatedFields = PatientSchema.safeParse({
    name: formData.get('name'),
    age: formData.get('age'),
    gender: formData.get('gender'),
    groupId: formData.get('groupId'),
    contactNumber: formData.get('contactNumber'),
    emailAddress: formData.get('emailAddress'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your inputs.',
    };
  }
  
  try {
    const group = await getClinicGroupById(validatedFields.data.groupId);
    if (!group) {
        return { message: "Invalid clinic group." };
    }
    
    const newPatient = await addPatient({
        name: validatedFields.data.name,
        age: validatedFields.data.age,
        gender: validatedFields.data.gender,
        groupId: validatedFields.data.groupId,
        contactNumber: validatedFields.data.contactNumber || '',
        emailAddress: validatedFields.data.emailAddress || '',
        clinicId: group.clinicId,
    }, group);
    
    // Revalidate paths to update caches
    revalidatePath('/doctor');
    revalidatePath('/display');
    revalidatePath('/admin/patient-registry');

    
    return { success: true, tokenNumber: newPatient.tokenNumber };

  } catch (error: any) {
    console.error('Error during patient registration:', error);
    return {
      message: error.message || 'An unknown error occurred during registration.',
    };
  }
}

export async function handlePatientAction(patientId: string, action: 'call' | 'start' | 'end' | 'no-show' | 'call-revert') {
    let status: 'calling' | 'consulting' | 'consultation-done' | 'no-show' | 'waiting' = 'waiting';
    switch(action) {
        case 'call': status = 'calling'; break;
        case 'start': status = 'consulting'; break;
        case 'end': status = 'consultation-done'; break;
        case 'no-show': status = 'no-show'; break;
        case 'call-revert': status = 'waiting'; break;
    }
    await updatePatientStatus(patientId, status);
    revalidatePath('/doctor');
    revalidatePath('/display');
    revalidatePath('/admin/patient-registry');
}


const ConsultationSchema = z.object({
    notes: z.string().min(10, "Notes must be at least 10 characters long."),
    patientId: z.string(),
    doctorId: z.string(),
});

export async function createConsultationSummary(prevState: any, formData: FormData) {
    const validatedFields = ConsultationSchema.safeParse({
        notes: formData.get('notes'),
        patientId: formData.get('patientId'),
        doctorId: formData.get('doctorId'),
    });
    
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    try {
        const { notes, patientId, doctorId } = validatedFields.data;

        // Call GenAI to summarize
        const { summary } = await summarizeConsultationNotes({ notes });

        // Save to DB
        await addConsultation({
            patientId,
            doctorId,
            notes,
            summary,
            date: new Date().toISOString(),
        });
        
        await updatePatientStatus(patientId, 'consultation-done');

        revalidatePath(`/doctor/${doctorId}`);
        revalidatePath('/admin/patient-registry');
        return { success: true, message: "Consultation saved and summarized." };

    } catch(e) {
        console.error(e);
        return { message: "Failed to summarize or save consultation." };
    }
}
