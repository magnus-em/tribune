"use client";

import { useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { extractLeaseData, createCase } from "./actions";
// CheckCircle2 removed — step indicator no longer uses icons
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics/posthog";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import {
  detailsStepSchema,
  landlordStepSchema,
  depositStepSchema,
  agreementStepSchema,
  type IntakeFormData,
  type ExtractedLeaseData,
} from "@/lib/schemas/intake";
import {
  LeaseStep,
  DetailsStep,
  LandlordStep,
  DepositStep,
  PhotosStep,
  AgreementStep,
} from "./_steps";

// ─── Steps config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: "lease", label: "Lease" },
  { id: "details", label: "Your Details" },
  { id: "landlord", label: "Landlord" },
  { id: "deposit", label: "Deposit" },
  { id: "photos", label: "Photos" },
  { id: "agreement", label: "Agreement" },
] as const;

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 overflow-x-auto">
      <div
        className="flex"
        style={{
          borderBottom: "1px solid hsl(var(--border))",
          gap: "1px",
          background: "hsl(var(--border))",
        }}
      >
        {STEPS.map((step, i) => {
          const isDone = i < current;
          const isActive = i === current;
          return (
            <div
              key={step.id}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: isActive
                  ? "hsl(var(--primary))"
                  : isDone
                  ? "hsl(219 100% 97%)"
                  : "hsl(var(--background))",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-mono, monospace)",
                  fontSize: "9px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: isActive
                    ? "rgba(248,250,252,0.6)"
                    : isDone
                    ? "hsl(224 71% 40%)"
                    : "hsl(var(--muted-foreground))",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="hidden sm:block whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-fraunces, Georgia, serif)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: isActive
                    ? "hsl(var(--primary-foreground))"
                    : isDone
                    ? "hsl(224 71% 40%)"
                    : "hsl(var(--muted-foreground))",
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Per-step validation ───────────────────────────────────────────────────────

type StepSchema =
  | typeof detailsStepSchema
  | typeof landlordStepSchema
  | typeof depositStepSchema
  | typeof agreementStepSchema;

const STEP_SCHEMAS: Partial<Record<number, StepSchema>> = {
  1: detailsStepSchema,
  2: landlordStepSchema,
  3: depositStepSchema,
  5: agreementStepSchema,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // File state — kept in memory, uploaded at createCase
  const [leaseFile, setLeaseFile] = useState<File | null>(null);
  const [itemizedFile, setItemizedFile] = useState<File | null>(null);
  const [moveInPhotos, setMoveInPhotos] = useState<File[]>([]);
  const [moveOutPhotos, setMoveOutPhotos] = useState<File[]>([]);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedLeaseData | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);

  const methods = useForm<IntakeFormData>({
    defaultValues: {
      full_name: "",
      phone: "",
      fwd_street: "",
      fwd_unit: "",
      fwd_city: "",
      fwd_state: "CT",
      fwd_zip: "",
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
      landlord_stated_reason: "",
      itemized_deductions_received: false,
      notice_given: "",
      preexisting_damage: "",
      preexisting_damage_desc: "",
      apartment_condition: "",
      landlord_contact_since: "",
      landlord_contact_desc: "",
      initials_key_clause: "",
      signature_name: "",
    },
  });

  // Trigger extraction when a lease file is selected
  const handleLeaseFileChange = useCallback(
    async (file: File) => {
      setLeaseFile(file);
      setExtracted(null);
      setExtractionFailed(false);
      setExtracting(true);

      const formData = new FormData();
      formData.append("lease", file);
      const result = await extractLeaseData(formData);

      setExtracting(false);

      if (result.data) {
        setExtracted(result.data);
        // Pre-populate form fields from extraction
        const d = result.data;
        if (d.property_address) methods.setValue("property_address", d.property_address);
        if (d.unit_number) methods.setValue("unit_number", d.unit_number);
        if (d.landlord_name) methods.setValue("landlord_name", d.landlord_name);
        if (d.landlord_email) methods.setValue("landlord_email", d.landlord_email);
        if (d.landlord_phone) methods.setValue("landlord_phone", d.landlord_phone);
        if (d.landlord_address) methods.setValue("landlord_address", d.landlord_address);
        if (d.lease_start_date) methods.setValue("lease_start_date", d.lease_start_date);
        if (d.lease_end_date) methods.setValue("lease_end_date", d.lease_end_date);
        if (d.deposit_amount_dollars !== undefined)
          methods.setValue("deposit_amount", String(d.deposit_amount_dollars));
        trackEvent("lease_extracted");
      } else {
        setExtractionFailed(true);
        trackEvent("lease_extraction_failed");
      }
    },
    [methods]
  );

  // Validate the current step's fields before advancing
  function validateStep(): boolean {
    const schema = STEP_SCHEMAS[step];
    if (!schema) return true; // lease and photos steps have no text-field validation

    const values = methods.getValues();
    const result = schema.safeParse(values);

    if (!result.success) {
      methods.clearErrors();
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof IntakeFormData;
        methods.setError(field, { message: issue.message });
      }
      return false;
    }
    return true;
  }

  function handleNext() {
    // Lease step: require a file
    if (step === 0) {
      if (!leaseFile) {
        toast.error("Please upload your lease to continue");
        return;
      }
      if (extracting) return; // wait for extraction
    }

    if (!validateStep()) return;

    trackEvent("intake_step_completed", {
      step,
      step_name: STEPS[step].id,
    });
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateStep()) return;

    // Final full-schema check
    const values = methods.getValues();
    const { intakeSchema } = await import("@/lib/schemas/intake");
    const parsed = intakeSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        methods.setError(issue.path[0] as keyof IntakeFormData, {
          message: issue.message,
        });
      }
      toast.error("Please fix the errors above");
      return;
    }

    if (!leaseFile) {
      toast.error("Lease file is required");
      return;
    }

    setSubmitting(true);

    // Build FormData — text fields + all files
    const formData = new FormData();

    // Text fields
    const v = parsed.data;
    (Object.keys(v) as (keyof typeof v)[]).forEach((key) => {
      const val = v[key];
      if (val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    });

    // Files
    formData.append("lease", leaseFile);
    if (itemizedFile) formData.append("itemized_list", itemizedFile);
    moveInPhotos.forEach((f) => formData.append("move_in_photos", f));
    moveOutPhotos.forEach((f) => formData.append("move_out_photos", f));

    const result = await createCase(formData);

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    trackEvent("case_submitted", {
      has_move_in_photos: moveInPhotos.length > 0,
      has_move_out_photos: moveOutPhotos.length > 0,
      has_itemized: itemizedFile !== null,
    });

    if (result.uploadWarnings && result.uploadWarnings.length > 0) {
      result.uploadWarnings.forEach((w) => toast.warning(w));
    } else {
      toast.success("Case submitted!");
    }
    router.push(`/dashboard/case/${result.caseId}`);
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Start Your Case</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Takes about 5 minutes. Upload your lease first — we&apos;ll fill in most of the form for you.
          </p>
        </div>

        <div className="border bg-card p-6">
          <StepIndicator current={step} />

          {step === 0 && (
            <LeaseStep
              leaseFile={leaseFile}
              onFileChange={handleLeaseFileChange}
              extracting={extracting}
              extracted={extracted}
              extractionFailed={extractionFailed}
              onNext={handleNext}
            />
          )}
          {step === 1 && (
            <DetailsStep onNext={handleNext} onBack={handleBack} />
          )}
          {step === 2 && (
            <LandlordStep onNext={handleNext} onBack={handleBack} />
          )}
          {step === 3 && (
            <DepositStep
              onNext={handleNext}
              onBack={handleBack}
              itemizedFile={itemizedFile}
              onItemizedFileChange={setItemizedFile}
            />
          )}
          {step === 4 && (
            <PhotosStep
              onNext={handleNext}
              onBack={handleBack}
              onSkip={() => {
                setStep(5);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              moveInPhotos={moveInPhotos}
              moveOutPhotos={moveOutPhotos}
              onMoveInChange={setMoveInPhotos}
              onMoveOutChange={setMoveOutPhotos}
            />
          )}
          {step === 5 && (
            <AgreementStep
              onBack={handleBack}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>

        <LegalDisclaimer />
      </div>
    </FormProvider>
  );
}
