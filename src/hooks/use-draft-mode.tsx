import { useEffect, useState } from "react";

const KEY = "admin_draft_mode";

/**
 * Toggle stored in localStorage. When ON, admin form submissions call
 * upsert*({ publish: false }) so changes go to the draft column instead of
 * live production content.
 */
export function useDraftMode(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(KEY) === "1";
  });

  useEffect(() => {
    const onChange = () => setOn(window.localStorage.getItem(KEY) === "1");
    window.addEventListener("storage", onChange);
    window.addEventListener("draft-mode-changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("draft-mode-changed", onChange);
    };
  }, []);

  function set(v: boolean) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, v ? "1" : "0");
    window.dispatchEvent(new Event("draft-mode-changed"));
    setOn(v);
  }

  return [on, set];
}

/** Returns `!draftMode` — pass this as `publish` to upsert functions. */
export function usePublishFlag(): boolean {
  const [draft] = useDraftMode();
  return !draft;
}
