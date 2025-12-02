"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"

interface YearSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  className?: string
  isActive?: boolean
}

export function YearSelector({
  value,
  onValueChange,
  className,
  isActive = false,
}: YearSelectorProps) {
  // Générer les années de 2023 à l'année actuelle
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    const startYear = 2023
    const yearsList = []
    
    for (let year = currentYear; year >= startYear; year--) {
      yearsList.push(year.toString())
    }
    
    return yearsList
  }, [])

  // Si aucune valeur n'est fournie, on ne sélectionne rien par défaut pour laisser le placeholder
  // ou on pourrait sélectionner l'année en cours si souhaité.
  // Ici, on respecte la props value.

  return (
    <div className="relative">
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger 
          className={`${className} ${isActive ? 'ring-1 ring-green-500/20 dark:ring-green-400/20 border-green-300 dark:border-green-700' : ''} ${!value ? 'opacity-60' : ''}`}
        >
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isActive && value && (
        <div className="absolute -top-2 -right-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-normal px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-800/50">
          Actif
        </div>
      )}
    </div>
  )
}


