"use client";

import {
  type Schedule,
  minutesToTimeString,
  timeStringToMinutes,
  minutesToTimeString12h,
} from "@/lib/schedule";

type Props = { schedule: Schedule };

export default function SchedulePreview({ schedule }: Props) {
  if (!schedule.length) return null;
  return (
    <div className="card p-3">
      <div className="text-base text-foreground/60 mb-3">
        Today&apos;s periods
      </div>
      <div>
        <ul className="grid grid-cols-1 gap-2">
          {schedule.map((p) => {
            const start = timeStringToMinutes(p.start);
            const end = timeStringToMinutes(p.end);
            const duration = end - start;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3 bg-white text-sm flex-wrap"
              >
                <div className="font-medium truncate max-w-full">{p.name}</div>
                <div className="text-sm tabular-nums text-foreground/80 whitespace-nowrap">
                  {minutesToTimeString12h(start)} –{" "}
                  {minutesToTimeString12h(end)}
                  <span className="ml-1 text-foreground/50">
                    ({minutesToTimeString(duration).replace(/^[0-9]{2}:/, "")})
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
