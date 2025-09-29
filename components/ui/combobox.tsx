"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Item = { value: string; label: string };
type Props = {
  items: Item[];
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
};

export function Combobox({
  items, value, onChange,
  placeholder = "Search…",
  emptyText = "No results.",
  className, disabled
}: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = items.find((i) => i.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selected ? selected.label : "Select…"}
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((i) => (
                <CommandItem
                  key={i.value}
                  value={i.label}
                  onSelect={() => {
                    onChange?.(i.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", i.value === value ? "opacity-100" : "opacity-0")} />
                  {i.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
