import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return <main className={styles.page}><section className={styles.hero}><p className={styles.eyebrow}>HOME DASHBOARD</p><h1>우리 집의 오늘을<br />한눈에.</h1><p className={styles.description}>태블릿에서는 필요한 정보를 편안하게 확인하고,<br />휴대폰에서는 간단하게 관리하세요.</p></section><nav className={styles.actions} aria-label="대시보드 이동"><Link className={styles.primaryAction} href="/display"><span className={styles.actionIcon}>◷</span><span><strong>대시보드 보기</strong><small>태블릿 디스플레이</small></span><span aria-hidden="true">→</span></Link><Link className={styles.secondaryAction} href="/admin"><span className={styles.actionIcon}>☷</span><span><strong>관리하기</strong><small>휴대폰에서 정보 수정</small></span><span aria-hidden="true">→</span></Link></nav></main>;
}
