/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useCashStore } from "../store";
import { formatCOP } from "../utils";
import { DollarSign, Landmark, CreditCard, Layers, Percent, Sliders, ShieldQuestion } from "lucide-react";

export default function ConsolidatedSummary() {
  const {
    denominations,
    bancolombiaBalance,
    bancolombiaCredit,
    tksBalance,
    tksCommission,
    ptmBalance,
    adjustments,
  } = useCashStore();

  const totalCash = denominations.reduce((acc, item) => acc + item.total, 0);
  const totalAdjustments = adjustments.reduce((acc, item) => acc + item.value, 0);

  const grandTotal =
    totalCash +
    tksBalance +
    ptmBalance +
    totalAdjustments;

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-600 shadow-sm overflow-hidden relative" id="consolidated-summary-module">
      {/* Decorative corporate banner on top */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 flex items-center justify-between" id="summary-banner">
        <h3 className="text-white font-extrabold text-xs uppercase tracking-wider" id="summary-banner-title">
          Resumen Consolidado
        </h3>
        <span className="text-[10px] text-indigo-100 font-extrabold uppercase tracking-widest bg-indigo-800/50 border border-indigo-500/30 px-2 py-0.5 rounded" id="summary-banner-status">
          Cuadre en progreso
        </span>
      </div>

      <div className="p-5 flex flex-col gap-4" id="summary-content">
        {/* Itemized listing */}
        <div className="flex flex-col gap-3" id="summary-items-list">
          {/* Total Efectivo */}
          <div className="flex items-center justify-between" id="summary-item-efectivo">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="label-efectivo-summary">
              <DollarSign size={14} className="text-slate-400" />
              <span>Total Efectivo</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900" id="val-efectivo-summary">
              {formatCOP(totalCash)}
            </span>
          </div>

          {/* Bancolombia Saldo */}
          <div className="flex items-center justify-between" id="summary-item-bancolombia">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="label-bancolombia-summary">
              <Landmark size={14} className="text-slate-400" />
              <span>Saldo Bancolombia <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal ml-1 bg-slate-100 dark:bg-slate-850 px-1 py-0.5 rounded">Informativo</span></span>
            </div>
            <span className={`text-xs font-mono font-bold ${bancolombiaBalance > 0 ? "text-slate-900" : "text-slate-400"}`} id="val-bancolombia-summary">
              {formatCOP(bancolombiaBalance)}
            </span>
          </div>

          {/* Bancolombia Cupo */}
          <div className="flex items-center justify-between" id="summary-item-cupo">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="label-cupo-summary">
              <CreditCard size={14} className="text-slate-400" />
              <span>Cupo Bancolombia <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal ml-1 bg-slate-100 dark:bg-slate-850 px-1 py-0.5 rounded">Informativo</span></span>
            </div>
            <span className={`text-xs font-mono font-bold ${bancolombiaCredit > 0 ? "text-slate-900" : "text-slate-400"}`} id="val-cupo-summary">
              {formatCOP(bancolombiaCredit)}
            </span>
          </div>

          {/* TKS Saldo */}
          <div className="flex items-center justify-between" id="summary-item-tks">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="label-tks-summary">
              <Layers size={14} className="text-slate-400" />
              <span>Saldo TKS</span>
            </div>
            <span className={`text-xs font-mono font-bold ${tksBalance > 0 ? "text-slate-900" : "text-slate-400"}`} id="val-tks-summary">
              {formatCOP(tksBalance)}
            </span>
          </div>

          {/* Comisión TKS */}
          <div className="flex items-center justify-between" id="summary-item-tks-commission">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="label-tks-commission-summary">
              <Percent size={14} className="text-slate-400" />
              <span>Comisión TKS <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal ml-1 bg-slate-100 dark:bg-slate-850 px-1 py-0.5 rounded">Informativo</span></span>
            </div>
            <span className={`text-xs font-mono font-bold ${tksCommission > 0 ? "text-slate-900" : "text-slate-400"}`} id="val-tks-commission-summary">
              {formatCOP(tksCommission)}
            </span>
          </div>

          {/* PTM Saldo */}
          <div className="flex items-center justify-between" id="summary-item-ptm">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="label-ptm-summary">
              <Percent size={14} className="text-slate-400" />
              <span>Saldo PTM</span>
            </div>
            <span className={`text-xs font-mono font-bold ${ptmBalance > 0 ? "text-slate-900" : "text-slate-400"}`} id="val-ptm-summary">
              {formatCOP(ptmBalance)}
            </span>
          </div>

          {/* Total Ajustes */}
          <div className="flex items-center justify-between" id="summary-item-ajustes">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold" id="label-ajustes-summary">
              <Sliders size={14} className="text-slate-400" />
              <span>Total Ajustes</span>
            </div>
            <span className={`text-xs font-mono font-bold ${
              totalAdjustments > 0 
                ? "text-[#4f46e5]" 
                : totalAdjustments < 0 
                  ? "text-rose-600" 
                  : "text-slate-400"
            }`} id="val-ajustes-summary">
              {totalAdjustments > 0 ? "+" : ""}{formatCOP(totalAdjustments)}
            </span>
          </div>
        </div>

        {/* Divider line */}
        <div className="h-px bg-slate-100 my-1" id="summary-divider"></div>

        {/* TOTAL GENERAL DE CAJA */}
        <div className="flex flex-col gap-1 mt-1 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner" id="grand-total-summary-card">
          <p className="text-[10px] font-extrabold text-[#4f46e5] uppercase tracking-widest" id="grand-total-summary-title">
            Total General de Caja
          </p>
          <div className="flex items-center justify-between" id="grand-total-amount-row">
            <h4 className="text-2xl md:text-3xl font-black font-sans text-slate-900 tracking-tight" id="compiled-total-text">
              {formatCOP(grandTotal)}
            </h4>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded" id="currency-tag">
              COP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
