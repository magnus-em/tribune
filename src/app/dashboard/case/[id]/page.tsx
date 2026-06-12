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
import { uploadDocument, getDocumentUrl, reportRecovery, markLandlordIntroSent } from "./actions";
import { INTRO_SENT_TITLE } from "@/lib/constants";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { statusColor, parseDateOnly } from "@/lib/utils/case";
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
  LandlordIntroStep,
  RecoveryStep,
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
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);
  const evidenceRef = useRef<HTMLDivElement>(null);

  async function handleUploadLease(file: File) {
    await handleUpload("lease", file);
  }

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [
      { data: caseResult },
      { data: messagesResult },
      { data: actionsResult },
      { data: docsResult },
      { data: invoiceResult },
      { data: profileResult },
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
      user
        ? supabase.from("profiles").select("full_name").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);
    setCaseData(caseResult);
    setMessages(messagesResult || []);
    setActions(actionsResult || []);
    setDocuments(docsResult || []);
    setInvoice(invoiceResult ?? null);
    setTenantName((profileResult as { full_name?: string } | null)?.full_name ?? "");
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

  async function handleConfirmIntro() {
    const result = await markLandlordIntroSent(caseId);
    if (result.error) {
      toast.error(result.error);
    } else {
      trackEvent("landlord_intro_sent");
      toast.success("Marked as sent. Tribune will take it from here.");
      loadData();
    }
  }

  async function handleRecovery(amountCents: number, notes: string) {
    const result = await reportRecovery(caseId, amountCents, notes);
    if (result.error) {
      toast.error(result.error);
    } else {
      // No amount in analytics — deposit amounts are PII per project policy.
      trackEvent("recovery_reported");
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
  const deadline = parseDateOnly(caseData.statutory_deadline);
  const daysOverdue = differenceInDays(new Date(), deadline);
  const isTerminal = caseData.status === "resolved" || caseData.status === "closed";
  const introSent = messages.some((m) => m.title === INTRO_SENT_TITLE);
  const inSetup =
    caseData.status === "intake_submitted" || caseData.status === "under_review";

  // Build event stream and rounds
  const events = buildEventStream(messages, actions);
  const rounds = groupIntoRounds(events);
  const activeRoundIdx = 0; // rounds are newest-first, so active round is at index 0

  const headline = getStatusHeadline(caseData.status, hasLease);

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
          "Tribune typically responds to new cases within a few hours. You'll receive an email when your demand letter is ready or if Tribune needs anything else from you. No action needed right now.",
      };
    }
    if (caseData!.status === "correspondence_ready") {
      return {
        variant: "waiting" as const,
        title: "Tribune is preparing to contact your landlord",
        description: "Your demand letter is staged. Tribune will send it to your landlord shortly.",
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
          : `Tribune sent your letter — ${Math.abs(daysOverdue)} day${Math.abs(daysOverdue) !== 1 ? "s" : ""} left on deadline`,
        description:
          "Tribune has contacted your landlord on your behalf. If they return your deposit, report it below.",
      };
    }
    if (caseData!.status === "landlord_responded") {
      return {
        variant: "info" as const,
        title: "Landlord has responded — Tribune is preparing next steps",
        description:
          "Your landlord replied to Tribune. We're reviewing their position and will update you shortly.",
      };
    }
    if (caseData!.status === "resolved") {
      return {
        variant: "done" as const,
        title: "Case resolved",
        description: "Your case has been resolved. See the outcome below.",
      };
    }
    if (caseData!.status === "declined") {
      return {
        variant: "info" as const,
        title: "Tribune is unable to take this case",
        description:
          caseData!.decline_message ||
          "Tribune has reviewed your intake and isn't able to take this case on. Connecticut tenants still have rights under § 47a-21 — see the free resources listed below.",
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
      <div className="border bg-card overflow-hidden">
        <StageRail status={caseData.status} />
      </div>

      {/* ── PRIMARY ACTION ZONE ──────────────────────────────────────────── */}

      <ActionBanner {...bannerProps} />

      {/* Declined: free CT resources */}
      {caseData.status === "declined" && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Free Connecticut tenant resources
          </h3>
          <p className="text-sm text-muted-foreground">
            Declining to take this case is not a legal opinion on your claim.
            You may still have strong rights under CT § 47a-21. These groups
            can help you pursue this directly.
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <p className="font-semibold text-foreground">
                New Haven Legal Assistance Association (NHLAA)
              </p>
              <p className="text-muted-foreground">
                Free civil legal help for low-income CT tenants.{" "}
                <a
                  href="https://nhlegal.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  nhlegal.org
                </a>{" "}
                · (203)&nbsp;946-4811
              </p>
            </li>
            <li>
              <p className="font-semibold text-foreground">
                Connecticut Fair Housing Center
              </p>
              <p className="text-muted-foreground">
                Statewide tenant resources and referrals.{" "}
                <a
                  href="https://www.ctfairhousing.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  ctfairhousing.org
                </a>
              </p>
            </li>
            <li>
              <p className="font-semibold text-foreground">
                CT § 47a-21 statutory text
              </p>
              <p className="text-muted-foreground">
                What the law says about security deposits, deadlines, and
                damages.{" "}
                <a
                  href="https://www.cga.ct.gov/current/pub/chap_831.htm#sec_47a-21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Connecticut General Statutes, Chapter 831
                </a>
              </p>
            </li>
          </ul>
        </div>
      )}

      {/* Setup: tenant introduces Tribune to the landlord (agency hand-off) */}
      {inSetup && (
        <LandlordIntroStep
          caseData={caseData}
          tenantName={tenantName}
          introSent={introSent}
          onConfirmSent={handleConfirmIntro}
        />
      )}

      {/* awaiting_landlord / letter_sent / landlord_responded: report recovery */}
      {(caseData.status === "awaiting_landlord" ||
        caseData.status === "letter_sent" ||
        caseData.status === "landlord_responded") && (
        <RecoveryStep
          caseData={caseData}
          onReportRecovery={handleRecovery}
        />
      )}

      {/* resolved / closed: invoice payment (if outstanding) shown prominently */}
      {invoice && isTerminal && invoice.status !== "paid" && invoice.status !== "waived" && (
        <InvoicePanel
          invoice={invoice}
          paymentPhone={process.env.NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE ?? ""}
        />
      )}

      {/* ── CASE DETAILS ─────────────────────────────────────────────────── */}

      {/* Claim + Readiness — hide on terminal states to reduce noise */}
      {!isTerminal && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ClaimSummary caseData={caseData} />
          <CaseReadiness
            caseData={caseData}
            documents={documents}
            onUploadLeaseFile={handleUploadLease}
          />
        </div>
      )}

      {/* Resolved: show recovery outcome + paid invoice (if paid) */}
      {isTerminal && (
        <>
          <RecoveryForm caseData={caseData} onSubmit={handleRecovery} />
          {invoice && (invoice.status === "paid" || invoice.status === "waived") && (
            <InvoicePanel
              invoice={invoice}
              paymentPhone={process.env.NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE ?? ""}
            />
          )}
        </>
      )}

      {/* Current round box */}
      {rounds.length > 0 && !isTerminal && (
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

      <LegalDisclaimer />

      <p className="text-xs text-muted-foreground text-center pt-4" style={{ fontFamily: "var(--font-space-mono, monospace)" }}>
        Different property?{" "}
        <Link href="/dashboard/new-case" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Start another case →
        </Link>
      </p>
    </div>
  );
}
