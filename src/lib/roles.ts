export type UserRole = 'central-admin' | 'clinic-admin' | 'doctor' | 'assistant' | 'display' | 'advertiser';

const userRoles: Record<string, UserRole> = {
    'admin@omni.com': 'central-admin',
    'clinic-admin@omni.com': 'clinic-admin',
    'doc_ashish@omni.com': 'doctor',
    'doc_vijay@omni.com': 'doctor',
    'asst_sunita@omni.com': 'assistant',
    'asst_rajesh@omni.com': 'assistant',
    'display@omni.com': 'display',
    'advertiser@omni.com': 'advertiser',
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
        case 'clinic-admin': // For now, clinic admin goes to same dashboard
            return '/admin';
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
