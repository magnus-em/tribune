"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { submitIntake } from "./actions";
import {
  tenantInfoSchema,
  propertySchema,
  landlordSchema,
  depositSchema,
  type TenantInfoData,
  type PropertyData,
  type LandlordData,
  type DepositData,
} from "@/lib/schemas/intake";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalDisclaimer } from "@/components/legal-disclaimer";

const STEPS = ["Your Info", "Property", "Landlord", "Deposit & Agreement"];
const CONTINGENCY_PCT = 15;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? "\u2713" : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 ${i < current ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}

export default function IntakePage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();

  // Separate forms per step to allow independent validation
  const tenantForm = useForm<TenantInfoData>({
    resolver: zodResolver(tenantInfoSchema),
    defaultValues: { full_name: "", email: "", phone: "", forwarding_address: "" },
  });

  const propertyForm = useForm<PropertyData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_address: "",
      unit_number: "",
      lease_start_date: "",
      lease_end_date: "",
      move_out_date: "",
    },
  });

  const landlordForm = useForm<LandlordData>({
    resolver: zodResolver(landlordSchema),
    defaultValues: { landlord_name: "", landlord_email: "", landlord_phone: "", landlord_address: "" },
  });

  const depositForm = useForm<DepositData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      deposit_amount: "",
      amount_withheld: "",
      withholding_reason: "",
      itemized_deductions_received: false,
      situation_description: "",
      contingency_agreed: false,
    },
  });

  async function handleNext() {
    if (step === 0) {
      const valid = await tenantForm.trigger();
      if (valid) setStep(1);
    } else if (step === 1) {
      const valid = await propertyForm.trigger();
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await landlordForm.trigger();
      if (valid) setStep(3);
    }
  }

  async function handleSubmit() {
    const valid = await depositForm.trigger();
    if (!valid) return;

    setSubmitting(true);
    setSubmitError("");

    const tenant = tenantForm.getValues();
    const property = propertyForm.getValues();
    const landlord = landlordForm.getValues();
    const deposit = depositForm.getValues();

    // Combine all form data
    const fullData = {
      ...tenant,
      ...property,
      ...landlord,
      ...deposit,
    };

    // Submit via server action
    const result = await submitIntake(fullData);

    if (result.error) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    // Success - redirect to confirmation
    router.push("/auth/confirm");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Start Your Case</CardTitle>
          <CardDescription>
            Tell us about your situation. This takes about 10 minutes.
          </CardDescription>
          <LegalDisclaimer />
          <StepIndicator current={step} total={STEPS.length} />
        </CardHeader>
        <CardContent>
          {/* Step 1: Tenant Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{STEPS[0]}</h3>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" {...tenantForm.register("full_name")} />
                <FieldError message={tenantForm.formState.errors.full_name?.message} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...tenantForm.register("email")} />
                <FieldError message={tenantForm.formState.errors.email?.message} />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" {...tenantForm.register("phone")} />
              </div>
              <div>
                <Label htmlFor="forwarding_address">Current / Forwarding Address</Label>
                <Input id="forwarding_address" {...tenantForm.register("forwarding_address")} />
                <FieldError message={tenantForm.formState.errors.forwarding_address?.message} />
                <p className="text-xs text-muted-foreground mt-1">
                  CT law requires your landlord to have your forwarding address. This is used to
                  calculate their legal deadline.
                </p>
              </div>
              <Button onClick={handleNext} className="w-full">
                Next
              </Button>
            </div>
          )}

          {/* Step 2: Property */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{STEPS[1]}</h3>
              <div>
                <Label htmlFor="property_address">Rental Property Address</Label>
                <Input id="property_address" {...propertyForm.register("property_address")} />
                <FieldError message={propertyForm.formState.errors.property_address?.message} />
              </div>
              <div>
                <Label htmlFor="unit_number">Unit / Apt Number (optional)</Label>
                <Input id="unit_number" {...propertyForm.register("unit_number")} />
              </div>
              <div>
                <Label htmlFor="lease_start_date">Lease Start Date</Label>
                <Input
                  id="lease_start_date"
                  type="date"
                  {...propertyForm.register("lease_start_date")}
                />
                <FieldError message={propertyForm.formState.errors.lease_start_date?.message} />
              </div>
              <div>
                <Label htmlFor="lease_end_date">Lease End Date</Label>
                <Input
                  id="lease_end_date"
                  type="date"
                  {...propertyForm.register("lease_end_date")}
                />
                <FieldError message={propertyForm.formState.errors.lease_end_date?.message} />
              </div>
              <div>
                <Label htmlFor="move_out_date">Move-Out Date</Label>
                <Input
                  id="move_out_date"
                  type="date"
                  {...propertyForm.register("move_out_date")}
                />
                <FieldError message={propertyForm.formState.errors.move_out_date?.message} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Landlord */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{STEPS[2]}</h3>
              <div>
                <Label htmlFor="landlord_name">Landlord / Property Manager Name</Label>
                <Input id="landlord_name" {...landlordForm.register("landlord_name")} />
                <FieldError message={landlordForm.formState.errors.landlord_name?.message} />
              </div>
              <div>
                <Label htmlFor="landlord_email">Landlord Email (if known)</Label>
                <Input
                  id="landlord_email"
                  type="email"
                  {...landlordForm.register("landlord_email")}
                />
                <FieldError message={landlordForm.formState.errors.landlord_email?.message} />
              </div>
              <div>
                <Label htmlFor="landlord_phone">Landlord Phone (if known)</Label>
                <Input
                  id="landlord_phone"
                  type="tel"
                  {...landlordForm.register("landlord_phone")}
                />
              </div>
              <div>
                <Label htmlFor="landlord_address">Landlord Mailing Address (if known)</Label>
                <Input id="landlord_address" {...landlordForm.register("landlord_address")} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Deposit & Agreement */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{STEPS[3]}</h3>
              <div>
                <Label htmlFor="deposit_amount">Security Deposit Amount ($)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 2400.00"
                  {...depositForm.register("deposit_amount")}
                />
                <FieldError message={depositForm.formState.errors.deposit_amount?.message} />
              </div>
              <div>
                <Label htmlFor="amount_withheld">Amount Withheld ($)</Label>
                <Input
                  id="amount_withheld"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 2400.00"
                  {...depositForm.register("amount_withheld")}
                />
                <FieldError message={depositForm.formState.errors.amount_withheld?.message} />
              </div>
              <div>
                <Label htmlFor="withholding_reason">
                  Landlord&apos;s Stated Reason for Withholding (if any)
                </Label>
                <Input
                  id="withholding_reason"
                  placeholder="e.g., 'cleaning fees' or 'damages'"
                  {...depositForm.register("withholding_reason")}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="itemized_deductions_received"
                  checked={depositForm.watch("itemized_deductions_received")}
                  onCheckedChange={(checked) =>
                    depositForm.setValue("itemized_deductions_received", checked === true)
                  }
                />
                <Label htmlFor="itemized_deductions_received" className="text-sm">
                  My landlord provided an itemized list of deductions
                </Label>
              </div>
              <div>
                <Label htmlFor="situation_description">Describe Your Situation</Label>
                <Textarea
                  id="situation_description"
                  rows={5}
                  placeholder="Tell us what happened. When did you move out? Have you contacted your landlord about the deposit? What did they say?"
                  {...depositForm.register("situation_description")}
                />
                <FieldError
                  message={depositForm.formState.errors.situation_description?.message}
                />
              </div>

              <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                <h4 className="font-semibold">Contingency Fee Agreement</h4>
                <p className="text-sm text-muted-foreground">
                  Tribune charges a {CONTINGENCY_PCT}% contingency fee on any amount recovered. If
                  we don&apos;t recover anything, you owe nothing.
                </p>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="contingency_agreed"
                    checked={depositForm.watch("contingency_agreed")}
                    onCheckedChange={(checked) =>
                      depositForm.setValue("contingency_agreed", checked === true)
                    }
                  />
                  <Label htmlFor="contingency_agreed" className="text-sm leading-relaxed">
                    I agree that if Tribune helps recover any portion of my security deposit, I will
                    pay {CONTINGENCY_PCT}% of the recovered amount. If nothing is recovered, I owe
                    nothing.
                  </Label>
                </div>
                <FieldError message={depositForm.formState.errors.contingency_agreed?.message} />
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Case"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
