/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DenominationItem {
  denomination: number;
  quantity: number;
  total: number;
}

export interface AdjustmentItem {
  id: string;
  concept: string;
  value: number;
}

export interface CashClosure {
  id: string;
  createdAt: string; // ISO timestamp string e.g. "2026-06-07T21:50:42Z"

  denominations: DenominationItem[];
  totalCash: number;

  bancolombiaBalance: number;
  bancolombiaCredit: number; // Cupo Bancolombia

  tksBalance: number;
  tksCommission: number; // Comisión TKS
  ptmBalance: number;

  adjustments: AdjustmentItem[];
  observations: string;

  grandTotal: number;
  syncedToSheets?: boolean; // Indicator if synced to Google Sheets
}

export interface GoogleSheetsConfig {
  clientId: string;
  spreadsheetId: string;
  sheetName: string;
  autoSync: boolean;
  accessToken: string | null;
  tokenExpiresAt: number | null; // timestamp millisecond
  lastSyncedAt: string | null; // ISO timestamp string
}

export type ActiveTab = "cuadre" | "historial";
