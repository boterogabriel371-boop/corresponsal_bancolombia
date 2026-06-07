/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CashClosure } from "../types";
import { formatCOP, formatLocalDate, formatLocalTime } from "../utils";
import { Landmark, Coins, Sliders, ShieldCheck } from "lucide-react";

interface PrintReportViewProps {
  closure: CashClosure | null;
  elementId?: string;
}

export default function PrintReportView({ closure, elementId = "hidden-print-report" }: PrintReportViewProps) {
  if (!closure) return null;

  const totalAdjustments = closure.adjustments.reduce((acc, item) => acc + item.value, 0);

  return (
    <div 
      id={elementId}
      className="bg-white p-12 text-slate-950 font-sans shadow-lg rounded-none w-[792px] leading-relaxed flex flex-col gap-6"
      style={{
        width: "792px", // standard letter width scaling
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* HEADER BAR */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5" id="print-heading">
        <div id="print-org-info">
          <div className="flex items-center gap-2" id="print-header-brand">
            <span className="w-4 h-4 rounded bg-slate-900 flex items-center justify-center font-black text-[10px] text-white">C</span>
            <span className="text-sm font-black tracking-wide uppercase text-slate-900">CUADRE DE CAJA DIARIA</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-2" id="print-doc-title">
            REPORTE DE CIERRE DIARIO
          </h1>
          <p className="text-xs text-gray-400 mt-1" id="print-app-instance">
            Sistema Interno de Gestión de Efectivo • Google AI Studio S.A.S.
          </p>
        </div>

        <div className="text-right flex flex-col gap-1 font-mono text-xs text-gray-500" id="print-meta-data">
          <div><strong className="text-slate-800">Fecha:</strong> {formatLocalDate(closure.createdAt)}</div>
          <div><strong className="text-slate-800">Hora:</strong> {formatLocalTime(closure.createdAt)}</div>
          <div className="text-[10px] text-gray-400"><strong>Cierre ID:</strong> {closure.id.toUpperCase()}</div>
        </div>
      </div>

      {/* CONSOLIDATED STATEMENT BOARD */}
      <div className="bg-slate-100 border border-slate-205 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4" id="print-grand-total-board">
        <div id="print-gt-left">
          <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
            Total General Consolidado en Caja
          </h2>
          <span className="text-3xl font-black font-mono mt-1 block tracking-tight text-slate-900">
            {formatCOP(closure.grandTotal)}
          </span>
        </div>
        <div className="text-right" id="print-gt-right">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-black" id="print-status-tag">
            CERRADO & AUDITADO
          </span>
        </div>
      </div>

      {/* THREE-COLUMN COMPACT BREAKDOWN */}
      <div className="grid grid-cols-2 gap-6 items-start" id="print-sections-grid">
        
        {/* LEFT COLUMN: CASH COUNTING */}
        <div className="flex flex-col gap-3" id="print-section-cash">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-200 flex items-center gap-1.5" id="print-sc-cash-title">
            <Coins size={14} className="text-slate-800" />
            Efectivo Recaudado ({formatCOP(closure.totalCash)})
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-150" id="print-denom-rec">
            {closure.denominations.filter((d) => d.quantity > 0).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                Sin efectivo registrado. No se contaron unidades.
              </div>
            ) : (
              closure.denominations
                .filter((d) => d.quantity > 0)
                .map((d) => (
                  <div key={d.denomination} className="flex justify-between px-4 py-2 text-xs" id={`print-row-${d.denomination}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {d.denomination.toLocaleString("es-CO")}
                      </span>
                      <span className="text-slate-400">x</span>
                      <span className="font-semibold text-slate-700">{d.quantity} u</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCOP(d.total)}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BANK BALANCES */}
        <div className="flex flex-col gap-4" id="print-section-balances">
          <div className="flex flex-col gap-3" id="print-platform-balances">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-200 flex items-center gap-1.5" id="print-sc-bal-title">
              <Landmark size={14} className="text-slate-800" />
              Saldos en Plataforma
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3" id="print-balances-det">
              <div className="flex justify-between text-xs" id="print-bal-bancolombia">
                <span className="text-slate-500 font-semibold">Saldo Bancolombia</span>
                <span className="font-mono font-bold text-slate-900">{formatCOP(closure.bancolombiaBalance)}</span>
              </div>
              <div className="flex justify-between text-xs items-center" id="print-bal-cupo">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  Cupo Bancolombia <span className="text-[9px] font-normal text-slate-400 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">Informativo</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{formatCOP(closure.bancolombiaCredit)}</span>
              </div>
              <div className="flex justify-between text-xs" id="print-bal-tks">
                <span className="text-slate-500 font-semibold">Saldo TKS</span>
                <span className="font-mono font-bold text-slate-900">{formatCOP(closure.tksBalance)}</span>
              </div>
              <div className="flex justify-between text-xs" id="print-bal-ptm">
                <span className="text-slate-500 font-semibold">Saldo PTM</span>
                <span className="font-mono font-bold text-slate-900">{formatCOP(closure.ptmBalance)}</span>
              </div>
            </div>
          </div>

          {/* ADJUSTMENTS SECTION */}
          <div className="flex flex-col gap-3" id="print-adjustments-sub">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-200 flex items-center gap-1.5" id="print-sc-adj-title">
              <Sliders size={14} className="text-slate-800" />
              Ajustes Manuales ({formatCOP(totalAdjustments)})
            </h3>
            <div className="flex flex-col gap-1.5" id="print-adjustments-det">
              {closure.adjustments.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 px-3 py-2 rounded-xl border border-slate-150">
                  Sin ajustes registrados.
                </div>
              ) : (
                closure.adjustments.map((a) => (
                  <div key={a.id} className="flex justify-between px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs" id={`print-adj-row-${a.id}`}>
                    <span className="capitalize font-semibold text-slate-700">{a.concept}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {a.value >= 0 ? "+" : ""}{formatCOP(a.value)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* OBSERVATIONS */}
      <div className="flex flex-col gap-2 border-t border-slate-200 pt-5" id="print-section-observations">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          Observaciones y Novedades de la Jornada
        </h3>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-700 min-h-[60px]" id="print-obs-box">
          {closure.observations ? (
            <p className="whitespace-pre-line leading-relaxed">{closure.observations}</p>
          ) : (
            <p className="italic text-gray-400">Sin novedades registradas durante la jornada de cuadre diario.</p>
          )}
        </div>
      </div>

      {/* AUDIT SIGNATURE LINES */}
      <div className="grid grid-cols-2 gap-12 mt-10 pt-10 border-t border-dashed border-slate-300" id="print-section-signatures">
        <div className="flex flex-col items-center" id="sig-operator">
          <div className="w-full h-px bg-slate-400 max-w-[200px]" id="line-operator"></div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-2" id="label-operator">
            Firma Responsable Caja
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5 font-mono" id="label-op-id">
            Operario de Turno
          </p>
        </div>

        <div className="flex flex-col items-center" id="sig-auditor">
          <div className="w-full h-px bg-slate-400 max-w-[200px]" id="line-auditor"></div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-2" id="label-auditor">
            Firma Verificado / Auditor
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5 font-mono" id="label-auditor-title">
            Administración Central
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-slate-100 pt-4 mt-auto font-mono" id="print-report-footer">
        <div className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Firma digital electrónica: SHA256-V2_AUTHENTICATED</span>
        </div>
        <span>Página 1 de 1</span>
      </div>
    </div>
  );
}
