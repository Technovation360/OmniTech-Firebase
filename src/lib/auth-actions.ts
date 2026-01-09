"use server";

import { getUserRole, getRedirectUrlForRole, type UserRole } from "@/lib/roles";

// This is a mock login function. In a real application, you would use
// Firebase Authentication to verify the user's credentials.
export async function handleLogin(email: string, password: string): Promise<{ success: boolean; message: string; redirectUrl?: string; }> {
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const role = getUserRole(email);

        if (!role) {
            return { success: false, message: "Invalid email or password." };
        }

        const redirectUrl = getRedirectUrlForRole(role, email);

        if (!redirectUrl) {
            return { success: false, message: "Could not determine redirect for your role." };
        }
        
        return { success: true, message: "Login successful", redirectUrl };

    } catch (error) {
        return { success: false, message: "An unexpected error occurred." };
    }
}
