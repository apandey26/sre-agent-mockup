import { create } from 'zustand'

const useStore = create((set) => ({
  // Active scenario: 'A' or 'B'
  activeScenario: 'A',
  setActiveScenario: (s) => set({ activeScenario: s }),

  // Active investigations count
  activeInvestigations: 2,
}))

export default useStore
