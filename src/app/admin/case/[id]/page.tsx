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
  STATUS_LABELS,
} from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
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
} from "./actions";
import { statusColor, formatCents } from "@/lib/utils/case";
import {
  Download,
  FileText,
  AlertTriangle,
  MessageSquare,
  Mail,
  StickyNote,
  Activity,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MetricBox({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-base font-bold mt-0.5 ${danger ? "text-destructive" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function DocumentsTab({
  documents,
  onDownload,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: any[];
  onDownload: (path: string) => void;
}) {
  const kinds = [
    "lease",
    "landlord_correspondence",
    "deduction_itemization",
    "photo",
    "other",
  ];

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <FileText className="size-8 mx-auto mb-2 opacity-30" />
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {kinds.map((kind) => {
        const kindDocs = documents.filter((doc) => doc.kind === kind);
        if (kindDocs.length === 0) return null;
        return (
          <div key={kind}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {kind.replace(/_/g, " ")}
            </h4>
            <div className="space-y-1.5">
              {kindDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {doc.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_at), "MMM d, yyyy 'at' h:mm a")}
                      {doc.size_bytes && ` \u00b7 ${(doc.size_bytes / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(doc.storage_path)}
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThreadTab({ messages }: { messages: CaseMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <MessageSquare className="size-8 mx-auto mb-2 opacity-30" />
        No messages yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-lg border p-3 text-sm transition-colors hover:bg-muted/30 ${
            msg.is_admin_only ? "border-dashed border-yellow-300/50 bg-yellow-50/30" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-medium">
              {msg.message_type.replace(/_/g, " ")}
            </Badge>
            {msg.is_admin_only && (
              <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-700 border-yellow-200">
                Internal
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground ml-auto">
              {format(new Date(msg.created_at), "MMM d, h:mm a")}
            </span>
          </div>
          <p className="font-medium">{msg.title}</p>
          {msg.body && (
            <p className="text-muted-foreground whitespace-pre-wrap mt-1 leading-relaxed">
              {msg.body}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function LetterForm({ onPost }: { onPost: (title: string, body: string, num: number) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [num, setNum] = useState("1");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Post a demand letter for the tenant to review and send.
      </p>
      <div className="flex gap-3">
        <div>
          <Label className="text-xs">Letter #</Label>
          <Select value={num} onValueChange={setNum}>
            <SelectTrigger className="w-24 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-xs">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g., Demand Letter #1'
            className="rounded-lg"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Letter Body</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          placeholder="Paste the demand letter content..."
          className="rounded-lg font-mono text-xs"
        />
      </div>
      <Button
        onClick={() => {
          onPost(title, body, parseInt(num));
          setTitle("");
          setBody("");
        }}
        disabled={!title.trim() || !body.trim()}
        size="sm"
      >
        Post Letter
      </Button>
    </div>
  );
}

function UpdateForm({ onPost }: { onPost: (title: string, body: string) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Post a visible update to the tenant.
      </p>
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Next steps" className="rounded-lg" />
      </div>
      <div>
        <Label className="text-xs">Body</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="rounded-lg" />
      </div>
      <Button
        onClick={() => { onPost(title, body); setTitle(""); setBody(""); }}
        disabled={!title.trim() || !body.trim()}
        size="sm"
      >
        Post Update
      </Button>
    </div>
  );
}

function NoteForm({ onPost }: { onPost: (title: string, body: string, adminOnly: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [adminOnly, setAdminOnly] = useState(true);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="rounded-lg" />
      </div>
      <div>
        <Label className="text-xs">Body (optional)</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="rounded-lg" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="admin_only" checked={adminOnly} onCheckedChange={(c) => setAdminOnly(c === true)} />
        <Label htmlFor="admin_only" className="text-xs">Internal note (hidden from tenant)</Label>
      </div>
      <Button
        onClick={() => { onPost(title, body, adminOnly); setTitle(""); setBody(""); }}
        disabled={!title.trim()}
        size="sm"
      >
        Add Note
      </Button>
    </div>
  );
}

function ActionsTab({ actions }: { actions: CaseAction[] }) {
  if (actions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Activity className="size-8 mx-auto mb-2 opacity-30" />
        No tenant actions yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <div key={action.id} className="rounded-lg border p-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {action.action_type.replace(/_/g, " ")}
            </Badge>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {format(new Date(action.created_at), "MMM d, h:mm a")}
            </span>
          </div>
          {action.metadata && Object.keys(action.metadata).length > 0 && (
            <pre className="text-[10px] text-muted-foreground mt-1 font-mono">
              {JSON.stringify(action.metadata, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function AdminCaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [actions, setActions] = useState<CaseAction[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: c }, { data: m }, { data: a }, { data: d }] =
      await Promise.all([
        supabase.from("cases").select("*").eq("id", caseId).single(),
        supabase.from("case_messages").select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
        supabase.from("case_actions").select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
        supabase.from("case_documents").select("*").eq("case_id", caseId).order("created_at", { ascending: false }),
      ]);
    setCaseData(c);
    setMessages(m || []);
    setActions(a || []);
    setDocuments(d || []);
    if (c) setNewStatus(c.status);
    setLoading(false);
  }, [caseId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function changeStatus() {
    if (!newStatus || newStatus === caseData?.status) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("cases").update({ status: newStatus as CaseStatus }).eq("id", caseId);
    await supabase.from("case_messages").insert({
      case_id: caseId,
      message_type: "system",
      title: `Status changed to ${STATUS_LABELS[newStatus as CaseStatus]}`,
      body: `Updated from "${STATUS_LABELS[caseData!.status]}" to "${STATUS_LABELS[newStatus as CaseStatus]}".`,
      created_by: user.id,
    });
    toast.success("Status updated");
    loadData();
  }

  async function handlePostLetter(title: string, body: string, num: number) {
    const r = await postLetterWithNotification({ caseId, title, body, letterNumber: num });
    if (r.error) toast.error(r.error);
    else { toast.success("Letter posted"); loadData(); }
  }

  async function handlePostUpdate(title: string, body: string) {
    const r = await postUpdateWithNotification({ caseId, title, body });
    if (r.error) toast.error(r.error);
    else { toast.success("Update posted"); loadData(); }
  }

  async function handlePostNote(title: string, body: string, adminOnly: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("case_messages").insert({
      case_id: caseId, message_type: "tribune_update", title, body, is_admin_only: adminOnly, created_by: user.id,
    });
    toast.success(adminOnly ? "Internal note added" : "Note posted");
    loadData();
  }

  async function downloadDocument(storagePath: string) {
    const r = await getDocumentUrl(storagePath);
    if (r.error) toast.error("Failed to download");
    else if (r.url) window.open(r.url, "_blank");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
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
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" render={<Link href="/admin" />} className="text-muted-foreground -ml-2">
        <ArrowLeft className="size-4 mr-1" /> Back to cases
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{caseData.property_address}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Case #{caseId.slice(0, 8)}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 ${statusColor(caseData.status)}`}>
          {STATUS_LABELS[caseData.status]}
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricBox label="Deposit" value={formatCents(caseData.deposit_amount_cents)} />
        <MetricBox label="Withheld" value={formatCents(caseData.amount_withheld_cents)} />
        <MetricBox
          label="Deadline"
          value={`${format(deadline, "MMM d")}${daysOverdue > 0 ? ` (+${daysOverdue}d)` : ""}`}
          danger={daysOverdue > 0}
        />
        <MetricBox label="Letter #" value={String(caseData.current_letter_number || "—")} />
      </div>

      {/* Case info card */}
      <Card className="rounded-xl">
        <CardContent className="pt-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Landlord</h4>
              <p className="font-medium">{caseData.landlord_name}</p>
              {caseData.landlord_email && <p className="text-muted-foreground">{caseData.landlord_email}</p>}
              {caseData.landlord_phone && <p className="text-muted-foreground">{caseData.landlord_phone}</p>}
              {caseData.landlord_address && <p className="text-muted-foreground">{caseData.landlord_address}</p>}
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Lease</h4>
              <p>Start: {format(new Date(caseData.lease_start_date), "MMM d, yyyy")}</p>
              <p>End: {format(new Date(caseData.lease_end_date), "MMM d, yyyy")}</p>
              <p>Move-out: {format(new Date(caseData.move_out_date), "MMM d, yyyy")}</p>
              <p>Itemized deductions: {caseData.itemized_deductions_received ? "Yes" : "No"}</p>
            </div>
          </div>

          {caseData.withholding_reason && (
            <>
              <Separator />
              <div className="text-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Withholding Reason</h4>
                <p className="text-muted-foreground">{caseData.withholding_reason}</p>
              </div>
            </>
          )}

          <Separator />
          <div className="text-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tenant Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{caseData.situation_description}</p>
          </div>

          <Separator />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs">Change Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={changeStatus} disabled={newStatus === caseData.status} size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="thread">
        <TabsList className="grid w-full grid-cols-5 h-9">
          <TabsTrigger value="thread" className="text-xs gap-1">
            <MessageSquare className="size-3" /> Thread
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs gap-1">
            <FileText className="size-3" /> Docs
          </TabsTrigger>
          <TabsTrigger value="letter" className="text-xs gap-1">
            <Mail className="size-3" /> Letter
          </TabsTrigger>
          <TabsTrigger value="note" className="text-xs gap-1">
            <StickyNote className="size-3" /> Note
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs gap-1">
            <Activity className="size-3" /> Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thread" className="mt-4">
          <ThreadTab messages={messages} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab documents={documents} onDownload={downloadDocument} />
        </TabsContent>
        <TabsContent value="letter" className="mt-4">
          <LetterForm onPost={handlePostLetter} />
        </TabsContent>
        <TabsContent value="note" className="mt-4 space-y-6">
          <UpdateForm onPost={handlePostUpdate} />
          <Separator />
          <NoteForm onPost={handlePostNote} />
        </TabsContent>
        <TabsContent value="actions" className="mt-4">
          <ActionsTab actions={actions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
