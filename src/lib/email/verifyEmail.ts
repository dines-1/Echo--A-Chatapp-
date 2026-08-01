// src/lib/actions/email.actions.ts
import { resend } from "@/src/lib/resend";

export async function sendOtpEmail(email: string, username: string, otp: string) {
  try {
    await resend.emails.send({
      from: "Echo <onboarding@resend.dev>", // use your verified domain in production
      to: email,
      subject: "Verify your Echo account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${username},</h2>
          <p>Your verification code is:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't create an Echo account, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send verification email");
  }
}