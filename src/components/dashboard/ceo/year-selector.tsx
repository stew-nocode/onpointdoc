"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"

interface YearSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  className?: string
}

export function YearSelector({
  value,
  onValueChange,
  className,
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
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
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
  )
}

