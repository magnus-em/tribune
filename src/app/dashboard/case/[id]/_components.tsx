"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Circle,
  Clock,
  Upload,
  Download,
  Send,
  FileText,
  Copy,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCheck,
  Hourglass,
  MessageSquare,
  Scale,
  Handshake,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatCents } from "@/lib/utils/case";
import type { Case, CaseMessage, CaseAction } from "@/lib/types/database";
import { CONTINGENCY_PCT } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventKind =
  | "tribune_letter"
  | "tribune_update"
  | "landlord_reply"
  | "letter_sent"
  | "document_upload"
  | "resolution"
  | "system";

export type EventActor = "tribune" | "tenant" | "landlord";

export interface CaseEvent {
  id: string;
  kind: EventKind;
  actor: EventActor;
  title: string;
  body?: string;
  date: string;
  round: number; // 0 = setup phase, 1+ = demand rounds
  letterNumber?: number;
  // document fields
  docFilename?: string;
  docKind?: string;
  docStoragePath?: string;
}

export interface Round {
  number: number;
  label: string;
  events: CaseEvent[];
}

export interface CaseDocument {
  id: string;
  kind: string;
  original_filename: string;
  storage_path: string;
  created_at: string;
}

// ─── Event synthesis ──────────────────────────────────────────────────────────

export function buildEventStream(
  messages: CaseMessage[],
  actions: CaseAction[]
): CaseEvent[] {
  const events: CaseEvent[] = [];

  for (const msg of messages) {
    let kind: EventKind;
    let actor: EventActor;

    switch (msg.message_type) {
      case "tribune_letter":
        kind = "tribune_letter";
        actor = "tribune";
        break;
      case "tribune_update":
        kind = "tribune_update";
        actor = "tribune";
        break;
      case "tenant_landlord_reply":
        kind = "landlord_reply";
        actor = "landlord";
        break;
      case "tenant_response":
        kind = "document_upload";
        actor = "tenant";
        break;
      case "system":
        kind = "document_upload";
        actor = "tenant";
        break;
      default:
        kind = "system";
        actor = "tenant";
    }

    events.push({
      id: msg.id,
      kind,
      actor,
      title: msg.title,
      body: msg.body,
      date: msg.created_at,
      letterNumber: msg.letter_number ?? undefined,
      round: 0,
    });
  }

  for (const action of actions) {
    let kind: EventKind;
    let title: string;
    const meta = action.metadata as Record<string, unknown> | null;

    switch (action.action_type) {
      case "letter_sent":
        kind = "letter_sent";
        title = `Letter ${meta?.letter_number ?? ""} sent to landlord`.trim();
        break;
      case "resolution_reported":
        kind = "resolution";
        title = "Recovery reported";
        break;
      default:
        kind = "system";
        title = "Action recorded";
    }

    events.push({
      id: action.id,
      kind,
      actor: "tenant",
      title,
      date: action.created_at,
      round: 0,
    });
  }

  // Sort by date
  events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Assign rounds based on when tribune_letters were posted
  const letterTimes = events
    .filter((e) => e.kind === "tribune_letter")
    .map((e) => new Date(e.date).getTime());

  for (const ev of events) {
    const t = new Date(ev.date).getTime();
    let round = 0;
    for (let i = 0; i < letterTimes.length; i++) {
      if (t >= letterTimes[i]) round = i + 1;
    }
    ev.round = round;
  }

  return events;
}

export function groupIntoRounds(events: CaseEvent[]): Round[] {
  const roundMap = new Map<number, CaseEvent[]>();

  for (const ev of events) {
    const bucket = roundMap.get(ev.round) ?? [];
    bucket.push(ev);
    roundMap.set(ev.round, bucket);
  }

  const roundLabels: Record<number, string> = {
    0: "Case Setup",
    1: "Round 1 — Initial Demand",
    2: "Round 2 — Follow-Up",
    3: "Round 3 — Final Demand",
  };

  return Array.from(roundMap.entries())
    .sort(([a], [b]) => b - a) // newest round first
    .map(([num, evs]) => ({
      number: num,
      label: roundLabels[num] ?? `Round ${num}`,
      events: [...evs].reverse(), // newest event first within each round
    }));
}

// ─── Stage Rail ───────────────────────────────────────────────────────────────

