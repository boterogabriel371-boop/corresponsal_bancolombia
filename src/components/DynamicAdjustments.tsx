/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useCashStore } from "../store";
import { formatCOP } from "../utils";
import { Plus, Trash2, Sliders, Info, PlusCircle, MinusCircle } from "lucide-react";

export default function DynamicAdjustments() {
  const { adjustments, addAdjustment, removeAdjustment } = useCashStore();
  const [concept, setConcept] = useState("");
  const [valueStr, setValueStr] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    // Parse the value string. It could be "+5000" or "-15000" or "41000".
    // We clean up characters except sign and digits.
    let cleaned = valueStr.trim().replace(/[^\d+-]/g, "");
    if (!cleaned) cleaned = "0";

    const value = parseInt(cleaned, 10);
    if (isNaN(value)) return;

    addAdjustment(concept, value);
    setConcept("");
    setValueStr("");

    // Return focus to the concept field for lightning add flow
    const conceptField = document.getElementById("adj-concept-input");
    if (conceptField) {
      conceptField.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && concept.trim() && valueStr.trim()) {
      handleAdd(e);
    }
  };

  // Determine sign in real-time for visual feedback
  const trimmedVal = valueStr.trim();
  const isNegative = trimmedVal.startsWith("-");
  const hasValue = trimmedVal.length > 0 && trimmedVal !== "-" && trimmedVal !== "+";

  const totalAdjustments = adjustments.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="dynamic-adjustments-module">
      {/* Header section */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" id="adjustments-header-bar">
        <div>
          <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5" id="adj-hd-title">
            Ajustes Dinámicos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5" id="adj-hd-desc">
            Suma/resta extracciones o comisiones. El signo define la operación.
          </p>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
          totalAdjustments >= 0 
            ? "text-[#4f46e5] bg-indigo-50/50 border-indigo-100/50" 
            : "text-rose-700 bg-rose-50/50 border-rose-100"
        }`} id="adj-total-badge">
          {totalAdjustments >= 0 ? "+" : ""}{formatCOP(totalAdjustments)}
        </span>
      </div>

      {/* Insert Adjustment Form */}
      <form onSubmit={handleAdd} className="p-5 bg-slate-50/40 border-b border-slate-100 flex flex-col gap-3" id="adj-form">
        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest" id="new-adjustment-label">
          Agregar Ajuste Rápido
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5" id="adj-inputs-row">
          {/* Concept input */}
          <div className="flex-1" id="adj-input-concept-wrapper">
            <input
              type="text"
              id="adj-concept-input"
              placeholder="Ej. Retiro Jesu o Comisión"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none rounded-xl px-3 py-2.5 transition-all text-slate-800"
            />
          </div>

          {/* Val input */}
          <div className="w-full sm:w-44 relative" id="adj-input-value-wrapper">
            <input
              type="text"
              placeholder="Ej. -10000 ó +5000"
              value={valueStr}
              onChange={(e) => {
                // Allow sign character (+ or -) followed by numbers
                const val = e.target.value.replace(/[^\d+-]/g, "");
                setValueStr(val);
              }}
              onKeyDown={handleKeyDown}
              className="w-full text-xs font-mono font-bold bg-white border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none rounded-xl pl-8 pr-3 py-2.5 transition-all text-slate-800"
            />
            {/* Realtime visual sign cue */}
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none" id="realtime-sign">
              {hasValue ? (
                isNegative ? (
                  <MinusCircle size={15} className="text-rose-500" title="Resta de caja" />
                ) : (
                  <PlusCircle size={15} className="text-emerald-500" title="Suma a caja" />
                )
              ) : (
                <Sliders size={14} className="text-slate-400" />
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={!concept.trim() || !valueStr.trim() || valueStr === "+" || valueStr === "-"}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all cursor-pointer shadow-3xs shrink-0"
            id="adj-btn-add"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>

        {/* Dynamic validation cue */}
        {hasValue && (
          <div className="flex items-center gap-1 text-[10px]" id="adj-cue-text">
            {isNegative ? (
              <span className="text-rose-600 font-bold">
                Se restarán <strong className="font-mono">{formatCOP(Math.abs(parseInt(valueStr, 10)))}</strong> del total general.
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">
                Se sumarán <strong className="font-mono">{formatCOP(Math.abs(parseInt(valueStr, 10)))}</strong> al total general.
              </span>
            )}
          </div>
        )}
      </form>

      {/* Adjustments list registry */}
      <div className="p-3" id="adjustments-registry">
        {adjustments.length === 0 ? (
          <div className="py-8 px-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2" id="adj-empty-state">
            <Info size={20} className="text-slate-300" />
            <div>
              <p className="text-xs font-bold text-slate-500">Sin ajustes registrados</p>
              <p className="text-[10px] mt-0.5 text-slate-400 font-medium">Los egresos, compras y otras novedades aparecerán aquí.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1" id="adj-scrollable-list">
            {adjustments.map((item) => {
              const sign = item.value >= 0 ? "+" : "";
              const colorClass = item.value >= 0 
                ? "bg-emerald-50/50 text-emerald-800 border-emerald-200" 
                : "bg-rose-50/40 text-rose-800 border-rose-200";

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all group ${colorClass}`}
                  id={`adjustment-item-${item.id}`}
                >
                  <div className="flex flex-col gap-0.5" id={`adj-meta-${item.id}`}>
                    <span className="font-semibold text-slate-700 shrink-0 capitalize truncate max-w-[150px] md:max-w-[200px]" title={item.concept}>
                      {item.concept}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      ID: {item.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5" id={`adj-actions-${item.id}`}>
                    <span className="font-mono font-bold" id={`adj-val-${item.id}`}>
                      {sign}{formatCOP(item.value)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAdjustment(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-white transition-colors cursor-pointer"
                      title="Eliminar ajuste"
                      id={`adj-delete-btn-${item.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
