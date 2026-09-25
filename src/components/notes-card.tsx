"use client";

import { useEffect, useState } from "react";
import { fetchDashboardNotes, type DashboardNote } from "@/lib/dashboard-notes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-cards.module.css";

export function NotesCard() {
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let removeChannel: (() => void) | undefined;
    const loadNotes = async () => {
      try {
        const data = await fetchDashboardNotes();
        if (active) { setNotes(data); setError(false); }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadNotes();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadNotes();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    try {
      const supabase = getSupabaseBrowserClient();
      const channel = supabase.channel("dashboard-notes-realtime").on("postgres_changes", { event: "*", schema: "public", table: "dashboard_notes" }, () => { void loadNotes(); }).subscribe((status) => {
        if (["SUBSCRIBED", "CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) console.info("Dashboard notes Realtime", status);
      });
      removeChannel = () => { void supabase.removeChannel(channel); };
    } catch (error) {
      console.warn("Dashboard notes Realtime subscription failed", error);
    }

    return () => { active = false; document.removeEventListener("visibilitychange", refreshWhenVisible); removeChannel?.(); };
  }, []);

  return <section className={`${styles.card} ${styles.notesCard}`}><div className={styles.cardHeader}><span className={styles.icon}><DashboardIcon name="checklist" /></span><h2>챙겨야 할 것</h2></div>{loading ? <div className={styles.empty}><strong>항목을 불러오는 중이에요</strong></div> : error ? <div className={styles.empty}><strong>항목을 불러오지 못했어요</strong><span>잠시 후 화면을 새로고침해 주세요.</span></div> : notes.length === 0 ? <div className={styles.empty}><strong>아직 챙겨야 할 것이 없어요</strong><span>관리 페이지에서 항목을 추가해 보세요.</span></div> : <ul className={styles.notes}>{notes.map((note) => <li key={note.id} className={note.completed ? styles.noteCompleted : ""}><i>{note.completed ? "✓" : ""}</i><span>{note.content}</span></li>)}</ul>}</section>;
}
