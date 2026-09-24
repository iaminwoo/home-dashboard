import { Clock } from "@/components/clock";
import { CalendarCard } from "@/components/dashboard-cards";
import { NotesCard } from "@/components/notes-card";
import { ParkingCard } from "@/components/parking-card";
import { WeatherCard } from "@/components/weather-card";
import styles from "./page.module.css";
export default function DisplayPage() { return <main className={styles.display}><section className={styles.topRow}><Clock /><WeatherCard /><ParkingCard /></section><section className={styles.bottomRow}><CalendarCard /><NotesCard /></section></main>; }
