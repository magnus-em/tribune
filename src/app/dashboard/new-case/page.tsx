"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createCase } from "./actions";
import { intakeSchema, type IntakeFormData } from "@/lib/schemas/intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { CONTINGENCY_PCT } from "@/lib/constants";
import { CheckCircle2, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics/posthog";

const STEPS = [
  { label: "Your Info", description: "Contact and forwarding details" },
  { label: "Property", description: "The rental you moved out of" },
  { label: "Landlord", description: "Who to contact" },
  { label: "Deposit", description: "Amounts and agreement" },
];

const stepSchemas = [
  // Step 0: Your Info
  z.object({
    full_name: z.string().min(2, "Full name is required"),
    phone: z.string(),
    forwarding_address: z.string().min(5, "Forwarding address is required"),
  }),
  // Step 1: Property
  z
    .object({
      property_address: z.string().min(5, "Property address is required"),
      unit_number: z.string(),
      lease_start_date: z.string().min(1, "Lease start date is required"),
      lease_end_date: z.string().min(1, "Lease end date is required"),
      move_out_date: z.string().min(1, "Move-out date is required"),
    })
    .superRefine((data, ctx) => {
      if (data.lease_start_date && data.lease_end_date) {
        if (new Date(data.lease_start_date) >= new Date(data.lease_end_date)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Lease end date must be after start date",
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
    }),
  // Step 2: Landlord — require email OR phone
  z
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
    }),
  // Step 3: Deposit + Agreements
  z
    .object({
      deposit_amount: z.string().min(1, "Deposit amount is required"),
      amount_withheld: z.string().min(1, "Amount withheld is required"),
      withholding_reason: z.string(),
      itemized_deductions_received: z.boolean(),
      situation_description: z
        .string()
        .min(20, "Please describe your situation in more detail"),
      contingency_agreed: z.boolean(),
      independent_contact_agreed: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (!data.contingency_agreed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "You must sign the service agreement to proceed",
          path: ["contingency_agreed"],
        });
      }
      if (!data.independent_contact_agreed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "You must authorize Tribune to contact your landlord",
          path: ["independent_contact_agreed"],
        });
      }
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
          message: "Amount withheld cannot exceed deposit amount",
          path: ["amount_withheld"],
        });
      }
    }),
];

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < current
                  ? "bg-primary text-primary-foreground"
                  : i === current
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < current ? <CheckCircle2 className="size-5" /> : i + 1}
            </div>
            <span
              className={`text-xs mt-1.5 hidden sm:block ${
                i <= current
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {STEPS[i].label}
            </span>
          </div>
          {i < total - 1 && (
            <div
              className={`h-0.5 flex-1 mx-3 mt-[-1.25rem] sm:mt-0 ${
                i < current ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
  );
}

