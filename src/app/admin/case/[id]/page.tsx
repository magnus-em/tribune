"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format, differenceInDays } from "date-fns";
import {
  type Case,
  type CaseMessage,
  type CaseAction,
  type CaseStatus,
  type Profile,
  STATUS_LABELS,
} from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getDocumentUrl } from "@/app/dashboard/case/[id]/actions";
import {
  postLetterWithNotification,
  postUpdateWithNotification,
  changeStatus,
  postNote,
  markInvoicePaid,
} from "./actions";
import type { InvoiceData } from "@/app/dashboard/case/[id]/_components";
import { statusColor, formatCents } from "@/lib/utils/case";
import {
  FileText,
  AlertTriangle,
  Mail,
  StickyNote,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Scale,
  Send,
  MessageSquare,
  Clock,
  CheckCheck,
  Handshake,
  Zap,
  User,
  Phone,
  AtSign,
  MapPin,
  X,
  Circle,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import {
  buildEventStream,
  groupIntoRounds,
  StageRail,
  EvidenceCenter,
  type CaseDocument,
  type Round,
  type CaseEvent,
} from "@/app/dashboard/case/[id]/_components";
import {
  generateDemandLetter,
  type LetterData,
} from "@/lib/letters/templates";

// ─── Admin Event Card ─────────────────────────────────────────────────────────

const EVENT_STYLES: Record<string, { label: string; colorClass: string; icon: React.ReactNode }> = {
  tribune_letter:  { label: "Tribune letter",  colorClass: "bg-blue-50 border-blue-200",   icon: <Scale className="size-3.5" /> },
  tribune_update:  { label: "Tribune update",  colorClass: "bg-blue-50 border-blue-200",   icon: <MessageSquare className="size-3.5" /> },
  landlord_reply:  { label: "Landlord reply",  colorClass: "bg-orange-50 border-orange-200", icon: <MessageSquare className="size-3.5" /> },
  letter_sent:     { label: "Sent to landlord", colorClass: "bg-purple-50 border-purple-200", icon: <Send className="size-3.5" /> },
  document_upload: { label: "Document",        colorClass: "bg-muted border-border",        icon: <FileText className="size-3.5" /> },
  resolution:      { label: "Recovery",        colorClass: "bg-green-50 border-green-200",  icon: <Handshake className="size-3.5" /> },
  system:          { label: "System",          colorClass: "bg-muted border-border",        icon: <Clock className="size-3.5" /> },
};

function AdminEventCard({
  event,
  adminOnly,
}: {
  event: CaseEvent;
  adminOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(event.kind !== "tribune_letter");
  const style = EVENT_STYLES[event.kind] ?? EVENT_STYLES.system;

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${style.colorClass} ${
        adminOnly ? "border-dashed border-yellow-400 bg-yellow-50/60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="opacity-60 shrink-0">{style.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
                {adminOnly ? "Internal note" : style.label}
              </span>
              {adminOnly && (
                <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1 rounded font-medium">
                  Admin only
                </span>
              )}
              <span className="text-[11px] opacity-40">
                {format(new Date(event.date), "MMM d 'at' h:mm a")}
              </span>
            </div>
            <p className="font-medium leading-snug mt-0.5">{event.title}</p>
          </div>
        </div>
        {event.body?.trim() && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 shrink-0 opacity-50 hover:opacity-100"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </Button>
        )}
      </div>
      {event.body?.trim() && expanded && (
        <div className="mt-2 pt-2 border-t border-current/10">
          <p className="whitespace-pre-wrap text-sm leading-relaxed opacity-80">{event.body}</p>
          {event.kind === "tribune_letter" && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-7 text-xs -ml-1 opacity-60 hover:opacity-100"
              onClick={() => { navigator.clipboard.writeText(event.body!); toast.success("Copied"); }}
            >
              <Copy className="size-3 mr-1" /> Copy
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Admin Round Group ────────────────────────────────────────────────────────

function AdminRoundGroup({
  round,
  isActive,
  allMessages,
}: {
  round: Round;
  isActive: boolean;
  allMessages: CaseMessage[];
}) {
  const [open, setOpen] = useState(isActive);

  // Match events back to messages to get is_admin_only
  function isAdminOnly(eventId: string): boolean {
    return allMessages.find((m) => m.id === eventId)?.is_admin_only ?? false;
  }

  const hasTribuneLetter = round.events.some((e) => e.kind === "tribune_letter");
  const hasLandlordReply = round.events.some((e) => e.kind === "landlord_reply");
  const letterSent = round.events.some((e) => e.kind === "letter_sent");

  const parts: string[] = [];
  if (hasTribuneLetter) parts.push("letter drafted");
  if (letterSent) parts.push("sent");
  if (hasLandlordReply) parts.push("landlord replied");
  const summary = parts.join(" · ") || `${round.events.length} event${round.events.length !== 1 ? "s" : ""}`;

  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`size-2 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground/30"}`} />
          <div>
            <p className="text-sm font-medium">{round.label}</p>
            <p className="text-xs text-muted-foreground">{summary}</p>
          </div>
        </div>
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="p-3 space-y-2">
          {round.events.map((ev) => (
            <AdminEventCard
              key={ev.id}
              event={ev}
              adminOnly={isAdminOnly(ev.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contacts Panel ───────────────────────────────────────────────────────────

function ContactsPanel({ caseData, profile }: { caseData: Case; profile: Profile | null }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parties</p>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tenant</p>
        {profile?.full_name && (
          <div className="flex items-center gap-2">
            <User className="size-3.5 text-muted-foreground shrink-0" />
            <span>{profile.full_name}</span>
          </div>
        )}
        {profile?.email && (
          <div className="flex items-center gap-2">
            <AtSign className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{profile.email}</span>
          </div>
        )}
        {profile?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{profile.phone}</span>
          </div>
        )}
        {caseData.forwarding_address && (
          <div className="flex items-start gap-2">
            <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{caseData.forwarding_address}</span>
          </div>
        )}
      </div>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Landlord</p>
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{caseData.landlord_name}</span>
        </div>
        {caseData.landlord_email && (
          <div className="flex items-center gap-2">
            <AtSign className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{caseData.landlord_email}</span>
          </div>
        )}
        {caseData.landlord_phone && (
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{caseData.landlord_phone}</span>
          </div>
        )}
        {caseData.landlord_address && (
          <div className="flex items-start gap-2">
            <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{caseData.landlord_address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Case Assessment Panel ────────────────────────────────────────────────────

function CaseAssessmentPanel({
  caseData,
  documents,
  daysOverdue,
}: {
  caseData: Case;
  documents: CaseDocument[];
  daysOverdue: number;
}) {
  const hasLease = documents.some((d) => d.kind === "lease");
  const hasPhotos = documents.some((d) => d.kind === "photo");
  const hasLandlordContact = !!(caseData.landlord_email || caseData.landlord_phone);
  const exposure = caseData.deposit_amount_cents * 2;

  const items = [
    { label: "Lease on file", done: hasLease, required: true },
    { label: "Photos uploaded", done: hasPhotos, required: false },
    { label: "Landlord contact", done: hasLandlordContact, required: true },
    { label: "Itemized deductions received", done: caseData.itemized_deductions_received, required: false },
  ];

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Case Assessment</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <p className="text-xs text-muted-foreground">Statutory exposure</p>
          <p className="font-bold text-destructive">{formatCents(exposure)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Deadline</p>
          <p className={`font-bold ${daysOverdue > 0 ? "text-destructive" : ""}`}>
            {daysOverdue > 0 ? `${daysOverdue}d overdue` : `${Math.abs(daysOverdue)}d left`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Letter</p>
          <p className="font-bold">#{caseData.current_letter_number || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Withholding reason</p>
          <p className="font-medium truncate">{caseData.withholding_reason || "Not stated"}</p>
        </div>
      </div>
      <Separator />
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.done ? (
              <CheckCheck className="size-3.5 text-primary shrink-0" />
            ) : item.required ? (
              <X className="size-3.5 text-destructive shrink-0" />
            ) : (
              <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />
            )}
            <span className={`text-xs ${item.done ? "" : item.required ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin action banner ──────────────────────────────────────────────────────

function AdminActionBanner({
  status,
  daysOverdue,
  hasLease,
  hasLandlordReply,
}: {
  status: CaseStatus;
  daysOverdue: number;
  hasLease: boolean;
  hasLandlordReply: boolean;
}) {
  type Variant = "required" | "waiting" | "done" | "info";
  const configs: Record<string, { variant: Variant; title: string; description: string }> = {
    intake_submitted: {
      variant: hasLease ? "required" : "required",
      title: hasLease ? "Ready to draft — generate Letter 1" : "Waiting for lease upload before drafting",
      description: hasLease
        ? "Tenant has uploaded their lease. Review the situation and generate Letter 1 below."
        : "The tenant hasn't uploaded their lease yet. Post a guidance note asking them to upload it.",
    },
    under_review: {
      variant: "required",
      title: "Under review — draft Letter 1 when ready",
      description: "Review the tenant's situation description and uploaded documents, then generate and post Letter 1.",
    },
    letter_ready: {
      variant: "waiting",
      title: "Waiting for tenant to send letter",
      description: "Letter has been posted. Tenant needs to send it to their landlord and confirm.",
    },
    letter_sent: {
      variant: "waiting",
      title: "Letter sent — monitoring for landlord response",
      description: daysOverdue > 0
        ? `Landlord is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} past the statutory deadline. Tenant is waiting for their reply.`
        : "Waiting for landlord to respond. Tenant will upload the reply when received.",
    },
    awaiting_landlord: {
      variant: daysOverdue > 0 ? "required" : "waiting",
      title: daysOverdue > 0
        ? `Landlord ${daysOverdue}d overdue — consider escalating`
        : "Waiting for landlord response",
      description: daysOverdue > 0
        ? "Landlord has not responded past the statutory deadline. Consider posting a follow-up or preparing Letter 2."
        : "Tenant is waiting for landlord reply.",
    },
    landlord_responded: {
      variant: "required",
      title: hasLandlordReply ? "Landlord replied — review and draft response" : "Landlord responded — review case",
      description: "Read the landlord's reply below, assess their position, then draft and post the appropriate response (Letter 2 or guidance).",
    },
    resolved: { variant: "done", title: "Case resolved", description: "Tenant has reported recovery. Confirm the outcome and close." },
    closed:   { variant: "info", title: "Case closed",   description: "This case is closed." },
  };

  const cfg = configs[status] ?? { variant: "info" as Variant, title: "Case in progress", description: "" };

  const bg: Record<Variant, string> = {
    required: "border-destructive/30 bg-destructive/5",
    waiting:  "border-border bg-muted/40",
    done:     "border-primary/20 bg-primary/5",
    info:     "border-border bg-muted/40",
  };
  const icons: Record<Variant, React.ReactNode> = {
    required: <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />,
    waiting:  <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />,
    done:     <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />,
    info:     <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />,
  };

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${bg[cfg.variant]}`}>
      {icons[cfg.variant]}
      <div>
        <p className="font-semibold text-sm">{cfg.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{cfg.description}</p>
      </div>
    </div>
  );
}

// ─── Admin Write Panel ────────────────────────────────────────────────────────

function AdminWritePanel({
  caseData,
  profile,
  messages,
  onPosted,
}: {
  caseData: Case;
  profile: Profile | null;
  messages: CaseMessage[];
  onPosted: () => void;
}) {
  const [letterTitle, setLetterTitle] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [letterNum, setLetterNum] = useState("1");
  const [postingLetter, setPostingLetter] = useState(false);

  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteAdminOnly, setNoteAdminOnly] = useState(true);
  const [postingNote, setPostingNote] = useState(false);

  function buildLetterData(): LetterData | null {
    if (!profile) return null;
    const deadline = new Date(caseData.statutory_deadline);
    const daysOverdue = Math.max(0, differenceInDays(new Date(), deadline));
    return {
      tenantName: profile.full_name,
      tenantAddress: caseData.forwarding_address ?? "",
      tenantPhone: profile.phone ?? undefined,
      tenantEmail: profile.email,
      landlordName: caseData.landlord_name,
      landlordAddress: caseData.landlord_address ?? undefined,
      propertyAddress: caseData.property_address,
      unitNumber: caseData.unit_number ?? undefined,
      leaseStartDate: caseData.lease_start_date,
      leaseEndDate: caseData.lease_end_date,
      moveOutDate: caseData.move_out_date,
      depositAmountCents: caseData.deposit_amount_cents,
      amountWithheldCents: caseData.amount_withheld_cents,
      depositReturnedCents: caseData.deposit_returned_cents,
      statutoryDeadline: caseData.statutory_deadline,
      daysOverdue,
      itemizedDeductionsReceived: caseData.itemized_deductions_received,
      situationDescription: caseData.situation_description,
      withholding_reason: caseData.withholding_reason ?? undefined,
    };
  }

  function handleGenerateTemplate() {
    const data = buildLetterData();
    if (!data) { toast.error("Tenant profile not loaded"); return; }
    const num = parseInt(letterNum);
    try {
      // Find prior letter dates for Letter 2 / 3
      const priorLetters = messages
        .filter((m) => m.message_type === "tribune_letter")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const generated = generateDemandLetter(num, data, {
        letter1: priorLetters[0]?.created_at,
        letter2: priorLetters[1]?.created_at,
      });
      setLetterBody(generated);
      if (!letterTitle) setLetterTitle(`Demand Letter ${num} — ${caseData.property_address}`);
      toast.success("Template generated — review before posting");
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handlePostLetter() {
    if (!letterTitle.trim() || !letterBody.trim()) return;
    setPostingLetter(true);
    const r = await postLetterWithNotification({ caseId: caseData.id, title: letterTitle, body: letterBody, letterNumber: parseInt(letterNum) });
    if (r.error) toast.error(r.error);
    else { toast.success("Letter posted"); setLetterTitle(""); setLetterBody(""); onPosted(); }
    setPostingLetter(false);
  }

  async function handlePostUpdate() {
    if (!updateTitle.trim() || !updateBody.trim()) return;
    setPostingUpdate(true);
    const r = await postUpdateWithNotification({ caseId: caseData.id, title: updateTitle, body: updateBody });
    if (r.error) toast.error(r.error);
    else { toast.success("Update posted"); setUpdateTitle(""); setUpdateBody(""); onPosted(); }
    setPostingUpdate(false);
  }

  async function handlePostNote() {
    if (!noteTitle.trim()) return;
    setPostingNote(true);
    const r = await postNote(caseData.id, noteTitle, noteBody, noteAdminOnly);
    if (r.error) toast.error(r.error);
    else { toast.success(noteAdminOnly ? "Internal note added" : "Note posted"); setNoteTitle(""); setNoteBody(""); onPosted(); }
    setPostingNote(false);
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2">
        <Zap className="size-4 text-primary" />
        <p className="text-sm font-semibold">Admin Actions</p>
      </div>
      <div className="p-4">
        <Tabs defaultValue="letter">
          <TabsList className="grid w-full grid-cols-3 h-8 mb-4">
            <TabsTrigger value="letter" className="text-xs gap-1"><Mail className="size-3" /> Letter</TabsTrigger>
            <TabsTrigger value="update" className="text-xs gap-1"><MessageSquare className="size-3" /> Update</TabsTrigger>
            <TabsTrigger value="note"   className="text-xs gap-1"><StickyNote className="size-3" /> Note</TabsTrigger>
          </TabsList>

          {/* Letter */}
          <TabsContent value="letter" className="space-y-3 mt-0">
            <p className="text-xs text-muted-foreground">Post a demand letter. Use &ldquo;Generate from template&rdquo; to auto-fill from case data, then edit before posting.</p>
            <div className="flex gap-3">
              <div>
                <Label className="text-xs">Letter #</Label>
                <Select value={letterNum} onValueChange={setLetterNum}>
                  <SelectTrigger className="w-20 rounded-lg h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Title</Label>
                <Input value={letterTitle} onChange={(e) => setLetterTitle(e.target.value)} placeholder="e.g., Demand Letter #1" className="rounded-lg h-8 text-xs" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Letter Body</Label>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2 gap-1" onClick={handleGenerateTemplate}>
                  <Zap className="size-3" /> Generate from template
                </Button>
              </div>
              <Textarea value={letterBody} onChange={(e) => setLetterBody(e.target.value)} rows={10} placeholder="Paste or generate letter content…" className="rounded-lg font-mono text-xs" />
            </div>
            <Button onClick={handlePostLetter} disabled={!letterTitle.trim() || !letterBody.trim() || postingLetter} size="sm">
              {postingLetter ? "Posting…" : "Post Letter"}
            </Button>
          </TabsContent>

          {/* Update */}
          <TabsContent value="update" className="space-y-3 mt-0">
            <p className="text-xs text-muted-foreground">Post a visible update to the tenant. Triggers an email notification.</p>
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} placeholder="e.g., Next steps" className="rounded-lg h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Body</Label>
              <Textarea value={updateBody} onChange={(e) => setUpdateBody(e.target.value)} rows={4} className="rounded-lg text-sm" />
            </div>
            <Button onClick={handlePostUpdate} disabled={!updateTitle.trim() || !updateBody.trim() || postingUpdate} size="sm">
              {postingUpdate ? "Posting…" : "Post Update"}
            </Button>
          </TabsContent>

          {/* Note */}
          <TabsContent value="note" className="space-y-3 mt-0">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" className="rounded-lg h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Body (optional)</Label>
              <Textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} rows={3} className="rounded-lg text-sm" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="admin_only" checked={noteAdminOnly} onCheckedChange={(c) => setNoteAdminOnly(c === true)} />
              <Label htmlFor="admin_only" className="text-xs">Internal note (hidden from tenant)</Label>
            </div>
            <Button onClick={handlePostNote} disabled={!noteTitle.trim() || postingNote} size="sm">
              {postingNote ? "Saving…" : "Add Note"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminCaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [actions, setActions] = useState<CaseAction[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<CaseStatus>("intake_submitted");
  const [savingStatus, setSavingStatus] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: c }, { data: m }, { data: a }, { data: d }, { data: inv }] = await Promise.all([
      supabase.from("cases").select("*").eq("id", caseId).single(),
      supabase.from("case_messages").select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
      supabase.from("case_actions").select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
      supabase.from("case_documents").select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
      supabase.from("invoices").select("id, invoice_number, amount_cents, status, due_date, paid_at, payment_method, created_at").eq("case_id", caseId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setCaseData(c);
    setMessages(m || []);
    setActions(a || []);
    setDocuments(d || []);
    setInvoice(inv ?? null);
    if (c) {
      setNewStatus(c.status);
      // Load profile
      const { data: p } = await supabase.from("profiles").select("*").eq("id", c.tenant_id).single();
      setProfile(p);
    }
    setLoading(false);
  }, [caseId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleChangeStatus() {
    if (!caseData || newStatus === caseData.status) return;
    setSavingStatus(true);
    const r = await changeStatus(caseId, newStatus, caseData.status);
    if (r.error) toast.error(r.error);
    else { toast.success("Status updated"); loadData(); }
    setSavingStatus(false);
  }

  async function handleDownload(storagePath: string) {
    const r = await getDocumentUrl(storagePath);
    if (r.error) toast.error("Failed to download");
    else if (r.url) window.open(r.url, "_blank");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
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

  const deadline = new Date(caseData.statutory_deadline);
  const daysOverdue = differenceInDays(new Date(), deadline);
  const hasLease = documents.some((d) => d.kind === "lease");
  const hasLandlordReply = messages.some((m) => m.message_type === "tenant_landlord_reply");

  // Build event stream — admin sees ALL messages including admin-only
  const events = buildEventStream(messages, actions);
  const rounds = groupIntoRounds(events);
  const activeRoundIdx = rounds.length - 1;

  // Latest landlord reply (for prominent display)
  const latestLandlordReply = [...messages]
    .reverse()
    .find((m) => m.message_type === "tenant_landlord_reply");

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" render={<Link href="/admin" />} className="text-muted-foreground -ml-2">
        <ArrowLeft className="size-4 mr-1" /> All cases
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{caseData.property_address}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profile?.full_name ?? "Tenant"} · Case {caseId.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColor(caseData.status)}>
            {STATUS_LABELS[caseData.status]}
          </Badge>
        </div>
      </div>

      {/* Stage rail */}
      <div className="rounded-xl border bg-card px-4 py-3">
        <StageRail status={caseData.status} />
      </div>

      {/* Admin action banner */}
      <AdminActionBanner
        status={caseData.status}
        daysOverdue={daysOverdue}
        hasLease={hasLease}
        hasLandlordReply={hasLandlordReply}
      />

      {/* Contacts + Assessment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ContactsPanel caseData={caseData} profile={profile} />
        <CaseAssessmentPanel caseData={caseData} documents={documents} daysOverdue={daysOverdue} />
      </div>

      {/* Situation description */}
      <SituationDescription caseData={caseData} />

      {/* Status change */}
      <div className="rounded-xl border bg-card p-4 flex items-end gap-3">
        <div className="flex-1">
          <Label className="text-xs">Change Status</Label>
          <Select value={newStatus} onValueChange={(v) => setNewStatus(v as CaseStatus)}>
            <SelectTrigger className="rounded-lg mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleChangeStatus} disabled={newStatus === caseData.status || savingStatus} size="sm">
          {savingStatus ? "Saving…" : "Update"}
        </Button>
      </div>

      {/* Landlord reply spotlight */}
      {caseData.status === "landlord_responded" && latestLandlordReply && (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-orange-700">
              Latest Landlord Reply — Review Required
            </h2>
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Landlord response</span>
                <span className="text-xs text-orange-600/70">
                  {format(new Date(latestLandlordReply.created_at), "MMM d 'at' h:mm a")}
                </span>
              </div>
              <p className="font-medium text-sm">{latestLandlordReply.title}</p>
              <p className="text-sm whitespace-pre-wrap text-orange-900/80 leading-relaxed">
                {latestLandlordReply.body}
              </p>
            </div>
          </section>
        </>
      )}

      {/* Correspondence rounds */}
      {rounds.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Case Activity
            </h2>
            {rounds.map((round, idx) => (
              <AdminRoundGroup
                key={round.number}
                round={round}
                isActive={idx === activeRoundIdx}
                allMessages={messages}
              />
            ))}
          </section>
        </>
      )}

      {/* Evidence */}
      <Separator />
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Evidence &amp; Documents
        </h2>
        <EvidenceCenter
          documents={documents}
          onUpload={async () => {}}
          onDownload={handleDownload}
        />
      </section>

      {/* Invoice */}
      {invoice && (
        <>
          <Separator />
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tribune Fee Invoice
            </h2>
            <AdminInvoicePanel invoice={invoice} onUpdated={loadData} />
          </section>
        </>
      )}

      {/* Admin write panel */}
      <Separator />
      <AdminWritePanel
        caseData={caseData}
        profile={profile}
        messages={messages}
        onPosted={loadData}
      />
    </div>
  );
}

// ─── Admin Invoice Panel ──────────────────────────────────────────────────────

function AdminInvoicePanel({
  invoice,
  onUpdated,
}: {
  invoice: InvoiceData;
  onUpdated: () => void;
}) {
  const [method, setMethod] = useState<"venmo" | "zelle" | "stripe" | "waived">("venmo");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const isPaid = invoice.status === "paid" || invoice.status === "waived";

  async function handleMarkPaid() {
    setSaving(true);
    const r = await markInvoicePaid(invoice.id, method, reference);
    if (r.error) toast.error(r.error);
    else { toast.success("Invoice marked as paid"); onUpdated(); }
    setSaving(false);
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-muted-foreground" />
          <div>
            <p className="font-semibold">{invoice.invoice_number}</p>
            <p className="text-xs text-muted-foreground">
              Due {format(new Date(invoice.due_date + "T00:00:00"), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCents(invoice.amount_cents)}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPaid
              ? "bg-green-100 text-green-800"
              : invoice.status === "overdue"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
          }`}>
            {invoice.status}
          </span>
        </div>
      </div>

      {invoice.payment_method && isPaid && (
        <p className="text-xs text-muted-foreground">
          Paid via {invoice.payment_method}
          {invoice.paid_at ? ` on ${format(new Date(invoice.paid_at), "MMM d, yyyy")}` : ""}
        </p>
      )}

      {!isPaid && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mark as Paid</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Payment method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                  <SelectTrigger className="h-8 rounded-lg mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Reference / confirmation</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Optional"
                  className="h-8 rounded-lg mt-1 text-xs"
                />
              </div>
            </div>
            <Button size="sm" onClick={handleMarkPaid} disabled={saving}>
              {saving ? "Saving…" : "Mark Paid"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Situation description (collapsible) ─────────────────────────────────────

function SituationDescription({ caseData }: { caseData: Case }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <p className="text-sm font-medium">Tenant&apos;s situation description</p>
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-sm">
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {caseData.situation_description}
          </p>
          {caseData.withholding_reason && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Stated reason for withholding</p>
              <p className="text-muted-foreground">{caseData.withholding_reason}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-muted-foreground border-t">
            <span>Lease: {format(new Date(caseData.lease_start_date), "MMM d, yyyy")} – {format(new Date(caseData.lease_end_date), "MMM d, yyyy")}</span>
            <span>Move-out: {format(new Date(caseData.move_out_date), "MMM d, yyyy")}</span>
            <span>Itemized deductions: {caseData.itemized_deductions_received ? "Yes" : "No"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
