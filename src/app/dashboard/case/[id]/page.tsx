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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

function statusColor(status: string): string {
  switch (status) {
    case "letter_ready":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

function nextAction(status: string): string {
  switch (status) {
    case "intake_submitted":
    case "under_review":
      return "We're reviewing your case. You'll be notified when your demand letter is ready.";
    case "letter_ready":
      return "Your demand letter is ready! Review it below, then send it to your landlord.";
    case "letter_sent":
    case "awaiting_landlord":
      return "Waiting for your landlord to respond. Submit their response below when you receive it.";
    case "landlord_responded":
      return "We're reviewing your landlord's response and preparing next steps.";
    case "resolved":
      return "Your case has been resolved. Thank you for using Tribune.";
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

  const [expanded, setExpanded] = useState(message.message_type !== "tribune_letter");

  return (
    <div className={`flex ${isTribune ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-lg p-4 ${
          isTribune
            ? "bg-muted border"
            : "bg-primary text-primary-foreground"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium opacity-70">
            {isTribune ? "Tribune" : "You"}
          </span>
          <span className="text-xs opacity-50">
            {format(new Date(message.created_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        <p className="font-semibold text-sm mb-1">{message.title}</p>

        {message.message_type === "tribune_letter" && !expanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className={isTribune ? "" : "text-primary-foreground hover:text-primary-foreground/80"}
          >
            View letter
          </Button>
        ) : (
          <div className="text-sm whitespace-pre-wrap">{message.body}</div>
        )}

        {message.message_type === "tribune_letter" && expanded && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              navigator.clipboard.writeText(message.body);
              toast.success("Letter copied to clipboard");
            }}
          >
            Copy letter text
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

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const [{ data: caseResult }, { data: messagesResult }] = await Promise.all([
      supabase.from("cases").select("*").eq("id", caseId).single(),
      supabase
        .from("case_messages")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true }),
    ]);

    setCaseData(caseResult);
    setMessages(messagesResult || []);
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
    toast.success("Landlord response submitted. We'll review it and prepare next steps.");
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

    toast.success("Great! We'll track the landlord's response deadline.");
    setConfirmingSent(false);
    loadData();
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading case...</p>;
  }

  if (!caseData) {
    return <p className="text-destructive">Case not found.</p>;
  }

  const deadline = new Date(caseData.statutory_deadline);
  const today = new Date();
  const daysOverdue = differenceInDays(today, deadline);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{caseData.property_address}</CardTitle>
            <Badge variant="outline" className={statusColor(caseData.status)}>
              {STATUS_LABELS[caseData.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {STATUS_DESCRIPTIONS[caseData.status]}
          </p>
        </CardHeader>
        <CardContent>
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
              <p className="text-muted-foreground">Landlord Deadline</p>
              <p className="font-semibold">{format(deadline, "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-semibold">
                {daysOverdue > 0 ? (
                  <span className="text-destructive">{daysOverdue} days overdue</span>
                ) : (
                  <span>{Math.abs(daysOverdue)} days remaining</span>
                )}
              </p>
            </div>
          </div>

          <Separator className="my-4" />
          <p className="text-sm font-medium">{nextAction(caseData.status)}</p>
        </CardContent>
      </Card>

      {/* Correspondence Thread */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Case Thread</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Action area */}
      {caseData.status !== "resolved" && caseData.status !== "closed" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Confirm letter sent */}
            {caseData.status === "letter_ready" && (
              <Button
                onClick={confirmLetterSent}
                disabled={confirmingSent}
                className="w-full"
              >
                {confirmingSent ? "Confirming..." : "I sent the letter to my landlord"}
              </Button>
            )}

            {/* Submit landlord response */}
            <div>
              <h3 className="font-medium mb-2">Submit landlord&apos;s response</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Paste or type your landlord&apos;s response below. Include the full text of any
                email, letter, or text message.
              </p>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={5}
                placeholder="Paste your landlord's response here..."
              />
              <Button
                onClick={submitLandlordResponse}
                disabled={submitting || !responseText.trim()}
                className="mt-2"
              >
                {submitting ? "Submitting..." : "Submit Response"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
