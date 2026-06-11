/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from "zustand";
import { CashClosure, DenominationItem, AdjustmentItem, ActiveTab, GoogleSheetsConfig } from "./types";

interface CashState {
  closures: CashClosure[];
  activeTab: ActiveTab;
  selectedClosureId: string | null;

  // Active closure draft
  denominations: DenominationItem[];
  bancolombiaBalance: number;
  bancolombiaCredit: number;
  tksBalance: number;
  tksCommission: number;
  ptmBalance: number;
  adjustments: AdjustmentItem[];
  observations: string;

  // Google Sheets configurations
  sheetsConfig: GoogleSheetsConfig;
  sheetsSyncing: boolean;
  sheetsError: string | null;

  // Setters
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedClosureId: (id: string | null) => void;
  updateDenominationQuantity: (denomination: number, quantity: number) => void;
  updateBancolombiaBalance: (val: number) => void;
  updateBancolombiaCredit: (val: number) => void;
  updateTksBalance: (val: number) => void;
  updateTksCommission: (val: number) => void;
  updatePtmBalance: (val: number) => void;
  addAdjustment: (concept: string, value: number) => void;
  removeAdjustment: (id: string) => void;
  updateObservations: (text: string) => void;

  // Google Sheets Slices
  updateSheetsConfig: (updates: Partial<GoogleSheetsConfig>) => void;
  setSheetsSyncing: (isSyncing: boolean) => void;
  setSheetsError: (err: string | null) => void;
  markClosureSynced: (id: string, synced: boolean) => void;

  // Operations
  resetCurrentClosure: (preserveBalances: boolean) => void;
  saveCurrentClosure: () => CashClosure;
  deleteClosure: (id: string) => void;
}

const DEFAULT_DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

const getStoredClosures = (): CashClosure[] => {
  try {
    const data = localStorage.getItem("cash_closures");
    if (!data) return [];
    
    const parsed: CashClosure[] = JSON.parse(data);
    let changed = false;
    
    // Migrate and ensure grandTotal does not include bancolombiaCredit
    const migrated = parsed.map((item) => {
      const computedTotalCash = item.denominations.reduce((acc, d) => acc + (d.total || 0), 0);
      const totalAdjustments = item.adjustments.reduce((acc, adj) => acc + adj.value, 0);
      const correctedGrandTotal = 
        computedTotalCash + 
        (item.tksBalance || 0) + 
        (item.ptmBalance || 0) + 
        totalAdjustments;
        
      if (item.grandTotal !== correctedGrandTotal || item.tksCommission === undefined) {
        changed = true;
        return {
          ...item,
          tksCommission: item.tksCommission || 0,
          totalCash: computedTotalCash,
          grandTotal: correctedGrandTotal
        };
      }
      return item;
    });

    if (changed) {
      persistClosures(migrated);
    }
    return migrated;
  } catch (e) {
    console.error("Error reading cash closures from localStorage", e);
    return [];
  }
};

const persistClosures = (closures: CashClosure[]) => {
  try {
    localStorage.setItem("cash_closures", JSON.stringify(closures));
  } catch (e) {
    console.error("Error saving cash closures to localStorage", e);
  }
};

