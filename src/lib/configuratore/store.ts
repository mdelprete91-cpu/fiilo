'use client'

import { create } from 'zustand'
import type {
  ConfiguratoreState, ConfigStep, JacketConfig, PantConfig, VestConfig, ColorContrastConfig, FabricConfig,
} from '@/types/configuratore'
import type { GarmentType } from '@/types/database'
import { EMPTY_FABRIC, EMPTY_JACKET, EMPTY_PANT, EMPTY_COLOR } from './defaults'
import { nextStep, prevStep, resolveLegacyStep } from './steps'

interface ConfiguratoreStore {
  garmentId: string | null
  clientId: string | null
  garmentName: string
  currentStep: ConfigStep
  isDirty: boolean
  isSaving: boolean
  /** Where to return when the user exits the configurator. */
  origin: 'produzione' | 'clienti'
  measurementsCount: number
  config: ConfiguratoreState

  // Navigation
  setStep: (step: ConfigStep) => void
  goNext: () => void
  goBack: () => void

  // Garment meta
  setGarmentName: (name: string) => void
  setGarmentType: (type: GarmentType | null) => void

  // Field setters
  setFabric: (patch: Partial<FabricConfig>) => void
  setJacket: (patch: Partial<JacketConfig>) => void
  setPant: (patch: Partial<PantConfig>) => void
  setVest: (patch: Partial<VestConfig> | null) => void
  setColor: (patch: Partial<ColorContrastConfig>) => void
  setMeasurementId: (id: string | null) => void

  // Persistence
  markSaved: () => void
  markSaving: (saving: boolean) => void

  // Hydrate from DB
  hydrate: (args: {
    garmentId: string
    clientId: string
    name: string
    step: string
    state: ConfiguratoreState
    origin: 'produzione' | 'clienti'
    measurementsCount: number
  }) => void
  setMeasurementsCount: (n: number) => void
  reset: () => void
}

const INITIAL_STATE: ConfiguratoreState = {
  garmentType: null,
  fabric: EMPTY_FABRIC,
  jacket: EMPTY_JACKET,
  pant: EMPTY_PANT,
  vest: null,
  colorContrast: EMPTY_COLOR,
  measurementId: null,
}

export const useConfiguratoreStore = create<ConfiguratoreStore>((set, get) => ({
  garmentId: null,
  clientId: null,
  garmentName: 'Nuovo abito',
  currentStep: 'setup.type',
  isDirty: false,
  isSaving: false,
  origin: 'clienti',
  measurementsCount: 0,
  config: INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),

  goNext: () => {
    const { currentStep, config, measurementsCount } = get()
    const next = nextStep(currentStep, config, { measurementsCount })
    if (next) set({ currentStep: next })
  },

  goBack: () => {
    const { currentStep, config, measurementsCount } = get()
    const prev = prevStep(currentStep, config, { measurementsCount })
    if (prev) set({ currentStep: prev })
  },

  setGarmentName: (garmentName) => set({ garmentName, isDirty: true }),
  setGarmentType: (garmentType) =>
    set((s) => {
      // If switching to a type without vest, drop the vest config entirely.
      const dropsVest =
        garmentType !== 'suit_3pc' && garmentType !== 'waistcoat' && garmentType !== 'tuxedo'
      return {
        config: {
          ...s.config,
          garmentType,
          vest: dropsVest ? null : s.config.vest,
        },
        isDirty: true,
      }
    }),

  setFabric: (patch) => set((s) => ({
    config: { ...s.config, fabric: { ...s.config.fabric, ...patch } },
    isDirty: true,
  })),
  setJacket: (patch) => set((s) => ({
    config: { ...s.config, jacket: { ...s.config.jacket, ...patch } },
    isDirty: true,
  })),
  setPant: (patch) => set((s) => ({
    config: { ...s.config, pant: { ...s.config.pant, ...patch } },
    isDirty: true,
  })),
  setVest: (vest) => set((s) => ({
    config: { ...s.config, vest: vest === null ? null : { ...(s.config.vest ?? {}), ...vest } as VestConfig },
    isDirty: true,
  })),
  setColor: (patch) => set((s) => ({
    config: { ...s.config, colorContrast: { ...s.config.colorContrast, ...patch } },
    isDirty: true,
  })),
  setMeasurementId: (measurementId) => set((s) => ({
    config: { ...s.config, measurementId },
    isDirty: true,
  })),

  markSaved: () => set({ isDirty: false }),
  markSaving: (isSaving) => set({ isSaving }),

  hydrate: ({ garmentId, clientId, name, step, state, origin, measurementsCount }) =>
    set({
      garmentId,
      clientId,
      garmentName: name,
      currentStep: resolveLegacyStep(step),
      isDirty: false,
      isSaving: false,
      origin,
      measurementsCount,
      config: state,
    }),

  setMeasurementsCount: (n) => set({ measurementsCount: n }),

  reset: () =>
    set({
      garmentId: null,
      clientId: null,
      garmentName: 'Nuovo abito',
      currentStep: 'setup.type',
      isDirty: false,
      isSaving: false,
      origin: 'clienti',
      measurementsCount: 0,
      config: INITIAL_STATE,
    }),
}))
