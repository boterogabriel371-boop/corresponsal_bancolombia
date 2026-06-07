/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useCashStore } from "../store";
import { FileText } from "lucide-react";

export default function ObservationsBox() {
  const { observations, updateObservations } = useCashStore();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-3.5" id="observations-module">
      <div className="flex items-center gap-2 border-b border-slate-150 pb-2.5" id="obs-title-wrapper">
        <FileText size={16} className="text-slate-400 shrink-0" />
        <div>
          <h4 className="text-sm font-extrabold text-slate-800" id="obs-title">
            Observaciones y Novedades del Día
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium" id="obs-desc">
            Registra aclaraciones, descuadres menores, transacciones rechazadas o eventos extraordinarios.
          </p>
        </div>
      </div>
      
      <div id="obs-textarea-wrapper">
        <textarea
          id="obs-textarea"
          rows={3}
          value={observations}
          onChange={(e) => updateObservations(e.target.value)}
          placeholder="Ej: Cliente entregó efectivo ($20.000) pero la transacción en PTM fue rechazada inicialmente debido a fallas de red... "
          className="w-full text-xs font-bold leading-relaxed bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl p-3.5 text-slate-800 placeholder-slate-400 transition-all focus:ring-1 focus:ring-indigo-600"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold" id="obs-footer">
        <span>Se guarda automáticamente de forma local.</span>
        <span className="font-mono">{observations.length} Caracteres</span>
      </div>
    </div>
  );
}
