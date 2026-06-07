/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Formatter for Colombian Pesos (COP)
const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const formatCOP = (value: number): string => {
  return copFormatter.format(value);
};

// Simple date-time formatting utilities
export const formatLocalDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
};

export const formatLocalTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoString;
  }
};
