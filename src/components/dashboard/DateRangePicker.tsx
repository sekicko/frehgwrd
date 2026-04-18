import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  from: Date;
  to: Date;
  onChange: (from: Date, to: Date) => void;
};

export function DateRangePicker({ from, to, onChange }: Props) {
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover open={openFrom} onOpenChange={setOpenFrom}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("justify-start gap-2 font-normal", !from && "text-muted-foreground")}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {from ? format(from, "MMM d, yyyy") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={from}
            onSelect={(d) => {
              if (d) {
                onChange(d, to);
                setOpenFrom(false);
              }
            }}
            disabled={(d) => d > new Date() || d > to}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-muted-foreground">→</span>

      <Popover open={openTo} onOpenChange={setOpenTo}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("justify-start gap-2 font-normal", !to && "text-muted-foreground")}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {to ? format(to, "MMM d, yyyy") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={to}
            onSelect={(d) => {
              if (d) {
                onChange(from, d);
                setOpenTo(false);
              }
            }}
            disabled={(d) => d > new Date() || d < from}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
