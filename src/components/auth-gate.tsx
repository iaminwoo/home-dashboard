"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./auth-gate.module.css";

type AuthGateProps = { children: React.ReactNode };

export function AuthGate({ children }: AuthGateProps) {
  const [{ client, configError }] = useState<{ client: SupabaseClient | null; configError: string | null }>(() => {
    try { return { client: getSupabaseBrowserClient(), configError: null }; } catch (error) {
      return { client: null, configError: error instanceof Error ? error.message : "Supabase 설정을 확인해 주세요." };
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!client) return;

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setChecking(false);
    });
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError("세션을 확인하지 못했습니다. 다시 로그인해 주세요.");
      setSession(data.session);
      setChecking(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setSubmitting(true);
    setAuthError(null);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) setAuthError("이메일 또는 비밀번호를 확인해 주세요.");
    setSubmitting(false);
  }

  if (configError) return <AuthScreen><p className={styles.error}>{configError}</p><p className={styles.help}>`.env.local`을 채운 뒤 개발 서버를 다시 시작해 주세요.</p></AuthScreen>;
  if (checking) return <AuthScreen><p className={styles.status}>세션을 확인하고 있어요…</p></AuthScreen>;
  if (!session) return <AuthScreen><form className={styles.form} onSubmit={handleSignIn}><label>이메일<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>비밀번호<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{authError && <p className={styles.error} role="alert">{authError}</p>}<button type="submit" disabled={submitting}>{submitting ? "로그인 중…" : "로그인"}</button></form></AuthScreen>;
  return <>{children}</>;
}

function AuthScreen({ children }: AuthGateProps) { return <main className={styles.page}><section className={styles.card}><p className={styles.eyebrow}>HOME DASHBOARD</p><h1>로그인</h1><p className={styles.intro}>대시보드에 접근하려면 로그인해 주세요.</p>{children}</section></main>; }
