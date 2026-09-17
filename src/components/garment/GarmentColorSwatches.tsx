import { garmentColors } from "../../lib/garmentColors";

interface GarmentColorSwatchesProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

export default function GarmentColorSwatches({ value, onChange, className }: GarmentColorSwatchesProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 ${className?.includes("justify-") ? className : `justify-center ${className ?? ""}`}`}
      role="radiogroup"
      aria-label="Garment colour"
    >
      {garmentColors.map((c) => {
        const active = value.toLowerCase() === c.value.toLowerCase();
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={c.name}
            title={c.name}
            onClick={() => onChange(c.value)}
            className={`h-9 w-9 rounded-full border-2 shadow-sm transition-transform ${
              active ? "scale-110 border-ink" : "border-line-soft hover:scale-105 hover:border-ink-soft"
            }`}
            style={{ backgroundColor: c.value }}
          />
        );
      })}
    </div>
  );
}
