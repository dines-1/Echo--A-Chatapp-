import { getResendClient } from "@/src/lib/resend";

export async function sendOtpEmail(email: string, username: string, otp: string) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log(`[DEV MODE - NO RESEND API KEY] OTP for ${email} (${username}): ${otp}`);
      return;
    }

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Verify your Echo account - OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #2563eb;">Welcome to Echo, ${username}!</h2>
          <p style="color: #475569;">Your email verification OTP code is:</p>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you didn't request this registration, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send OTP email via Resend:", error);
    console.log(`[DEV FALLBACK] Verification OTP for ${email} (${username}): ${otp}`);
  }
}