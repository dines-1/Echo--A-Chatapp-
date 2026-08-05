export type UserRole = "admin" | "customer";

export interface ManagedUser {
    _id: string;
    fullname: string;
    username: string;
    email: string;
    phone?: string;
    role: UserRole;
    isVerified: boolean;
    createdAt?: string;
}

export interface ActionMessage {
    text: string;
    type: "success" | "error";
}

/** Partial patch used for optimistic UI updates before the server confirms. */
export type UserPatch = Partial<Pick<ManagedUser, "role" | "isVerified">>;