export default function NewCasePage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<IntakeFormData>({
    defaultValues: {
      full_name: "",
      phone: "",
      forwarding_address: "",
      property_address: "",
      unit_number: "",
      lease_start_date: "",
      lease_end_date: "",
      move_out_date: "",
      landlord_name: "",
      landlord_email: "",
      landlord_phone: "",
      landlord_address: "",
      deposit_amount: "",
      amount_withheld: "",
      withholding_reason: "",
      itemized_deductions_received: false,
      situation_description: "",
      contingency_agreed: false,
      independent_contact_agreed: false,
    },
  });

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
  } = form;

  function validateStep(): boolean {
    clearErrors();
    const values = getValues();
    const schema = stepSchemas[step];
    const result = schema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof IntakeFormData;
        setError(field, { message: issue.message });
      }
      return false;
    }
    return true;
  }

  function handleNext() {
    if (validateStep()) {
      trackEvent("intake_step_completed", { step, step_name: STEPS[step].label });
      setStep((s) => s + 1);
    }
  }

  async function handleSubmit() {
    if (!validateStep()) return;

    const values = getValues();
    const fullParse = intakeSchema.safeParse(values);
    if (!fullParse.success) {
      for (const issue of fullParse.error.issues) {
        const field = issue.path[0] as keyof IntakeFormData;
        setError(field, { message: issue.message });
      }
      toast.error("Please fix the errors above");
      return;
    }

    setSubmitting(true);
    const result = await createCase(values);

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    trackEvent("case_submitted");
    toast.success("Case submitted. Upload your lease to get started.");
    router.push(`/dashboard/case/${result.caseId}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Start Your Case</CardTitle>
          <CardDescription>
            Tell us about your situation. This takes about 5 minutes.
          </CardDescription>
          <StepIndicator current={step} total={STEPS.length} />
        </CardHeader>
        <CardContent>

          {/* Step 0: Your Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{STEPS[0].label}</h3>
                <p className="text-sm text-muted-foreground mb-4">{STEPS[0].description}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full Legal Name</Label>
                <Input id="full_name" {...register("full_name")} />
                <FieldError message={errors.full_name?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="forwarding_address">Current / Forwarding Address</Label>
                <Input id="forwarding_address" {...register("forwarding_address")} />
                <FieldError message={errors.forwarding_address?.message} />
                <p className="text-xs text-muted-foreground">
                  CT law requires your landlord to have your forwarding address to calculate their legal deadline.
                </p>
              </div>
              <Button type="button" onClick={handleNext} className="w-full">
                Continue <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Property */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{STEPS[1].label}</h3>
                <p className="text-sm text-muted-foreground mb-4">{STEPS[1].description}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="property_address">Rental Property Address</Label>
                <Input id="property_address" {...register("property_address")} />
                <FieldError message={errors.property_address?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit_number">Unit / Apt Number (optional)</Label>
                <Input id="unit_number" {...register("unit_number")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lease_start_date">Lease Start Date</Label>
                  <Input id="lease_start_date" type="date" {...register("lease_start_date")} />
                  <FieldError message={errors.lease_start_date?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lease_end_date">Lease End Date</Label>
                  <Input id="lease_end_date" type="date" {...register("lease_end_date")} />
                  <FieldError message={errors.lease_end_date?.message} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="move_out_date">Move-Out Date</Label>
                <Input id="move_out_date" type="date" {...register("move_out_date")} />
                <FieldError message={errors.move_out_date?.message} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">
                  <ArrowLeft className="mr-2 size-4" /> Back
                </Button>
                <Button type="button" onClick={handleNext} className="flex-1">
                  Continue <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Landlord */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{STEPS[2].label}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tribune will contact your landlord directly on your behalf. Provide as much contact
                  information as you have — at minimum, email or phone is required.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlord_name">Landlord / Property Manager Name</Label>
                <Input id="landlord_name" {...register("landlord_name")} />
                <FieldError message={errors.landlord_name?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlord_email">
                  Landlord Email <span className="text-muted-foreground font-normal">(required if no phone)</span>
                </Label>
                <Input id="landlord_email" type="email" {...register("landlord_email")} />
                <FieldError message={errors.landlord_email?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlord_phone">
                  Landlord Phone <span className="text-muted-foreground font-normal">(required if no email)</span>
                </Label>
                <Input id="landlord_phone" type="tel" {...register("landlord_phone")} />
                <FieldError message={errors.landlord_phone?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlord_address">Landlord Mailing Address (if known)</Label>
                <Input id="landlord_address" {...register("landlord_address")} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 size-4" /> Back
                </Button>
                <Button type="button" onClick={handleNext} className="flex-1">
                  Continue <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Deposit & Agreement */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold mb-1">{STEPS[3].label}</h3>
                <p className="text-sm text-muted-foreground mb-4">{STEPS[3].description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="deposit_amount">Security Deposit Amount ($)</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 2400.00"
                    {...register("deposit_amount")}
                  />
                  <FieldError message={errors.deposit_amount?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount_withheld">Amount Withheld ($)</Label>
                  <Input
                    id="amount_withheld"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 2400.00"
                    {...register("amount_withheld")}
                  />
                  <FieldError message={errors.amount_withheld?.message} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="withholding_reason">
                  Landlord&apos;s Stated Reason for Withholding (if any)
                </Label>
                <Input
                  id="withholding_reason"
                  placeholder='e.g., "cleaning fees" or "damages"'
                  {...register("withholding_reason")}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="itemized_deductions_received"
                  checked={watch("itemized_deductions_received")}
                  onCheckedChange={(checked) =>
                    setValue("itemized_deductions_received", checked === true)
                  }
                />
                <Label htmlFor="itemized_deductions_received" className="text-sm">
                  My landlord provided an itemized list of deductions
                </Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="situation_description">Describe Your Situation</Label>
                <Textarea
                  id="situation_description"
                  rows={5}
                  placeholder="Tell us what happened. When did you move out? Have you contacted your landlord about the deposit? What did they say?"
                  {...register("situation_description")}
                />
                <FieldError message={errors.situation_description?.message} />
              </div>

              {/* Service Agreement */}
              <div className="rounded-lg border-2 border-foreground/20 overflow-hidden">
                <div className="bg-foreground/5 px-4 py-3 border-b border-foreground/10">
                  <p className="text-sm font-semibold uppercase tracking-wider">
                    Tribune Service Agreement
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Read carefully — this is a binding legal agreement
                  </p>
                </div>
                <div className="h-40 overflow-y-auto px-4 py-3 text-sm text-muted-foreground leading-relaxed space-y-3 bg-muted/30">
                  <p>
                    This Service Agreement (&ldquo;Agreement&rdquo;) is entered into between you (&ldquo;Client&rdquo;) and
                    Tribune (&ldquo;Company&rdquo;), a legal-information and document-preparation service
                    operating under the laws of the State of Connecticut.
                  </p>
                  <p>
                    <strong className="text-foreground">Services.</strong> Tribune will review your
                    security deposit dispute, prepare demand correspondence on your behalf, and
                    assist you through the recovery process pursuant to Connecticut General Statutes
                    § 47a-21. Tribune is not a law firm. No attorney-client relationship is created
                    by this Agreement. Tribune provides legal information and document preparation
                    only, not legal advice.
                  </p>
                  <p>
                    <strong className="text-foreground">Pro Se Representation.</strong> All
                    correspondence prepared by Tribune will be signed and sent by you in your own
                    name. You are acting on your own behalf (pro se). Tribune prepares and, where
                    authorized, mails correspondence on your behalf.
                  </p>
                  <p>
                    <strong className="text-foreground">Contingency Fee.</strong> Tribune charges a{" "}
                    {CONTINGENCY_PCT}% contingency fee on any amount recovered from your landlord
                    as a direct result of Tribune&apos;s services. If no amount is recovered,
                    you owe Tribune nothing. Hard costs (certified mailing, court filing fees if
                    applicable) are passed through at cost with no markup.
                  </p>
                  <p>
                    <strong className="text-foreground">Payment.</strong> Recovered funds are paid
                    directly to you by your landlord. You are responsible for remitting Tribune&apos;s
                    {CONTINGENCY_PCT}% fee within 30 days of receipt. Failure to pay may result
                    in your account being referred to collections.
                  </p>
                  <p>
                    <strong className="text-foreground">Independent Landlord Contact.</strong> You
                    authorize Tribune to contact your landlord directly at the contact information
                    you provide, on your behalf and in connection with your security deposit
                    dispute. Tribune may send written communications and, where appropriate,
                    place telephone calls to your landlord.
                  </p>
                  <p>
                    <strong className="text-foreground">Accuracy.</strong> You represent that the
                    information you have provided is accurate and complete to the best of your
                    knowledge. Tribune relies on your representations in preparing correspondence
                    on your behalf.
                  </p>
                  <p>
                    <strong className="text-foreground">Jurisdiction.</strong> This Agreement is
                    governed by the laws of the State of Connecticut. Tribune currently operates
                    exclusively in Connecticut.
                  </p>
                </div>
                <div className="px-4 py-4 border-t border-foreground/10 space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="contingency_agreed"
                      checked={watch("contingency_agreed")}
                      onCheckedChange={(checked) =>
                        setValue("contingency_agreed", checked === true)
                      }
                    />
                    <Label htmlFor="contingency_agreed" className="text-sm leading-relaxed">
                      I have read and agree to the Tribune Service Agreement. If Tribune helps
                      me recover any portion of my security deposit, I will pay{" "}
                      {CONTINGENCY_PCT}% of the recovered amount.
                    </Label>
                  </div>
                  <FieldError message={errors.contingency_agreed?.message} />

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="independent_contact_agreed"
                      checked={watch("independent_contact_agreed")}
                      onCheckedChange={(checked) =>
                        setValue("independent_contact_agreed", checked === true)
                      }
                    />
                    <Label htmlFor="independent_contact_agreed" className="text-sm leading-relaxed">
                      I authorize Tribune to contact my landlord independently at the contact
                      information I have provided above, on my behalf and in connection with
                      this dispute.
                    </Label>
                  </div>
                  <FieldError message={errors.independent_contact_agreed?.message} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 size-4" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Case"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <LegalDisclaimer />
    </div>
  );
}
