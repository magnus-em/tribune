import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title?: string;
  message: string;
  className?: string;
}

export function ErrorMessage({ title = "Error", message, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "border border-red-200 bg-red-50 rounded-lg p-4 flex gap-3",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-semibold text-red-900 mb-1">{title}</h3>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
}
