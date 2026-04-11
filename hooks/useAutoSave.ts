import { useState, useEffect, useRef, useCallback } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSave(
  values: Record<string, string>,
  storageKeys: Record<string, string>,
  onSave?: () => Promise<void>,
  delay = 1500
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const prevValues = useRef(values);

  const save = useCallback(async () => {
    setStatus("saving");
    try {
      Object.entries(storageKeys).forEach(([key, storageKey]) => {
        localStorage.setItem(storageKey, values[key] || "");
      });
      if (onSave) await onSave();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [values, storageKeys, onSave]);

  useEffect(() => {
    const changed = Object.keys(values).some(
      (key) => values[key] !== prevValues.current[key]
    );
    if (!changed) return;
    prevValues.current = values;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [values, save, delay]);

  return status;
}
