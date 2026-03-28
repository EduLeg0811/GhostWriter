import { useCallback, useEffect, useRef, useState } from "react";

const useGhostWriterFeedback = () => {
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);
  const historyNoticeTimeoutRef = useRef<number | null>(null);

  const showHistoryNotice = useCallback((message: string) => {
    const trimmed = (message || "").trim();
    if (!trimmed) return;
    setHistoryNotice(trimmed);
    if (historyNoticeTimeoutRef.current !== null) {
      window.clearTimeout(historyNoticeTimeoutRef.current);
    }
    historyNoticeTimeoutRef.current = window.setTimeout(() => {
      setHistoryNotice(null);
      historyNoticeTimeoutRef.current = null;
    }, 4500);
  }, []);

  useEffect(() => () => {
    if (historyNoticeTimeoutRef.current !== null) {
      window.clearTimeout(historyNoticeTimeoutRef.current);
    }
  }, []);

  const toast = useRef({
    error: (message: string) => showHistoryNotice(message),
    info: (message: string) => showHistoryNotice(message),
    success: (message: string) => showHistoryNotice(message),
    warning: (message: string) => showHistoryNotice(message),
  }).current;

  return {
    historyNotice,
    showHistoryNotice,
    toast,
  };
};

export default useGhostWriterFeedback;
