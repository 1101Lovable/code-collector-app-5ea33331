import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value: string | null;
  onChange: (next: string) => void;
  disabled?: boolean;
}

// Helper to pad numbers to 2 digits
const pad2 = (n: number) => n.toString().padStart(2, "0");

export default function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  // Internal segmented state
  const [ampm, setAmPm] = useState<string>(""); // "오전" | "오후"
  const [hour, setHour] = useState<string>(""); // "1".."12"
  const [minute, setMinute] = useState<string>(""); // "00","10",...

  // Options: prevent infinite scroll by providing bounded lists
  const hourOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []); // 1..12
  const minuteOptions = useMemo(() => [0, 10, 20, 30, 40, 50].map(pad2), []); // 10분 단위

  // Parse incoming HH:MM (24h) to segmented AM/PM, hour(1-12), minute
  useEffect(() => {
    if (!value) {
      setAmPm("");
      setHour("");
      setMinute("");
      return;
    }
    const [hStr, mStr] = value.split(":");
    const h = Number(hStr);
    const isAM = h < 12;
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    setAmPm(isAM ? "오전" : "오후");
    setHour(String(displayHour));
    setMinute(pad2(Number(mStr)));
  }, [value]);

  // When all three are selected, emit HH:MM in 24h format
  useEffect(() => {
    if (!ampm || !hour || !minute) return;
    let h = Number(hour);
    if (ampm === "오전") {
      h = h === 12 ? 0 : h; // 12 AM -> 00
    } else {
      h = h === 12 ? 12 : h + 12; // 12 PM stays 12, others +12
    }
    onChange(`${pad2(h)}:${minute}`);
  }, [ampm, hour, minute, onChange]);

  return (
    <div className="flex items-center gap-3">
      {/* AM/PM */}
      <Select value={ampm} onValueChange={setAmPm} disabled={disabled}>
        <SelectTrigger className="h-24 text-senior-2xl px-4 min-w-[7rem]">
          <SelectValue placeholder="오전/오후" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="오전" className="text-senior-xl">오전</SelectItem>
          <SelectItem value="오후" className="text-senior-xl">오후</SelectItem>
        </SelectContent>
      </Select>

      {/* Hour 1..12 */}
      <Select value={hour} onValueChange={setHour} disabled={disabled}>
        <SelectTrigger className="h-24 text-senior-2xl px-4 min-w-[7rem]">
          <SelectValue placeholder="시간" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h} className="text-senior-xl">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Minute 0..59 (10분 단위) */}
      <Select value={minute} onValueChange={setMinute} disabled={disabled}>
        <SelectTrigger className="h-24 text-senior-2xl px-4 min-w-[7rem]">
          <SelectValue placeholder="분" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m} className="text-senior-xl">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
