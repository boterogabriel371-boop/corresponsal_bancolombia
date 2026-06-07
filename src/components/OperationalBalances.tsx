/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useCashStore } from "../store";
import { formatCOP } from "../utils";
import { CreditCard, Landmark, Percent, Layers, ShieldCheck } from "lucide-react";

export default function OperationalBalances() {
  const {
    bancolombiaBalance,
    bancolombiaCredit,
    tksBalance,
    ptmBalance,
    updateBancolombiaBalance,
    updateBancolombiaCredit,
    updateTksBalance,
    updatePtmBalance,
  } = useCashStore();

  // Helper inputs to parse and update easily
  const createInputChangeHandler = (updater: (val: number) => void) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      const val = raw ? parseInt(raw, 10) : 0;
      updater(val);
    };
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const totalBalances = bancolombiaBalance + tksBalance + ptmBalance;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="operational-balances-module">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" id="balances-header">
        <div>
          <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5" id="balances-hd-title">
            Saldos Operativos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5" id="balances-hd-desc">
            Registra saldos de cuentas bancarias y plataformas diarias.
          </p>
        </div>
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100/50 px-2.5 py-1 rounded-full font-mono" id="balances-total-badge">
          + {formatCOP(totalBalances)}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-4.5" id="balances-inputs-grid">
        {/* Saldo Bancolombia */}
        <div className="flex flex-col gap-1.5" id="group-bancolombia-saldo">
          <label className="text-xs font-bold text-slate-600 flex items-center justify-between" htmlFor="input-bancolombia-balance">
            <span>Saldo Bancolombia</span>
            {bancolombiaBalance > 0 && (
              <span className="text-[10px] text-slate-500 font-mono font-extrabold bg-slate-50 border border-slate-200 px-1.5 rounded">
                {formatCOP(bancolombiaBalance)}
              </span>
            )}
          </label>
          <div className="relative rounded-xl shadow-3xs" id="input-bancolombia-balance-wrapper">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400" id="icon-bancolombia-balance">
              <Landmark size={15} />
            </div>
            <input
              type="text"
              id="input-bancolombia-balance"
              inputMode="numeric"
              placeholder="$ 0"
              value={bancolombiaBalance === 0 ? "" : bancolombiaBalance.toString()}
              onChange={createInputChangeHandler(updateBancolombiaBalance)}
              onFocus={handleFocus}
              className="w-full text-left font-mono font-bold text-sm bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl pl-9.5 pr-4 py-2.5 transition-all text-slate-800 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Cupo Bancolombia */}
        <div className="flex flex-col gap-1.5" id="group-bancolombia-cupo">
          <label className="text-xs font-bold text-slate-600 flex items-center justify-between" htmlFor="input-bancolombia-credit">
            <span>Cupo Bancolombia <span className="text-[9px] font-normal text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-slate-905 px-1.5 py-0.5 rounded border border-indigo-100/50 dark:border-slate-800">Informativo</span></span>
            {bancolombiaCredit > 0 && (
              <span className="text-[10px] text-slate-500 font-mono font-extrabold bg-slate-50 border border-slate-200 px-1.5 rounded">
                {formatCOP(bancolombiaCredit)}
              </span>
            )}
          </label>
          <div className="relative rounded-xl shadow-3xs" id="input-bancolombia-credit-wrapper">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400" id="icon-bancolombia-credit">
              <CreditCard size={15} />
            </div>
            <input
              type="text"
              id="input-bancolombia-credit"
              inputMode="numeric"
              placeholder="$ 0"
              value={bancolombiaCredit === 0 ? "" : bancolombiaCredit.toString()}
              onChange={createInputChangeHandler(updateBancolombiaCredit)}
              onFocus={handleFocus}
              className="w-full text-left font-mono font-bold text-sm bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl pl-9.5 pr-4 py-2.5 transition-all text-slate-800 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Saldo TKS */}
        <div className="flex flex-col gap-1.5" id="group-tks">
          <label className="text-xs font-bold text-slate-600 flex items-center justify-between" htmlFor="input-tks-balance">
            <span>Saldo TKS</span>
            {tksBalance > 0 && (
              <span className="text-[10px] text-slate-500 font-mono font-extrabold bg-slate-50 border border-slate-200 px-1.5 rounded">
                {formatCOP(tksBalance)}
              </span>
            )}
          </label>
          <div className="relative rounded-xl shadow-3xs" id="input-tks-balance-wrapper">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400" id="icon-tks-balance">
              <Layers size={15} />
            </div>
            <input
              type="text"
              id="input-tks-balance"
              inputMode="numeric"
              placeholder="$ 0"
              value={tksBalance === 0 ? "" : tksBalance.toString()}
              onChange={createInputChangeHandler(updateTksBalance)}
              onFocus={handleFocus}
              className="w-full text-left font-mono font-bold text-sm bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl pl-9.5 pr-4 py-2.5 transition-all text-slate-800 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Saldo PTM */}
        <div className="flex flex-col gap-1.5" id="group-ptm">
          <label className="text-xs font-bold text-slate-600 flex items-center justify-between" htmlFor="input-ptm-balance">
            <span>Saldo PTM</span>
            {ptmBalance > 0 && (
              <span className="text-[10px] text-slate-500 font-mono font-extrabold bg-slate-50 border border-slate-200 px-1.5 rounded">
                {formatCOP(ptmBalance)}
              </span>
            )}
          </label>
          <div className="relative rounded-xl shadow-3xs" id="input-ptm-balance-wrapper">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400" id="icon-ptm-balance">
              <Percent size={15} />
            </div>
            <input
              type="text"
              id="input-ptm-balance"
              inputMode="numeric"
              placeholder="$ 0"
              value={ptmBalance === 0 ? "" : ptmBalance.toString()}
              onChange={createInputChangeHandler(updatePtmBalance)}
              onFocus={handleFocus}
              className="w-full text-left font-mono font-bold text-sm bg-white border-2 border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl pl-9.5 pr-4 py-2.5 transition-all text-slate-800 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Safety message */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium" id="balances-footer">
        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
        <span>Tus saldos se cifran y guardan únicamente en este navegador de forma local.</span>
      </div>
    </div>
  );
}
