"use client";

import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormEvent, useEffect, useState } from "react";
import { createDashboardNote, deleteDashboardNote, fetchDashboardNotes, saveDashboardNoteOrder, sortNotes, type DashboardNote, updateDashboardNote } from "@/lib/dashboard-notes";
import styles from "./notes-manager.module.css";

type SortableNoteProps = { note: DashboardNote; editing: DashboardNote | null; editContent: string; saving: boolean; onToggle: (note: DashboardNote) => void; onEdit: (note: DashboardNote) => void; onRemove: (id: number) => void; onEditContent: (value: string) => void; onSaveEdit: (event: FormEvent<HTMLFormElement>) => void; onCancelEdit: () => void; };

function SortableNote({ note, editing, editContent, saving, onToggle, onEdit, onRemove, onEditContent, onSaveEdit, onCancelEdit }: SortableNoteProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id, disabled: Boolean(editing) || saving });
  return <li ref={setNodeRef} className={`${note.completed ? styles.completed : ""} ${isDragging ? styles.dragging : ""}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
    {editing?.id === note.id ? <form className={styles.editForm} onSubmit={onSaveEdit}><input aria-label="챙겨야 할 것 수정" value={editContent} onChange={(event) => onEditContent(event.target.value)} autoFocus maxLength={300} /><button type="submit" disabled={saving}>저장</button><button type="button" className={styles.textButton} onClick={onCancelEdit}>취소</button></form> : <><button type="button" className={styles.dragHandle} aria-label={`순서 변경: ${note.content}`} disabled={saving} {...attributes} {...listeners}>⠿</button><button type="button" className={styles.check} onClick={() => onToggle(note)} aria-label={`${note.content} ${note.completed ? "미완료로 변경" : "완료로 변경"}`} disabled={saving}>{note.completed ? "✓" : ""}</button><span className={styles.content}>{note.content}</span><button type="button" className={styles.textButton} onClick={() => onEdit(note)}>수정</button><button type="button" className={`${styles.textButton} ${styles.delete}`} onClick={() => onRemove(note.id)} disabled={saving}>삭제</button></>}
  </li>;
}

export function NotesManager() {
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [newContent, setNewContent] = useState("");
  const [editing, setEditing] = useState<DashboardNote | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { let active = true; void fetchDashboardNotes().then((data) => { if (active) setNotes(data); }).catch(() => { if (active) setError("챙겨야 할 것을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  function replaceNote(updated: DashboardNote) { setNotes((current) => sortNotes(current.map((note) => note.id === updated.id ? updated : note))); }
  async function addNote(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const content = newContent.trim(); if (!content || saving) return; setSaving(true); setError(null); try { const note = await createDashboardNote(content); setNotes((current) => sortNotes([...current, note])); setNewContent(""); } catch { setError("챙겨야 할 것을 추가하지 못했어요."); } finally { setSaving(false); } }
  async function toggleNote(note: DashboardNote) { setSaving(true); setError(null); try { replaceNote(await updateDashboardNote(note.id, { completed: !note.completed })); } catch { setError("완료 상태를 변경하지 못했어요."); } finally { setSaving(false); } }
  async function saveEdit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const content = editContent.trim(); if (!editing || !content || saving) return; setSaving(true); setError(null); try { replaceNote(await updateDashboardNote(editing.id, { content })); setEditing(null); } catch { setError("챙겨야 할 것을 수정하지 못했어요."); } finally { setSaving(false); } }
  async function removeNote(id: number) { if (!window.confirm("이 항목을 삭제할까요?")) return; setSaving(true); setError(null); try { await deleteDashboardNote(id); setNotes((current) => current.filter((note) => note.id !== id)); } catch { setError("항목을 삭제하지 못했어요."); } finally { setSaving(false); } }
  async function handleDragEnd(event: DragEndEvent) { const { active, over } = event; if (!over || active.id === over.id || saving) return; const before = notes; const from = notes.findIndex((note) => note.id === active.id); const to = notes.findIndex((note) => note.id === over.id); if (from < 0 || to < 0) return; const reordered = arrayMove(notes, from, to).map((note, index) => ({ ...note, sort_order: index })); setNotes(reordered); setSaving(true); setError(null); try { await saveDashboardNoteOrder(reordered); } catch { setNotes(before); setError("순서를 저장하지 못했어요. 다시 시도해 주세요."); } finally { setSaving(false); } }

  return <section className={styles.section} aria-labelledby="notes-heading"><div className={styles.heading}><span className={styles.icon}>✓</span><div><h2 id="notes-heading">챙겨야 할 것</h2><p>드래그해서 가족이 함께 볼 순서를 바꿔 보세요.</p></div></div><form className={styles.addForm} onSubmit={addNote}><input aria-label="새 챙겨야 할 것" placeholder="새 항목 추가" value={newContent} onChange={(event) => setNewContent(event.target.value)} maxLength={300} /><button type="submit" disabled={saving || !newContent.trim()}>추가</button></form>{error && <p className={styles.error} role="alert">{error}</p>}{loading ? <p className={styles.status}>항목을 불러오는 중이에요…</p> : notes.length === 0 ? <div className={styles.empty}><strong>아직 등록한 항목이 없어요</strong><span>필요한 일을 간단히 적어 보세요.</span></div> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}><SortableContext items={notes.map((note) => note.id)} strategy={verticalListSortingStrategy}><ul className={styles.list}>{notes.map((note) => <SortableNote key={note.id} note={note} editing={editing} editContent={editContent} saving={saving} onToggle={(item) => void toggleNote(item)} onEdit={(item) => { setEditing(item); setEditContent(item.content); }} onRemove={(id) => void removeNote(id)} onEditContent={setEditContent} onSaveEdit={(event) => void saveEdit(event)} onCancelEdit={() => setEditing(null)} />)}</ul></SortableContext></DndContext>}</section>;
}
