/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useCashStore } from "./store";
import { CashClosure } from "./types";
import { formatCOP, formatLocalDate, formatLocalTime } from "./utils";
import Header from "./components/Header";
import CashCounterTable from "./components/CashCounterTable";
import OperationalBalances from "./components/OperationalBalances";
import DynamicAdjustments from "./components/DynamicAdjustments";
import ConsolidatedSummary from "./components/ConsolidatedSummary";
import ObservationsBox from "./components/ObservationsBox";
import ClosureHistory from "./components/ClosureHistory";
import PrintReportView from "./components/PrintReportView";
import GoogleSheetsSync from "./components/GoogleSheetsSync";
import { syncClosureToGoogleSheets } from "./sheetsService";

// Libraries for PDF generation
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import { 
  CheckCircle2, 
  HelpCircle, 
  X, 
  FileText, 
  Download, 
  Loader2,
  Trash2,
  Info,
  DollarSign
} from "lucide-react";

export default function App() {
  const {
    activeTab,
    setActiveTab,
    saveCurrentClosure,
    resetCurrentClosure,
    denominations,
    bancolombiaBalance,
    bancolombiaCredit,
    tksBalance,
    ptmBalance,
    adjustments,
    observations,
    closures,
    sheetsConfig,
    markClosureSynced,
    updateSheetsConfig,
  } = useCashStore();

  // Dark / Light Mode state with LocalStorage persistence
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
      // Default to light
      return "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    } catch (e) {
      console.error("Theme persistence error", e);
    }
  }, [theme]);

  // Google Sheets OAuth Token Grabber on Mount
  useEffect(() => {
    try {
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const expiresIn = params.get("expires_in");
        
        if (accessToken) {
          const expiresMs = expiresIn ? parseInt(expiresIn, 10) * 1000 : 3600 * 1000;
          const expiresAt = Date.now() + expiresMs;
          
          updateSheetsConfig({
            accessToken,
            tokenExpiresAt: expiresAt,
          });
          
          // Clean the hash cleanly from address bar
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    } catch (e) {
      console.error("Error parsing OAuth token on load:", e);
    }
  }, [updateSheetsConfig]);

  // Google Sheets Auto-Sync Background Handler
  useEffect(() => {
    const isAuthorized = !!sheetsConfig.accessToken && 
      !!sheetsConfig.tokenExpiresAt && 
      sheetsConfig.tokenExpiresAt > Date.now();

    if (isAuthorized && sheetsConfig.autoSync && sheetsConfig.spreadsheetId && closures.length > 0) {
      const latestClosure = closures[0];
      if (!latestClosure.syncedToSheets) {
        // Run background sync
        syncClosureToGoogleSheets(latestClosure, sheetsConfig, markClosureSynced, updateSheetsConfig)
          .then((res) => {
            if (res.success) {
              console.log(`Auto-sincronizado exitoso para cierre: ${latestClosure.id}`);
            } else {
              console.warn(`Error auto-sincronizando: ${res.error}`);
            }
          });
      }
    }
  }, [closures, sheetsConfig, markClosureSynced, updateSheetsConfig]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Dialog/Modal states
  const [showNewDayModal, setShowNewDayModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [justSavedClosure, setJustSavedClosure] = useState<CashClosure | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  // Hidden print element target
  const [printClosure, setPrintClosure] = useState<CashClosure | null>(null);

  // Initialize hidden printing target with current state for immediate actions
  const getCurrentStateAsClosure = (): CashClosure => {
    const totalCash = denominations.reduce((acc, item) => acc + item.total, 0);
    const totalAdjustments = adjustments.reduce((acc, item) => acc + item.value, 0);
    const grandTotal =
      totalCash +
      bancolombiaBalance +
      tksBalance +
      ptmBalance +
      totalAdjustments;

    return {
      id: "DRAFT_ACTUAL",
      createdAt: new Date().toISOString(),
      denominations,
      totalCash,
      bancolombiaBalance,
      bancolombiaCredit,
      tksBalance,
      ptmBalance,
      adjustments,
      observations,
      grandTotal,
    };
  };

  // Handler to export ANY closure as PDF using jsPDF + html2canvas
  const handleExportPDF = async (closure: CashClosure) => {
    setIsExporting(true);
    setExportMessage("Generando documento PDF de alta fidelidad...");
    setPrintClosure(closure);

    // Wait short delay to guarantee React has updated the offscreen DOM
    setTimeout(async () => {
      try {
        const element = document.getElementById("hidden-print-report-wrapper");
        if (!element) {
          throw new Error("No se pudo encontrar el contenedor de impresión (#hidden-print-report-wrapper).");
        }

        // Workaround for html2canvas crashing on Tailwind v4's oklch() color function parser.
        // We temporarily redefine document.styleSheets to be empty during parsing so html2canvas
        // bypasses raw stylesheet processing and relies solely on the browser-resolved computed
        // style values (which the browser naturally translates to standard RGB/RGBA values!).
        const originalStyleSheetsDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "styleSheets");
        Object.defineProperty(document, "styleSheets", {
          get: () => [],
          configurable: true,
        });

        let canvas;
        try {
          canvas = await html2canvas(element, {
            scale: 2, // High DPI rendering
            useCORS: true,
            logging: true, // Enable logging for debugging
            backgroundColor: "#ffffff",
            windowWidth: 792, // Explicitly set width to prevent viewport scaling bugs
          });
        } finally {
          // Restore original document.styleSheets descriptor
          if (originalStyleSheetsDescriptor) {
            Object.defineProperty(document, "styleSheets", originalStyleSheetsDescriptor);
          } else {
            delete (document as any).styleSheets;
          }
        }

        const imgData = canvas.toDataURL("image/png", 1.0);
        
        // Use custom sizing for letter page (612pt width x 792pt height)
        const pdf = new jsPDF({
          orientation: "p",
          unit: "pt",
          format: "letter",
        });

        const pdfWidth = 612;
        const pdfHeight = 792;
        
        // Calculate proportional height
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
        
        const dateStr = new Date(closure.createdAt).toISOString().split("T")[0];
        pdf.save(`Cuadre-de-Caja_${dateStr}.pdf`);
      } catch (err: any) {
        console.error("PDF generation failed:", err);
        alert(`Ocurrió un error al generar el PDF: ${err?.message || err}. Por favor reintente o utilice la opción de imprimir directamente.`);
      } finally {
        setIsExporting(false);
        setExportMessage("");
      }
    }, 450);
  };

  // Direct print action
  const handlePrint = (closure: CashClosure) => {
    setPrintClosure(closure);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleSaveClosure = () => {
    const saved = saveCurrentClosure();
    setJustSavedClosure(saved);
    setShowSaveSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200" id="app-root-container">
      
      {/* HEADER SECTION */}
      <Header
        onSave={handleSaveClosure}
        onPrint={() => handlePrint(getCurrentStateAsClosure())}
        onExportPDF={() => handleExportPDF(getCurrentStateAsClosure())}
        onNewDay={() => setShowNewDayModal(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* PRIMARY VIEWER PORTAL */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6" id="app-main-viewport">
        {activeTab === "cuadre" ? (
          /* TAB 1: CUADRE ACTUAL */
          <div className="flex flex-col lg:flex-row gap-6 items-start" id="cuadre-content-layout">
            
            {/* Left Dominant Panel: Cash Counting Table & Observations (occupies most of the screen) */}
            <div className="w-full lg:flex-1 flex flex-col gap-6" id="left-dominant-column">
              <CashCounterTable />
              <ObservationsBox />
            </div>

            {/* Right Panel: Side Balances, Adjustments, and Consolidated sums */}
            <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 lg:sticky lg:top-24" id="right-sidebar-column">
              <ConsolidatedSummary />
              <OperationalBalances />
              <DynamicAdjustments />
              <GoogleSheetsSync />
            </div>

          </div>
        ) : (
          /* TAB 2: HISTORIAL DE CIERRES (INDEPENDENT SCREEN) */
          <ClosureHistory
            onPrintHistoric={handlePrint}
            onExportHistoricPDF={handleExportPDF}
          />
        )}
      </main>

      {/* PERSISTENT INVISIBLE PRINT CONTENT FOR HTML2CANVAS & DIRECT SYSTEM PRINTING */}
      <div 
        style={{ position: "fixed", left: "0", top: "0", width: "792px", height: "auto", opacity: "0.01", pointerEvents: "none", zIndex: "-9999", overflow: "hidden" }}
        className="bg-white"
        id="hidden-print-zone"
      >
        <div id="hidden-print-report-wrapper" className="bg-white" style={{ width: "792px" }}>
          <PrintReportView closure={printClosure || getCurrentStateAsClosure()} elementId="rendered-pdf-layout" />
        </div>
      </div>

      {/* EXTRA STYLING FOR DIRECT @MEDIA PRINTING DIRECT FROM CHROME/EDGE/SAFARI */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          #hidden-print-zone, #hidden-print-zone * {
            visibility: visible;
          }
          #hidden-print-zone {
            position: absolute;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            opacity: 1 !important;
            z-index: 99999 !important;
            overflow: visible !important;
          }
          #hidden-print-report-wrapper {
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* MODAL 1: NUEVO DÍA DIALOGUE */}
      {showNewDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="modal-nuevo-dia">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-150 dark:border-slate-800 flex flex-col gap-5 animate-scale-up" id="modal-nd-content">
            <div className="flex items-start gap-3.5" id="modal-nd-header">
              <div className="p-3 bg-amber-50 dark:bg-amber-955 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 rounded-xl" id="modal-nd-icon">
                <HelpCircle size={22} className="animate-pulse" />
              </div>
              <div id="modal-nd-title-desc">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base" id="modal-nd-title">
                  Iniciar Nuevo Día de Caja
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed" id="modal-nd-body">
                  ¿Deseas conservar los saldos de plataformas administrativas (<strong className="text-gray-800 dark:text-slate-200">Bancolombia, TKS, PTM</strong>) para el siguiente turno de cuadre?
                </p>
              </div>
            </div>

            {/* Summarized visual balances for context */}
            <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-150 dark:border-slate-700/80 rounded-xl p-3.5 flex flex-col gap-2 text-xs font-semibold" id="modal-nd-context-sums">
              <div className="flex justify-between" id="nd-context-saldo">
                <span className="text-gray-500 dark:text-slate-400">Saldo Bancolombia:</span>
                <span className="font-mono text-gray-800 dark:text-slate-200">{formatCOP(bancolombiaBalance)}</span>
              </div>
              <div className="flex justify-between" id="nd-context-cupo">
                <span className="text-gray-500 dark:text-slate-400">Cupo Bancolombia (Informativo):</span>
                <span className="font-mono text-gray-800 dark:text-slate-200">{formatCOP(bancolombiaCredit)}</span>
              </div>
              <div className="flex justify-between" id="nd-context-tks">
                <span className="text-gray-500 dark:text-slate-400">Saldo TKS:</span>
                <span className="font-mono text-gray-800 dark:text-slate-200">{formatCOP(tksBalance)}</span>
              </div>
              <div className="flex justify-between" id="nd-context-ptm">
                <span className="text-gray-500 dark:text-slate-400">Saldo PTM:</span>
                <span className="font-mono text-gray-800 dark:text-slate-200">{formatCOP(ptmBalance)}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end" id="modal-nd-actions">
              <button
                onClick={() => {
                  resetCurrentClosure(true);
                  setShowNewDayModal(false);
                }}
                className="flex-1 sm:flex-initial inline-flex justify-center items-center px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                id="btn-nd-yes"
              >
                Sí, conservar saldos
              </button>
              <button
                onClick={() => {
                  resetCurrentClosure(false);
                  setShowNewDayModal(false);
                }}
                className="flex-1 sm:flex-initial inline-flex justify-center items-center px-4 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-850 dark:hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
                id="btn-nd-no"
              >
                No, reiniciar todo
              </button>
              <button
                onClick={() => setShowNewDayModal(false)}
                className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                id="btn-nd-cancel"
                title="Cancelar operación"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GUARDADO EXITOSO SNAPSHOT OVERLAY */}
      {showSaveSuccessModal && justSavedClosure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="modal-save-success">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-150 dark:border-slate-800 flex flex-col gap-5 animate-scale-up" id="modal-ss-content">
            <div className="flex flex-col items-center text-center gap-3 pb-2" id="modal-ss-banner">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs" id="modal-ss-[ok-icon]">
                <CheckCircle2 size={32} className="animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg" id="modal-ss-title">
                  ¡Cierre Guardado!
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-1" id="modal-ss-id-stamp">
                  Se ha creado correctamente el Snapshot histórico para este día.
                </p>
              </div>
            </div>

            {/* Compact overview receipt card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700/80 rounded-xl p-4 flex flex-col gap-2.5 text-xs font-semibold" id="modal-ss-receipt">
              <div className="flex justify-between" id="ss-receipt-date">
                <span className="text-gray-500 dark:text-slate-400">Fecha Cierre:</span>
                <span className="text-gray-850 dark:text-slate-200">{formatLocalDate(justSavedClosure.createdAt)}</span>
              </div>
              <div className="flex justify-between" id="ss-receipt-cash">
                <span className="text-gray-500 dark:text-slate-400">Total Efectivo:</span>
                <span className="font-mono text-gray-850 dark:text-slate-200">{formatCOP(justSavedClosure.totalCash)}</span>
              </div>
              <div className="flex justify-between mt-1 pt-2.5 border-t border-slate-205/60 dark:border-slate-700" id="ss-receipt-gt">
                <span className="text-slate-900 dark:text-slate-100 font-bold">Total Consolidado Caja:</span>
                <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">{formatCOP(justSavedClosure.grandTotal)}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 dark:text-slate-400 text-center leading-relaxed" id="modal-ss-actions-invite">
              ¿Qué te gustaría hacer con este snapshot auditado antes de iniciar un nuevo día?
            </p>

            <div className="grid grid-cols-2 gap-2" id="modal-ss-quick-btns">
              <button
                onClick={() => {
                  handleExportPDF(justSavedClosure);
                }}
                className="inline-flex justify-center items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                id="btn-ss-pdf"
              >
                <Download size={13} />
                Descargar PDF
              </button>
              <button
                onClick={() => {
                  handlePrint(justSavedClosure);
                }}
                className="inline-flex justify-center items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                id="btn-ss-print"
              >
                <FileText size={13} />
                Imprimir Reporte
              </button>
            </div>

            <div className="flex gap-2 justify-center pt-2 border-t border-gray-100 dark:border-slate-800" id="modal-ss-footer-actions">
              <button
                onClick={() => {
                  setShowSaveSuccessModal(false);
                  setActiveTab("historial");
                }}
                className="text-xs text-slate-800 dark:text-indigo-400 hover:text-slate-950 dark:hover:text-indigo-300 font-bold cursor-pointer"
                id="btn-ss-view-history"
              >
                Ir a Archivo Histórico
              </button>
              <span className="text-gray-300 dark:text-slate-700">•</span>
              <button
                onClick={() => {
                  setShowSaveSuccessModal(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 font-semibold cursor-pointer"
                id="btn-ss-dismiss"
              >
                Permanecer Aquí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY EXPORTING SPINNER */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs" id="exporting-overlay">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-xl border border-gray-150 dark:border-slate-800 flex flex-col items-center justify-center gap-3.5" id="exporting-box">
            <Loader2 className="animate-spin text-slate-900 dark:text-indigo-400" size={32} />
            <p className="text-xs font-bold text-gray-700 dark:text-slate-300 font-mono tracking-tight" id="exporting-message">
              {exportMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
