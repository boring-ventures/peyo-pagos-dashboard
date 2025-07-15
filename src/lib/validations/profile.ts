import * as z from "zod";

export const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(30)
    .optional()
    .nullable(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(30)
    .optional()
    .nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
