
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
    'clinic-admin-city@omni.com': 'clinic_01',
    'clinic-admin-health@omni.com': 'clinic_02',
    'doc_ashish@omni.com': 'doc_ashish',
    'doc_vijay@omni.com': 'doc_vijay', 
    'asst_sunita@omni.com': 'asst_sunita', 
    'asst_rajesh@omni.com': 'asst_rajesh',
};


export function getUserRole(email: string): UserRole | null {
    // This is now mainly for sample data. In a real app, role is fetched from Firestore.
    return userRoles[email] || null;
}

export function getRedirectUrlForRole(role: UserRole, userId: string): string | null {
    switch (role) {
        case 'central-admin':
            return '/admin';
        case 'clinic-admin':
            return `/clinic-admin/${userId}`;
        case 'doctor':
            return `/doctor/${userId}`;
        case 'assistant':
            return `/assistant/${userId}`;
        case 'display':
            return `/display/${userId}`; // e.g. /display/scr_main_hall
        case 'advertiser':
            return '/admin/advertising';
        default:
            return null;
    }
}
