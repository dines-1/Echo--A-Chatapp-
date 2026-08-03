import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    username: string;
    role: "admin" | "customer";
    isVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "customer";
      isVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    username?: string;
    role?: "admin" | "customer";
    isVerified?: boolean;
  }
}
