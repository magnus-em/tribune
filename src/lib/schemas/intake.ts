import { z } from "zod";

// Phone number validation (US format, optional)
const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      // Allow various formats: (123) 456-7890, 123-456-7890, 1234567890
      const cleaned = val.replace(/\D/g, "");
      return cleaned.length === 10 || cleaned.length === 11;
    },
    { message: "Phone must be a valid 10-digit US number" }
  );

export const tenantInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required").max(200, "Name too long"),
  email: z.string().email("Valid email is required").toLowerCase(),
  phone: phoneSchema,
  forwarding_address: z.string().min(5, "Forwarding address is required").max(500, "Address too long"),
});

export const propertySchema = z
  .object({
    property_address: z.string().min(5, "Property address is required").max(500, "Address too long"),
    unit_number: z.string().optional(),
    lease_start_date: z.string().min(1, "Lease start date is required"),
    lease_end_date: z.string().min(1, "Lease end date is required"),
    move_out_date: z.string().min(1, "Move-out date is required"),
  })
  .refine(
    (data) => {
      const start = new Date(data.lease_start_date);
      const end = new Date(data.lease_end_date);
      return start < end;
    },
    {
      message: "Lease end date must be after start date",
      path: ["lease_end_date"],
    }
  )
  .refine(
    (data) => {
      const moveOut = new Date(data.move_out_date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      return moveOut >= oneYearAgo && moveOut <= today;
    },
    {
      message: "Move-out date must be within the past year",
      path: ["move_out_date"],
    }
  );

export const landlordSchema = z.object({
  landlord_name: z.string().min(2, "Landlord name is required").max(200, "Name too long"),
  landlord_email: z.string().email("Valid email required").toLowerCase().optional().or(z.literal("")),
  landlord_phone: phoneSchema,
  landlord_address: z.string().max(500, "Address too long").optional(),
});

export const depositSchema = z
  .object({
    deposit_amount: z
      .string()
      .min(1, "Deposit amount is required")
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0 && num <= 1000000;
        },
        { message: "Deposit must be a valid amount between $0 and $1,000,000" }
      ),
    amount_withheld: z
      .string()
      .min(1, "Amount withheld is required")
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num >= 0 && num <= 1000000;
        },
        { message: "Amount withheld must be between $0 and $1,000,000" }
      ),
    withholding_reason: z.string().max(1000, "Reason too long").optional(),
    itemized_deductions_received: z.boolean(),
    situation_description: z
      .string()
      .min(20, "Please describe your situation in more detail")
      .max(5000, "Description too long"),
    contingency_agreed: z.boolean().refine((val) => val === true, {
      message: "You must agree to the contingency fee to proceed",
    }),
  })
  .refine(
    (data) => {
      const deposit = parseFloat(data.deposit_amount);
      const withheld = parseFloat(data.amount_withheld);
      return withheld <= deposit;
    },
    {
      message: "Amount withheld cannot exceed deposit amount",
      path: ["amount_withheld"],
    }
  );

export const fullIntakeSchema = tenantInfoSchema
  .merge(propertySchema)
  .merge(landlordSchema)
  .merge(depositSchema);

export type TenantInfoData = z.infer<typeof tenantInfoSchema>;
export type PropertyData = z.infer<typeof propertySchema>;
export type LandlordData = z.infer<typeof landlordSchema>;
export type DepositData = z.infer<typeof depositSchema>;
export type FullIntakeData = z.infer<typeof fullIntakeSchema>;