const STAGES = [
  { key: "setup", label: "Setup" },
  { key: "review", label: "Review" },
  { key: "correspondence", label: "Correspondence" },
  { key: "recovery", label: "Recovery" },
  { key: "closed", label: "Closed" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

function deriveStageKey(status: string): StageKey {
  switch (status) {
    case "intake_submitted":
      return "setup";
    case "under_review":
      return "review";
    case "letter_ready":
    case "letter_sent":
    case "awaiting_landlord":
    case "landlord_responded":
      return "correspondence";
    case "resolved":
      return "recovery";
    case "closed":
      return "closed";
    default:
      return "setup";
  }
}

export function StageRail({ status }: { status: string }) {
  const currentKey = deriveStageKey(status);
  const currentIdx = STAGES.findIndex((s) => s.key === currentKey);

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STAGES.map((stage, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <div key={stage.key} className="flex items-center shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md">
              {isDone ? (
                <CheckCircle2 className="size-3.5 text-primary shrink-0" />
              ) : isActive ? (
                <div className="size-3.5 rounded-full bg-primary shrink-0" />
              ) : (
                <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "text-foreground"
                    : isDone
                      ? "text-primary"
                      : "text-muted-foreground/50"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <ChevronRight className="size-3 text-muted-foreground/30 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Status headline ──────────────────────────────────────────────────────────

export function getStatusHeadline(status: string, hasLease: boolean): string {
  if (status === "intake_submitted" && !hasLease)
    return "Action needed — upload your lease to begin";
  if (status === "intake_submitted")
    return "Case submitted — Tribune will review shortly";
  if (status === "under_review") return "Tribune is reviewing your case";
  if (status === "letter_ready") return "Your demand letter is ready to send";
  if (status === "letter_sent" || status === "awaiting_landlord")
    return "Waiting for your landlord to respond";
  if (status === "landlord_responded")
    return "Tribune is preparing your next response";
  if (status === "resolved") return "Case resolved";
  if (status === "closed") return "Case closed";
  return "Your case is in progress";
}

// ─── Claim Summary ────────────────────────────────────────────────────────────

export function ClaimSummary({
  caseData,
}: {
  caseData: Case;
}) {
  const originalReturnedCents =
    caseData.deposit_amount_cents - caseData.amount_withheld_cents;
  const recoveredCents = Math.max(
    0,
    caseData.deposit_returned_cents - originalReturnedCents
  );
  const tribFee = Math.round((recoveredCents * caseData.contingency_pct) / 100);
  const deadline = new Date(caseData.statutory_deadline);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Claim Summary
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Deposit paid</p>
          <p className="font-semibold">{formatCents(caseData.deposit_amount_cents)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Withheld</p>
          <p className="font-semibold text-destructive">{formatCents(caseData.amount_withheld_cents)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Recovered so far</p>
          <p className={`font-semibold ${recoveredCents > 0 ? "text-green-600" : ""}`}>
            {formatCents(recoveredCents)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Tribune fee ({CONTINGENCY_PCT}%)</p>
          <p className="font-semibold">{tribFee > 0 ? formatCents(tribFee) : "—"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground text-xs">Statutory deadline</p>
          <p className="font-semibold">{format(deadline, "MMMM d, yyyy")}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Case Readiness ───────────────────────────────────────────────────────────

interface ReadinessItem {
  label: string;
  done: boolean;
  required: boolean;
}

export function CaseReadiness({
  caseData,
  documents,
  onUploadLease,
}: {
  caseData: Case;
  documents: CaseDocument[];
  onUploadLease: () => void;
}) {
  const hasLease = documents.some((d) => d.kind === "lease");
  const hasPhotos = documents.some((d) => d.kind === "photo");
  const hasContact = !!(caseData.landlord_email || caseData.landlord_phone);
  const hasDepositProof = documents.some((d) => d.kind === "other" || d.kind === "deduction_itemization");

  const items: ReadinessItem[] = [
    { label: "Service agreement signed", done: !!caseData.contingency_agreed_at, required: true },
    { label: "Landlord contact on file", done: hasContact, required: true },
    { label: "Lease uploaded", done: hasLease, required: true },
    { label: "Photos uploaded", done: hasPhotos, required: false },
    { label: "Deposit proof uploaded", done: hasDepositProof, required: false },
  ];

  const requiredDone = items.filter((i) => i.required && i.done).length;
  const requiredTotal = items.filter((i) => i.required).length;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Case Readiness
        </p>
        <span className="text-xs text-muted-foreground">
          {requiredDone}/{requiredTotal} required
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.done ? (
              <CheckCheck className="size-3.5 text-primary shrink-0" />
            ) : item.required ? (
              <X className="size-3.5 text-destructive shrink-0" />
            ) : (
              <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />
            )}
            <span
              className={`text-xs ${
                item.done
                  ? "text-foreground"
                  : item.required
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
              }`}
            >
              {item.label}
              {!item.required && !item.done && (
                <span className="ml-1 text-muted-foreground/60">(recommended)</span>
              )}
            </span>
          </div>
        ))}
      </div>
      {!hasLease && (
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs h-8"
          onClick={onUploadLease}
        >
          <Upload className="size-3 mr-1.5" /> Upload Lease
        </Button>
      )}
    </div>
  );
}

// ─── Current Round Box ────────────────────────────────────────────────────────

export function CurrentRoundBox({
  rounds,
  status,
}: {
  rounds: Round[];
  status: string;
}) {
  const inCorrespondence = [
    "letter_ready",
    "letter_sent",
    "awaiting_landlord",
    "landlord_responded",
  ].includes(status);

  if (!inCorrespondence || rounds.length === 0) return null;

  // Find the active round (highest number with events)
  const activeRound = rounds[rounds.length - 1];
  if (activeRound.number === 0) return null;

  const lastEvent = activeRound.events[activeRound.events.length - 1];
  const hasTribuneDraft = activeRound.events.some((e) => e.kind === "tribune_letter");
  const hasLandlordReply = activeRound.events.some((e) => e.kind === "landlord_reply");
  const letterSent = activeRound.events.some((e) => e.kind === "letter_sent");

  let tribuneAction = "Awaiting your action";
  if (status === "landlord_responded") tribuneAction = "Response prepared";
  else if (hasTribuneDraft && !letterSent) tribuneAction = "Letter ready for you to send";
  else if (letterSent && !hasLandlordReply) tribuneAction = "Waiting for landlord reply";

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {activeRound.label}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Last event</p>
              <p className="font-medium truncate">{lastEvent?.title ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tribune</p>
              <p className="font-medium">{tribuneAction}</p>
            </div>
          </div>
        </div>
        <Scale className="size-5 text-primary/50 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  EventKind,
  { icon: React.ReactNode; label: string; colorClass: string }
> = {
  tribune_letter: {
    icon: <Scale className="size-3.5" />,
    label: "Tribune",
    colorClass: "bg-blue-50 border-blue-200 text-blue-900",
  },
  tribune_update: {
    icon: <MessageSquare className="size-3.5" />,
    label: "Tribune",
    colorClass: "bg-blue-50 border-blue-200 text-blue-900",
  },
  landlord_reply: {
    icon: <MessageSquare className="size-3.5" />,
    label: "Landlord reply",
    colorClass: "bg-orange-50 border-orange-200 text-orange-900",
  },
  letter_sent: {
    icon: <Send className="size-3.5" />,
    label: "Sent to landlord",
    colorClass: "bg-purple-50 border-purple-200 text-purple-900",
  },
  document_upload: {
    icon: <FileText className="size-3.5" />,
    label: "Document",
    colorClass: "bg-muted border-border text-foreground",
  },
  resolution: {
    icon: <Handshake className="size-3.5" />,
    label: "Recovery",
    colorClass: "bg-green-50 border-green-200 text-green-900",
  },
  system: {
    icon: <Clock className="size-3.5" />,
    label: "System",
    colorClass: "bg-muted border-border text-muted-foreground",
  },
};

export function EventCard({
  event,
  onDownload,
}: {
  event: CaseEvent;
  onDownload?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(
    event.kind === "tribune_letter" ? false : true
  );
  const config = EVENT_CONFIG[event.kind];
  const hasBody = !!event.body?.trim();

  return (
    <div className={`rounded-lg border p-3 text-sm ${config.colorClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="shrink-0 opacity-70">{config.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
                {config.label}
              </span>
              <span className="text-[11px] opacity-50">
                {format(new Date(event.date), "MMM d 'at' h:mm a")}
              </span>
            </div>
            <p className="font-medium leading-snug mt-0.5">{event.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {event.docStoragePath && onDownload && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs opacity-60 hover:opacity-100"
              onClick={() => onDownload(event.docStoragePath!)}
            >
              <Download className="size-3" />
            </Button>
          )}
          {hasBody && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs opacity-60 hover:opacity-100"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {hasBody && expanded && (
        <div className="mt-2 pt-2 border-t border-current/10">
          <p className="whitespace-pre-wrap text-sm leading-relaxed opacity-80">
            {event.body}
          </p>
          {event.kind === "tribune_letter" && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-xs opacity-60 hover:opacity-100 -ml-1"
              onClick={() => {
                navigator.clipboard.writeText(event.body!);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="size-3 mr-1" /> Copy text
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Round Group ──────────────────────────────────────────────────────────────

export function RoundGroup({
  round,
  isActive,
  onDownload,
}: {
  round: Round;
  isActive: boolean;
  onDownload: (path: string) => void;
}) {
  const [open, setOpen] = useState(isActive);

  const hasTribuneLetter = round.events.some((e) => e.kind === "tribune_letter");
  const hasLandlordReply = round.events.some((e) => e.kind === "landlord_reply");
  const letterSent = round.events.some((e) => e.kind === "letter_sent");

  let summary = "";
  if (round.number === 0) {
    summary = `${round.events.length} setup event${round.events.length !== 1 ? "s" : ""}`;
  } else {
    const parts: string[] = [];
    if (hasTribuneLetter) parts.push("letter drafted");
    if (letterSent) parts.push("sent to landlord");
    if (hasLandlordReply) parts.push("landlord replied");
    summary = parts.join(" · ") || `${round.events.length} event${round.events.length !== 1 ? "s" : ""}`;
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-2 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground/30"}`}
          />
          <div>
            <p className="text-sm font-medium">{round.label}</p>
            <p className="text-xs text-muted-foreground">{summary}</p>
          </div>
        </div>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="p-3 space-y-2">
          {round.events.map((ev) => (
            <EventCard key={ev.id} event={ev} onDownload={onDownload} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Evidence Center ──────────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  lease: "Lease",
  photo_move_in: "Move-In Photos",
  photo_move_out: "Move-Out Photos",
  photo: "Photos", // legacy — cases before the split
  landlord_correspondence: "Landlord Correspondence",
  deduction_itemization: "Deduction Itemization",
  other: "Other Documents",
};

const KIND_ORDER = [
  "lease",
  "photo_move_in",
  "photo_move_out",
  "photo",
  "landlord_correspondence",
  "deduction_itemization",
  "other",
];

export function EvidenceCenter({
  documents,
  onUpload,
  onDownload,
}: {
  documents: CaseDocument[];
  onUpload: (kind: string, file: File) => Promise<void>;
  onDownload: (path: string) => void;
}) {
  const [uploadKind, setUploadKind] = useState("photo_move_out");
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(uploadKind, file);
    setUploading(false);
    e.target.value = "";
  }

  const grouped = KIND_ORDER.reduce<Record<string, CaseDocument[]>>((acc, kind) => {
    acc[kind] = documents.filter((d) => d.kind === kind);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={uploadKind} onValueChange={setUploadKind}>
          <SelectTrigger className="sm:w-[220px] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_ORDER.filter((k) => k !== "photo").map((k) => (
              <SelectItem key={k} value={k}>
                {KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-dashed cursor-pointer text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors flex-1">
          <Upload className="size-4" />
          {uploading ? "Uploading…" : "Choose file"}
          <input
            type="file"
            onChange={handleFile}
            disabled={uploading}
            className="sr-only"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </label>
      </div>

      {KIND_ORDER.map((kind) => {
        const docs = grouped[kind];
        if (docs.length === 0) return null;
        return (
          <div key={kind}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {KIND_LABELS[kind]}
            </p>
            <div className="space-y-1.5">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(doc.storage_path)}
                    className="shrink-0 h-7"
                  >
                    <Download className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No documents uploaded yet.</p>
      )}
    </div>
  );
}

// ─── Action Banner ────────────────────────────────────────────────────────────

type ActionVariant = "required" | "waiting" | "done" | "info";

interface ActionBannerProps {
  variant: ActionVariant;
  title: string;
  description: string;
  cta?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
}

export function ActionBanner({
  variant,
  title,
  description,
  cta,
}: ActionBannerProps) {
  const styles: Record<ActionVariant, string> = {
    required: "border-destructive/30 bg-destructive/5",
    waiting: "border-border bg-muted/40",
    done: "border-primary/20 bg-primary/5",
    info: "border-border bg-muted/40",
  };

  const icons: Record<ActionVariant, React.ReactNode> = {
    required: <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />,
    waiting: <Hourglass className="size-4 text-muted-foreground shrink-0 mt-0.5" />,
    done: <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />,
    info: <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />,
  };

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${styles[variant]}`}>
      {icons[variant]}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        {cta && (
          <Button
            size="sm"
            className="mt-3"
            onClick={cta.onClick}
            disabled={cta.disabled || cta.loading}
          >
            {cta.loading ? "Working…" : cta.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Landlord Next Step ────────────────────────────────────────────────────────
// Shown when status is awaiting_landlord or letter_sent.
// Two modes: submit landlord's reply text, or report a refund (full or partial).

export function LandlordNextStep({
  caseData,
  onSubmitResponse,
  onReportRecovery,
}: {
  caseData: Case;
  onSubmitResponse: (text: string) => Promise<void>;
  onReportRecovery: (amountCents: number, notes: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<null | "reply" | "refund">(null);
  const [refundMode, setRefundMode] = useState<null | "full" | "partial">(null);
  const [text, setText] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReply() {
    if (!text.trim()) return;
    setSubmitting(true);
    await onSubmitResponse(text.trim());
    setSubmitting(false);
    setText("");
    setMode(null);
  }

  async function submitFullRefund() {
    setSubmitting(true);
    await onReportRecovery(caseData.amount_withheld_cents, "Landlord returned full deposit");
    setSubmitting(false);
  }

  async function submitPartialRefund() {
    const cents = Math.round(parseFloat(partialAmount || "0") * 100);
    if (isNaN(cents) || cents <= 0) return;
    setSubmitting(true);
    await onReportRecovery(cents, notes);
    setSubmitting(false);
  }

  const partialCents = Math.round(parseFloat(partialAmount || "0") * 100);
  const tribFee = Math.round((partialCents * caseData.contingency_pct) / 100);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-amber-800 shrink-0" />
        <p className="text-sm font-semibold text-amber-900">
          Has your landlord done anything?
        </p>
      </div>

      {mode === null && (
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => setMode("reply")}
            className="flex flex-col gap-1.5 p-3 rounded-lg border bg-white hover:bg-muted/30 text-left transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="size-3.5 text-muted-foreground" />
              They sent a written reply
            </div>
            <p className="text-xs text-muted-foreground">
              Paste their email, letter, or text. Tribune will review and prepare your next step.
            </p>
          </button>
          <button
            onClick={() => setMode("refund")}
            className="flex flex-col gap-1.5 p-3 rounded-lg border border-green-200 bg-white hover:bg-green-50 text-left transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-green-800">
              <Handshake className="size-3.5" />
              They returned my deposit
            </div>
            <p className="text-xs text-muted-foreground">
              Full or partial. Report the amount to close your case.
            </p>
          </button>
        </div>
      )}

      {mode === "reply" && (
        <div className="space-y-3">
          <button
            onClick={() => setMode(null)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronRight className="size-3 rotate-180" /> Back
          </button>
          <p className="text-sm text-muted-foreground">
            Paste the full text of any email, letter, or text message from your landlord.
            Tribune will review it and prepare a recommended response.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Paste your landlord's response here…"
            className="rounded-lg bg-white"
          />
          <Button onClick={submitReply} disabled={submitting || !text.trim()} size="sm">
            {submitting ? "Submitting…" : "Submit Response"}
          </Button>
        </div>
      )}

      {mode === "refund" && refundMode === null && (
        <div className="space-y-3">
          <button
            onClick={() => setMode(null)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronRight className="size-3 rotate-180" /> Back
          </button>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={submitFullRefund}
              disabled={submitting}
              className="flex flex-col gap-1.5 p-3 rounded-lg border border-green-300 bg-green-50 hover:bg-green-100 text-left transition-colors disabled:opacity-60"
            >
              <span className="text-sm font-semibold text-green-900">Full refund</span>
              <span className="text-xs font-medium text-green-800">
                {formatCents(caseData.amount_withheld_cents)} returned
              </span>
              <span className="text-xs text-muted-foreground">
                Landlord returned the full withheld amount. Closes the case immediately.
              </span>
            </button>
            <button
              onClick={() => setRefundMode("partial")}
              className="flex flex-col gap-1.5 p-3 rounded-lg border bg-white hover:bg-muted/30 text-left transition-colors"
            >
              <span className="text-sm font-medium">Partial refund</span>
              <span className="text-xs text-muted-foreground">
                Landlord returned less than the full withheld amount. Enter the exact amount.
              </span>
            </button>
          </div>
        </div>
      )}

      {mode === "refund" && refundMode === "partial" && (
        <div className="space-y-3">
          <button
            onClick={() => setRefundMode(null)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronRight className="size-3 rotate-180" /> Back
          </button>
          <div className="space-y-1.5">
            <Label htmlFor="partial_amount">Amount recovered from withheld deposit ($)</Label>
            <Input
              id="partial_amount"
              type="number"
              step="0.01"
              min="0"
              max={(caseData.amount_withheld_cents / 100).toFixed(2)}
              placeholder={`Max ${formatCents(caseData.amount_withheld_cents)}`}
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              className="bg-white"
            />
          </div>
          {partialCents > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tribune fee ({CONTINGENCY_PCT}%)</span>
                <span className="font-medium">{formatCents(tribFee)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                <span>Your net recovery</span>
                <span>{formatCents(partialCents - tribFee)}</span>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="partial_notes">Notes (optional)</Label>
            <Textarea
              id="partial_notes"
              rows={2}
              placeholder="e.g., Received check Apr 15, partial return only"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white"
            />
          </div>
          <Button
            onClick={submitPartialRefund}
            disabled={submitting || partialCents <= 0}
            className="w-full"
          >
            {submitting ? "Saving…" : "Report Recovery & Close Case"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Landlord Response Form ───────────────────────────────────────────────────

export function LandlordResponseForm({
  onSubmit,
}: {
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    await onSubmit(text.trim());
    setText("");
    setSubmitting(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Paste the full text of any email, letter, or text message from your landlord.
        Tribune will review it and prepare a recommended response.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Paste your landlord's response here…"
        className="rounded-lg"
      />
      <Button onClick={handleSubmit} disabled={submitting || !text.trim()} size="sm">
        {submitting ? "Submitting…" : "Submit Response"}
      </Button>
    </div>
  );
}

// ─── Recovery Form ────────────────────────────────────────────────────────────

export function RecoveryForm({
  caseData,
  onSubmit,
}: {
  caseData: Case;
  onSubmit: (amountCents: number, notes: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const originalReturnedCents =
    caseData.deposit_amount_cents - caseData.amount_withheld_cents;
  const tribFee = Math.round(
    (amountCents * caseData.contingency_pct) / 100
  );

  async function handleSubmit() {
    if (isNaN(amountCents) || amountCents < 0) return;
    setSubmitting(true);
    await onSubmit(amountCents, notes);
    setSubmitting(false);
  }

  // If already resolved, show the outcome instead
  const resolvedRecovery = Math.max(
    0,
    caseData.deposit_returned_cents - originalReturnedCents
  );
  if (caseData.status === "resolved" && resolvedRecovery > 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-green-900 flex items-center gap-2">
            <Handshake className="size-4" /> Case Resolved
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-green-800/60 text-xs">Amount recovered</p>
              <p className="font-bold text-green-900">{formatCents(resolvedRecovery)}</p>
            </div>
            <div>
              <p className="text-green-800/60 text-xs">Tribune fee ({CONTINGENCY_PCT}%)</p>
              <p className="font-bold text-green-900">
                {formatCents(Math.round((resolvedRecovery * caseData.contingency_pct) / 100))}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-green-800/60 text-xs">Your net recovery</p>
              <p className="font-bold text-green-900 text-base">
                {formatCents(
                  resolvedRecovery -
                    Math.round((resolvedRecovery * caseData.contingency_pct) / 100)
                )}
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Tribune will be in touch regarding fee payment. Thank you for using Tribune.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Report how much your landlord returned. This closes your case and calculates
        Tribune&apos;s fee.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="recovery_amount">Amount recovered from withheld deposit ($)</Label>
        <Input
          id="recovery_amount"
          type="number"
          step="0.01"
          min="0"
          max={(caseData.amount_withheld_cents / 100).toFixed(2)}
          placeholder={`Max ${formatCents(caseData.amount_withheld_cents)}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Enter only the amount from the withheld portion (not the part already returned).
        </p>
      </div>
      {amountCents > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tribune fee ({CONTINGENCY_PCT}%)</span>
            <span className="font-medium">{formatCents(tribFee)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
            <span>Your net recovery</span>
            <span>{formatCents(amountCents - tribFee)}</span>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="recovery_notes">Notes (optional)</Label>
        <Textarea
          id="recovery_notes"
          rows={2}
          placeholder="e.g., Landlord sent check on Apr 15, partial refund for deposit only"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={submitting || amountCents < 0}
        className="w-full"
      >
        {submitting ? "Saving…" : "Report Recovery & Close Case"}
      </Button>
    </div>
  );
}
