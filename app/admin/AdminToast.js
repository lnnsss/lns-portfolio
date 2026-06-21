"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import styles from "./admin.module.css";

const AdminToastContext = createContext(null);

export function AdminToastProvider({ children, initialToast = null }) {
  const [toast, setToast] = useState(initialToast);
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    window.clearTimeout(timeoutRef.current);
    setToast({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    timeoutRef.current = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeoutRef.current);
  }, [toast]);

  return (
    <AdminToastContext.Provider value={showToast}>
      {children}
      {toast ? (
        <div
          key={toast.id || toast.message}
          className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}
          role={toast.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <span className={styles.toastMark} aria-hidden="true">
            {toast.type === "error" ? "!" : "✓"}
          </span>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Закрыть уведомление">
            ×
          </button>
        </div>
      ) : null}
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const showToast = useContext(AdminToastContext);
  if (!showToast) throw new Error("useAdminToast must be used inside AdminToastProvider");
  return showToast;
}
