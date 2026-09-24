import Link from "next/link";
import { NotesManager } from "@/components/notes-manager";
import { AdminSignOut } from "@/components/admin-sign-out";
import { ParkingSelector } from "@/components/parking-selector";
import styles from "./page.module.css";
const sections = [["⚙", "설정", "날씨와 캘린더 연결, 화면 설정을 관리합니다."]];
export default function AdminPage() { return <main className={styles.page}><header><Link href="/" className={styles.back}>← 홈</Link><p className={styles.eyebrow}>MANAGE</p><h1>관리하기</h1><p className={styles.intro}>집 밖에서도 대시보드 정보를 빠르게 업데이트하세요.</p></header><ParkingSelector /><NotesManager /><section className={styles.sections} aria-label="관리 메뉴">{sections.map(([icon, title, description]) => <button key={title} className={styles.section}><span className={styles.icon}>{icon}</span><span className={styles.copy}><strong>{title}</strong><small>{description}</small></span><span className={styles.arrow}>›</span></button>)}</section><AdminSignOut /></main>; }
