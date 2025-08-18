"use client";

import { useEffect, useMemo, useState } from "react";
import { type Schedule, getCurrentPeriod, getNextBellDate, getNowMinutes } from "@/lib/schedule";
import { bellPlayer } from "@/lib/bell";
import { loadSoundEnabled, saveSoundEnabled } from "@/lib/storage";

type Props = {
  schedule: Schedule;
};

export default function Countdown({ schedule }: Props) {
  const [now, setNow] = useState<Date>(new Date());
  const [target, setTarget] = useState<Date | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getNextBellDate(schedule, now);
    setTarget(t);
    // Small delay to prevent flash of "No bells scheduled"
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, [schedule, now]);

  // Load persisted sound preference once on mount
  useEffect(() => {
    const persisted = loadSoundEnabled(false);
    setEnabled(persisted);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!target) return;
    const diff = target.getTime() - now.getTime();
    if (diff <= 0 && enabled) {
      bellPlayer.playBellSound();
      // Set next target immediately after ringing
      const next = getNextBellDate(schedule, new Date(now.getTime() + 1000));
      setTarget(next);
      // keep enabled on; users can toggle off if needed
    }
  }, [now, target, enabled, schedule]);

  const currentPeriodName = useMemo(() => {
    const p = getCurrentPeriod(schedule, getNowMinutes(now));
    return p?.name ?? "—";
  }, [schedule, now]);

  const remainingParts = useMemo(() => {
    if (loading) return null;
    if (!target) return null;
    const diffMs = Math.max(0, target.getTime() - now.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return { h: pad(h), m: pad(m), s: pad(s) };
  }, [target, now, loading]);

  const nextBellTimeLabel = useMemo(() => {
    if (!target) return "";
    return target.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }, [target]);

  return (
    <div className="card p-3">
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground/60">Current period</div>
            <div className="flex items-center gap-2 select-none">
              <span className="text-sm text-foreground/70">{enabled ? "Sound on" : "Sound off"}</span>
              <button
                aria-label="Toggle sound"
                aria-pressed={enabled}
                onClick={async () => {
                  const next = !enabled;
                  if (next) {
                    await bellPlayer.unlock();
                  }
                  setEnabled(next);
                  saveSoundEnabled(next);
                }}
                className={`relative inline-flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${enabled ? "bg-[color:var(--accent)]" : "bg-gray-300"}`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`}
                />
              </button>
            </div>
          </div>
          <div className="text-base font-semibold font-display mt-0.5">{currentPeriodName}</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-foreground/60">Next bell in</div>
          {remainingParts ? (
            <div className="mt-1 leading-none tracking-tight">
              <span className="text-2xl md:text-3xl lg:text-4xl font-semibold tabular-nums text-[color:var(--accent)]">{remainingParts.h}</span>
              <span className="ml-1 mr-3 text-base md:text-lg text-foreground/60 align-[2px]">hrs</span>
              <span className="text-2xl md:text-3xl lg:text-4xl font-semibold tabular-nums text-[color:var(--accent)]">{remainingParts.m}</span>
              <span className="ml-1 mr-3 text-base md:text-lg text-foreground/60 align-[2px]">mins</span>
              <span className="text-2xl md:text-3xl lg:text-4xl font-semibold tabular-nums text-[color:var(--accent)]">{remainingParts.s}</span>
              <span className="ml-1 text-base md:text-lg text-foreground/60 align-[2px]">secs</span>
            </div>
          ) : (
            <div className="text-base md:text-lg font-medium text-foreground/70 mt-1">{loading ? "Loading..." : "No bells scheduled"}</div>
          )}
          {nextBellTimeLabel && (
            <div className="text-xs text-foreground/60 mt-0.5">at {nextBellTimeLabel}</div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => bellPlayer.playBellSound()}
            className="px-3 py-1.5 btn-outline text-sm"
          >
            Test bell
          </button>
        </div>
      </div>
    </div>
  );
}


