import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Educational Prototype</p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          This prototype is for educational and portfolio purposes only. Do not upload confidential, privileged, medical, legal, or personally identifiable claim information.
        </p>
      </div>
    </div>
  );
}