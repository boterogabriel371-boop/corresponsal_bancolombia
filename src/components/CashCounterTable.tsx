/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useCashStore } from "../store";
import { formatCOP } from "../utils";
import { Coins, CircleEqual, AlertCircle } from "lucide-react";
import { z } from "zod";

// Zod Schema to validate positive integers with a reasonable cutoff
const itemQuantitySchema = z.string()
  .refine(val => val === "" || /^[0-9]+$/.test(val), {
    message: "Debe ser un número."
  })
  .transform(val => (val === "" ? 0 : parseInt(val, 10)))
  .pipe(
    z.number()
      .min(0, "Mínimo 0 unidades.")
      .max(25000, "Excede el límite razonable (máx 25.000 u).")
  );

export default function CashCounterTable() {
  const { denominations, updateDenominationQuantity } = useCashStore();
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [inputStates, setInputStates] = useState<Record<number, string>>({});

  const totalCash = denominations.reduce((acc, item) => acc + item.total, 0);

  // Synchronize state back if the store was cleared/reset from parent (e.g., New Day modal)
  useEffect(() => {
    const updatedInputs: Record<number, string> = {};
    denominations.forEach(item => {
      // If store says 0 and we haven't touched it, or if they mismatch
      if (item.quantity === 0 && inputStates[item.denomination] !== undefined && inputStates[item.denomination] !== "") {
        updatedInputs[item.denomination] = "";
      }
    });
    if (Object.keys(updatedInputs).length > 0) {
      setInputStates(prev => ({ ...prev, ...updatedInputs }));
      // Clear errors for those cleared denominations too
      const updatedErrors = { ...errors };
      Object.keys(updatedInputs).forEach(denom => {
        delete updatedErrors[Number(denom)];
      });
      setErrors(updatedErrors);
    }
  }, [denominations]);

  // Focus-and-select helper for keyboard flow
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement | null;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Select input content on focus for quick entry
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleQtyChange = (denom: number, rawVal: string) => {
    setInputStates(prev => ({ ...prev, [denom]: rawVal }));

    // Instant validation of quantity string using Zod Schema
    const res = itemQuantitySchema.safeParse(rawVal);

    if (res.success) {
      setErrors(prev => ({ ...prev, [denom]: "" }));
      updateDenominationQuantity(denom, res.data);
    } else {
      // Show descriptive message and update store calculation to 0 to prevent corrupt tally
      setErrors(prev => ({ ...prev, [denom]: res.error.issues[0].message }));
      updateDenominationQuantity(denom, 0);
    }
  };

  const getDisplayValue = (denom: number, qty: number) => {
    if (inputStates[denom] !== undefined) {
      return inputStates[denom];
    }
    return qty === 0 ? "" : qty.toString();
  };

  // Helper to color bills and coins according to Colombian Peso design, fully optimized for both themes
  const getDenominationColor = (denom: number) => {
    switch (denom) {
      case 100000:
        return { 
          bg: "bg-[#e2f1eb] dark:bg-[#123126]", 
          border: "border-[#8acdb0] dark:border-[#1d5c41]", 
          text: "text-[#12583d] dark:text-[#a0eed9]", 
          label: "Billete" 
        };
      case 50000:
        return { 
          bg: "bg-[#f4ebf8] dark:bg-[#2c1d32]", 
          border: "border-[#d1afd8] dark:border-[#5a2e68]", 
          text: "text-[#5b1e6e] dark:text-[#e4beed]", 
          label: "Billete" 
        };
      case 20000:
        return { 
          bg: "bg-[#fff2e6] dark:bg-[#3d2410]", 
          border: "border-[#ffd4ad] dark:border-[#734217]", 
          text: "text-[#a35200] dark:text-[#ffd6b3]", 
          label: "Billete" 
        };
      case 1000:
        return { 
          bg: "bg-[#faf0e6] dark:bg-[#2e2114]", 
          border: "border-[#e0c0a0] dark:border-[#593b1d]", 
          text: "text-[#5c2e00] dark:text-[#f3cd9e]", 
          label: "Billete / Moneda" 
        };
      case 10000:
        return { 
          bg: "bg-[#ffebe6] dark:bg-[#3a1510]", 
          border: "border-[#ffbeb0] dark:border-[#702113]", 
          text: "text-[#a81a00] dark:text-[#fcaea0]", 
          label: "Billete" 
        };
      case 5000:
        return { 
          bg: "bg-[#f5f5dc] dark:bg-[#2a2a16]", 
          border: "border-[#dfdfa3] dark:border-[#5d5d28]", 
          text: "text-[#5e5e2e] dark:text-[#dfdf99]", 
          label: "Billete" 
        };
      case 2000:
        return { 
          bg: "bg-[#e6f2ff] dark:bg-[#11243b]", 
          border: "border-[#b0d4ff] dark:border-[#204975]", 
          text: "text-[#0052a3] dark:text-[#aadbff]", 
          label: "Billete" 
        };
      case 500:
      case 200:
      case 100:
        return { 
          bg: "bg-slate-50 dark:bg-slate-800/40", 
          border: "border-slate-200 dark:border-slate-700", 
          text: "text-slate-700 dark:text-slate-350", 
          label: "Moneda" 
        };
      default:
        return { 
          bg: "bg-gray-50 dark:bg-slate-800/50", 
          border: "border-gray-200 dark:border-slate-700", 
          text: "text-gray-700 dark:text-slate-300", 
          label: "Efectivo" 
        };
    }
  };

  return (
    <div className="flex flex-col gap-6" id="cash-counter-module">
      {/* Dynamic Display of Total Cash Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex items-center justify-between transition-all duration-300" id="total-cash-badge-container">
        <div id="total-cash-texts">
          <p className="text-[10px] font-extrabold tracking-widest text-[#a5b4fc] uppercase flex items-center gap-1.5 animate-pulse" id="total-cash-title">
            <Coins size={12} className="text-[#f59e0b]" />
            Total Efectivo en Caja
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight font-sans mt-2 text-white animate-fade-in" id="total-cash-value">
            {formatCOP(totalCash)}
          </h2>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-750 hidden sm:block shadow-inner" id="total-cash-icon">
          <Coins size={32} className="text-[#fbbf24] animate-pulse" />
        </div>
      </div>
 
      {/* Main Counting Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200" id="denom-table-wrapper">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between animate-fade-in" id="denom-table-header">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5" id="denom-table-hd-title">
              Conteo por Denominación
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" id="denom-table-hd-desc">
              Escribe las cantidades de billetes/monedas. Usa <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 text-[10px] rounded font-mono font-semibold">Enter ↵</kbd> o las flechas para navegar sin ratón.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-800/50 px-2.5 py-1 rounded-full font-mono" id="item-count-badge">
            {denominations.length} Denominaciones
          </span>
        </div>
 
        <div className="overflow-x-auto" id="denom-table-scroller animate-fade-in">
          <table className="w-full text-left border-collapse" id="denom-table">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-150 dark:border-slate-800/80" id="denom-thead-row">
                <th className="px-5 py-3 w-1/3" id="th-denomination">Denominación</th>
                <th className="px-5 py-3 w-1/3" id="th-quantity">Cantidad</th>
                <th className="px-5 py-3 w-1/3 text-right" id="th-total">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60" id="denom-table-body">
              {denominations.map((item, index) => {
                const styles = getDenominationColor(item.denomination);
                const hasError = !!errors[item.denomination];
                
                return (
                  <tr 
                    key={item.denomination} 
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors group"
                    id={`row-${item.denomination}`}
                  >
                    {/* Denomination Info */}
                    <td className="px-5 py-3.5 align-middle" id={`cell-desc-${item.denomination}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-28 py-1.5 px-3 rounded-lg border font-mono font-black text-center text-sm md:text-base tracking-tight shadow-3xs transition-colors duration-150 ${styles.bg} ${styles.border} ${styles.text}`} id={`badge-${item.denomination}`}>
                          {item.denomination.toLocaleString("es-CO")}
                        </div>
                        <div id={`label-container-${item.denomination}`}>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans" id={`label-${item.denomination}`}>{styles.label}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold" id={`currency-${item.denomination}`}>COP</p>
                        </div>
                      </div>
                    </td>
 
                    {/* Quantity Input Field with Zod Validation */}
                    <td className="px-5 py-3.5 align-middle" id={`cell-input-${item.denomination}`}>
                      <div className="relative max-w-[170px]" id={`input-container-${item.denomination}`}>
                        <input
                          type="text"
                          inputMode="numeric"
                          data-index={index}
                          value={getDisplayValue(item.denomination, item.quantity)}
                          onChange={(e) => handleQtyChange(item.denomination, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onFocus={handleFocus}
                          placeholder="0"
                          className={`w-full text-left font-mono font-bold text-base bg-white dark:bg-slate-905 border-2 ${
                            hasError 
                              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" 
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-600 focus:ring-indigo-600"
                          } focus:ring-1 rounded-xl px-4 py-2 transition-all shadow-3xs text-slate-800 dark:text-slate-200 focus:outline-none`}
                          id={`input-${item.denomination}`}
                        />
                        {hasError && (
                          <div className="flex items-center gap-1 text-[10px] text-rose-500 mt-1 font-semibold animate-fade-in absolute left-1 top-full z-10 bg-white dark:bg-slate-900 rounded px-1 shadow-md border border-rose-200/50" id={`err-${item.denomination}`}>
                            <AlertCircle size={10} />
                            <span>{errors[item.denomination]}</span>
                          </div>
                        )}
                      </div>
                    </td>
 
                    {/* Automatic Calculated Total */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 align-middle" id={`cell-total-${item.denomination}`}>
                      <div className="flex items-center justify-end gap-1" id={`total-container-${item.denomination}`}>
                        {item.total > 0 ? (
                          <span className="text-indigo-600 dark:text-indigo-400 tracking-tight" id={`val-${item.denomination}`}>
                            {formatCOP(item.total)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 shadow-none" id={`val-empty-${item.denomination}`}>$0</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
 
        {/* Footer info about fast calculation */}
        <div className="bg-slate-50 dark:bg-slate-950/40 px-5 py-3.5 border-t border-slate-100/85 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2" id="denom-table-footer">
          <CircleEqual size={14} className="text-indigo-500" />
          <span>Suma total calculada automáticamente en pesos colombianos.</span>
        </div>
      </div>
    </div>
  );
}
