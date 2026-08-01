import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";
import VerificationToken from "@/src/models/VerificationToken";
import { generateOtp } from "@/src/lib/generateOtp";
import {sendOtpEmail} from '@/src/lib/email/verifyEmail'

export async function resendOtp(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Account already verified" });
    }

    // Remove any existing OTPs for this user before issuing a new one
    await VerificationToken.deleteMany({ userId: user._id });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await VerificationToken.create({ userId: user._id, otp, expiresAt });
    await sendOtpEmail(user.email, user.username, otp);

    return NextResponse.json({ message: "Verification code resent" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req:NextRequest){
    return resendOtp(req);
}