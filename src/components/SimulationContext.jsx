import { createContext, useContext } from 'react'

const SimulationContext = createContext({ phase: 4, setPhase: () => {} })

export function useSimulation() {
  return useContext(SimulationContext)
}

export default SimulationContext
