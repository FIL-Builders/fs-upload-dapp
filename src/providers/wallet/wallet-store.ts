import { create } from "zustand";

interface WalletModalState {
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useWalletStore = create<WalletModalState>()((set) => ({
  modalOpen: false,
  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
}));
