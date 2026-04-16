import { z } from "zod";

// ─── Shared field validators ───────────────────────────────────────────────────

// "" = not yet selected (initial state); "yes"/"no" = chosen
const yesNo = z.enum(["yes", "no", ""]);

// ─── Per-step schemas (used for step-level validation) ────────────────────────

export const detailsStepSchema = z
  .object({
    full_name: z.string().min(2, "Full name is required"),
    phone: z.string().optional(),
    fwd_street: z.string().min(3, "Street address is required"),
    fwd_unit: z.string().optional(),
    fwd_city: z.string().min(2, "City is required"),
    fwd_state: z.string().min(2, "State is required"),
    fwd_zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
    property_address: z.string().min(5, "Property address is required"),
    unit_number: z.string().optional(),
    lease_start_date: z.string().min(1, "Lease start date is required"),
    lease_end_date: z.string().min(1, "Lease end date is required"),
    move_out_date: z.string().min(1, "Move-out date is required"),
  })
  .superRefine((data, ctx) => {
    if (data.lease_start_date && data.lease_end_date) {
      if (new Date(data.lease_start_date) >= new Date(data.lease_end_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lease end must be after start",
          path: ["lease_end_date"],
        });
      }
    }
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

export const landlordStepSchema = z
  .object({
    landlord_name: z.string().min(2, "Landlord name is required"),
    landlord_email: z.string().optional(),
    landlord_phone: z.string().optional(),
    landlord_address: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.landlord_email?.trim() && !data.landlord_phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one contact method is required (email or phone)",
        path: ["landlord_email"],
      });
    }
  });

export const depositStepSchema = z
  .object({
    deposit_amount: z.string().min(1, "Deposit amount is required"),
    amount_withheld: z.string().min(1, "Amount withheld is required"),
    landlord_stated_reason: z.string().optional(),
    itemized_deductions_received: z.boolean(),
    notice_given: yesNo,
    notice_given_desc: z.string().optional(),
    preexisting_damage: yesNo,
    preexisting_damage_desc: z.string().optional(),
    apartment_condition: z
      .string()
      .min(10, "Please briefly describe the apartment's condition"),
    landlord_contact_since: yesNo,
    landlord_contact_desc: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const deposit = parseFloat(data.deposit_amount);
    if (isNaN(deposit) || deposit <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid deposit amount",
        path: ["deposit_amount"],
      });
    }
    const withheld = parseFloat(data.amount_withheld);
    if (isNaN(withheld) || withheld < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid amount",
        path: ["amount_withheld"],
      });
    }
    if (!isNaN(deposit) && !isNaN(withheld) && withheld > deposit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount withheld cannot exceed deposit",
        path: ["amount_withheld"],
      });
    }
    if (!data.notice_given) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select one", path: ["notice_given"] });
    }
    if (!data.preexisting_damage) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select one", path: ["preexisting_damage"] });
    }
    if (!data.landlord_contact_since) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select one", path: ["landlord_contact_since"] });
    }
  });

export const agreementStepSchema = z.object({
  initials_key_clause: z.string().min(1, "Initials are required"),
  signature_name: z.string().min(2, "Full legal name is required"),
});

// ─── Full intake schema (used on final submit) ────────────────────────────────

export const intakeSchema = detailsStepSchema
  .merge(landlordStepSchema)
  .merge(depositStepSchema)
  .merge(agreementStepSchema);

export type IntakeFormData = z.infer<typeof intakeSchema>;

// ─── Extracted lease data (returned by AI extraction) ─────────────────────────

export interface ExtractedLeaseData {
  property_address?: string;
  unit_number?: string;
  landlord_name?: string;
  landlord_email?: string;
  landlord_phone?: string;
  landlord_address?: string;
  lease_start_date?: string; // YYYY-MM-DD
  lease_end_date?: string;   // YYYY-MM-DD
  deposit_amount_dollars?: number;
}
