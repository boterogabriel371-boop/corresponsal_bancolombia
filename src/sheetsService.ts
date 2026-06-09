/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CashClosure, GoogleSheetsConfig } from "./types";
import { formatLocalDate, formatLocalTime } from "./utils";

// Auto-create a sub-tab using Sheets batchUpdate
export async function createGoogleSheetTab(
  spreadsheetId: string,
  title: string,
  token: string
): Promise<boolean> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: title
              }
            }
          }
        ]
      })
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to auto-create sheet tab:", err);
    return false;
  }
}

// Push a single CashClosure record to a Google Spreadsheet
export async function syncClosureToGoogleSheets(
  closure: CashClosure,
  sheetsConfig: GoogleSheetsConfig,
  markClosureSynced: (id: string, synced: boolean) => void,
  updateSheetsConfig: (updates: Partial<GoogleSheetsConfig>) => void
): Promise<{ success: boolean; error: string | null }> {
  const token = sheetsConfig.accessToken;
  const sprId = sheetsConfig.spreadsheetId;
  const activeSheetName = sheetsConfig.sheetName || "Cierres de Caja";

  if (!token || !sprId) {
    return { success: false, error: "Falta autenticación o enlace de hoja de cálculo" };
  }

  const headers = [
    "ID Cierre", 
    "Fecha", 
    "Hora", 
    "Total General (COP)", 
    "Total Efectivo (COP)", 
    "Saldo Bancolombia (COP)", 
    "Cupo Bancolombia (COP)", 
    "Saldo TKS (COP)", 
    "Comisión TKS (COP)", 
    "Saldo PTM (COP)", 
    "Neto Egresos/Ajustes", 
    "Detalle Ajustes", 
    "Observaciones"
  ];

  const totalAdjustments = closure.adjustments.reduce((sum, item) => sum + item.value, 0);
  const adjustmentsDetail = closure.adjustments.map(a => `${a.concept}: ${a.value >= 0 ? "+" : ""}${a.value}`).join(" | ");

  const row = [
    closure.id.toUpperCase(),
    formatLocalDate(closure.createdAt),
    formatLocalTime(closure.createdAt),
    closure.grandTotal,
    closure.totalCash,
    closure.bancolombiaBalance,
    closure.bancolombiaCredit,
    closure.tksBalance,
    closure.tksCommission || 0,
    closure.ptmBalance,
    totalAdjustments,
    adjustmentsDetail || "Ninguno",
    closure.observations || "Sin observaciones"
  ];

  try {
    const attemptAppend = async (valuesArray: any[][]) => {
      return await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sprId}/values/${encodeURIComponent(activeSheetName)}:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ values: valuesArray })
        }
      );
    };

    // 1. Check if headers exist
    let needHeaders = false;
    const getRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sprId}/values/${encodeURIComponent(activeSheetName)}!A1:B1`,
      {
        headers: { "Authorization": `Bearer ${token}` }
      }
    );

    if (getRes.status === 404 || getRes.status === 400) {
      // Create tab if missing
      const tabCreated = await createGoogleSheetTab(sprId, activeSheetName, token);
      if (tabCreated) {
        needHeaders = true;
      } else {
        return { success: false, error: `No se pudo crear la pestaña '${activeSheetName}' en el Spreadsheet.` };
      }
    } else if (getRes.ok) {
      const getData = await getRes.json();
      if (!getData.values || getData.values.length === 0) {
        needHeaders = true;
      }
    }

    if (needHeaders) {
      await attemptAppend([headers]);
    }

    // 2. Append the data row
    const appendRes = await attemptAppend([row]);
    if (!appendRes.ok) {
      const errText = await appendRes.text();
      console.error("Append error payload:", errText);
      return { success: false, error: `HTTP ${appendRes.status}: ${appendRes.statusText}` };
    }

    // Mark as correctly synced
    markClosureSynced(closure.id, true);
    updateSheetsConfig({ lastSyncedAt: new Date().toISOString() });

    return { success: true, error: null };

  } catch (err: any) {
    console.error("Sync error:", err);
    return { success: false, error: err.message || "Error de red conectando con Google Sheets API" };
  }
}
