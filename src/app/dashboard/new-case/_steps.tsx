"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Upload,
  CheckCircle2,
  Loader2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { CONTINGENCY_PCT } from "@/lib/constants";
import type { IntakeFormData, ExtractedLeaseData } from "@/lib/schemas/intake";
import { formatCents } from "@/lib/utils/case";

// ─── Shared helpers ────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive mt-1 flex items-center gap-1.5">
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  loading = false,
  backDisabled = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  loading?: boolean;
  backDisabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={backDisabled}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={loading}
        className={onBack ? "flex-1" : "w-full"}
      >
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <>
            {nextLabel} <ArrowRight className="ml-2 size-4" />
          </>
        )}
      </Button>
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: "yes" | "no" | "";
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <div className="flex gap-px" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--border))" }}>
      {(["yes", "no"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={{
            flex: 1,
            padding: "10px 0",
            border: "none",
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
            background: value === opt ? "hsl(var(--primary))" : "hsl(var(--background))",
            color: value === opt ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
          }}
        >
          {opt === "yes" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

// Single-file drop zone
function FileZone({
  label,
  accept,
  file,
  onChange,
  hint,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File) => void;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
      {file ? (
        <div className="flex items-center gap-3 p-4 border" style={{ background: "hsl(219 100% 97%)", borderColor: "#bfdbfe" }}>
          <CheckCircle2 className="size-4 shrink-0" style={{ color: "hsl(224 71% 40%)" }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-space-mono, monospace)" }}>
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => ref.current?.click()}
          >
            Change
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed hover:border-foreground/40 hover:bg-muted/20 transition-colors text-muted-foreground"
        >
          <Upload className="size-5" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground" style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}>{label}</p>
            {hint && <p className="text-xs mt-1 text-muted-foreground" style={{ fontFamily: "var(--font-space-mono, monospace)" }}>{hint}</p>}
          </div>
        </button>
      )}
    </div>
  );
}

// Multi-photo zone with thumbnails
function PhotoZone({
  label,
  files,
  onChange,
  description,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  description: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function add(incoming: FileList | null) {
    if (!incoming) return;
    onChange([...files, ...Array.from(incoming)]);
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => ref.current?.click()}
        >
          <Upload className="size-3 mr-1.5" /> Add photos
        </Button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        multiple
        className="sr-only"
        onChange={(e) => add(e.target.files)}
      />
      {files.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {files.map((file, idx) => (
            <PhotoThumb key={idx} file={file} onRemove={() => remove(idx)} />
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed hover:border-foreground/30 hover:bg-muted/30 transition-colors text-muted-foreground text-sm"
        >
          <ImageIcon className="size-4" />
          Click to add photos
        </button>
      )}
    </div>
  );
}

function PhotoThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="w-full h-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 size-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

// ─── Step 0: Lease ─────────────────────────────────────────────────────────────

export function LeaseStep({
  leaseFile,
  onFileChange,
  extracting,
  extracted,
  extractionFailed,
  onNext,
}: {
  leaseFile: File | null;
  onFileChange: (file: File) => void;
  extracting: boolean;
  extracted: ExtractedLeaseData | null;
  extractionFailed: boolean;
  onNext: () => void;
}) {
  const canContinue = leaseFile !== null && !extracting;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Upload Your Lease</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll read your lease to pre-fill most of the form. PDF or photo is fine.
        </p>
      </div>

      <FileZone
        label="Choose your lease"
        accept=".pdf,.jpg,.jpeg,.png"
        file={leaseFile}
        onChange={onFileChange}
        hint="PDF, JPG, or PNG · max 10MB"
      />

      {extracting && (
        <div className="flex items-center gap-3 p-4 border" style={{ background: "hsl(219 100% 97%)", borderColor: "#bfdbfe" }}>
          <Loader2 className="size-4 animate-spin shrink-0" style={{ color: "hsl(224 71% 40%)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "hsl(224 71% 40%)" }}>Reading your lease…</p>
            <p className="text-xs mt-0.5 text-muted-foreground" style={{ fontFamily: "var(--font-space-mono, monospace)" }}>
              This takes about 10–15 seconds.
            </p>
          </div>
        </div>
      )}

      {extracted && !extracting && (
        <div className="border p-4 space-y-2" style={{ background: "hsl(219 100% 97%)", borderColor: "#bfdbfe" }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" style={{ color: "hsl(224 71% 40%)" }} />
            <p className="text-sm font-semibold" style={{ color: "hsl(224 71% 40%)" }}>
              Lease read — we pre-filled what we found
            </p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5 pl-6" style={{ fontFamily: "var(--font-space-mono, monospace)" }}>
            {extracted.property_address && (
              <li>Property: {extracted.property_address}</li>
            )}
            {extracted.landlord_name && <li>Landlord: {extracted.landlord_name}</li>}
            {extracted.lease_start_date && extracted.lease_end_date && (
              <li>
                Lease: {extracted.lease_start_date} → {extracted.lease_end_date}
              </li>
            )}
            {extracted.deposit_amount_dollars !== undefined && (
              <li>Deposit: ${extracted.deposit_amount_dollars}</li>
            )}
          </ul>
          <p className="text-xs text-muted-foreground pl-6">
            You&apos;ll be able to edit everything on the next step.
          </p>
        </div>
      )}

      {extractionFailed && !extracting && leaseFile && (
        <div className="border p-4" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
          <p className="text-sm font-medium" style={{ color: "#92400e" }}>
            Couldn&apos;t read the lease automatically
          </p>
          <p className="text-xs mt-1" style={{ color: "#78350f", opacity: 0.75, fontFamily: "var(--font-space-mono, monospace)" }}>
            No problem — you&apos;ll fill in the details manually on the next step.
          </p>
        </div>
      )}

      <StepNav onNext={onNext} nextLabel="Continue" loading={extracting} />
      {!canContinue && !leaseFile && (
        <p className="text-xs text-muted-foreground text-center">
          A lease is required to open a case.
        </p>
      )}
    </div>
  );
}

// ─── Step 1: Your Details ──────────────────────────────────────────────────────

export function DetailsStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<IntakeFormData>();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Your Details</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Confirm or correct what we found, then add your current address and move-out date.
        </p>
      </div>

      {/* Personal */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About You
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Legal Name</Label>
            <Input id="full_name" {...register("full_name")} />
            <FieldError message={errors.full_name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" {...register("phone")} />
          </div>
        </div>
      </div>

      {/* Forwarding address */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Current / Forwarding Address
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            CT law uses this to calculate your landlord&apos;s legal deadline.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fwd_street">Street Address</Label>
          <Input id="fwd_street" placeholder="123 Main St" {...register("fwd_street")} />
          <FieldError message={errors.fwd_street?.message} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fwd_unit">Apt / Unit (optional)</Label>
            <Input id="fwd_unit" placeholder="Apt 2B" {...register("fwd_unit")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fwd_zip">ZIP Code</Label>
            <Input id="fwd_zip" placeholder="06511" {...register("fwd_zip")} />
            <FieldError message={errors.fwd_zip?.message} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fwd_city">City</Label>
            <Input id="fwd_city" placeholder="New Haven" {...register("fwd_city")} />
            <FieldError message={errors.fwd_city?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fwd_state">State</Label>
            <Input id="fwd_state" placeholder="CT" {...register("fwd_state")} />
            <FieldError message={errors.fwd_state?.message} />
          </div>
        </div>
      </div>

      {/* Rental property (pre-filled from lease) */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rental Property
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-filled from your lease — correct anything that&apos;s wrong.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="property_address">Property Address</Label>
            <Input id="property_address" {...register("property_address")} />
            <FieldError message={errors.property_address?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit_number">Unit (optional)</Label>
            <Input id="unit_number" {...register("unit_number")} />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lease_start_date">Lease Start</Label>
            <Input
              id="lease_start_date"
              type="date"
              {...register("lease_start_date")}
            />
            <FieldError message={errors.lease_start_date?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lease_end_date">Lease End</Label>
            <Input
              id="lease_end_date"
              type="date"
              {...register("lease_end_date")}
            />
            <FieldError message={errors.lease_end_date?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="move_out_date">
              Move-Out Date{" "}
              <span className="text-primary font-normal text-xs">(required)</span>
            </Label>
            <Input
              id="move_out_date"
              type="date"
              {...register("move_out_date")}
            />
            <FieldError message={errors.move_out_date?.message} />
          </div>
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─── Step 2: Landlord ──────────────────────────────────────────────────────────

export function LandlordStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<IntakeFormData>();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Landlord Contact</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ve pre-filled what was in your lease. Add anything that&apos;s missing — at
          minimum email or phone is required so Tribune can send correspondence.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="landlord_name">Landlord / Property Manager Name</Label>
          <Input id="landlord_name" {...register("landlord_name")} />
          <FieldError message={errors.landlord_name?.message} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="landlord_email">
              Email{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (required if no phone)
              </span>
            </Label>
            <Input id="landlord_email" type="email" {...register("landlord_email")} />
            <FieldError message={errors.landlord_email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="landlord_phone">
              Phone{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (required if no email)
              </span>
            </Label>
            <Input id="landlord_phone" type="tel" {...register("landlord_phone")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="landlord_address">
            Mailing Address{" "}
            <span className="text-muted-foreground font-normal text-xs">(if known)</span>
          </Label>
          <Input
            id="landlord_address"
            placeholder="e.g. 50 Church St, New Haven, CT 06510"
            {...register("landlord_address")}
          />
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─── Step 3: Deposit & Situation ───────────────────────────────────────────────

export function DepositStep({
  onNext,
  onBack,
  itemizedFile,
  onItemizedFileChange,
}: {
  onNext: () => void;
  onBack: () => void;
  itemizedFile: File | null;
  onItemizedFileChange: (f: File | null) => void;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IntakeFormData>();

  const itemizedReceived = watch("itemized_deductions_received");
  const preexistingDamage = watch("preexisting_damage");
  const landlordContactSince = watch("landlord_contact_since");

  const withheldDollars = parseFloat(watch("amount_withheld") || "0");
  const tribFee = isNaN(withheldDollars)
    ? 0
    : Math.round(withheldDollars * CONTINGENCY_PCT) / 100;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Deposit & Your Situation</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about the money and what happened. Short answers are fine — we just need the facts.
        </p>
      </div>

      {/* Deposit amounts */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          The Money
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="deposit_amount">Security Deposit Paid ($)</Label>
            <Input
              id="deposit_amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 2400.00"
              {...register("deposit_amount")}
            />
            <FieldError message={errors.deposit_amount?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount_withheld">Amount Withheld / Not Returned ($)</Label>
            <Input
              id="amount_withheld"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 2400.00"
              {...register("amount_withheld")}
            />
            <FieldError message={errors.amount_withheld?.message} />
          </div>
        </div>
        {withheldDollars > 0 && !isNaN(withheldDollars) && (
          <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Your estimated net (after {CONTINGENCY_PCT}% Tribune fee)
            </span>
            <span className="font-bold text-primary">
              {formatCents(Math.round((withheldDollars - tribFee) * 100))}
            </span>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="landlord_stated_reason">
            Landlord&apos;s stated reason for keeping it{" "}
            <span className="text-muted-foreground font-normal text-xs">(if any)</span>
          </Label>
          <Input
            id="landlord_stated_reason"
            placeholder='e.g. "cleaning fees" or they gave no reason'
            {...register("landlord_stated_reason")}
          />
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="itemized_deductions_received"
            checked={itemizedReceived}
            onCheckedChange={(c) =>
              setValue("itemized_deductions_received", c === true)
            }
          />
          <div className="space-y-1">
            <Label htmlFor="itemized_deductions_received" className="text-sm leading-snug">
              I received an itemized deductions list from my landlord
            </Label>
            {itemizedReceived && (
              <div className="pt-1">
                <FileZone
                  label="Upload itemized list"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={itemizedFile}
                  onChange={onItemizedFileChange}
                  hint="PDF or photo"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Situation questions */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Situation
        </p>

        <div className="space-y-2">
          <Label className="text-sm">
            Did you give written notice before moving out?
          </Label>
          <YesNo
            value={watch("notice_given")}
            onChange={(v) => setValue("notice_given", v)}
          />
          <FieldError message={errors.notice_given?.message} />
          {watch("notice_given") === "no" && (
            <Textarea
              rows={2}
              placeholder="Briefly explain why (e.g. month-to-month, landlord knew verbally, lease ended naturally)"
              {...register("notice_given_desc")}
              className="mt-1"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm">
            Were there any pre-existing issues or damage when you moved in?
          </Label>
          <YesNo
            value={watch("preexisting_damage")}
            onChange={(v) => setValue("preexisting_damage", v)}
          />
          <FieldError message={errors.preexisting_damage?.message} />
          {preexistingDamage === "yes" && (
            <Textarea
              rows={2}
              placeholder="Briefly describe (e.g. scuffed walls in bedroom, worn carpet)"
              {...register("preexisting_damage_desc")}
              className="mt-1"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apartment_condition" className="text-sm">
            What condition did you leave the apartment in?
          </Label>
          <Textarea
            id="apartment_condition"
            rows={2}
            placeholder="e.g. Cleaned thoroughly, no damage beyond normal wear and tear"
            {...register("apartment_condition")}
          />
          <FieldError message={errors.apartment_condition?.message} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">
            Have you contacted your landlord about the deposit since moving out?
          </Label>
          <YesNo
            value={watch("landlord_contact_since")}
            onChange={(v) => setValue("landlord_contact_since", v)}
          />
          <FieldError message={errors.landlord_contact_since?.message} />
          {landlordContactSince === "yes" && (
            <Textarea
              rows={2}
              placeholder="What did they say? e.g. They ignored my emails, or they said they'd return it within a week"
              {...register("landlord_contact_desc")}
              className="mt-1"
            />
          )}
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─── Step 4: Photos ────────────────────────────────────────────────────────────

export function PhotosStep({
  onNext,
  onBack,
  onSkip,
  moveInPhotos,
  moveOutPhotos,
  onMoveInChange,
  onMoveOutChange,
}: {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  moveInPhotos: File[];
  moveOutPhotos: File[];
  onMoveInChange: (files: File[]) => void;
  onMoveOutChange: (files: File[]) => void;
}) {
  const hasPhotos = moveInPhotos.length > 0 || moveOutPhotos.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Photos</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Photos are your strongest evidence. Move-in photos prove the apartment&apos;s
          condition before you arrived; move-out photos show what you left behind.
          You can skip this and upload photos later from your case page.
        </p>
      </div>

      <div className="space-y-4">
        <PhotoZone
          label="Move-In Photos"
          description="Taken when you first moved in — showing the apartment's pre-existing condition"
          files={moveInPhotos}
          onChange={onMoveInChange}
        />
        <PhotoZone
          label="Move-Out Photos"
          description="Taken when you left — showing the condition you left it in"
          files={moveOutPhotos}
          onChange={onMoveOutChange}
        />
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextLabel={hasPhotos ? "Continue" : "Continue with photos"} />
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
      >
        Skip for now — I&apos;ll add photos later
      </button>
    </div>
  );
}

// ─── Step 5: Service Agreement ─────────────────────────────────────────────────

const KEY_CLAUSE_TEXT = `You authorize Tribune to independently verify the amount recovered directly with your landlord or any other party to this dispute. This authorization is irrevocable after recovery occurs. If you receive any funds covered by this Agreement, you must remit Tribune's fee within seven (7) days of receipt. Fees unpaid after fourteen (14) days accrue interest at 1.5% per month. Fees remaining unpaid after thirty (30) days constitute a valid and enforceable debt and may be referred to a collection agency, reported to consumer credit reporting agencies, and pursued through civil legal proceedings in Connecticut courts, including recovery of accrued interest, collection costs, and attorneys' fees.`;

export function AgreementStep({
  onBack,
  onSubmit,
  submitting,
}: {
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<IntakeFormData>();

  const initials = watch("initials_key_clause");
  const sigName = watch("signature_name");

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Tribune Service Agreement</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Read carefully — this is a binding agreement. Initial the highlighted clause and
          sign your full name at the bottom.
        </p>
      </div>

      {/* Contract */}
      <div className="rounded-xl border overflow-hidden text-sm">
        <div className="bg-muted/40 px-4 py-2.5 border-b">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Service Agreement
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto px-4 py-4 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            This Agreement is between you (&ldquo;Client&rdquo;) and Tribune, a legal-information
            and document-preparation service operating in Connecticut.
          </p>
          <p>
            <strong className="text-foreground">1. Services.</strong> Tribune will review your
            security deposit dispute, prepare demand correspondence on your behalf, and assist
            you through the recovery process under Connecticut General Statutes § 47a-21.
            Tribune is not a law firm. No attorney-client relationship is created.
            Tribune provides legal information and document preparation, not legal advice.
          </p>
          <p>
            <strong className="text-foreground">2. Pro Se Representation.</strong> All
            correspondence Tribune prepares will be signed and sent by you in your own name.
            You are acting pro se (on your own behalf). Tribune prepares and, where
            authorized, mails correspondence on your behalf.
          </p>
          <p>
            <strong className="text-foreground">3. Contingency Fee.</strong> Tribune charges a{" "}
            {CONTINGENCY_PCT}% fee on any amount recovered from your landlord as a direct
            result of Tribune&apos;s services. If nothing is recovered, you owe Tribune nothing.
          </p>
          <p>
            <strong className="text-foreground">4. Hard Costs.</strong> Certified mailing fees
            and court filing fees (if your case escalates to Small Claims Court) are passed
            through at cost with no markup. These are your responsibility.
          </p>
          <p>
            <strong className="text-foreground">5. Fee, Payment, and Enforcement.</strong>{" "}
            Tribune&apos;s fee is {CONTINGENCY_PCT}% of all amounts recovered on your behalf.
            &ldquo;Recovered&rdquo; includes any amount paid, credited, or forgiven by the landlord
            in connection with this dispute. Recovered funds go directly from your landlord to you.
            Tribune will issue a formal invoice at resolution specifying the amount due and accepted
            payment methods. Payment is due within seven (7) days of the invoice date. Fees unpaid
            after fourteen (14) days accrue interest at 1.5% per month (18% per annum) from the
            original due date. If your account remains unpaid after thirty (30) days, Tribune
            reserves the right to: (a) refer the unpaid balance to a collection agency;
            (b) report the delinquency to consumer credit reporting agencies; and (c) initiate civil
            legal proceedings to recover the unpaid amount, together with accrued interest,
            collection costs, and reasonable attorneys&apos; fees as permitted by applicable law.
            You consent to jurisdiction in Connecticut courts for any action arising from this
            Agreement. If nothing is recovered, no fee is owed.
          </p>

          {/* Key clause with initials */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
            <p>
              <strong className="text-foreground">6. Independent Verification & Irrevocable Authorization.</strong>{" "}
              {KEY_CLAUSE_TEXT}
            </p>
            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <Label htmlFor="initials_key_clause" className="text-xs text-foreground">
                  Initial here to acknowledge clause 6
                </Label>
                <Input
                  id="initials_key_clause"
                  placeholder="Your initials"
                  className="w-32 bg-white"
                  {...register("initials_key_clause")}
                />
                <FieldError message={errors.initials_key_clause?.message} />
              </div>
              {initials && (
                <CheckCircle2 className="size-5 text-primary shrink-0 mt-4" />
              )}
            </div>
          </div>

          <p>
            <strong className="text-foreground">7. Landlord Contact Authorization.</strong>{" "}
            You authorize Tribune to contact your landlord at the information you provide,
            on your behalf and in connection with your security deposit dispute.
          </p>
          <p>
            <strong className="text-foreground">8. Accuracy.</strong> You represent that all
            information you have provided is accurate and complete to the best of your
            knowledge. Tribune relies on your representations in preparing correspondence.
          </p>
          <p>
            <strong className="text-foreground">9. Jurisdiction.</strong> This Agreement is
            governed by the laws of Connecticut.
          </p>
          <p className="text-xs italic">
            This is a legal-information service agreement, not legal advice. Tribune is not
            a law firm and no attorney-client relationship is created by this Agreement.
          </p>
        </div>

        {/* Signature line */}
        <div className="border-t px-4 py-4 bg-muted/20 space-y-3">
          <p className="text-xs text-muted-foreground">
            By typing your full legal name below, you are electronically signing this
            Agreement and agree to all terms above.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="signature_name">Full Legal Name (signature)</Label>
            <Input
              id="signature_name"
              placeholder="Type your full name exactly as it appears on your lease"
              className="bg-white font-medium"
              {...register("signature_name")}
            />
            <FieldError message={errors.signature_name?.message} />
          </div>
          {sigName && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <CheckCircle2 className="size-3.5" />
              Signed by {sigName}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Submitting…
            </>
          ) : (
            "Submit Case"
          )}
        </Button>
      </div>
    </div>
  );
}
