"use client";

import { useEffect, useMemo, useState } from "react";
import { type Period, type Schedule, normalizeSchedule } from "@/lib/schedule";

type Props = {
  value: Schedule;
  onChange: (schedule: Schedule) => void;
  onResetAll?: () => void;
  onDeleteAll?: () => void;
};

function createEmptyPeriod(durationMinutes = 45): Period {
  const now = new Date();
  const startMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = startMinutes + durationMinutes;
  
  return {
    id: crypto.randomUUID(),
    name: "",
    start: `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`,
    end: `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`,
  };
}

export default function ScheduleEditor({ value, onChange, onResetAll, onDeleteAll }: Props) {
  const [draft, setDraft] = useState<Schedule>(value);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addStart, setAddStart] = useState("08:00");
  const [addEnd, setAddEnd] = useState("08:45");

  const sortedDraft = useMemo(() => normalizeSchedule(draft), [draft]);

  // Keep local draft in sync when parent value changes (e.g., after loading from storage)
  useEffect(() => {
    // Avoid unnecessary state churn to prevent loops
    if (JSON.stringify(value) !== JSON.stringify(draft)) {
      setDraft(value);
    }
  }, [value, draft]);

  function openAddModal() {
    const p = createEmptyPeriod();
    setAddName("");
    setAddStart(p.start);
    setAddEnd(p.end);
    setIsAddOpen(true);
  }

  function addPeriodFromModal() {
    const startMinutes = parseInt(addStart.slice(0,2)) * 60 + parseInt(addStart.slice(3));
    const endMinutes = parseInt(addEnd.slice(0,2)) * 60 + parseInt(addEnd.slice(3));
    if (endMinutes <= startMinutes) {
      alert("End time must be after start time");
      return;
    }
    const newPeriod: Period = {
      id: crypto.randomUUID(),
      name: addName.trim() || "Untitled",
      start: addStart,
      end: addEnd,
    };
    setDraft((prev) => [...prev, newPeriod]);
    setIsAddOpen(false);
  }

  function updateField(id: string, field: keyof Period, val: string) {
    setDraft((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  }

  function remove(id: string) {
    setDraft((prev) => prev.filter((p) => p.id !== id));
  }

  // Propagate changes to parent after render, avoiding parent updates during child render
  useEffect(() => {
    const normalized = normalizeSchedule(draft);
    if (JSON.stringify(normalized) !== JSON.stringify(value)) {
      onChange(normalized);
    }
  }, [draft, value, onChange]);

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-3 pr-2">
        <h2 className="text-2xl font-semibold font-display">Schedule</h2>
        <div className="flex items-center gap-2">
          {onResetAll && (
            <button
              onClick={onResetAll}
              className="px-2.5 py-1.5 text-sm rounded-md border border-black/15 bg-white hover:bg-gray-50"
            >
              Reset all
            </button>
          )}
          {onDeleteAll && (
            <button
              onClick={() => {
                const ok = window.confirm("Delete all periods? This cannot be undone.");
                if (ok) onDeleteAll();
              }}
              className="px-2.5 py-1.5 text-sm rounded-md border border-red-200 text-red-700 hover:bg-red-50"
            >
              Delete all
            </button>
          )}
          <button
            onClick={openAddModal}
            className="px-2.5 py-1.5 text-sm rounded-md bg-[color:var(--accent)] text-white hover:bg-[#195a44]"
          >
            Add period
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2.5 pr-2">
          {sortedDraft.length === 0 && (
            <div className="card p-4 text-sm text-foreground/70">
              No periods yet. Click &quot;Add period&quot; to get started.
            </div>
          )}

          {sortedDraft.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-black/10 p-3 bg-white/60 backdrop-blur-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
                <div className="flex flex-col">
                  <label className="text-sm mb-0.5 text-foreground/70">Name</label>
                  <input
                    value={p.name}
                    onChange={(e) => updateField(p.id, "name", e.target.value)}
                    placeholder="e.g., Period 1"
                    className="px-3 py-2 text-base rounded-md border border-black/10 bg-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm mb-0.5 text-foreground/70">Start</label>
                  <input
                    type="time"
                    value={p.start}
                    onChange={(e) => updateField(p.id, "start", e.target.value)}
                    className="px-3 py-2 text-base rounded-md border border-black/10 bg-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm mb-0.5 text-foreground/70">End</label>
                  <input
                    type="time"
                    value={p.end}
                    onChange={(e) => updateField(p.id, "end", e.target.value)}
                    className="px-3 py-2 text-base rounded-md border border-black/10 bg-white"
                  />
                </div>
                <div className="flex gap-2 md:justify-end">
                  <button
                    onClick={() => remove(p.id)}
                    className="px-2.5 py-1.5 text-base rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-md p-4">
            <div className="text-lg font-semibold font-display mb-2">Add period</div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col">
                <label className="text-sm mb-0.5 text-foreground/70">Name</label>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g., Period 6"
                  className="px-3 py-2 text-base rounded-md border border-black/10 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-sm mb-0.5 text-foreground/70">Start</label>
                  <input
                    type="time"
                    value={addStart}
                    onChange={(e) => setAddStart(e.target.value)}
                    className="px-3 py-2 text-base rounded-md border border-black/10 bg-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm mb-0.5 text-foreground/70">End</label>
                  <input
                    type="time"
                    value={addEnd}
                    onChange={(e) => setAddEnd(e.target.value)}
                    className="px-3 py-2 text-base rounded-md border border-black/10 bg-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsAddOpen(false)} className="px-2.5 py-1.5 text-sm rounded-md border border-black/15 bg-white hover:bg-gray-50">Cancel</button>
              <button onClick={addPeriodFromModal} className="px-3 py-1.5 text-sm rounded-md bg-[color:var(--accent)] text-white hover:bg-[#195a44]">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


