"use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./admin-sign-out.module.css";
export function AdminSignOut() { return <button type="button" className={styles.button} onClick={() => void getSupabaseBrowserClient().auth.signOut()}>로그아웃</button>; }
