import Link from "next/link";
import { NotesManager } from "@/components/notes-manager";
import { AdminSignOut } from "@/components/admin-sign-out";
import { ParkingSelector } from "@/components/parking-selector";
import styles from "./page.module.css";
export default function AdminPage() { return <main className={styles.page}><header><Link href="/" className={styles.back}>← 홈</Link><p className={styles.eyebrow}>MANAGE</p><h1>관리하기</h1><p className={styles.intro}>집 밖에서도 대시보드 정보를 빠르게 업데이트하세요.</p></header><ParkingSelector /><NotesManager /><AdminSignOut /></main>; }
