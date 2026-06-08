/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useCashStore } from "../store";
import { formatCOP, formatLocalDate, formatLocalTime } from "../utils";
import { CashClosure, GoogleSheetsConfig } from "../types";
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  LogOut, 
  Settings, 
  Link2, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  Sparkles,
  Info,
  ExternalLink,
  Lock
} from "lucide-react";

export default function GoogleSheetsSync() {
  const { 
    closures, 
    sheetsConfig, 
    sheetsSyncing, 
    sheetsError, 
    updateSheetsConfig, 
    setSheetsSyncing, 
    setSheetsError,
    markClosureSynced
  } = useCashStore();

  const [rawUrl, setRawUrl] = useState("");
  const [sheetNameInput, setSheetNameInput] = useState("");
  const [clientIdInput, setClientIdInput] = useState("");
  const [showAdvancePanel, setShowAdvancePanel] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Sync inputs with config state
  useEffect(() => {
    if (sheetsConfig.spreadsheetId) {
      setRawUrl(`https://docs.google.com/spreadsheets/d/${sheetsConfig.spreadsheetId}/edit`);
    } else {
      setRawUrl("");
    }
    setSheetNameInput(sheetsConfig.sheetName || "Cierres de Caja");
    setClientIdInput(sheetsConfig.clientId || "10335006369119-dummy.apps.googleusercontent.com");
  }, [sheetsConfig]);

  // Is Token Valid?
  const isAuthorized = !!sheetsConfig.accessToken && 
    !!sheetsConfig.tokenExpiresAt && 
    sheetsConfig.tokenExpiresAt > Date.now();

  const handleOAuthLogin = () => {
    try {
      const client = clientIdInput.trim() || sheetsConfig.clientId;
      // In a preview environment, redirect back with current URL
      const redirectUri = window.location.origin + window.location.pathname;
      const scope = "https://www.googleapis.com/auth/spreadsheets";
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(client)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent(scope)}` +
        `&prompt=consent`;

      // Redirect for implicit grant flow
      window.location.href = authUrl;
    } catch (e) {
      console.error(e);
      setSheetsError("No se pudo iniciar el flujo de autenticación de Google.");
    }
  };

  const handleLogout = () => {
    updateSheetsConfig({
      accessToken: null,
      tokenExpiresAt: null,
    });
    setSheetsError(null);
    setSyncStatusMsg("Sesión de Google Sheets finalizada.");
  };

  const extractSpreadsheetId = (input: string): string => {
    // Matches standard spreadsheet URLs: /spreadsheets/d/[ID]/
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = input.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback if they write just the pure ID directly
    return input.trim();
  };

  const handleSaveConfigs = async () => {
    const spreadsheetId = extractSpreadsheetId(rawUrl);
    if (!spreadsheetId) {
      setSheetsError("Por favor, ingrese un enlace o ID de Google Sheets válido.");
      return;
    }
    
    setSheetsError(null);
    updateSheetsConfig({
      spreadsheetId,
      sheetName: sheetNameInput.trim() || "Cierres de Caja",
      clientId: clientIdInput.trim() || sheetsConfig.clientId,
    });

    setSyncStatusMsg("¡Enlace de Google Sheets guardado!");

    // If authorized, trigger automatic sync of pending closures or the latest closure
    if (isAuthorized) {
      setSyncStatusMsg("Enlace guardado. Sincronizando datos con tu hoja de cálculo...");
      
      // Delay so state can process, though handleSyncClosure uses rawUrl directly
      setTimeout(async () => {
        const pending = closures.filter(c => !c.syncedToSheets);
        if (pending.length > 0) {
          let successCount = 0;
          for (const item of pending) {
            const success = await handleSyncClosure(item);
            if (success) successCount++;
          }
          if (successCount > 0) {
            setSyncStatusMsg(`¡Listísimo! Se conectó la hoja y se sincronizaron ${successCount} cierres pendientes.`);
          }
        } else if (closures.length > 0) {
          // If no pending, sync the latest anyway so the sheet has data!
          const lastClosure = closures[0];
          setSyncStatusMsg(`Copiando el último cierre de caja en tu Excel para inicializar la hoja...`);
          const success = await handleSyncClosure(lastClosure);
          if (success) {
            setSyncStatusMsg("¡Excelente! El cierre más reciente ha sido copiado a tu nueva hoja de Google Sheets.");
          }
        } else {
          setSyncStatusMsg("¡Enlace guardado! La hoja de cálculo está lista. Se sincronizará automáticamente cuando guardes tu próximo cierre.");
        }
        setTimeout(() => setSyncStatusMsg(null), 6000);
      }, 500);
    } else {
      setTimeout(() => setSyncStatusMsg("Enlace guardado. Conecta tu cuenta de Google arriba con el botón negro para iniciar la sincronización."), 1500);
    }
  };

  const handleSaveClientId = () => {
    updateSheetsConfig({
      clientId: clientIdInput.trim() || "10335006369119-dummy.apps.googleusercontent.com",
    });
    setSyncStatusMsg("Google Client ID guardado correctamente.");
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  // Helper: auto-create Sheet if it doesn't exist
  const createSheetTab = async (spreadsheetId: string, title: string, token: string) => {
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
  };

  // Push rows to sheets
  const handleSyncClosure = async (closure: CashClosure, isAuto = false): Promise<boolean> => {
    if (!isAuthorized || !sheetsConfig.accessToken) {
      if (!isAuto) setSheetsError("Debe iniciar sesión en Google primero.");
      return false;
    }

    const sprId = extractSpreadsheetId(rawUrl) || sheetsConfig.spreadsheetId;
    if (!sprId) {
      if (!isAuto) setSheetsError("Por favor ingrese el enlace o ID de la hoja Google Sheets.");
      return false;
    }

    const activeSheetName = sheetsConfig.sheetName || "Cierres de Caja";

    setSheetsSyncing(true);
    setSheetsError(null);
    if (!isAuto) setSyncStatusMsg(`Sincronizando cierre ${closure.id.slice(0, 8)}...`);

    const headers = [
      "ID Cierre", 
      "Fecha", 
      "Hora", 
      "Total General (COP)", 
      "Total Efectivo (COP)", 
      "Saldo Bancolombia (COP)", 
      "Cupo Bancolombia (COP)", 
      "Saldo TKS (COP)", 
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
      closure.ptmBalance,
      totalAdjustments,
      adjustmentsDetail || "Ninguno",
      closure.observations || "Sin observaciones"
    ];

    try {
      // Helper to append values
      const attemptAppend = async (valuesArray: any[][]) => {
        return await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sprId}/values/${encodeURIComponent(activeSheetName)}:append?valueInputOption=USER_ENTERED`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sheetsConfig.accessToken}`
            },
            body: JSON.stringify({ values: valuesArray })
          }
        );
      };

      // 1. Let's inspect if we should append the headers first by reading A1
      let needHeaders = false;
      const getRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sprId}/values/${encodeURIComponent(activeSheetName)}!A1:B1`,
        {
          headers: { "Authorization": `Bearer ${sheetsConfig.accessToken}` }
        }
      );

      if (getRes.status === 404 || getRes.status === 400) {
        // Sheet tab probably doesn't exist, let's create it!
        const tabCreated = await createSheetTab(sprId, activeSheetName, sheetsConfig.accessToken);
        if (tabCreated) {
          needHeaders = true;
        } else {
          throw new Error("No se pudo crear ni encontrar la pestaña de la hoja!");
        }
      } else if (getRes.ok) {
        const getData = await getRes.json();
        if (!getData.values || getData.values.length === 0) {
          needHeaders = true;
        }
      }

      // 2. Append headers if empty
      if (needHeaders) {
        await attemptAppend([headers]);
      }

      // 3. Append actual closure row
      const appendRes = await attemptAppend([row]);
      
      if (!appendRes.ok) {
        const errMsg = await appendRes.text();
        console.error("Append row error:", errMsg);
        throw new Error(`Error de Sheets API: ${appendRes.statusText}`);
      }

      markClosureSynced(closure.id, true);
      updateSheetsConfig({ lastSyncedAt: new Date().toISOString() });
      if (!isAuto) {
        setSyncStatusMsg("Sincronizado correctamente a Google Sheets!");
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
      return true;

    } catch (err: any) {
      console.error(err);
      setSheetsError(err.message || "No se pudo sincronizar el cierre. Valide el enlace e ID.");
      return false;
    } finally {
      setSheetsSyncing(false);
    }
  };

  // Sync all non-synced closures in batch
  const handleSyncAllPending = async () => {
    const pending = closures.filter(c => !c.syncedToSheets);
    if (pending.length === 0) {
      setSyncStatusMsg("No hay ningún cierre pendiente por sincronizar.");
      setTimeout(() => setSyncStatusMsg(null), 3500);
      return;
    }

    let successCount = 0;
    for (const item of pending) {
      const success = await handleSyncClosure(item);
      if (success) {
        successCount++;
      } else {
        break; // Stop on error to prevent cascading auth errors
      }
    }

    setSyncStatusMsg(`Sincronizados ${successCount} de ${pending.length} cierres pendientes.`);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  // Sync immediately if autoSync is enabled and a new closure is saved
  useEffect(() => {
    if (isAuthorized && sheetsConfig.autoSync && closures.length > 0) {
      const target = closures[0];
      if (!target.syncedToSheets) {
        handleSyncClosure(target, true);
      }
    }
  }, [closures, isAuthorized]);

  const extractedId = sheetsConfig.spreadsheetId;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-xs flex flex-col gap-4.5 transition-colors duration-200" id="gsheets-sync-panel">
      
      {/* Title */}
      <div className="flex items-center justify-between" id="gsheets-header">
        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2" id="gsheets-title">
          <FileSpreadsheet className="text-emerald-650 dark:text-emerald-500 animate-pulse" size={16} />
          Google Sheets Sync
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isAuthorized 
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
            : "bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400"
        }`} id="gsheets-badge">
          {isAuthorized ? "Google Activo" : "No Conectado"}
        </span>
      </div>

      {/* Main Authentication Flow Section */}
      {!isAuthorized ? (
        <div className="flex flex-col gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl" id="gsheets-unauth-box">
          <p className="text-xs text-slate-500 dark:text-slate-400 tracking-tight leading-relaxed font-semibold">
            Sincroniza tus registros diarios de cuadre de caja de forma automática y segura en una hoja de Google Excel, con tu autorización.
          </p>

          {/* Quick client ID tip */}
          <div className="flex items-start gap-2 bg-indigo-50/40 dark:bg-indigo-950/25 border border-indigo-100/50 dark:border-indigo-900/30 p-2.5 rounded-lg text-[10px] text-indigo-700 dark:text-indigo-400 font-bold" id="gsheets-scopes-tip">
            <Lock size={12} className="shrink-0 mt-0.5" />
            <span>La app usará la autenticación de cuenta para agregar filas de cierres directamente con tus permisos.</span>
          </div>

          {/* Warning if they are using the dummy Client ID */}
          {typeof window !== "undefined" && (clientIdInput.includes("dummy") || sheetsConfig.clientId.includes("dummy")) && (
            <div className="flex flex-col gap-1.5 p-3 bg-amber-50/70 dark:bg-amber-955/20 border border-amber-250 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-850 dark:text-amber-400 font-bold animate-fade-in" id="gsheets-dummy-warning">
              <span className="flex items-center gap-1 font-extrabold uppercase tracking-wide text-[9px] text-amber-700 dark:text-amber-450">
                <AlertTriangle size={12} className="text-amber-550 shrink-0" />
                Configuración Requerida
              </span>
              <p className="leading-relaxed font-semibold text-slate-850 dark:text-slate-300">
                Para que la autenticación de Google Sheets funcione en tu servidor actual (<code>{window.location.hostname}</code>), despliega abajo la sección <strong>"Personalizar Credenciales Client ID"</strong> e ingresa tu propio <strong>Client ID de Google Cloud</strong> con el Origen de JavaScript y URI de redirección autorizados para: <code>{window.location.origin}</code>. El ID por defecto de pruebas de AI Studio arroja un error 401 en otros entornos.
              </p>
            </div>
          )}

          <button
            onClick={handleOAuthLogin}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
            id="gsi-sheets-btn"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0 fill-white">
              <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Conectar Google Sheets
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5" id="gsheets-auth-box">
          {/* Linked Configuration Fields */}
          <div className="flex flex-col gap-2.5" id="gsheets-field-inputs">
            
            {/* Spreadsheet link */}
            <div className="flex flex-col gap-1" id="field-spr-url">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1" htmlFor="spreadsheet-url-input">
                <Link2 size={11} className="text-slate-400" />
                Enlace / ID Spreadsheet de Google
              </label>
              <input
                type="text"
                id="spreadsheet-url-input"
                value={rawUrl}
                onChange={(e) => setRawUrl(e.target.value)}
                placeholder="Pegue el link del Spreadsheet o el ID de la hoja..."
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none rounded-lg p-2 text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>

            {/* Sheet Sub-tab name */}
            <div className="flex flex-col gap-1" id="field-sheet-name">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest" htmlFor="sheet-tab-name-input">
                Nombre de la Pestaña
              </label>
              <input
                type="text"
                id="sheet-tab-name-input"
                value={sheetNameInput}
                onChange={(e) => setSheetNameInput(e.target.value)}
                placeholder="Cierres de Caja"
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none rounded-lg p-2 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Auto sync option */}
            <label className="flex items-center gap-2 mt-1 cursor-pointer select-none" id="label-auto-sync">
              <input
                type="checkbox"
                checked={sheetsConfig.autoSync}
                onChange={(e) => updateSheetsConfig({ autoSync: e.target.checked })}
                className="w-3.5 h-3.5 accent-emerald-650 cursor-pointer rounded"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Sincronizar automáticamente al guardar cierres
              </span>
            </label>
          </div>

          {/* Action buttons & Save */}
          <div className="flex gap-2 items-center" id="gsheets-actions-row">
            <button
              onClick={handleSaveConfigs}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg inline-flex items-center gap-1 cursor-pointer"
              id="btn-save-sheets-config"
              title="Guardar Enlace y Configuración"
            >
              <Save size={12} />
              Guardar Links
            </button>

            {extractedId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${extractedId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 rounded-lg inline-flex items-center gap-1.5"
                id="link-open-spreadsheet"
              >
                Abrir Excel
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div className="h-px bg-slate-150 dark:bg-slate-800" id="gsheets-divider"></div>

          {/* Sincronización manual total */}
          <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-3 rounded-xl" id="manual-sync-block">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
              Sincroniza todos los cuadres que se hayan guardado localmente en esta jornada y no se encuentren en Google Sheets.
            </p>
            <div className="flex gap-2 mt-0.5 justify-between items-center" id="manual-sync-actions">
              <button
                onClick={handleSyncAllPending}
                disabled={sheetsSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-emerald-650 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg border border-transparent shadow-3xs cursor-pointer"
                id="btn-sync-all-closures"
              >
                <RefreshCw size={12} className={sheetsSyncing ? "animate-spin" : ""} />
                Sincronizar Pendientes
              </button>

              <button
                onClick={handleLogout}
                className="px-2 py-1 text-[10px] text-rose-650 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/25 border border-transparent rounded-md inline-flex items-center gap-1 font-bold cursor-pointer transition-colors"
                id="btn-logout-sheets"
                title="Cerrar sesión de Google"
              >
                <LogOut size={12} />
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced OAuth Client ID Customization */}
      <div className="bg-slate-50/50 dark:bg-slate-950/10 rounded-xl border border-slate-200/60 dark:border-slate-850/60 overflow-hidden" id="gsheets-advanced-block">
        <button
          onClick={() => setShowAdvancePanel(!showAdvancePanel)}
          className="w-full flex items-center justify-between px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:bg-slate-100/50 dark:hover:bg-slate-850/40"
          id="toggle-advanced-btn"
        >
          <span className="flex items-center gap-1.5">
            <Settings size={12} />
            Personalizar Credenciales Client ID
          </span>
          <span>{showAdvancePanel ? "Ocultar" : "Mostrar"}</span>
        </button>

        {showAdvancePanel && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 bg-white dark:bg-slate-900" id="advanced-settings-body">
            <div className="flex flex-col gap-1" id="field-client-id">
              <label className="text-[9px] font-extrabold text-slate-405 dark:text-slate-500 uppercase tracking-widest" htmlFor="client-id-input">
                Google OAuth Client ID
              </label>
              <input
                type="text"
                id="client-id-input"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="Ingrese su Client ID de Google Cloud..."
                className="w-full text-[10px] face-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-650 focus:outline-none rounded p-1.5 text-slate-600 dark:text-slate-400 font-mono"
              />
              <p className="text-[9px] leading-relaxed text-slate-400 dark:text-slate-500 font-medium font-semibold">
                Por defecto se utiliza el Client ID de pruebas de AI Studio. Si tu aplicación se despliega en un dominio propio o localhost, crea y pega tu propio Client ID desde Google Cloud Console para evitar errores de origen cruzado de redirección.
              </p>
              <button
                onClick={handleSaveClientId}
                className="mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-extrabold text-slate-100 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-3xs"
                id="btn-save-custom-client-id"
              >
                <Save size={12} />
                Guardar Client ID personalizado
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Information / Log Overlays */}
      {syncStatusMsg && (
        <div className="p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 animate-fade-in" id="gsheets-status-alert">
          <CheckCircle2 size={13} className="shrink-0 text-emerald-700 dark:text-emerald-400" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {sheetsError && (
        <div className="p-2.5 rounded-xl text-xs font-bold flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 animate-fade-in" id="gsheets-error-alert">
          <AlertTriangle size={13} className="shrink-0 text-rose-700 dark:text-rose-400 mt-0.5" />
          <span>{sheetsError}</span>
        </div>
      )}

    </div>
  );
}
