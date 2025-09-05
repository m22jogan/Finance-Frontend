// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines Tailwind CSS classes and other class values,
 * intelligently merging them to avoid conflicts. (Required by shadcn-ui)
 * @param inputs A list of class values to combine.
 * @returns A string of merged Tailwind CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a numeric amount into a USD currency string.
 * @param amount The amount to format.
 * @returns A string representing the amount in USD currency (e.g., "$1,234.56").
 */
export function formatCurrency(amount: number | string): string {
  // Ensure amount is a number for formatting, converting from string if necessary
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericAmount);
}

/**
 * Formats a date string into a localized, human-readable format.
 * It provides relative dates for "Today" and "Yesterday", and a short date for older dates.
 * @param dateString The date string to format (e.g., ISO string).
 * @returns A formatted date string.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}