/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useCashStore } from "../store";
import { formatCOP } from "../utils";
import { Plus, Trash2, Sliders, Info, PlusCircle, MinusCircle, AlertCircle } from "lucide-react";
import { z } from "zod";

// Zod validation schemas for robust character validation
const adjustmentFormSchema = z.object({
  concept: z.string()
    .trim()
    .min(3, "El concepto debe tener al menos 3 caracteres.")
    .max(50, "El concepto es demasiado largo (máximo 50 caracteres)."),
  valueStr: z.string()
    .refine((val) => {
      const cleaned = val.replace(/[.,\s]/g, "");
      if (cleaned === "" || cleaned === "+" || cleaned === "-") return false;
      return /^[+-]?[0-9]+$/.test(cleaned);
    }, {
      message: "Formato numérico inválido. Ingrese solo números (ej: -10.000 ó +5.000)."
    })
    .transform((val) => {
      const cleaned = val.replace(/[.,\s]/g, "");
      return parseInt(cleaned, 10);
    })
    .pipe(
      z.number()
        .min(-50000000, "El valor excede el límite razonable (mín -$50.000.000).")
        .max(50000000, "El valor excede el límite razonable (máx $50.000.000).")
    )
});

export default function DynamicAdjustments() {
  const { adjustments, addAdjustment, removeAdjustment } = useCashStore();
  const [concept, setConcept] = useState("");
  const [valueStr, setValueStr] = useState("");
  const [errors, setErrors] = useState<{ concept?: string; valueStr?: string }>({});

  const validateField = (name: "concept" | "valueStr", val: string, otherVal: string) => {
    if (name === "concept") {
      const trimmed = val.trim();
      if (trimmed === "") {
        setErrors(prev => ({ ...prev, concept: undefined }));
        return;
      }
      const res = z.string().min(3, "Mínimo 3 caracteres.").safeParse(trimmed);
      setErrors(prev => ({
        ...prev,
        concept: res.success ? undefined : res.error.issues[0].message
      }));
    } else {
      if (val === "" || val === "+" || val === "-") {
        setErrors(prev => ({ ...prev, valueStr: undefined }));
        return;
      }
      const cleaned = val.replace(/[.,\s]/g, "");
      const isNumFormat = /^[+-]?[0-9]+$/.test(cleaned);
      if (!isNumFormat) {
        setErrors(prev => ({ ...prev, valueStr: "Use solo dígitos (ej: -10000 ó +5000)." }));
        return;
      }
      const parsedVal = parseInt(cleaned, 10);
      const res = z.number()
        .min(-50000000, "Mínimo: -$50M COP.")
        .max(50000000, "Máximo: $50M COP.")
        .safeParse(parsedVal);

      setErrors(prev => ({
        ...prev,
        valueStr: res.success ? undefined : res.error.issues[0].message
      }));
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Direct execution validation of both values with Zod
    const result = adjustmentFormSchema.safeParse({ concept, valueStr });
    
    if (!result.success) {
      const newErrors: typeof errors = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as "concept" | "valueStr"] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    const value = result.data.valueStr;
    addAdjustment(concept.trim(), value);
    setConcept("");
    setValueStr("");
    setErrors({});

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200" id="dynamic-adjustments-module">
      {/* Header section */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between" id="adjustments-header-bar">
        <div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5" id="adj-hd-title">
            Ajustes Dinámicos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" id="adj-hd-desc">
            Suma/resta extracciones o comisiones. El signo define la operación.
          </p>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
          totalAdjustments >= 0 
            ? "text-[#4f46e5] dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-800/40" 
            : "text-rose-700 dark:text-rose-450 bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800/40"
        }`} id="adj-total-badge">
          {totalAdjustments >= 0 ? "+" : ""}{formatCOP(totalAdjustments)}
        </span>
      </div>

      {/* Insert Adjustment Form */}
      <form onSubmit={handleAdd} className="p-5 bg-slate-50/40 dark:bg-slate-950/25 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-3" id="adj-form">
        <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest" id="new-adjustment-label">
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
              onChange={(e) => {
                const val = e.target.value;
                setConcept(val);
                validateField("concept", val, valueStr);
              }}
              className={`w-full text-xs font-bold bg-white dark:bg-slate-905 border ${
                errors.concept 
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500 focus:ring-1" 
                  : "border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              } focus:outline-none rounded-xl px-3 py-2.5 transition-all text-slate-800 dark:text-slate-200`}
            />
            {errors.concept && (
              <div className="flex items-center gap-1 text-[10px] text-rose-500 mt-1.5 font-semibold" id="concept-err-msg">
                <AlertCircle size={10} />
                <span>{errors.concept}</span>
              </div>
            )}
          </div>

          {/* Val input */}
          <div className="w-full sm:w-44 flex flex-col gap-1 relative" id="adj-input-value-wrapper">
            <div className="relative">
              <input
                type="text"
                placeholder="Ej. -10.000 ó +5.000"
                value={valueStr}
                onChange={(e) => {
                  const val = e.target.value;
                  setValueStr(val);
                  validateField("valueStr", val, concept);
                }}
                onKeyDown={handleKeyDown}
                className={`w-full text-xs font-mono font-bold bg-white dark:bg-slate-905 border ${
                  errors.valueStr 
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500 focus:ring-1" 
                    : "border-slate-200 dark:border-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                } focus:outline-none rounded-xl pl-8 pr-3 py-2.5 transition-all text-slate-800 dark:text-slate-200`}
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
                  <Sliders size={14} className="text-slate-400 dark:text-slate-500" />
                )}
              </div>
            </div>
            {errors.valueStr && (
              <div className="flex items-center gap-1 text-[10px] text-rose-500 mt-1 font-semibold" id="val-err-msg">
                <AlertCircle size={10} />
                <span>{errors.valueStr}</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={!concept.trim() || !valueStr.trim() || valueStr === "+" || valueStr === "-" || !!errors.concept || !!errors.valueStr}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 rounded-xl transition-all cursor-pointer shadow-3xs shrink-0"
            id="adj-btn-add"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>

        {/* Dynamic validation cue */}
        {hasValue && !errors.valueStr && (
          <div className="flex items-center gap-1 text-[10px]" id="adj-cue-text">
            {isNegative ? (
              <span className="text-rose-650 dark:text-rose-400 font-bold animate-fade-in text-[11px]">
                Se restarán <strong className="font-mono">{formatCOP(Math.abs(parseInt(valueStr.replace(/[.,\s]/g, ""), 10) || 0))}</strong> del total general.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-450 font-bold animate-fade-in text-[11px]">
                Se sumarán <strong className="font-mono">{formatCOP(Math.abs(parseInt(valueStr.replace(/[.,\s]/g, ""), 10) || 0))}</strong> al total general.
              </span>
            )}
          </div>
        )}
      </form>

      {/* Adjustments list registry */}
      <div className="p-3" id="adjustments-registry">
        {adjustments.length === 0 ? (
          <div className="py-8 px-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2" id="adj-empty-state">
            <Info size={20} className="text-slate-300 dark:text-slate-700" />
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Sin ajustes registrados</p>
              <p className="text-[10px] mt-0.5 text-slate-400 dark:text-slate-500 font-medium">Los egresos, compras y otras novedades aparecerán aquí.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1" id="adj-scrollable-list">
            {adjustments.map((item) => {
              const sign = item.value >= 0 ? "+" : "";
              const colorClass = item.value >= 0 
                ? "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" 
                : "bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-800";

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all group ${colorClass}`}
                  id={`adjustment-item-${item.id}`}
                >
                  <div className="flex flex-col gap-0.5" id={`adj-meta-${item.id}`}>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 capitalize truncate max-w-[150px] md:max-w-[200px]" title={item.concept}>
                      {item.concept}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 font-mono font-medium">
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
                      className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 p-1 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
