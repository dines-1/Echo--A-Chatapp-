import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";
import VerificationToken from "@/src/models/VerificationToken";
import { generateOtp } from "@/src/lib/generateOtp";
import { sendOtpEmail } from "@/src/lib/email/verifyEmail";
import { checkRateLimit, checkCooldown } from "@/src/lib/rateLimit";

export async function resendOtp(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    // IP-based limit: max 10 resends per hour per IP
    const ipLimit = checkRateLimit(`resend-ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: `Too many OTP resend attempts from this IP. Please try again in ${ipLimit.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Email-based cooldown: 60 seconds between resends
    const cooldown = checkCooldown(`resend-email:${email}`, 60 * 1000);
    if (!cooldown.success) {
      return NextResponse.json(
        {
          error: `Please wait ${cooldown.remainingSeconds} seconds before requesting a new code.`,
          remainingSeconds: cooldown.remainingSeconds,
        },
        { status: 429 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Account already verified" });
    }

    // Remove existing email-verification tokens for this user before issuing a new one
    await VerificationToken.deleteMany({
      userId: user._id,
      purpose: "email-verification",
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await VerificationToken.create({
      userId: user._id,
      otp,
      purpose: "email-verification",
      expiresAt,
    });

    await sendOtpEmail(user.email, user.username, otp);

    return NextResponse.json({ message: "Verification code resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return resendOtp(req);
}