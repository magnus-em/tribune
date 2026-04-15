import { z } from "zod";

// Base object schema — plain z.object, no transforms or pipes.
export const intakeBaseSchema = z.object({
  // Tenant info
  full_name: z
    .string()
    .min(2, "Full name is required")
    .max(200, "Name too long"),
  phone: z.string().optional(),
  forwarding_address: z
    .string()
    .min(5, "Forwarding address is required")
    .max(500, "Address too long"),

  // Property
  property_address: z
    .string()
    .min(5, "Property address is required")
    .max(500, "Address too long"),
  unit_number: z.string().optional(),
  lease_start_date: z.string().min(1, "Lease start date is required"),
  lease_end_date: z.string().min(1, "Lease end date is required"),
  move_out_date: z.string().min(1, "Move-out date is required"),

  // Landlord
  landlord_name: z
    .string()
    .min(2, "Landlord name is required")
    .max(200, "Name too long"),
  landlord_email: z.string().optional(),
  landlord_phone: z.string().optional(),
  landlord_address: z.string().optional(),

  // Deposit
  deposit_amount: z.string().min(1, "Deposit amount is required"),
  amount_withheld: z.string().min(1, "Amount withheld is required"),
  withholding_reason: z.string().optional(),
  itemized_deductions_received: z.boolean(),
  situation_description: z
    .string()
    .min(20, "Please describe your situation in more detail")
    .max(5000, "Description too long"),
  contingency_agreed: z.boolean(),
});

// Full schema with all validations — used on final submit only.
export const intakeSchema = intakeBaseSchema.superRefine((data, ctx) => {
  // Contingency agreement required
  if (!data.contingency_agreed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "You must agree to the contingency fee to proceed",
      path: ["contingency_agreed"],
    });
  }

  // Deposit amount must be valid
  const deposit = parseFloat(data.deposit_amount);
  if (isNaN(deposit) || deposit <= 0 || deposit > 1000000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Deposit must be between $0 and $1,000,000",
      path: ["deposit_amount"],
    });
  }

  // Withheld amount must be valid
  const withheld = parseFloat(data.amount_withheld);
  if (isNaN(withheld) || withheld < 0 || withheld > 1000000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount withheld must be between $0 and $1,000,000",
      path: ["amount_withheld"],
    });
  }

  // Withheld cannot exceed deposit
  if (!isNaN(deposit) && !isNaN(withheld) && withheld > deposit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount withheld cannot exceed deposit amount",
      path: ["amount_withheld"],
    });
  }

  // Lease end after start
  if (data.lease_start_date && data.lease_end_date) {
    if (new Date(data.lease_start_date) >= new Date(data.lease_end_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lease end date must be after start date",
        path: ["lease_end_date"],
      });
    }
  }

  // Move-out within past year
  if (data.move_out_date) {
    const moveOut = new Date(data.move_out_date);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    if (moveOut < oneYearAgo || moveOut > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Move-out date must be within the past year",
        path: ["move_out_date"],
      });
    }
  }
});

export type IntakeFormData = z.infer<typeof intakeBaseSchema>;
