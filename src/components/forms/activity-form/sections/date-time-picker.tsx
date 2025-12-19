/**
 * Composant DateTimePicker pour sélectionner date et heure
 * 
 * Composant atomique utilisant Calendar (ShadCN) pour la date
 * et un input time pour l'heure
 */

'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/ui/button';
import { Calendar } from '@/ui/calendar';
import { Label } from '@/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/ui/popover';
import { INPUT_CLASS } from '@/lib/constants/form-styles';
import { cn } from '@/lib/utils';

type DateTimePickerProps = {
  label: string;
  date: Date | undefined;
  time: string; // Format HH:mm ou HH:mm:ss
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  required?: boolean;
  id?: string;
};

/**
 * Composant pour sélectionner une date et une heure
 * 
 * @param label - Label du champ
 * @param date - Date sélectionnée (Date object)
 * @param time - Heure sélectionnée (format HH:mm)
 * @param onDateChange - Callback quand la date change
 * @param onTimeChange - Callback quand l'heure change
 * @param required - Si le champ est requis
 * @param id - ID du champ
 */
export function DateTimePicker({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  required = false,
  id
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Calculer la plage d'années autorisées (année actuelle à +5 ans)
  const currentYear = new Date().getFullYear();
  const fromDate = new Date(currentYear, 0, 1); // 1er janvier de l'année en cours
  const toDate = new Date(currentYear + 5, 11, 31); // 31 décembre dans 5 ans

  // Définir explicitement la plage d'années pour le dropdown
  const fromYear = currentYear;
  const toYear = currentYear + 5;

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id} className="px-1">
        {label}
        {required && <span className="text-status-danger ml-1">*</span>}
      </Label>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Date Picker avec Calendar */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full sm:w-[200px] justify-between font-normal',
                !date && 'text-slate-500'
              )}
            >
              {date ? date.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" sideOffset={5}>
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              fromDate={fromDate}
              toDate={toDate}
              fromYear={fromYear}
              toYear={toYear}
              disabled={(date) => {
                return date < fromDate || date > toDate;
              }}
              onSelect={(selectedDate) => {
                onDateChange(selectedDate);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Time Picker avec Input */}
        <input
          type="time"
          id={id}
          step="1"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          required={required}
          className={cn(
            INPUT_CLASS,
            'w-full sm:w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          )}
        />
      </div>
    </div>
  );
}
