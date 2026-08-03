// src/lib/actions/auth.actions.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";
import VerificationToken from "@/src/models/VerificationToken";
import { registerSchema } from "@/src/schemas/authSchema";
import { generateOtp } from "@/src/lib/generateOtp";
import { sendOtpEmail } from "@/src/lib/email/verifyEmail";

export async function registerUser(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullname, username, email, phone, password } = result.data;

    await dbConnect();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const conflictField = existingUser.email === email ? "email" : "username";
      return NextResponse.json(
        { error: `An account with this ${conflictField} already exists` },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullname,
      username,
      email,
      phone: phone || undefined,
      password: hashedPassword,
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await VerificationToken.create({
      userId: newUser._id,
      otp,
      purpose: "email-verification", // scoped
      expiresAt,
    });

    try {
      await sendOtpEmail(newUser.email, newUser.username, otp);
    } catch (emailError) {
      console.error("OTP email failed to send:", emailError);
    }

    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return NextResponse.json(
      {
        message: "Account created. Please check your email for a verification code.",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return registerUser(req);
}
