"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format, differenceInDays } from "date-fns";
import {
  type Case,
  type CaseMessage,
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
} from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { uploadDocument, getDocumentUrl } from "./actions";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { statusColor, formatCents } from "@/lib/utils/case";
import {
  FileText,
  Download,
  Upload,
  Send,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Copy,
} from "lucide-react";
import Link from "next/link";

function nextAction(status: string): string {
  switch (status) {
    case "intake_submitted":
    case "under_review":
      return "We're reviewing your case. You'll be notified when your demand letter is ready.";
    case "letter_ready":
      return "Your demand letter is ready. Review it below, then send it to your landlord.";
    case "letter_sent":
    case "awaiting_landlord":
      return "Waiting for your landlord to respond. Submit their response below when you receive it.";
    case "landlord_responded":
      return "We're reviewing your landlord's response and preparing next steps.";
    case "resolved":
      return "Your case has been resolved.";
    case "closed":
      return "This case is closed.";
    default:
      return "";
  }
}

function MessageBubble({ message }: { message: CaseMessage }) {
  const isTribune =
    message.message_type === "tribune_letter" ||
    message.message_type === "tribune_update" ||
    message.message_type === "system";

  const [expanded, setExpanded] = useState(
    message.message_type !== "tribune_letter"
  );

  return (
    <div className={`flex ${isTribune ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-xl p-4 ${
          isTribune
            ? "bg-muted/60 border"
            : "bg-foreground text-background"
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
            {isTribune ? "Tribune" : "You"}
          </span>
          <span className="text-[11px] opacity-40">
            {format(new Date(message.created_at), "MMM d 'at' h:mm a")}
          </span>
        </div>
        <p className="font-medium text-sm">{message.title}</p>

        {message.message_type === "tribune_letter" && !expanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="mt-1 text-xs h-7"
          >
            View full letter
          </Button>
        ) : (
          <p className="text-sm whitespace-pre-wrap mt-1 opacity-90 leading-relaxed">
            {message.body}
          </p>
        )}

        {message.message_type === "tribune_letter" && expanded && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs h-7"
            onClick={() => {
              navigator.clipboard.writeText(message.body);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="size-3 mr-1" /> Copy text
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingSent, setConfirmingSent] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadKind, setUploadKind] = useState<string>("lease");

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: caseResult }, { data: messagesResult }, { data: docs }] =
      await Promise.all([
        supabase.from("cases").select("*").eq("id", caseId).single(),
        supabase
          .from("case_messages")
          .select("*")
          .eq("case_id", caseId)
          .eq("is_admin_only", false)
          .order("created_at", { ascending: true }),
        supabase
          .from("case_documents")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false }),
      ]);
    setCaseData(caseResult);
    setMessages(messagesResult || []);
    setDocuments(docs || []);
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function submitLandlordResponse() {
    if (!responseText.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("case_messages").insert({
      case_id: caseId,
      message_type: "tenant_landlord_reply",
      title: "Landlord's response",
      body: responseText.trim(),
      created_by: user.id,
    });

    setResponseText("");
    setSubmitting(false);
    toast.success("Response submitted. We'll prepare next steps.");
    loadData();
  }

  async function confirmLetterSent() {
    setConfirmingSent(true);
    const supabase = createClient();
    await supabase.from("case_actions").insert({
      case_id: caseId,
      action_type: "letter_sent",
      metadata: {
        letter_number: caseData?.current_letter_number || 1,
        sent_date: new Date().toISOString(),
      },
    });
    toast.success("Noted. We'll track the landlord's response deadline.");
    setConfirmingSent(false);
    loadData();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", uploadKind);
    const result = await uploadDocument(caseId, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${file.name} uploaded`);
      loadData();
    }
    setUploading(false);
    e.target.value = "";
  }

  async function downloadDocument(storagePath: string) {
    const result = await getDocumentUrl(storagePath);
    if (result.error) {
      toast.error("Failed to download");
    } else if (result.url) {
      window.open(result.url, "_blank");
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-5 w-32" />
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

  const deadline = new Date(caseData.statutory_deadline);
  const daysOverdue = differenceInDays(new Date(), deadline);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
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
            {STATUS_DESCRIPTIONS[caseData.status]}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 ${statusColor(caseData.status)}`}
        >
          {STATUS_LABELS[caseData.status]}
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Deposit", value: formatCents(caseData.deposit_amount_cents) },
          { label: "Withheld", value: formatCents(caseData.amount_withheld_cents) },
          { label: "Deadline", value: format(deadline, "MMM d, yyyy") },
          {
            label: "Status",
            value: daysOverdue > 0 ? `${daysOverdue}d overdue` : `${Math.abs(daysOverdue)}d left`,
            danger: daysOverdue > 0,
          },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border bg-card p-3.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {m.label}
            </p>
            <p className={`text-base font-bold mt-0.5 ${"danger" in m && m.danger ? "text-destructive" : ""}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Next action */}
      <div className="flex items-start gap-2.5 rounded-xl border bg-muted/40 px-4 py-3">
        {daysOverdue > 0 ? (
          <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
        ) : (
          <Clock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        )}
        <p className="text-sm">{nextAction(caseData.status)}</p>
      </div>

      {/* Letter sent CTA */}
      {caseData.status === "letter_ready" && (
        <Button
          onClick={confirmLetterSent}
          disabled={confirmingSent}
          className="w-full rounded-xl h-11"
        >
          <Send className="mr-2 size-4" />
          {confirmingSent ? "Confirming..." : "I sent the letter to my landlord"}
        </Button>
      )}

      <Separator />

      {/* Documents */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Documents
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={uploadKind} onValueChange={setUploadKind}>
            <SelectTrigger className="sm:w-[200px] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lease">Lease</SelectItem>
              <SelectItem value="landlord_correspondence">Landlord Correspondence</SelectItem>
              <SelectItem value="deduction_itemization">Deduction Itemization</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-dashed cursor-pointer text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors flex-1">
            <Upload className="size-4" />
            {uploading ? "Uploading..." : "Choose file"}
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </label>
        </div>

        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {doc.original_filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.kind.replace(/_/g, " ")} &middot;{" "}
                    {format(new Date(doc.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDocument(doc.storage_path)}
                  className="shrink-0"
                >
                  <Download className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Thread */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Case Thread
        </h2>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <FileText className="size-8 mx-auto mb-2 opacity-30" />
            No messages yet. Updates will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </section>

      {/* Submit landlord response */}
      {caseData.status !== "resolved" && caseData.status !== "closed" && (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Submit Landlord&apos;s Response
            </h2>
            <p className="text-sm text-muted-foreground">
              Paste the full text of any email, letter, or text message from
              your landlord.
            </p>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={4}
              placeholder="Paste your landlord's response here..."
              className="rounded-lg"
            />
            <Button
              onClick={submitLandlordResponse}
              disabled={submitting || !responseText.trim()}
              size="sm"
            >
              {submitting ? "Submitting..." : "Submit Response"}
            </Button>
          </section>
        </>
      )}

      <LegalDisclaimer />
    </div>
  );
}
