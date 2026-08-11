import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit numeric OTP code.
 */
export function generateOtp(length = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export default generateOtp;
