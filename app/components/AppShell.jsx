"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import styles from "./AppShell.module.css";

// Routes that manage their own layout (no public sidebar/header)
const NO_SHELL_PREFIXES = ["/admin", "/login", "/register"];

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const noShell = NO_SHELL_PREFIXES.some((p) => pathname?.startsWith(p));

  const handleClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setSidebarOpen((p) => !p);
  }, []);

  if (noShell) {
    return <>{children}</>;
  }

  return (
    <div className={styles.shell}>
      {/* Persistent sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={handleClose} />

      {/* Main column: header + content */}
      <div className={styles.main}>
        <Header onMenuToggle={handleToggle} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

