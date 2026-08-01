import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";
import VerificationToken from "@/src/models/VerificationToken";
import {  verifyOtpSchema } from "@/src/schemas/authSchema";

export async function verifyOtp(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifyOtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp } = result.data;

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Account already verified" });
    }

    const token = await VerificationToken.findOne({ userId: user._id, otp });
    if (!token) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    user.isVerified = true;
    await user.save();
    await token.deleteOne();

    return NextResponse.json({ message: "Account verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return verifyOtp(req);
}