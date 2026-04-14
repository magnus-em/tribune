import { z } from "zod";

export const tenantInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  forwarding_address: z.string().min(5, "Forwarding address is required for deadline calculation"),
});

export const propertySchema = z.object({
  property_address: z.string().min(5, "Property address is required"),
  unit_number: z.string().optional(),
  lease_start_date: z.string().min(1, "Lease start date is required"),
  lease_end_date: z.string().min(1, "Lease end date is required"),
  move_out_date: z.string().min(1, "Move-out date is required"),
});

export const landlordSchema = z.object({
  landlord_name: z.string().min(2, "Landlord name is required"),
  landlord_email: z.string().email("Valid email required").optional().or(z.literal("")),
  landlord_phone: z.string().optional(),
  landlord_address: z.string().optional(),
});

export const depositSchema = z.object({
  deposit_amount: z.string().min(1, "Deposit amount is required"),
  amount_withheld: z.string().min(1, "Amount withheld is required"),
  withholding_reason: z.string().optional(),
  itemized_deductions_received: z.boolean(),
  situation_description: z.string().min(20, "Please describe your situation in more detail"),
  contingency_agreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the contingency fee to proceed",
  }),
});

export const fullIntakeSchema = tenantInfoSchema
  .merge(propertySchema)
  .merge(landlordSchema)
  .merge(depositSchema);

export type TenantInfoData = z.infer<typeof tenantInfoSchema>;
export type PropertyData = z.infer<typeof propertySchema>;
export type LandlordData = z.infer<typeof landlordSchema>;
export type DepositData = z.infer<typeof depositSchema>;
export type FullIntakeData = z.infer<typeof fullIntakeSchema>;
