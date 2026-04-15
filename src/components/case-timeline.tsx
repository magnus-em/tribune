import { format } from "date-fns";
import { CheckCircle2, Circle, Clock, FileText, Mail, MessageSquare, AlertCircle } from "lucide-react";
import { type CaseMessage, type CaseAction } from "@/lib/types/database";

interface TimelineEvent {
  id: string;
  type: "message" | "action" | "milestone";
  date: string;
  title: string;
  description?: string;
  icon: "check" | "letter" | "mail" | "message" | "alert" | "clock";
  variant?: "success" | "warning" | "default";
}

interface CaseTimelineProps {
  messages: CaseMessage[];
  actions: CaseAction[];
  statutoryDeadline: string;
  moveOutDate: string;
}

function getIcon(icon: TimelineEvent["icon"]) {
  const iconClass = "h-4 w-4";
  switch (icon) {
    case "check":
      return <CheckCircle2 className={iconClass} />;
    case "letter":
      return <FileText className={iconClass} />;
    case "mail":
      return <Mail className={iconClass} />;
    case "message":
      return <MessageSquare className={iconClass} />;
    case "alert":
      return <AlertCircle className={iconClass} />;
    case "clock":
      return <Clock className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
}

export function CaseTimeline({ messages, actions, statutoryDeadline, moveOutDate }: CaseTimelineProps) {
  // Combine messages and actions into timeline events
  const events: TimelineEvent[] = [];

  // Add move-out milestone
  events.push({
    id: "move-out",
    type: "milestone",
    date: moveOutDate,
    title: "Moved out of property",
    icon: "check",
    variant: "default",
  });

  // Add statutory deadline milestone
  const deadlinePassed = new Date(statutoryDeadline) < new Date();
  events.push({
    id: "deadline",
    type: "milestone",
    date: statutoryDeadline,
    title: "Statutory deadline (30 days)",
    description: deadlinePassed ? "Landlord failed to return deposit" : "Landlord must return deposit by this date",
    icon: deadlinePassed ? "alert" : "clock",
    variant: deadlinePassed ? "warning" : "default",
  });

  // Add messages
  messages.forEach((msg) => {
    let icon: TimelineEvent["icon"] = "message";
    let variant: TimelineEvent["variant"] = "default";

    if (msg.message_type === "tribune_letter") {
      icon = "letter";
      variant = "success";
    } else if (msg.message_type === "tribune_update") {
      icon = "message";
    } else if (msg.message_type === "tenant_landlord_reply") {
      icon = "mail";
    }

    events.push({
      id: msg.id,
      type: "message",
      date: msg.created_at,
      title: msg.title,
      description: msg.message_type === "tribune_letter" ? `Letter ${msg.letter_number || ''}` : undefined,
      icon,
      variant,
    });
  });

  // Add actions
  actions.forEach((action) => {
    events.push({
      id: action.id,
      type: "action",
      date: action.created_at,
      title: action.action_type.replace(/_/g, " "),
      icon: "check",
      variant: "default",
    });
  });

  // Sort by date (newest first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-8 bottom-8 w-px bg-slate-200" aria-hidden="true" />

      {/* Events */}
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon */}
            <div
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                event.variant === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : event.variant === "warning"
                    ? "bg-orange-50 border-orange-200 text-orange-700"
                    : "bg-white border-slate-200 text-slate-600"
              }`}
            >
              {getIcon(event.icon)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-sm capitalize">{event.title}</h4>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(event.date), "MMM d, yyyy")}
                </time>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No timeline events yet
        </div>
      )}
    </div>
  );
}
