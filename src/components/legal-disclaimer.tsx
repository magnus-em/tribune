import { Info } from "lucide-react";

export function LegalDisclaimer() {
  return (
    <div className="flex items-start gap-2.5 text-xs text-muted-foreground py-4 border-t mt-8">
      <Info className="size-3.5 shrink-0 mt-0.5" />
      <p>
        Tribune provides information about Connecticut tenant rights and helps
        prepare documents. We are not a law firm and do not provide legal advice.
      </p>
    </div>
  );
}
