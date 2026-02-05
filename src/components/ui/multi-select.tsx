import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "./badge";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type MultiSelectProps = {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
};

export const MultiSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select",
  allowCreate = false,
  className,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  const hasQuery = query.trim().length > 0;
  const canCreate = allowCreate && hasQuery && !options.some((opt) => opt.toLowerCase() === query.trim().toLowerCase());

  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }
    onChange([...value, option]);
  };

  const createOption = () => {
    const next = query.trim();
    if (!next) return;
    onChange([...value, next]);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-[36px] w-full flex-wrap items-center gap-2 rounded-lg bg-base-200/40 px-3 py-2 text-sm text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 ring-offset-base-100",
            className
          )}
        >
          {value.length === 0 ? (
            <span className="text-base-content/50">{placeholder}</span>
          ) : (
            value.map((item) => (
              <Badge key={item} variant="secondary" className="flex items-center gap-1 text-[11px]">
                {item}
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-1 rounded-full hover:bg-base-300/60 p-0.5"
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(value.filter((entry) => entry !== item));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onChange(value.filter((entry) => entry !== item));
                    }
                  }}
                >
                  <X size={10} />
                </span>
              </Badge>
            ))
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-3">
        <div className="space-y-2">
          <Input
            placeholder={allowCreate ? "Filter or add..." : "Filter..."}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canCreate) {
                event.preventDefault();
                createOption();
              }
            }}
          />
          {canCreate && (
            <button
              type="button"
              className="w-full rounded-md border border-base-200/60 px-2 py-1 text-xs text-left hover:bg-base-200/50 flex items-center gap-2"
              onClick={createOption}
            >
              <Plus size={12} /> Add "{query.trim()}"
            </button>
          )}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <div className="text-xs text-base-content/60">No matches</div>
            ) : (
              filtered.map((option) => {
                const selected = value.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-base-200/60 flex items-center gap-2"
                    onClick={() => toggle(option)}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded border border-base-300 flex items-center justify-center",
                        selected && "bg-primary text-primary-content border-transparent"
                      )}
                    >
                      {selected && <Check size={10} />}
                    </span>
                    {option}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
