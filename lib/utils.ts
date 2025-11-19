import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  // Expected format: "DD.MM.YYYY HH.MM.SS"
  const parts = dateStr.split(" ")
  if (parts.length !== 2) return null
  const datePart = parts[0].split(".")
  const timePart = parts[1].split(".")
  if (datePart.length !== 3 || timePart.length !== 3) return null

  const day = parseInt(datePart[0], 10)
  const month = parseInt(datePart[1], 10) - 1 // JS months are 0-based
  const year = parseInt(datePart[2], 10)
  const hour = parseInt(timePart[0], 10)
  const minute = parseInt(timePart[1], 10)
  const second = parseInt(timePart[2], 10)

  return new Date(year, month, day, hour, minute, second)
}
