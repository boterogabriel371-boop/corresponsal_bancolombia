/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useCashStore } from "../store";
import { formatCOP, formatLocalDate, formatLocalTime } from "../utils";
import { CashClosure } from "../types";
import GoogleSheetsSync from "./GoogleSheetsSync";
import { 
  Calendar, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  BookOpen, 
  Printer, 
  FileDown, 
  Trash2, 
  X, 
  ChevronRight, 
  Coins, 
  Landmark, 
  Sliders, 
  Info,
  Layers,
  Percent,
  CreditCard,
  FileText
} from "lucide-react";

interface ClosureHistoryProps {
  onPrintHistoric: (closure: CashClosure) => void;
  onDeleteClosure?: (id: string) => void;
}

export default function ClosureHistory({ onPrintHistoric }: ClosureHistoryProps) {
  const { closures, deleteClosure, selectedClosureId, setSelectedClosureId } = useCashStore();
  
  // Custom delete item confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Auto-reset delete confirmation mode if selected item changes
  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [selectedClosureId]);
  
  // States of filter
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Reset filters
  const resetFilters = () => {
    setStartDateStr("");
    setEndDateStr("");
    setSortOrder("desc");
  };

  // Filter closures
  const filteredClosures = closures.filter((c) => {
    const dateOfClosure = new Date(c.createdAt);
    // Strip time to allow accurate date-only matches if user inputs.
    const closureDateStr = dateOfClosure.toISOString().split("T")[0];

    if (startDateStr && closureDateStr < startDateStr) {
      return false;
    }
    if (endDateStr && closureDateStr > endDateStr) {
      return false;
    }
    return true;
  });

  // Sort closures
  const sortedClosures = [...filteredClosures].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  // Selected Closure object
  const selectedClosure = closures.find((c) => c.id === selectedClosureId) || null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[calc(100vh-140px)] transition-colors duration-200" id="closure-history-module">
      
      {/* LEFT COLUMN: FILTERS & CARD LIST */}
      <div className="w-full lg:w-[420px] flex flex-col gap-4 shrink-0" id="history-sidebar">
        
        <GoogleSheetsSync />

        {/* Filters Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col gap-3" id="filters-container">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5" id="filters-title">
            Filtros de Historial
          </h4>

          {/* Date range inputs */}
          <div className="grid grid-cols-2 gap-2" id="filters-date-inputs">
            <div className="flex flex-col gap-1" id="filter-start-group">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest" htmlFor="start-date-input">
                Desde
              </label>
              <input
                type="date"
                id="start-date-input"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none rounded-lg p-2 text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>
            <div className="flex flex-col gap-1" id="filter-end-group">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest" htmlFor="end-date-input">
                Hasta
              </label>
              <input
                type="date"
                id="end-date-input"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none rounded-lg p-2 text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Sorting and clear toggles */}
          <div className="flex items-center justify-between gap-2 mt-1 pt-3 border-t border-slate-100 dark:border-slate-800/80" id="filters-toggles">
            <button
              onClick={() => setSortOrder((order) => (order === "desc" ? "asc" : "desc"))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-650 dark:hover:text-indigo-400 font-bold bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
              id="sort-toggle-btn"
            >
              {sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
              Orden: {sortOrder === "desc" ? "Reciente" : "Antiguo"}
            </button>

            {(startDateStr || endDateStr) && (
              <button
                onClick={resetFilters}
                className="text-xs font-extrabold text-rose-650 hover:text-rose-800 cursor-pointer"
                id="clear-filters-btn"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Closures list display */}
        <div className="flex-1 overflow-y-auto max-h-[500px] lg:max-h-[calc(100vh-270px)] pr-1 flex flex-col gap-2.5" id="history-cards-scroll">
          {sortedClosures.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-3" id="cards-empty-state">
              <BookOpen size={28} className="text-slate-300 dark:text-slate-700" id="cards-empty-icon" />
              <div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No se encontraron cierres</p>
                <p className="text-xs mt-1 text-slate-400 dark:text-slate-500 font-medium">
                  {closures.length === 0 
                    ? "Aún no has guardado ningún cierre en esta sesión." 
                    : "Ningún registro coincide con el rango de fechas."}
                </p>
              </div>
            </div>
          ) : (
            sortedClosures.map((c) => {
              const dateStr = formatLocalDate(c.createdAt);
              const isSelected = selectedClosureId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClosureId(c.id)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden group ${
                    isSelected
                      ? "bg-slate-900 dark:bg-slate-800 border-transparent text-white shadow-md transform translate-x-1"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-3xs"
                  }`}
                  id={`history-card-${c.id}`}
                >
                  <div className="flex items-center justify-between pointer-events-none" id={`card-heading-${c.id}`}>
                    <div className="flex items-center gap-2" id={`card-date-badge-${c.id}`}>
                      <Calendar size={13} className={isSelected ? "text-slate-300" : "text-slate-450"} />
                      <span className="text-xs font-extrabold capitalize">{dateStr}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold opacity-75`} id={`card-time-badge-${c.id}`}>
                      {formatLocalTime(c.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100/10 dark:border-slate-850/60 pointer-events-none" id={`card-sums-grid-${c.id}`}>
                    <div id={`card-sum-caja-${c.id}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-slate-300" : "text-slate-450"}`}>
                        Total Caja
                      </p>
                      <p className="text-base font-black font-mono tracking-tight mt-0.5">
                        {formatCOP(c.grandTotal)}
                      </p>
                    </div>
                    <div id={`card-sum-cash-${c.id}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-slate-300" : "text-slate-450"}`}>
                        Efectivo
                      </p>
                      <p className={`text-sm font-extrabold font-mono tracking-tight mt-0.5 ${isSelected ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}`}>
                        {formatCOP(c.totalCash)}
                      </p>
                    </div>
                  </div>

                  {/* Indicator arrow */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" id={`card-arrow-${c.id}`}>
                    <ChevronRight size={16} className={isSelected ? "text-white" : "text-slate-400 dark:text-slate-500"} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILED VIEW (Read Only Mode) */}
      <div className="flex-1 lg:min-w-[450px]" id="history-details-pane">
        {selectedClosure ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col gap-6 sticky top-24 transition-colors duration-200" id="details-box">
            
            {/* Detail Heading */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-150 dark:border-slate-800/80" id="details-heading">
              <div id="details-heading-text">
                <p className="text-[10px] font-extrabold text-[#4f46e5] dark:text-indigo-400 uppercase tracking-widest" id="details-heading-sub">
                  Resumen de Archivo
                </p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 capitalize animate-fade-in" id="details-heading-main">
                  Cierre: {formatLocalDate(selectedClosure.createdAt)}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono font-bold" id="details-meta">
                  <span>Hora: {formatLocalTime(selectedClosure.createdAt)}</span>
                  <span>•</span>
                  <span>ID: {selectedClosure.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* PDF & Imprimir & Borrar */}
              <div className="flex items-center gap-1.5" id="details-actions">
                <button
                  onClick={() => onPrintHistoric(selectedClosure)}
                  className="p-2 text-slate-500 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Imprimir este cierre"
                  id="det-btn-print"
                >
                  <Printer size={15} />
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" id="det-divider"></div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-rose-550 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar este cierre permanentemente"
                  id="det-btn-delete"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setSelectedClosureId(null)}
                  className="ml-1 p-1.5 text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar detalles"
                  id="det-btn-close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* GRAND TOTAL BOARD AS READ ONLY */}
            <div className="bg-slate-900 dark:bg-slate-950/80 text-white rounded-xl p-4.5 flex items-center justify-between shadow-2xs" id="details-grand-total">
              <div>
                <p className="text-[10px] font-extrabold text-slate-350 uppercase tracking-widest" id="det-grand-total-label">
                  Total Consolidado en Caja
                </p>
                <h4 className="text-3xl font-black font-mono tracking-tight mt-1 text-white animate-fade-in" id="det-grand-total-val">
                  {formatCOP(selectedClosure.grandTotal)}
                </h4>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-850 dark:bg-slate-900 border border-slate-750 dark:border-slate-800 text-xs text-slate-300 dark:text-slate-450 font-bold font-mono uppercase tracking-wider" id="det-grand-total-tag">
                HISTÓRICO
              </div>
            </div>

            {/* Grid display of Denominations and Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[350px] overflow-y-auto pr-1" id="details-sections">
              
              {/* CASH DENOMINATIONS DETAIL */}
              <div className="flex flex-col gap-2.5" id="details-cash-section">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1" id="det-cash-title">
                  <Coins size={12} className="text-[#fbbf24]" />
                  Efectivo ({formatCOP(selectedClosure.totalCash)})
                </p>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80" id="det-cash-table">
                  {selectedClosure.denominations.filter((d) => d.quantity > 0).length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 font-bold" id="det-cash-empty">
                      No se registraron billetes o monedas.
                    </div>
                  ) : (
                    selectedClosure.denominations
                      .filter((d) => d.quantity > 0)
                      .map((d) => (
                        <div key={d.denomination} className="flex items-center justify-between px-3.5 py-2.5 text-xs text-slate-705 dark:text-slate-300" id={`det-item-${d.denomination}`}>
                          <div className="flex items-center gap-2" id={`det-item-info-${d.denomination}`}>
                            <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono">
                              {d.denomination.toLocaleString("es-CO")}
                            </span>
                            <span className="text-slate-400 font-bold">x</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{d.quantity}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {formatCOP(d.total)}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* OPERATIONAL BALANCES DETAIL */}
              <div className="flex flex-col gap-2.5" id="details-balances-section">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1" id="det-balances-title">
                  <Landmark size={12} className="text-indigo-600 dark:text-indigo-455" />
                  Saldos de Plataformas
                </p>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col gap-3.5 bg-slate-50/40 dark:bg-slate-950/20" id="det-balances-list">
                  
                  {/* Bancolombia Balance */}
                  <div className="flex items-center justify-between text-xs font-bold" id="det-bal-bancolombia">
                    <span className="text-slate-500">Saldo Bancolombia</span>
                    <span className={`font-mono text-slate-800 dark:text-slate-200 ${selectedClosure.bancolombiaBalance > 0 ? "font-bold text-indigo-650 dark:text-indigo-400" : "opacity-60"}`}>
                      {formatCOP(selectedClosure.bancolombiaBalance)}
                    </span>
                  </div>

                  {/* Bancolombia Credit */}
                  <div className="flex items-center justify-between text-xs font-bold" id="det-bal-cupo">
                    <span className="text-slate-500 flex items-center gap-1">Cupo Bancolombia <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-850 px-1 rounded">Informativo</span></span>
                    <span className={`font-mono text-slate-800 dark:text-slate-200 ${selectedClosure.bancolombiaCredit > 0 ? "font-bold text-indigo-650 dark:text-indigo-400" : "opacity-60"}`}>
                      {formatCOP(selectedClosure.bancolombiaCredit)}
                    </span>
                  </div>

                  {/* TKS Balance */}
                  <div className="flex items-center justify-between text-xs font-bold" id="det-bal-tks">
                    <span className="text-slate-500">Saldo TKS</span>
                    <span className={`font-mono text-slate-800 dark:text-slate-200 ${selectedClosure.tksBalance > 0 ? "font-bold text-indigo-650 dark:text-indigo-400" : "opacity-60"}`}>
                      {formatCOP(selectedClosure.tksBalance)}
                    </span>
                  </div>

                  {/* Comisión TKS */}
                  <div className="flex items-center justify-between text-xs font-bold" id="det-bal-tks-commission">
                    <span className="text-slate-500">Comisión TKS</span>
                    <span className={`font-mono text-slate-800 dark:text-slate-200 ${(selectedClosure.tksCommission || 0) > 0 ? "font-bold text-indigo-650 dark:text-indigo-400" : "opacity-60"}`}>
                      {formatCOP(selectedClosure.tksCommission || 0)}
                    </span>
                  </div>

                  {/* PTM Balance */}
                  <div className="flex items-center justify-between text-xs font-bold" id="det-bal-ptm">
                    <span className="text-slate-500">Saldo PTM</span>
                    <span className={`font-mono text-slate-800 dark:text-slate-200 ${selectedClosure.ptmBalance > 0 ? "font-bold text-indigo-650 dark:text-indigo-400" : "opacity-60"}`}>
                      {formatCOP(selectedClosure.ptmBalance)}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* ADJUSTMENTS SECTION IN DETAIL */}
            <div className="flex flex-col gap-2.5" id="details-adjustments-section">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1" id="det-adjustments-title">
                <Sliders size={12} className="text-[#a5b4fc]" />
                Ajustes Especiales ({formatCOP(selectedClosure.adjustments.reduce((acc, item) => acc + item.value, 0))})
              </p>
              <div className="flex flex-col gap-1.5" id="det-adjustments-list">
                {selectedClosure.adjustments.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-450 italic bg-slate-50 dark:bg-slate-950/20 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80" id="det-adjustments-empty">
                    No se ingresaron ajustes para esta jornada.
                  </p>
                ) : (
                  selectedClosure.adjustments.map((a) => {
                    const isNeg = a.value < 0;
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between p-2.5 border rounded-xl text-xs font-bold ${
                          isNeg 
                            ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-400" 
                            : "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400"
                        }`}
                        id={`det-adj-item-${a.id}`}
                      >
                        <span className="capitalize">{a.concept}</span>
                        <span className="font-mono font-bold">
                          {a.value >= 0 ? "+" : ""}{formatCOP(a.value)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* OBSERVATIONS IN DETAIL */}
            <div className="flex flex-col gap-2" id="details-observations-section">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1" id="det-obs-title">
                <FileText size={12} className="text-slate-450" />
                Observaciones y Novedades
              </p>
              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-xs text-slate-700 dark:text-slate-350 font-bold leading-relaxed" id="det-obs-box">
                {selectedClosure.observations ? (
                  <p className="whitespace-pre-line" id="det-obs-text">{selectedClosure.observations}</p>
                ) : (
                  <p className="italic text-slate-450 dark:text-slate-500 font-medium" id="det-obs-empty">Sin observaciones ni novedades registradas.</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-850 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-4.5 h-[300px] lg:h-full lg:min-h-[400px]" id="details-stub">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-full border border-slate-100 dark:border-slate-850" id="stub-icon-circle">
              <FileText size={32} className="text-slate-400 dark:text-slate-500 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-400">Ningún archivo abierto</p>
              <p className="text-xs text-slate-500 dark:text-slate-450 max-w-sm mt-1 mx-auto font-medium leading-relaxed pb-2">
                Selecciona un reporte de cierre de caja en la lista de la izquierda para desplegar el desglose completo del conteo, saldos operativos, egresos y exportar reportes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="modal-delete-confirm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-150 dark:border-slate-800 flex flex-col gap-5 animate-scale-up" id="modal-delete-content">
            <div className="flex items-start gap-4" id="modal-delete-header">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-450 rounded-xl shrink-0" id="modal-delete-icon">
                <Trash2 size={22} className="animate-pulse" />
              </div>
              <div id="modal-delete-title-desc">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base" id="modal-delete-title">
                  Eliminar Reporte de Caja
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed" id="modal-delete-body">
                  ¿Está seguro de que desea eliminar permanentemente este reporte de caja del historial? Esta acción es irreversible.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end" id="modal-delete-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 inline-flex justify-center items-center px-4 py-2.5 text-xs font-bold text-slate-750 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                id="btn-delete-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedClosure) {
                    deleteClosure(selectedClosure.id);
                  }
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 inline-flex justify-center items-center px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700/80 rounded-xl shadow-xs transition-all cursor-pointer animate-pulse"
                id="btn-delete-confirm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
