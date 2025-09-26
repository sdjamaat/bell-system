"use client";

import { useEffect, useMemo, useState } from "react";
import ScheduleEditor from "@/components/ScheduleEditor";
import Countdown from "@/components/Countdown";
import SchedulePreview from "@/components/SchedulePreview";
import { type Schedule, normalizeSchedule } from "@/lib/schedule";
import { loadSchedule, saveSchedule } from "@/lib/storage";
import { useWakeLock } from "@/lib/useWakeLock";

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
  const [showEditorMobile, setShowEditorMobile] = useState(false);

  // Use wake lock to prevent device from sleeping
  const {
    isActive: wakeLockActive,
    isSupported: wakeLockSupported,
    error: wakeLockError,
  } = useWakeLock();

  useEffect(() => {
    const data = loadSchedule<Schedule>(DEFAULT_SCHEDULE);
    setSchedule(normalizeSchedule(data));

    // Set date on client side to avoid hydration mismatch
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    // Update time every second
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
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

  const headerTitle = useMemo(() => "Madrasah Bell System", []);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "radial-gradient(1200px 600px at 0% -10%, rgba(31,111,84,0.08), transparent), radial-gradient(800px 400px at 100% -10%, rgba(155,191,152,0.15), transparent)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-start justify-start sm:justify-between gap-2 sm:gap-6">
          <div>
            <h1
              className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight"
              style={{ letterSpacing: "0.2px" }}
            >
              {headerTitle}
            </h1>
            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
              Anjuman-e-Mohammedi San Diego
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
            <div className="text-xs sm:text-sm text-foreground/60">Today</div>
            <div className="text-base sm:text-lg font-medium leading-snug">
              {currentDate || "Loading..."}
            </div>
            <div className="text-lg sm:text-xl font-bold tabular-nums mt-1 text-[color:var(--accent)]">
              {currentTime || "Loading..."}
            </div>
            {/* Wake Lock Status Indicator */}
            {wakeLockSupported && (
              <div className="mt-2 flex items-center justify-start sm:justify-end gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    wakeLockActive ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-xs text-foreground/60">
                  {wakeLockActive
                    ? "Screen stays awake"
                    : wakeLockError
                    ? "Wake lock failed"
                    : "Screen may sleep"}
                </span>
              </div>
            )}
          </div>
        </header>

        {schedule === null ? (
          <div className="min-h-[50vh] md:h-[calc(100vh-200px)] flex items-center justify-center text-foreground/60">
            Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 md:h-[calc(100vh-200px)]">
            <div className="order-2 xl:hidden">
              <button
                onClick={() => setShowEditorMobile((prev) => !prev)}
                className="px-3 py-1.5 btn-outline text-sm w-full sm:w-auto"
              >
                {showEditorMobile ? "Hide editor" : "Edit schedule"}
              </button>
            </div>

            <div
              className={`order-3 xl:order-1 xl:col-span-2 h-auto md:h-full min-h-0 ${
                showEditorMobile ? "block" : "hidden"
              } xl:block`}
            >
              <ScheduleEditor
                value={schedule}
                onChange={onChange}
                onResetAll={() => onChange(DEFAULT_SCHEDULE)}
                onDeleteAll={() => onChange([])}
              />
            </div>
            <div className="order-1 xl:order-2 xl:col-span-1 flex flex-col gap-4">
              <Countdown schedule={schedule} />
              <SchedulePreview schedule={schedule} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
