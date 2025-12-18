"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        month_caption: "flex justify-center pt-1 pb-2 relative items-center min-h-[2.5rem]",
        caption_label: "hidden",
        dropdowns: "flex gap-2 justify-center w-full",
        dropdown_root: "relative",
        dropdown: "appearance-none bg-transparent border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 min-w-[110px]",
        dropdown_month: "pr-8",
        dropdown_year: "pr-8",
        chevron: "hidden",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 top-1"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 top-1"
        ),
        month_grid: "w-full border-collapse mt-4",
        weekdays: "flex mb-2",
        weekday:
          "text-slate-500 rounded-md w-9 font-medium text-xs uppercase dark:text-slate-400",
        week: "flex w-full mt-1",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
        ),
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        range_end: "day-range-end",
        selected:
          "bg-brand text-white hover:bg-brand hover:text-white focus:bg-brand focus:text-white",
        today:
          "bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white",
        outside:
          "text-slate-400 opacity-40 dark:text-slate-600 dark:opacity-60",
        disabled: "text-slate-300 opacity-50 dark:text-slate-600 line-through",
        range_middle:
          "aria-selected:bg-brand-50 aria-selected:text-brand-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
