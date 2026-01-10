
export type UserRole = 'central-admin' | 'clinic-admin' | 'doctor' | 'assistant' | 'display' | 'advertiser';

const userRoles: Record<string, UserRole> = {
    'admin@omni.com': 'central-admin',
    'clinic-admin-city@omni.com': 'clinic-admin',
    'clinic-admin-health@omni.com': 'clinic-admin',
    'doc_ashish@omni.com': 'doctor',
    'doc_vijay@omni.com': 'doctor',
    'asst_sunita@omni.com': 'assistant',
    'asst_rajesh@omni.com': 'assistant',
    'display@omni.com': 'display',
    'advertiser@omni.com': 'advertiser',
};

const affiliationMap: Record<string, string> = {
    'clinic-admin-city@omni.com': 'grp_cardiology_01',
    'clinic-admin-health@omni.com': 'grp_ortho_01',
    'doc_ashish@omni.com': 'grp_cardiology_01', // Also used for redirect
    'doc_vijay@omni.com': 'grp_ortho_01',
    'asst_sunita@omni.com': 'asst_sunita', // This seems to be assistant ID not clinic ID
    'asst_rajesh@omni.com': 'asst_rajesh',
};


const doctorIdMap: Record<string, string> = {
    'doc_ashish@omni.com': 'doc_ashish',
    'doc_vijay@omni.com': 'doc_vijay'
};

const assistantIdMap: Record<string, string> = {
    'asst_sunita@omni.com': 'asst_sunita',
    'asst_rajesh@omni.com': 'asst_rajesh'
}

export function getUserRole(email: string): UserRole | null {
    return userRoles[email] || null;
}

export function getRedirectUrlForRole(role: UserRole, email: string): string | null {
    switch (role) {
        case 'central-admin':
            return '/admin';
        case 'clinic-admin':
            const clinicId = affiliationMap[email];
            return clinicId ? `/clinic-admin/${clinicId}` : null;
        case 'doctor':
            const doctorId = doctorIdMap[email];
            return doctorId ? `/doctor/${doctorId}` : null;
        case 'assistant':
            const assistantId = assistantIdMap[email];
            return assistantId ? `/assistant/${assistantId}` : null;
        case 'display':
            return '/display/scr_main_hall'; // Assuming a default screen
        case 'advertiser':
            return '/admin/advertising';
        default:
            return null;
    }
}
