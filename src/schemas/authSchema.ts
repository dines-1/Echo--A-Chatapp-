import {z} from 'zod'

// ZOD validation for registration

export const registerSchema = z.object({
    fullname : z.string().trim().min(3,'Full name is required'),

    username:z.string().trim().min(3,'Username should be at least 3 characters')
    .max(12,'Username must be under 12 characters')
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores allowed"),

    email: z.string().trim().toLowerCase()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'Invalid email address'),

    phone: z.string()
      .trim()
      .regex(/^(\+\d{1,4})?\d{7,15}$/, "Please enter a valid number")
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
        "Password must contain at least one number and one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;


// zod validation for login 
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

//ZOD  validation  for otp verification 
export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ZOD validation for updating profile
export const updateProfileSchema = z.object({
  fullname: z.string().trim().min(3, "Full name must be at least 3 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+\d{1,4})?\d{7,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  avatar: z.string().optional().or(z.literal("")),
  bio: z.string().max(200, "Bio must be 200 characters or less").optional().or(z.literal("")),
  preferences: z
    .object({
      soundEnabled: z.boolean().default(true),
      onlineStatusVisible: z.boolean().default(true),
      notificationsEnabled: z.boolean().default(true),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ZOD validation for changing password
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(
        /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
        "New password must contain at least one number and one special character"
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;