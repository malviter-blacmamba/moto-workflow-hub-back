export interface UpdateProfileDTO {
    name?: string;
    email?: string;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}