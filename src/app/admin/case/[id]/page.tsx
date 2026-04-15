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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
import { postLetterWithNotification, postUpdateWithNotification } from "./actions";

function statusColor(status: string): string {
  switch (status) {
    case "letter_ready":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "landlord_responded":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

export default function AdminCaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [actions, setActions] = useState<CaseAction[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newStatus, setNewStatus] = useState<string>("");
  const [letterTitle, setLetterTitle] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [letterNumber, setLetterNumber] = useState("1");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteAdminOnly, setNoteAdminOnly] = useState(true);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const [{ data: caseResult }, { data: messagesResult }, { data: actionsResult }, { data: documentsResult }] =
      await Promise.all([
        supabase.from("cases").select("*").eq("id", caseId).single(),
        supabase
          .from("case_messages")
          .select("*")
          .eq("case_id", caseId)
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
          .order("created_at", { ascending: false }),
      ]);

    setCaseData(caseResult);
    setMessages(messagesResult || []);
    setActions(actionsResult || []);
    setDocuments(documentsResult || []);
    if (caseResult) setNewStatus(caseResult.status);
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function changeStatus() {
    if (!newStatus || newStatus === caseData?.status) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("cases")
      .update({
        status: newStatus as CaseStatus,
      })
      .eq("id", caseId);

    // Auto-create timeline entry
    await supabase.from("case_messages").insert({
      case_id: caseId,
      message_type: "system",
      title: `Status changed to ${STATUS_LABELS[newStatus as CaseStatus]}`,
      body: `Case status updated from "${STATUS_LABELS[caseData!.status]}" to "${STATUS_LABELS[newStatus as CaseStatus]}".`,
      created_by: user.id,
    });

    toast.success("Status updated");
    loadData();
  }

  async function postLetter() {
    if (!letterTitle.trim() || !letterBody.trim()) return;

    const result = await postLetterWithNotification({
      caseId,
      title: letterTitle.trim(),
      body: letterBody.trim(),
      letterNumber: parseInt(letterNumber),
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setLetterTitle("");
    setLetterBody("");
    toast.success("Letter posted and tenant notified by email");
    loadData();
  }

  async function postUpdate() {
    if (!updateTitle.trim() || !updateBody.trim()) return;

    const result = await postUpdateWithNotification({
      caseId,
      title: updateTitle.trim(),
      body: updateBody.trim(),
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setUpdateTitle("");
    setUpdateBody("");
    toast.success("Update posted and tenant notified by email");
    loadData();
  }

  async function postNote() {
    if (!noteTitle.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("case_messages").insert({
      case_id: caseId,
      message_type: "tribune_update",
      title: noteTitle.trim(),
      body: noteBody.trim(),
      is_admin_only: noteAdminOnly,
      created_by: user.id,
    });

    setNoteTitle("");
    setNoteBody("");
    toast.success(noteAdminOnly ? "Internal note added" : "Note posted to tenant");
    loadData();
  }

  async function downloadDocument(storagePath: string) {
    const result = await getDocumentUrl(storagePath);
    if (result.error) {
      toast.error("Failed to download document");
    } else if (result.url) {
      window.open(result.url, "_blank");
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading case...</p>;
  if (!caseData) return <p className="text-destructive">Case not found.</p>;

  const deadline = new Date(caseData.statutory_deadline);
  const daysOverdue = differenceInDays(new Date(), deadline);

  return (
    <div className="space-y-6">
      {/* Case Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{caseData.property_address}</CardTitle>
            <Badge variant="outline" className={statusColor(caseData.status)}>
              {STATUS_LABELS[caseData.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Deposit</p>
              <p className="font-semibold">${(caseData.deposit_amount_cents / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Withheld</p>
              <p className="font-semibold">${(caseData.amount_withheld_cents / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Deadline</p>
              <p className="font-semibold">
                {format(deadline, "MMM d, yyyy")}
                {daysOverdue > 0 && (
                  <span className="text-destructive ml-1">(+{daysOverdue}d)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Letter #</p>
              <p className="font-semibold">{caseData.current_letter_number || "None"}</p>
            </div>
          </div>

          <Separator />

          {/* Tenant & Landlord details */}
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Landlord</h4>
              <p>{caseData.landlord_name}</p>
              {caseData.landlord_email && <p className="text-muted-foreground">{caseData.landlord_email}</p>}
              {caseData.landlord_phone && <p className="text-muted-foreground">{caseData.landlord_phone}</p>}
              {caseData.landlord_address && <p className="text-muted-foreground">{caseData.landlord_address}</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Lease Details</h4>
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
                <h4 className="font-semibold mb-1">Withholding Reason</h4>
                <p className="text-muted-foreground">{caseData.withholding_reason}</p>
              </div>
            </>
          )}

          <Separator />
          <div className="text-sm">
            <h4 className="font-semibold mb-1">Tenant&apos;s Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {caseData.situation_description}
            </p>
          </div>

          {/* Status change */}
          <Separator />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Change Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={changeStatus} disabled={newStatus === caseData.status}>
              Update Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions tabs */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="thread">Thread ({messages.length})</TabsTrigger>
          <TabsTrigger value="letter">Post Letter</TabsTrigger>
          <TabsTrigger value="update">Post Update</TabsTrigger>
          <TabsTrigger value="note">Add Note</TabsTrigger>
          <TabsTrigger value="actions">Actions ({actions.length})</TabsTrigger>
        </TabsList>

        {/* Documents tab */}
        <TabsContent value="documents" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            All documents uploaded by the tenant. Click to preview or download.
          </p>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {/* Group documents by kind */}
              {["lease", "landlord_correspondence", "deduction_itemization", "photo", "other"].map((kind) => {
                const kindDocs = documents.filter((doc) => doc.kind === kind);
                if (kindDocs.length === 0) return null;

                return (
                  <div key={kind} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 capitalize">{kind.replace(/_/g, " ")}</h4>
                    <div className="space-y-2">
                      {kindDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between border-l-4 border-primary pl-3 py-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{doc.original_filename}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {format(new Date(doc.created_at), "MMM d, yyyy 'at' h:mm a")}
                              {doc.size_bytes && ` • ${(doc.size_bytes / 1024).toFixed(0)} KB`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(doc.storage_path)}
                            >
                              Preview/Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Thread tab */}
        <TabsContent value="thread" className="space-y-3 mt-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`border rounded-lg p-3 text-sm ${
                  msg.is_admin_only ? "border-dashed bg-muted/30" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {msg.message_type.replace("_", " ")}
                  </Badge>
                  {msg.is_admin_only && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                      Admin Only
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="font-medium">{msg.title}</p>
                {msg.body && (
                  <p className="text-muted-foreground whitespace-pre-wrap mt-1">{msg.body}</p>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* Post Letter tab */}
        <TabsContent value="letter" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Post a demand letter for the tenant to review and send to their landlord.
          </p>
          <div>
            <Label>Letter Number</Label>
            <Select value={letterNumber} onValueChange={setLetterNumber}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Letter 1</SelectItem>
                <SelectItem value="2">Letter 2</SelectItem>
                <SelectItem value="3">Letter 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={letterTitle}
              onChange={(e) => setLetterTitle(e.target.value)}
              placeholder="e.g., Demand Letter #1 — Ready for Review"
            />
          </div>
          <div>
            <Label>Letter Body</Label>
            <Textarea
              value={letterBody}
              onChange={(e) => setLetterBody(e.target.value)}
              rows={15}
              placeholder="Paste the demand letter content here..."
            />
          </div>
          <Button onClick={postLetter} disabled={!letterTitle.trim() || !letterBody.trim()}>
            Post Letter to Tenant
          </Button>
        </TabsContent>

        {/* Post Update tab */}
        <TabsContent value="update" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Post a visible update to the tenant (not a letter).
          </p>
          <div>
            <Label>Title</Label>
            <Input
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="e.g., Next steps for your case"
            />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea
              value={updateBody}
              onChange={(e) => setUpdateBody(e.target.value)}
              rows={5}
              placeholder="Your update message..."
            />
          </div>
          <Button onClick={postUpdate} disabled={!updateTitle.trim() || !updateBody.trim()}>
            Post Update
          </Button>
        </TabsContent>

        {/* Add Note tab */}
        <TabsContent value="note" className="space-y-4 mt-4">
          <div>
            <Label>Title</Label>
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title"
            />
          </div>
          <div>
            <Label>Body (optional)</Label>
            <Textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={4}
              placeholder="Details..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="admin_only"
              checked={noteAdminOnly}
              onCheckedChange={(checked) => setNoteAdminOnly(checked === true)}
            />
            <Label htmlFor="admin_only" className="text-sm">
              Internal note (hidden from tenant)
            </Label>
          </div>
          <Button onClick={postNote} disabled={!noteTitle.trim()}>
            Add Note
          </Button>
        </TabsContent>

        {/* Actions tab */}
        <TabsContent value="actions" className="space-y-3 mt-4">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenant actions yet.</p>
          ) : (
            actions.map((action) => (
              <div key={action.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{action.action_type.replace("_", " ")}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(action.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                {action.metadata && Object.keys(action.metadata).length > 0 && (
                  <pre className="text-xs text-muted-foreground mt-1">
                    {JSON.stringify(action.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
