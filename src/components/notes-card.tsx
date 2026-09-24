"use client";

import { useEffect, useState } from "react";
import { fetchDashboardNotes, type DashboardNote } from "@/lib/dashboard-notes";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-cards.module.css";

export function NotesCard() {
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchDashboardNotes().then((data) => { if (active) setNotes(data); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section className={`${styles.card} ${styles.notesCard}`}><div className={styles.cardHeader}><span className={styles.icon}><DashboardIcon name="checklist" /></span><h2>챙겨야 할 것</h2></div>{loading ? <div className={styles.empty}><strong>항목을 불러오는 중이에요</strong></div> : error ? <div className={styles.empty}><strong>항목을 불러오지 못했어요</strong><span>잠시 후 화면을 새로고침해 주세요.</span></div> : notes.length === 0 ? <div className={styles.empty}><strong>아직 챙겨야 할 것이 없어요</strong><span>관리 페이지에서 항목을 추가해 보세요.</span></div> : <ul className={styles.notes}>{notes.slice(0, 6).map((note) => <li key={note.id} className={note.completed ? styles.noteCompleted : ""}><i>{note.completed ? "✓" : ""}</i><span>{note.content}</span></li>)}</ul>}</section>;
}
