"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format, differenceInDays } from "date-fns";
import {
  type Case,
  type CaseMessage,
  type CaseAction,
} from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { uploadDocument, getDocumentUrl, reportRecovery, confirmLetterSent, submitLandlordResponse } from "./actions";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { statusColor } from "@/lib/utils/case";
import { STATUS_LABELS } from "@/lib/types/database";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/posthog";
import {
  type CaseDocument,
  type InvoiceData,
  buildEventStream,
  groupIntoRounds,
  getStatusHeadline,
  StageRail,
  ClaimSummary,
  CaseReadiness,
  CurrentRoundBox,
  RoundGroup,
  EvidenceCenter,
  ActionBanner,
  SendLetterBanner,
  LandlordNextStep,
  RecoveryForm,
  InvoicePanel,
} from "./_components";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [actions, setActions] = useState<CaseAction[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingSent, setConfirmingSent] = useState(false);
  const evidenceRef = useRef<HTMLDivElement>(null);

  async function handleUploadLease(file: File) {
    await handleUpload("lease", file);
  }

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [
      { data: caseResult },
      { data: messagesResult },
      { data: actionsResult },
      { data: docsResult },
      { data: invoiceResult },
    ] = await Promise.all([
      supabase.from("cases").select("*").eq("id", caseId).single(),
      supabase
        .from("case_messages")
        .select("*")
        .eq("case_id", caseId)
        .eq("is_admin_only", false)
        .order("created_at", { ascending: true }),
      supabase
        .from("case_actions")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true }),
      supabase
        .from("case_documents")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true }),
      supabase
        .from("invoices")
        .select("id, invoice_number, amount_cents, status, due_date, paid_at, payment_method, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setCaseData(caseResult);
    setMessages(messagesResult || []);
    setActions(actionsResult || []);
    setDocuments(docsResult || []);
    setInvoice(invoiceResult ?? null);
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleUpload(kind: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    const result = await uploadDocument(caseId, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      trackEvent("document_uploaded", { kind });
      toast.success(`${file.name} uploaded`);
      loadData();
    }
  }

  async function handleDownload(storagePath: string) {
    const result = await getDocumentUrl(storagePath);
    if (result.error) toast.error("Failed to download");
    else if (result.url) window.open(result.url, "_blank");
  }

  async function handleConfirmLetterSent() {
    if (!caseData) return;
    setConfirmingSent(true);
    const letterNumber = caseData.current_letter_number || 1;
    const result = await confirmLetterSent(caseId, letterNumber);
    if (result.error) {
      toast.error(result.error);
    } else {
      trackEvent("letter_sent_confirmed", { letter_number: letterNumber });
      toast.success("Noted. We'll track the landlord's response deadline.");
    }
    setConfirmingSent(false);
    loadData();
  }

  async function handleLandlordResponse(text: string) {
    const result = await submitLandlordResponse(caseId, text);
    if (result.error) {
      toast.error(result.error);
    } else {
      trackEvent("landlord_response_submitted");
      toast.success("Response submitted. Tribune will review and prepare next steps.");
      loadData();
    }
  }

  async function handleRecovery(amountCents: number, notes: string) {
    const result = await reportRecovery(caseId, amountCents, notes);
    if (result.error) {
      toast.error(result.error);
    } else {
      trackEvent("recovery_reported", { amount_cents: amountCents });
      toast.success("Recovery reported. Case marked as resolved.");
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="size-10 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Case not found</p>
      </div>
    );
  }

  // Derive computed state
  const hasLease = documents.some((d) => d.kind === "lease");
  const deadline = new Date(caseData.statutory_deadline);
  const daysOverdue = differenceInDays(new Date(), deadline);
  const isTerminal = caseData.status === "resolved" || caseData.status === "closed";

  // Build event stream and rounds
  const events = buildEventStream(messages, actions);
  const rounds = groupIntoRounds(events);
  const activeRoundIdx = 0; // rounds are newest-first, so active round is at index 0

  const headline = getStatusHeadline(caseData.status, hasLease);

  // Find the current letter body (active round's tribune_letter event)
  const currentLetterBody =
    rounds[0]?.events.find((e) => e.kind === "tribune_letter")?.body ?? null;

  // Derive the current action banner
  function getActionBannerProps() {
    if (caseData!.status === "intake_submitted" && !hasLease) {
      return {
        variant: "required" as const,
        title: "Upload your lease to begin",
        description:
          "Tribune cannot review your case until we have a copy of your lease agreement. Use the \"Upload Lease\" button in Case Readiness below.",
      };
    }
    if (
      caseData!.status === "intake_submitted" ||
      caseData!.status === "under_review"
    ) {
      return {
        variant: "waiting" as const,
        title: "Tribune is reviewing your case",
        description:
          "We'll notify you when your demand letter is ready. No action needed right now.",
      };
    }
    if (caseData!.status === "letter_ready") {
      return {
        variant: "required" as const,
        title: "Your demand letter is ready",
        description:
          "Review the letter below, send it to your landlord, then confirm you sent it here so we can track the response timeline.",
        cta: {
          label: confirmingSent ? "Confirming…" : "I sent the letter to my landlord",
          onClick: handleConfirmLetterSent,
          loading: confirmingSent,
        },
      };
    }
    if (
      caseData!.status === "letter_sent" ||
      caseData!.status === "awaiting_landlord"
    ) {
      return {
        variant: "waiting" as const,
        title: daysOverdue > 0
          ? `Landlord is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`
          : `Waiting for landlord — ${Math.abs(daysOverdue)} day${Math.abs(daysOverdue) !== 1 ? "s" : ""} left on deadline`,
        description:
          "When your landlord replies by email, letter, or text, submit their response below so Tribune can prepare your next step.",
      };
    }
    if (caseData!.status === "landlord_responded") {
      return {
        variant: "info" as const,
        title: "Tribune is preparing your response",
        description:
          "We've received your landlord's reply and are preparing the recommended next step. You'll be notified shortly.",
      };
    }
    if (caseData!.status === "resolved") {
      return {
        variant: "done" as const,
        title: "Case resolved",
        description: "Your case has been resolved. See the outcome below.",
      };
    }
    return {
      variant: "info" as const,
      title: "Case closed",
      description: "This case has been closed.",
    };
  }

  const bannerProps = getActionBannerProps();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/dashboard" />}
        className="text-muted-foreground -ml-2"
      >
        <ArrowLeft className="size-4 mr-1" /> Back to cases
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {caseData.property_address}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            vs. {caseData.landlord_name}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 ${statusColor(caseData.status)}`}
        >
          {STATUS_LABELS[caseData.status]}
        </Badge>
      </div>

      {/* Status headline */}
      <div>
        <h2
          className={`text-lg font-semibold ${
            caseData.status === "intake_submitted" && !hasLease
              ? "text-destructive"
              : ""
          }`}
        >
          {headline}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Case opened {format(new Date(caseData.created_at), "MMMM d, yyyy")}
          {daysOverdue > 0 && caseData.status !== "resolved" && caseData.status !== "closed" && (
            <span className="text-destructive font-medium ml-2">
              · Deadline passed {daysOverdue}d ago
            </span>
          )}
        </p>
      </div>

      {/* Stage pipeline */}
      <div className="rounded-xl border bg-card px-4 py-3">
        <StageRail status={caseData.status} />
      </div>

      {/* Action banner */}
      {caseData.status === "letter_ready" ? (
        <SendLetterBanner
          landlordEmail={caseData.landlord_email}
          landlordName={caseData.landlord_name}
          propertyAddress={caseData.property_address}
          letterBody={currentLetterBody}
          onConfirmSent={handleConfirmLetterSent}
          confirming={confirmingSent}
        />
      ) : (
        <ActionBanner {...bannerProps} />
      )}

      {/* Landlord next step — primary action when awaiting, placed right after banner */}
      {(caseData.status === "awaiting_landlord" ||
        caseData.status === "letter_sent") && (
        <LandlordNextStep
          caseData={caseData}
          onSubmitResponse={handleLandlordResponse}
          onReportRecovery={handleRecovery}
        />
      )}

      {/* Claim + Readiness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ClaimSummary caseData={caseData} />
        <CaseReadiness
          caseData={caseData}
          documents={documents}
          onUploadLeaseFile={handleUploadLease}
        />
      </div>

      {/* Current round box */}
      {rounds.length > 0 && (
        <CurrentRoundBox rounds={rounds} status={caseData.status} />
      )}

      {/* Correspondence rounds */}
      {rounds.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Case Activity
              </h2>
              <span className="text-xs text-muted-foreground/60">newest first</span>
            </div>
            {rounds.map((round, idx) => (
              <RoundGroup
                key={round.number}
                round={round}
                isActive={idx === activeRoundIdx}
                onDownload={handleDownload}
              />
            ))}
          </section>
        </>
      )}

      {/* Evidence center */}
      <Separator />
      <section className="space-y-4" ref={evidenceRef}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Evidence &amp; Documents
        </h2>
        <EvidenceCenter
          documents={documents}
          onUpload={handleUpload}
          onDownload={handleDownload}
        />
      </section>

      {/* Recovery module — shown when status is resolved or actively near resolution */}
      {(caseData.status === "resolved" ||
        caseData.status === "closed" ||
        (caseData.status === "landlord_responded" && !isTerminal)) && (
        <>
          <Separator />
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recovery
            </h2>
            <RecoveryForm caseData={caseData} onSubmit={handleRecovery} />
          </section>
        </>
      )}

      {/* Invoice — shown once case is resolved and invoice exists */}
      {invoice && (caseData.status === "resolved" || caseData.status === "closed") && (
        <>
          <Separator />
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tribune Fee
            </h2>
            <InvoicePanel
              invoice={invoice}
              paymentPhone={process.env.NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE ?? ""}
            />
          </section>
        </>
      )}

      <LegalDisclaimer />
    </div>
  );
}
