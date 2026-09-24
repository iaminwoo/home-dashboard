import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type DashboardNote = {
  id: number;
  content: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type DashboardNoteUpdate = Partial<Pick<DashboardNote, "content" | "completed" | "sort_order">>;
const noteFields = "id, content, completed, sort_order, created_at, updated_at";

function sortNotes(notes: DashboardNote[]) {
  return [...notes].sort((left, right) => left.sort_order - right.sort_order || new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
}

export async function fetchDashboardNotes() {
  const { data, error } = await getSupabaseBrowserClient().from("dashboard_notes").select(noteFields).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw error;
  return sortNotes((data ?? []) as DashboardNote[]);
}

export async function createDashboardNote(content: string) {
  const client = getSupabaseBrowserClient();
  const { data: lastNote, error: orderError } = await client.from("dashboard_notes").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  if (orderError) throw orderError;

  const { data, error } = await client.from("dashboard_notes").insert({ content, sort_order: (lastNote?.sort_order ?? -1) + 1 }).select(noteFields).single();
  if (error) throw error;
  return data as DashboardNote;
}

export async function updateDashboardNote(id: number, updates: DashboardNoteUpdate) {
  const { data, error } = await getSupabaseBrowserClient().from("dashboard_notes").update(updates).eq("id", id).select(noteFields).single();
  if (error) throw error;
  return data as DashboardNote;
}

export async function saveDashboardNoteOrder(notes: DashboardNote[]) {
  const client = getSupabaseBrowserClient();
  const results = await Promise.all(notes.map((note, index) => client.from("dashboard_notes").update({ sort_order: index }).eq("id", note.id)));
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function deleteDashboardNote(id: number) {
  const { error } = await getSupabaseBrowserClient().from("dashboard_notes").delete().eq("id", id);
  if (error) throw error;
}

export { sortNotes };
