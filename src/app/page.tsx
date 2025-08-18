"use client";

import { useEffect, useMemo, useState } from "react";
import ScheduleEditor from "@/components/ScheduleEditor";
import Countdown from "@/components/Countdown";
import SchedulePreview from "@/components/SchedulePreview";
import { type Schedule, normalizeSchedule } from "@/lib/schedule";
import { loadSchedule, saveSchedule } from "@/lib/storage";

const DEFAULT_SCHEDULE: Schedule = [
  { id: "p1", name: "Period 1", start: "08:00", end: "08:45" },
  { id: "p2", name: "Period 2", start: "08:50", end: "09:35" },
  { id: "p3", name: "Period 3", start: "09:45", end: "10:30" },
  { id: "brk", name: "Break", start: "10:30", end: "10:45" },
  { id: "p4", name: "Period 4", start: "10:45", end: "11:30" },
  { id: "p5", name: "Period 5", start: "11:35", end: "12:20" },
];

export default function Home() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const data = loadSchedule<Schedule>(DEFAULT_SCHEDULE);
    setSchedule(normalizeSchedule(data));
    
    // Set date on client side to avoid hydration mismatch
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    
    // Update time every second
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    
    updateTime(); // Set initial time
    const timeInterval = setInterval(updateTime, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  const onChange = (next: Schedule) => {
    const normalized = normalizeSchedule(next);
    setSchedule(normalized);
    saveSchedule(normalized);
  };

  const headerTitle = useMemo(() => "Madressa Bell System", []);

  return (
    <div className="min-h-screen" style={{ backgroundImage: "radial-gradient(1200px 600px at 0% -10%, rgba(31,111,84,0.08), transparent), radial-gradient(800px 400px at 100% -10%, rgba(155,191,152,0.15), transparent)" }}>
      <div className="mx-auto max-w-6xl px-8 py-12">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight" style={{ letterSpacing: "0.2px" }}>
              {headerTitle}
            </h1>
            <p className="text-foreground/70 mt-1">Anjuman-e-Mohammedi San Diego</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-foreground/60">Today</div>
            <div className="text-lg font-medium">
              {currentDate || "Loading..."}
            </div>
            <div className="text-xl font-bold tabular-nums mt-1 text-[color:var(--accent)]">
              {currentTime || "Loading..."}
            </div>
          </div>
        </header>

        {schedule === null ? (
          <div className="h-[calc(100vh-200px)] flex items-center justify-center text-foreground/60">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            <div className="xl:col-span-2 h-full min-h-0">
              <ScheduleEditor
                value={schedule}
                onChange={onChange}
                onResetAll={() => onChange(DEFAULT_SCHEDULE)}
                onDeleteAll={() => onChange([])}
              />
            </div>
            <div className="xl:col-span-1 flex flex-col gap-4 h-full min-h-0">
              <Countdown schedule={schedule} />
              <SchedulePreview schedule={schedule} />
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
