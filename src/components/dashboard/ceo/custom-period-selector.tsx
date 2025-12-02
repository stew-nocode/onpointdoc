"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { 
  format, 
  subDays, 
  subMonths, 
  startOfToday, 
  subYears, 
  setMonth, 
  setYear,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths as subMonth
} from "date-fns"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select"

interface CustomPeriodSelectorProps {
  date?: { from?: Date; to?: Date }
  onSelect?: (range: { from?: Date; to?: Date } | undefined) => void
  className?: string
}

export function CustomPeriodSelector({
  date,
  onSelect,
  className,
}: CustomPeriodSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempDate, setTempDate] = React.useState<{ from?: Date; to?: Date } | undefined>(date)
  const [activePreset, setActivePreset] = React.useState<string | null>(null)

  // États pour la navigation des calendriers
  const [monthFrom, setMonthFrom] = React.useState<Date>(date?.from || new Date())
  const [monthTo, setMonthTo] = React.useState<Date>(date?.to || new Date())

  React.useEffect(() => {
    setTempDate(date)
    if (date?.from) setMonthFrom(date.from)
    if (date?.to) setMonthTo(date.to)
  }, [date])

  const presets = [
    { label: "Aujourd'hui", getValue: () => ({ from: startOfToday(), to: startOfToday() }) },
    { label: "3 derniers jours", getValue: () => ({ from: subDays(startOfToday(), 2), to: startOfToday() }) },
    { label: "7 derniers jours", getValue: () => ({ from: subDays(startOfToday(), 6), to: startOfToday() }) },
    { label: "30 derniers jours", getValue: () => ({ from: subDays(startOfToday(), 29), to: startOfToday() }) },
    { label: "3 derniers mois", getValue: () => ({ from: subMonths(startOfToday(), 3), to: startOfToday() }) },
    { label: "6 derniers mois", getValue: () => ({ from: subMonths(startOfToday(), 6), to: startOfToday() }) },
    { label: "Dernière année", getValue: () => ({ from: subYears(startOfToday(), 1), to: startOfToday() }) },
  ]

  const handlePresetClick = (presetLabel: string, getValue: () => { from: Date; to: Date }) => {
    setActivePreset(presetLabel)
    const newRange = getValue()
    setTempDate(newRange)
    if (newRange.from) setMonthFrom(newRange.from)
    if (newRange.to) setMonthTo(newRange.to)
  }

  const handleApply = () => {
    onSelect?.(tempDate)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempDate(date)
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempDate(undefined)
    setActivePreset(null)
  }

  // Composant calendrier personnalisé
  const CustomCalendar = ({ 
    month, 
    onMonthChange,
    selected,
    onSelect 
  }: { 
    month: Date
    onMonthChange: (date: Date) => void
    selected?: { from?: Date; to?: Date }
    onSelect: (date: Date) => void
  }) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1, locale: fr })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1, locale: fr })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weekDays = ["lu", "ma", "me", "je", "ve", "sa", "di"]

    const handleDateClick = (day: Date) => {
      if (!tempDate?.from || (tempDate.from && tempDate.to)) {
        // Nouvelle sélection
        setTempDate({ from: day, to: undefined })
      } else if (tempDate.from && !tempDate.to) {
        // Compléter la sélection
        if (day < tempDate.from) {
          setTempDate({ from: day, to: tempDate.from })
        } else {
          setTempDate({ from: tempDate.from, to: day })
        }
      }
      onSelect(day)
    }

    const isSelected = (day: Date) => {
      if (!selected?.from) return false
      if (selected.from && !selected.to) {
        return isSameDay(day, selected.from)
      }
      if (selected.from && selected.to) {
        return isSameDay(day, selected.from) || isSameDay(day, selected.to)
      }
      return false
    }

    const isInRange = (day: Date) => {
      if (!selected?.from || !selected?.to) return false
      return isWithinInterval(day, { start: selected.from, end: selected.to })
    }

    const isToday = (day: Date) => {
      return isSameDay(day, new Date())
    }

    return (
      <div className="w-full">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-slate-400 dark:text-slate-500 text-[0.7rem] font-medium uppercase tracking-wider text-center h-9 flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des dates */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, dayIdx) => {
            const isCurrentMonth = isSameMonth(day, month)
            const selected = isSelected(day)
            const inRange = isInRange(day)
            const today = isToday(day)

            return (
              <button
                key={dayIdx}
                type="button"
                onClick={() => handleDateClick(day)}
                className={cn(
                  "h-9 w-9 text-sm font-normal rounded-md flex items-center justify-center transition-colors",
                  !isCurrentMonth && "text-slate-300 dark:text-slate-600",
                  isCurrentMonth && !selected && !inRange && "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800",
                  selected && "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/70",
                  inRange && !selected && "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300",
                  today && !selected && "bg-slate-50 dark:bg-slate-800 font-semibold text-brand dark:text-brand-400"
                )}
              >
                {format(day, "d")}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Composant d'en-tête personnalisé avec Dropdowns
  const CustomCaption = ({ displayMonth, onChange }: { displayMonth: Date, onChange: (date: Date) => void }) => {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
    const months = Array.from({ length: 12 }, (_, i) => i)

    const handleMonthChange = (value: string) => {
      onChange(setMonth(displayMonth, parseInt(value)))
    }

    const handleYearChange = (value: string) => {
      onChange(setYear(displayMonth, parseInt(value)))
    }

    return (
      <div className="flex items-center justify-between mb-4 px-1">
        <Select value={displayMonth.getMonth().toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[110px] h-8 border-0 shadow-none focus:ring-0 px-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100">
            <SelectValue>{format(displayMonth, "MMMM", { locale: fr })}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m.toString()}>
                {format(new Date(2000, m, 1), "MMMM", { locale: fr })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={displayMonth.getFullYear().toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[80px] h-8 border-0 shadow-none focus:ring-0 px-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 justify-end text-slate-900 dark:text-slate-100">
            <SelectValue>{displayMonth.getFullYear()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full sm:w-[300px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "dd MMM yyyy", { locale: fr })} -{" "}
                {format(date.to, "dd MMM yyyy", { locale: fr })}
              </>
            ) : (
              format(date.from, "dd MMM yyyy", { locale: fr })
            )
          ) : (
            <span>Période personnalisée</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw] sm:max-w-none" align="start">
        <div className="flex flex-col sm:flex-row h-auto sm:h-[480px]">
          {/* Sidebar Gauche */}
          <div className="w-full sm:w-[180px] border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 p-4 space-y-1 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6 px-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Personnalisé</span>
              <span className="text-brand text-lg">»</span>
            </div>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sm font-normal h-10 px-3 rounded-md",
                  activePreset === preset.label 
                    ? "text-white bg-brand dark:bg-brand font-medium relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-1 before:bg-brand before:rounded-r-full" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
                onClick={() => handlePresetClick(preset.label, preset.getValue)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Contenu Droit */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md h-10 px-4 bg-white dark:bg-slate-800 shadow-sm w-full sm:min-w-[300px]">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {tempDate?.from ? format(tempDate.from, "dd MMM yyyy", { locale: fr }) : "Début"}
                </span>
                <span className="mx-3 text-slate-400 dark:text-slate-500">-</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {tempDate?.to ? format(tempDate.to, "dd MMM yyyy", { locale: fr }) : "Fin"}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button onClick={handleClear} className="text-sm text-brand dark:text-brand-400 font-medium hover:underline px-2">
                  Effacer filtres
                </button>
                <Button variant="ghost" onClick={handleCancel} className="font-medium text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  Annuler
                </Button>
                <Button onClick={handleApply} className="bg-brand hover:bg-brand/90 px-4 sm:px-6 font-medium shadow-sm shadow-brand/20 text-sm sm:text-base">
                  Appliquer
                </Button>
              </div>
            </div>

            {/* Calendriers - Grille personnalisée */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 flex-1">
              <div className="flex-1 w-full">
                <div className="text-sm font-semibold mb-4 px-1 text-slate-900 dark:text-slate-100">De</div>
                <CustomCaption displayMonth={monthFrom} onChange={setMonthFrom} />
                <CustomCalendar 
                  month={monthFrom}
                  onMonthChange={setMonthFrom}
                  selected={tempDate}
                  onSelect={(day) => {
                    if (!tempDate?.from || (tempDate.from && tempDate.to)) {
                      setTempDate({ from: day, to: undefined })
                    } else if (tempDate.from && !tempDate.to) {
                      if (day < tempDate.from) {
                        setTempDate({ from: day, to: tempDate.from })
                      } else {
                        setTempDate({ from: tempDate.from, to: day })
                      }
                    }
                  }}
                />
              </div>

              <div className="flex-1 w-full">
                <div className="text-sm font-semibold mb-4 px-1 text-slate-900 dark:text-slate-100">À</div>
                <CustomCaption displayMonth={monthTo} onChange={setMonthTo} />
                <CustomCalendar 
                  month={monthTo}
                  onMonthChange={setMonthTo}
                  selected={tempDate}
                  onSelect={(day) => {
                    if (!tempDate?.from || (tempDate.from && tempDate.to)) {
                      setTempDate({ from: day, to: undefined })
                    } else if (tempDate.from && !tempDate.to) {
                      if (day < tempDate.from) {
                        setTempDate({ from: day, to: tempDate.from })
                      } else {
                        setTempDate({ from: tempDate.from, to: day })
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
