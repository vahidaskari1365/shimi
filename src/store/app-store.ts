"use client";

import { create } from "zustand";
import { apiFetch } from "@/hooks/use-api";
import type { SettingsDTO, HealthDTO } from "@/lib/types";

export type TabId =
  | "chat"
  | "documents"
  | "formulations"
  | "ingredients"
  | "graph"
  | "troubleshooting"
  | "settings";

interface AppState {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  settings: SettingsDTO | null;
  settingsLoading: boolean;
  refreshTick: number;
  bumpRefresh: () => void;
  loadSettings: () => Promise<void>;
  health: HealthDTO | null;
  setHealth: (h: HealthDTO | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "chat",
  setActiveTab: (t) => set({ activeTab: t }),
  settings: null,
  settingsLoading: true,
  refreshTick: 0,
  bumpRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
  loadSettings: async () => {
    try {
      const settings = await apiFetch<SettingsDTO>("/api/settings");
      set({ settings, settingsLoading: false });
    } catch {
      set({ settingsLoading: false });
    }
  },
  health: null,
  setHealth: (h) => set({ health: h }),
}));
