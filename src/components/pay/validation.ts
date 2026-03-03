import { z } from "zod";

export const numericString = z
  .string()
  .min(1, "Amount is required")
  .transform((v) => v.replace(/,/g, "").trim())
  .refine((v) => /^\d+\.?\d*$/.test(v), "Must be a valid number")
  .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0");
