import { Button } from "@/src/components/ui/button";
import { Option } from "../options";

interface ChoiceGridProps<T extends string | number> {
  options: Option<T>[];
  value: T | null;
  onSelect: (value: T) => void;
}

export default function ChoiceGrid<T extends string | number>({
  options,
  value,
  onSelect,
}: ChoiceGridProps<T>) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={option.value === value ? "default" : "secondary"}
          className="h-auto justify-start py-3 text-left"
          onClick={() => onSelect(option.value)}
        >
          <span className="flex flex-col">
            <span className="font-semibold">{option.label}</span>
            {option.description && (
              <span className="text-xs font-normal opacity-80">
                {option.description}
              </span>
            )}
          </span>
        </Button>
      ))}
    </div>
  );
}
