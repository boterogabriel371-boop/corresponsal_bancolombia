/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from "react";
import { useCashStore } from "../store";
import { formatCOP } from "../utils";
import { Coins, CircleEqual, RefreshCw } from "lucide-react";

export default function CashCounterTable() {
  const { denominations, updateDenominationQuantity } = useCashStore();

  const totalCash = denominations.reduce((acc, item) => acc + item.total, 0);

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

  // Helper to color bills and coins according to Colombian Peso design
  const getDenominationColor = (denom: number) => {
    switch (denom) {
      case 100000:
        return { bg: "bg-[#e2f1eb]", border: "border-[#8acdb0]", text: "text-[#12583d]", label: "Billete" };
      case 50000:
        return { bg: "bg-[#f4ebf8]", border: "border-[#d1afd8]", text: "text-[#5b1e6e]", label: "Billete" };
      case 20000:
        return { bg: "bg-[#fff2e6]", border: "border-[#ffd4ad]", text: "text-[#a35200]", label: "Billete" };
      case 10000:
        return { bg: "bg-[#ffebe6]", border: "border-[#ffbeb0]", text: "text-[#a81a00]", label: "Billete" };
      case 5000:
        return { bg: "bg-[#f5f5dc]", border: "border-[#dfdfa3]", text: "text-[#5e5e2e]", label: "Billete" };
      case 2000:
        return { bg: "bg-[#e6f2ff]", border: "border-[#b0d4ff]", text: "text-[#0052a3]", label: "Billete" };
      case 1000:
        return { bg: "bg-[#faf0e6]", border: "border-[#e0c0a0]", text: "text-[#5c2e00]", label: "Billete / Moneda" };
      case 500:
        return { bg: "bg-[#f1f3f5]", border: "border-[#dee2e6]", text: "text-[#495057]", label: "Moneda" };
      case 200:
        return { bg: "bg-[#f1f3f5]", border: "border-[#dee2e5]", text: "text-[#495057]", label: "Moneda" };
      case 100:
        return { bg: "bg-[#f1f3f5]", border: "border-[#dee2e5]", text: "text-[#495057]", label: "Moneda" };
      default:
        return { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", label: "Efectivo" };
    }
  };

  return (
    <div className="flex flex-col gap-6" id="cash-counter-module">
      {/* Dynamic Display of Total Cash Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex items-center justify-between transition-all duration-300" id="total-cash-badge-container">
        <div id="total-cash-texts">
          <p className="text-[10px] font-extrabold tracking-widest text-[#a5b4fc] uppercase flex items-center gap-1.5" id="total-cash-title">
            <Coins size={12} className="text-[#f59e0b]" />
            Total Efectivo en Caja
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight font-sans mt-2 text-white" id="total-cash-value">
            {formatCOP(totalCash)}
          </h2>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hidden sm:block shadow-inner" id="total-cash-icon">
          <Coins size={32} className="text-[#fbbf24] animate-pulse" />
        </div>
      </div>
 
      {/* Main Counting Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="denom-table-wrapper">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" id="denom-table-header">
          <div>
            <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5" id="denom-table-hd-title">
              Conteo por Denominación
            </h3>
            <p className="text-xs text-slate-500 mt-0.5" id="denom-table-hd-desc">
              Escribe las cantidades de billetes/monedas. Usa <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-250 text-[10px] rounded font-mono font-semibold">Enter ↵</kbd> o las flechas para navegar sin ratón.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100/50 px-2.5 py-1 rounded-full font-mono" id="item-count-badge">
            {denominations.length} Denominaciones
          </span>
        </div>
 
        <div className="overflow-x-auto" id="denom-table-scroller">
          <table className="w-full text-left border-collapse" id="denom-table">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-150" id="denom-thead-row">
                <th className="px-5 py-3 w-1/3" id="th-denomination">Denominación</th>
                <th className="px-5 py-3 w-1/3" id="th-quantity">Cantidad</th>
                <th className="px-5 py-3 w-1/3 text-right" id="th-total">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" id="denom-table-body">
              {denominations.map((item, index) => {
                const styles = getDenominationColor(item.denomination);
                return (
                  <tr 
                    key={item.denomination} 
                    className="hover:bg-slate-50/70 transition-colors group"
                    id={`row-${item.denomination}`}
                  >
                    {/* Denomination Info */}
                    <td className="px-5 py-3.5 align-middle" id={`cell-desc-${item.denomination}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-28 py-1.5 px-3 rounded-lg border font-mono font-black text-center text-sm md:text-base tracking-tight shadow-3xs ${styles.bg} ${styles.border} ${styles.text}`} id={`badge-${item.denomination}`}>
                          {item.denomination.toLocaleString("es-CO")}
                        </div>
                        <div id={`label-container-${item.denomination}`}>
                          <p className="text-xs font-bold text-slate-700 font-sans" id={`label-${item.denomination}`}>{styles.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-bold" id={`currency-${item.denomination}`}>COP</p>
                        </div>
                      </div>
                    </td>
 
                    {/* Quantity Input Field */}
                    <td className="px-5 py-3.5 align-middle" id={`cell-input-${item.denomination}`}>
                      <div className="relative max-w-[160px]" id={`input-container-${item.denomination}`}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          data-index={index}
                          value={item.quantity === 0 ? "" : item.quantity.toString()}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            const val = raw ? parseInt(raw, 10) : 0;
                            updateDenominationQuantity(item.denomination, val);
                          }}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onFocus={handleFocus}
                          placeholder="0"
                          className="w-full text-left font-mono font-bold text-base bg-white focus:bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl px-4 py-2 transition-all shadow-3xs focus:ring-1 focus:ring-indigo-600 text-slate-800 focus:outline-none"
                          id={`input-${item.denomination}`}
                        />
                      </div>
                    </td>
 
                    {/* Automatic Calculated Total */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-sm md:text-base text-slate-900 align-middle" id={`cell-total-${item.denomination}`}>
                      <div className="flex items-center justify-end gap-1" id={`total-container-${item.denomination}`}>
                        {item.total > 0 ? (
                          <span className="text-indigo-600 tracking-tight" id={`val-${item.denomination}`}>
                            {formatCOP(item.total)}
                          </span>
                        ) : (
                          <span className="text-slate-300" id={`val-empty-${item.denomination}`}>$0</span>
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
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100/80 text-xs text-slate-500 font-semibold flex items-center gap-2" id="denom-table-footer">
          <CircleEqual size={14} className="text-indigo-500" />
          <span>Suma total calculada automáticamente en pesos colombianos.</span>
        </div>
      </div>
    </div>
  );
}