const getStoredDraft = (key: string, defaultValue: any) => {
  try {
    const data = localStorage.getItem(`draft_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const persistDraft = (key: string, value: any) => {
  try {
    localStorage.setItem(`draft_${key}`, JSON.stringify(value));
  } catch {}
};

const initialDenominations: DenominationItem[] = getStoredDraft("denominations", 
  DEFAULT_DENOMINATIONS.map((num) => ({
    denomination: num,
    quantity: 0,
    total: 0,
  }))
);

export const useCashStore = create<CashState>((set, get) => ({
  closures: getStoredClosures(),
  activeTab: "cuadre",
  selectedClosureId: null,

  // Draft state load
  denominations: initialDenominations,
  bancolombiaBalance: getStoredDraft("bancolombiaBalance", 0),
  bancolombiaCredit: getStoredDraft("bancolombiaCredit", 0),
  tksBalance: getStoredDraft("tksBalance", 0),
  tksCommission: getStoredDraft("tksCommission", 0),
  ptmBalance: getStoredDraft("ptmBalance", 0),
  adjustments: getStoredDraft("adjustments", []),
  observations: getStoredDraft("observations", ""),

  // Google Sheets initial state
  sheetsConfig: getStoredDraft("sheetsConfig", {
    clientId: "10335006369119-dummy.apps.googleusercontent.com",
    spreadsheetId: "",
    sheetName: "Cierres de Caja",
    autoSync: true,
    accessToken: null,
    tokenExpiresAt: null,
    lastSyncedAt: null,
  }),
  sheetsSyncing: false,
  sheetsError: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedClosureId: (id) => set({ selectedClosureId: id }),

  updateSheetsConfig: (updates) => {
    set((state) => {
      const updated = { ...state.sheetsConfig, ...updates };
      persistDraft("sheetsConfig", updated);
      return { sheetsConfig: updated };
    });
  },

  setSheetsSyncing: (isSyncing) => set({ sheetsSyncing: isSyncing }),

  setSheetsError: (err) => set({ sheetsError: err }),

  markClosureSynced: (id, synced) => {
    set((state) => {
      const updatedClosures = state.closures.map((c) =>
        c.id === id ? { ...c, syncedToSheets: synced } : c
      );
      persistClosures(updatedClosures);
      return { closures: updatedClosures };
    });
  },

  updateDenominationQuantity: (denomination, quantity) => {
    set((state) => {
      const updatedDenom = state.denominations.map((item) => {
        if (item.denomination === denomination) {
          const qty = Math.max(0, quantity);
          return {
            denomination,
            quantity: qty,
            total: qty * denomination,
          };
        }
        return item;
      });
      persistDraft("denominations", updatedDenom);
      return { denominations: updatedDenom };
    });
  },

  updateBancolombiaBalance: (val) => {
    const v = Math.max(0, val);
    persistDraft("bancolombiaBalance", v);
    set({ bancolombiaBalance: v });
  },

  updateBancolombiaCredit: (val) => {
    const v = Math.max(0, val);
    persistDraft("bancolombiaCredit", v);
    set({ bancolombiaCredit: v });
  },

  updateTksBalance: (val) => {
    const v = Math.max(0, val);
    persistDraft("tksBalance", v);
    set({ tksBalance: v });
  },

  updateTksCommission: (val) => {
    const v = Math.max(0, val);
    persistDraft("tksCommission", v);
    set({ tksCommission: v });
  },

  updatePtmBalance: (val) => {
    const v = Math.max(0, val);
    persistDraft("ptmBalance", v);
    set({ ptmBalance: v });
  },

  addAdjustment: (concept, value) => {
    set((state) => {
      const newAdjustment: AdjustmentItem = {
        id: crypto.randomUUID(),
        concept: concept.trim() || "Ajuste sin concepto",
        value,
      };
      const updated = [...state.adjustments, newAdjustment];
      persistDraft("adjustments", updated);
      return { adjustments: updated };
    });
  },

  removeAdjustment: (id) => {
    set((state) => {
      const updated = state.adjustments.filter((adj) => adj.id !== id);
      persistDraft("adjustments", updated);
      return { adjustments: updated };
    });
  },

  updateObservations: (text) => {
    persistDraft("observations", text);
    set({ observations: text });
  },

  resetCurrentClosure: (preserveBalances) => {
    const freshDenominations = DEFAULT_DENOMINATIONS.map((num) => ({
      denomination: num,
      quantity: 0,
      total: 0,
    }));

    persistDraft("denominations", freshDenominations);

    if (preserveBalances) {
      persistDraft("observations", "");
      set({
        denominations: freshDenominations,
        observations: "",
      });
    } else {
      persistDraft("adjustments", []);
      persistDraft("observations", "");
      persistDraft("bancolombiaBalance", 0);
      persistDraft("bancolombiaCredit", 0);
      persistDraft("tksBalance", 0);
      persistDraft("tksCommission", 0);
      persistDraft("ptmBalance", 0);

      set({
        denominations: freshDenominations,
        bancolombiaBalance: 0,
        bancolombiaCredit: 0,
        tksBalance: 0,
        tksCommission: 0,
        ptmBalance: 0,
        adjustments: [],
        observations: "",
      });
    }
  },

  saveCurrentClosure: () => {
    const state = get();
    const totalCash = state.denominations.reduce((acc, item) => acc + item.total, 0);
    const totalAdjustments = state.adjustments.reduce((acc, item) => acc + item.value, 0);
    const grandTotal =
      totalCash +
      state.tksBalance +
      state.ptmBalance +
      totalAdjustments;

    const newClosure: CashClosure = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      denominations: JSON.parse(JSON.stringify(state.denominations)),
      totalCash,
      bancolombiaBalance: state.bancolombiaBalance,
      bancolombiaCredit: state.bancolombiaCredit,
      tksBalance: state.tksBalance,
      tksCommission: state.tksCommission || 0,
      ptmBalance: state.ptmBalance,
      adjustments: JSON.parse(JSON.stringify(state.adjustments)),
      observations: state.observations,
      grandTotal,
    };

    const updatedClosures = [newClosure, ...state.closures];
    set({ closures: updatedClosures });
    persistClosures(updatedClosures);

    return newClosure;
  },

  deleteClosure: (id) => {
    set((state) => {
      const updated = state.closures.filter((c) => c.id !== id);
      persistClosures(updated);
      const selectedId = state.selectedClosureId === id ? null : state.selectedClosureId;
      return { closures: updated, selectedClosureId: selectedId };
    });
  },
}));
