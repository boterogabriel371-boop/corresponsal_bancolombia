/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { formatCOP } from "../utils";
import { useCashStore } from "../store";
import { 
  Save, 
  Printer, 
  FileDown, 
  Calendar, 
  Clock, 
  History, 
  RefreshCw,
  PlusCircle,
  FileCheck2,
  Sun,
  Moon
} from "lucide-react";

interface HeaderProps {
  onSave: () => void;
  onPrint: () => void;
  onExportPDF: () => void;
  onNewDay: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export default function Header({ onSave, onPrint, onExportPDF, onNewDay, theme, toggleTheme }: HeaderProps) {
  const { activeTab, setActiveTab, selectedClosureId, setSelectedClosureId } = useCashStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = time.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-205 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-10 shadow-xs transition-colors duration-200" id="app-header">
      {/* Date, Time & Status */}
      <div className="flex items-center gap-4" id="header-info">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight animate-fade-in" id="app-logo">
            Corresponsal Celityn <span className="text-indigo-600 dark:text-indigo-400 font-medium ml-1">v2.1</span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest mt-0.5" id="app-subtitle">
            Módulo de Cuadre Diario
          </p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2" id="header-status-badge">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Caja Abierta (Hoy)
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 font-semibold" id="header-datetime">
            <span className="capitalize">{formattedDate}</span>
            <span className="text-gray-300 dark:text-slate-750">•</span>
            <span className="font-mono text-gray-700 dark:text-slate-300">{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Primary Actions Group */}
      <div className="flex flex-wrap items-center gap-2" id="header-actions">
        {activeTab === "cuadre" ? (
          <>
            <button
              onClick={onNewDay}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-700/30 rounded-lg transition-all duration-150 cursor-pointer"
              title="Reiniciar conteo diario"
              id="btn-nuevo-dia"
            >
              <RefreshCw size={13} className="text-slate-500 dark:text-slate-400 animate-hover-spin" />
              Nuevo Día
            </button>

            <button
              onClick={onSave}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-100 dark:shadow-none transition-all duration-150 cursor-pointer"
              title="Guardar snapshot de caja"
              id="btn-guardar-cierre"
            >
              <Save size={13} />
              Guardar Cierre
            </button>

            <div className="h-6 w-px bg-slate-250 dark:bg-slate-800 mx-1 hidden sm:block" id="divider-actions"></div>

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-700/30 rounded-lg transition-all duration-150 cursor-pointer"
              title="Imprimir reporte actual"
              id="btn-imprimir"
            >
              <Printer size={13} className="text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            <button
              onClick={onExportPDF}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-700/30 rounded-lg transition-all duration-150 cursor-pointer"
              title="Exportar reporte actual a PDF"
              id="btn-pdf"
            >
              <FileDown size={13} className="text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Exportar PDF</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setSelectedClosureId(null);
              setActiveTab("cuadre");
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-100 dark:shadow-none transition-all duration-150 cursor-pointer"
            id="btn-volver-cuadre"
          >
            <PlusCircle size={13} />
            Hacer Nuevo Cuadre
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" id="divider-tabs"></div>

        {/* Tab switcher */}
        <div className="p-0.5 bg-slate-100 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center" id="tab-switcher">
          <button
            onClick={() => {
              setSelectedClosureId(null);
              setActiveTab("cuadre");
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer ${
              activeTab === "cuadre"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            id="tab-cuadre-btn"
          >
            Cuadre Actual
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              activeTab === "historial"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            id="tab-historial-btn"
          >
            <History size={11} />
            Historial de Cierres
          </button>
        </div>

        {/* Light/Dark Mode Selector Switch */}
        <button
          onClick={toggleTheme}
          className="p-2 ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-150 cursor-pointer"
          title={theme === "light" ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
          id="btn-toggle-theme"
          aria-label="Alternar modo de pantalla"
        >
          {theme === "light" ? <Moon size={14} /> : <Sun size={14} className="text-amber-500" />}
        </button>
      </div>
    </header>
  );
}
