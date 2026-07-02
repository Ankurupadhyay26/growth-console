import { useEffect, useState } from "react";
import { subscribeToast, type Toast } from "../lib/toast";

const VARIANT_STYLE: Record<Toast["variant"], { border: string; dot: string }> = {
  success: { border: "var(--color-signal-good)", dot: "var(--color-signal-good)" },
  error: { border: "var(--color-signal-bad)", dot: "var(--color-signal-bad)" },
  info: { border: "var(--color-linkedin-500)", dot: "var(--color-linkedin-500)" },
};

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToast(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {toasts.map((t) => {
        const style = VARIANT_STYLE[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className="console-panel px-3.5 py-2.5 text-sm text-graphite-100 flex items-center gap-2 shadow-lg animate-[fadeIn_0.15s_ease-out]"
            style={{ borderLeft: `3px solid ${style.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: style.dot }} />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
