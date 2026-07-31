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
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// zod validation for login 
export const loginSchema = z.object({
  username: registerSchema,
  email: z.string().email({message:'invalid email address'}),
  password : z.string().min(8,{message:'Password must be 8 character with number and symbol'})
});

export type LoginInput = z.infer<typeof loginSchema>;