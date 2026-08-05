// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";
import { loginSchema } from "@/src/schemas/authSchema";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const result = loginSchema.safeParse(credentials);
                if (!result.success) {
                    throw new Error("Invalid credentials");
                }

                const { email, password } = result.data;

                await dbConnect();

                const user = await User.findOne({ email }).select("+password");
                if (!user) {
                    throw new Error("No account found with this email");
                }

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    throw new Error("Incorrect password");
                }

                if (!user.isVerified) {
                    throw new Error("Please verify your email before logging in");
                }

                return {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
                token.isVerified = user.isVerified;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.role = token.role as "admin" | "customer";
                session.user.isVerified = token.isVerified as boolean;
            }
            return session;
        },
    },
    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
};