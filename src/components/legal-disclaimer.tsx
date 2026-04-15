import { AlertCircle } from "lucide-react";

export function LegalDisclaimer() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-yellow-900 mb-1">
            Legal Information, Not Legal Advice
          </p>
          <p className="text-yellow-800">
            Tribune provides information about Connecticut tenant rights and helps you prepare
            documents. We are not a law firm and do not provide legal advice. You are responsible
            for reviewing and signing all correspondence.
          </p>
        </div>
      </div>
    </div>
  );
}
