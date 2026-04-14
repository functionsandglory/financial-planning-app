import { describe, it, expect } from 'vitest'

// =============================================================================
// TYPES - Timeline Event System
// =============================================================================

interface AssetClass {
  id: string
  name: string
  avgReturn: number // Annual return as decimal (e.g., 0.07 for 7%)
  stdDev: number // Annual standard deviation as decimal (e.g., 0.15 for 15%)
}

interface Account {
  id: string
  name: string
  type: '401k' | 'ira' | 'roth_ira' | 'taxable' | 'savings'
  currentBalance: number
  assetAllocation: {
    assetClassId: string
    percentage: number // 0.0 to 1.0, must sum to 1.0
  }[]
}

// Event Types - Core of the timeline system
// For Phase 2: Focus on RECURRING events only
// Future phases will add ONE_TIME events

type EventType = 'savings' | 'expenditure'

type EventFrequency = 'monthly' | 'yearly' // Can expand to weekly, quarterly, etc.

interface TimelineEvent {
  id: string
  name: string
  type: EventType
  amount: number // Positive for savings (contribution), negative for expenditure
  frequency: EventFrequency
  targetAccountId?: string // For savings events - which account receives the money
  startYear: number // When the event starts (0 = today)
  endYear?: number // When the event ends (undefined = runs until end of simulation)
}

// Recurring savings event - contributes to a specific account
interface RecurringSavingsEvent extends TimelineEvent {
  type: 'savings'
  amount: number // Positive - amount to save
  targetAccountId: string // Required - must specify which account
}

// Recurring expenditure event - reduces available cash
interface RecurringExpenditureEvent extends TimelineEvent {
  type: 'expenditure'
  amount: number // Negative - amount spent (stored as negative)
}

interface MonteCarloInput {
  accounts: Account[]
  assetClasses: AssetClass[]
  events: TimelineEvent[] // Timeline of savings and expenditure events
  years: number // Total simulation length
  simulationCount?: number // Default 1000
}

interface YearlyPercentiles {
  year: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

interface MonteCarloResult {
  yearlyPercentiles: YearlyPercentiles[]
  probabilityOfSuccess: number // % of runs that don't hit $0
  // Future: account-specific results, event impact analysis, etc.
}

// Mock function signature - implementation will be imported later
declare function runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResult

// =============================================================================
// TEST DATA
// =============================================================================

describe('Monte Carlo Simulation - Timeline Events System', () => {
  const stocksAsset: AssetClass = {
    id: 'stocks',
    name: 'US Stocks',
    avgReturn: 0.07,
    stdDev: 0.15,
  }

  const bondsAsset: AssetClass = {
    id: 'bonds',
    name: 'US Bonds',
    avgReturn: 0.035,
    stdDev: 0.05,
  }

  const internationalAsset: AssetClass = {
    id: 'international',
    name: 'International Stocks',
    avgReturn: 0.065,
    stdDev: 0.17,
  }

  // =============================================================================
  // BASIC FUNCTIONALITY
  // =============================================================================

  describe('basic timeline event functionality', () => {
    it('should run simulation with single account and monthly savings event', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: '401k-1',
            name: 'My 401k',
            type: '401k',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'monthly-401k-contribution',
            name: '401k Monthly Contribution',
            type: 'savings',
            amount: 1000, // $1000/month
            frequency: 'monthly',
            targetAccountId: '401k-1',
            startYear: 0,
          },
        ],
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.yearlyPercentiles).toHaveLength(31) // Year 0 + 30 years
      expect(result.yearlyPercentiles[0].year).toBe(0)
      expect(result.yearlyPercentiles[30].year).toBe(30)
      expect(result.probabilityOfSuccess).toBeGreaterThan(0)
      expect(result.probabilityOfSuccess).toBeLessThanOrEqual(1)

      // With $1k/month contributions, final balance should be higher than initial
      const finalBalance = result.yearlyPercentiles[30].p50
      expect(finalBalance).toBeGreaterThan(100000)
    })

    it('should run simulation with multiple accounts and savings events', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: '401k-1',
            name: '401k',
            type: '401k',
            currentBalance: 150000,
            assetAllocation: [
              { assetClassId: 'stocks', percentage: 0.6 },
              { assetClassId: 'bonds', percentage: 0.4 },
            ],
          },
          {
            id: 'ira-1',
            name: 'IRA',
            type: 'ira',
            currentBalance: 50000,
            assetAllocation: [
              { assetClassId: 'stocks', percentage: 0.9 },
              { assetClassId: 'bonds', percentage: 0.1 },
            ],
          },
        ],
        assetClasses: [stocksAsset, bondsAsset],
        events: [
          {
            id: '401k-contribution',
            name: '401k Monthly',
            type: 'savings',
            amount: 1500,
            frequency: 'monthly',
            targetAccountId: '401k-1',
            startYear: 0,
          },
          {
            id: 'ira-contribution',
            name: 'IRA Monthly',
            type: 'savings',
            amount: 500,
            frequency: 'monthly',
            targetAccountId: 'ira-1',
            startYear: 0,
          },
        ],
        years: 25,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.yearlyPercentiles).toHaveLength(26)
      expect(result.probabilityOfSuccess).toBeGreaterThan(0)
      
      // Total contributions: $2k/month * 12 * 25 = $600k + growth
      const year0Total = result.yearlyPercentiles[0].p50
      expect(year0Total).toBeCloseTo(200000, -3) // Initial $200k
      
      const year25Total = result.yearlyPercentiles[25].p50
      expect(year25Total).toBeGreaterThan(800000) // Significant growth
    })

    it('should handle yearly frequency events', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'taxable-1',
            name: 'Brokerage',
            type: 'taxable',
            currentBalance: 50000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'yearly-bonus-invest',
            name: 'Yearly Bonus Investment',
            type: 'savings',
            amount: 10000, // $10k/year
            frequency: 'yearly',
            targetAccountId: 'taxable-1',
            startYear: 0,
          },
        ],
        years: 20,
        simulationCount: 500,
      }

      const result = runMonteCarloSimulation(input)

      // Yearly $10k = same total as monthly $833, but different timing impact
      const finalBalance = result.yearlyPercentiles[20].p50
      expect(finalBalance).toBeGreaterThan(50000 + 200000) // $50k initial + $200k contributions
    })
  })

  // =============================================================================
  // EVENT TIMELINE FEATURES
  // =============================================================================

  describe('event timeline features', () => {
    it('should handle events with start and end years (finite recurring)', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: '401k-1',
            name: '401k',
            type: '401k',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'high-savings-period',
            name: 'Aggressive Savings (Working Years)',
            type: 'savings',
            amount: 2000, // $2k/month while working
            frequency: 'monthly',
            targetAccountId: '401k-1',
            startYear: 0,
            endYear: 20, // Stop after year 20
          },
        ],
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      // Growth should slow after year 20 when contributions stop
      const year20Balance = result.yearlyPercentiles[20].p50
      const year30Balance = result.yearlyPercentiles[30].p50
      
      // Still grows from years 20-30 due to investment returns, but slower
      expect(year30Balance).toBeGreaterThan(year20Balance)
    })

    it('should handle events with no end year (infinite recurring)', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: '401k-1',
            name: '401k',
            type: '401k',
            currentBalance: 50000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'lifetime-savings',
            name: 'Lifetime 401k Contribution',
            type: 'savings',
            amount: 1000, // $1k/month
            frequency: 'monthly',
            targetAccountId: '401k-1',
            startYear: 0,
            // No endYear - runs for entire simulation
          },
        ],
        years: 40,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      // Should contribute $1k/month for all 40 years
      // Total contributions: $1k * 12 * 40 = $480k
      // Plus initial $50k and growth
      const finalBalance = result.yearlyPercentiles[40].p50
      expect(finalBalance).toBeGreaterThan(50000 + 480000)
    })

    it('should handle multiple events with different timelines', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: '401k-1',
            name: '401k',
            type: '401k',
            currentBalance: 50000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
          {
            id: 'ira-1',
            name: 'IRA',
            type: 'ira',
            currentBalance: 20000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          // Event 1: 401k contributions for full 30 years
          {
            id: '401k-contribution',
            name: '401k Monthly',
            type: 'savings',
            amount: 1500,
            frequency: 'monthly',
            targetAccountId: '401k-1',
            startYear: 0,
          },
          // Event 2: IRA contributions only first 10 years
          {
            id: 'ira-contribution',
            name: 'IRA Monthly (Early Years)',
            type: 'savings',
            amount: 500,
            frequency: 'monthly',
            targetAccountId: 'ira-1',
            startYear: 0,
            endYear: 10,
          },
          // Event 3: Extra savings years 5-15
          {
            id: 'extra-savings',
            name: 'Extra Savings (Mid Career)',
            type: 'savings',
            amount: 1000,
            frequency: 'monthly',
            targetAccountId: '401k-1',
            startYear: 5,
            endYear: 15,
          },
        ],
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.yearlyPercentiles).toHaveLength(31)
      expect(result.yearlyPercentiles[30].p50).toBeGreaterThan(1000000)
    })
  })

  // =============================================================================
  // EXPENDITURE EVENTS (Phase 2: Recurring Only)
  // =============================================================================

  describe('expenditure events', () => {
    it('should handle monthly expenditure events', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'savings-1',
            name: 'Savings Account',
            type: 'savings',
            currentBalance: 200000,
            assetAllocation: [{ assetClassId: 'bonds', percentage: 1.0 }],
          },
        ],
        assetClasses: [bondsAsset],
        events: [
          {
            id: 'monthly-withdrawal',
            name: 'Monthly Living Expenses',
            type: 'expenditure',
            amount: -5000, // $5k/month spent (negative)
            frequency: 'monthly',
            startYear: 0,
          },
        ],
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      // Withdrawing $5k/month from $200k should eventually deplete
      expect(result.probabilityOfSuccess).toBeLessThan(1) // Some runs hit $0
      expect(result.probabilityOfSuccess).toBeGreaterThan(0) // But not all
    })

    it('should handle mixed savings and expenditure events', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: '401k-1',
            name: '401k',
            type: '401k',
            currentBalance: 100000,
            assetAllocation: [
              { assetClassId: 'stocks', percentage: 0.7 },
              { assetClassId: 'bonds', percentage: 0.3 },
            ],
          },
        ],
        assetClasses: [stocksAsset, bondsAsset],
        events: [
          // Working years: save $2k/month
          {
            id: 'working-savings',
            name: 'Working Years Contributions',
            type: 'savings',
            amount: 2000,
            frequency: 'monthly',
            targetAccountId: '401k-1',
            startYear: 0,
            endYear: 25,
          },
          // Retirement: withdraw $4k/month
          {
            id: 'retirement-withdrawal',
            name: 'Retirement Withdrawals',
            type: 'expenditure',
            amount: -4000,
            frequency: 'monthly',
            startYear: 25,
          },
        ],
        years: 40,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      // 25 years of saving, 15 years of withdrawal
      expect(result.probabilityOfSuccess).toBeGreaterThan(0.5)
    })
  })

  // =============================================================================
  // VOLATILITY AND SPREAD
  // =============================================================================

  describe('volatility and spread', () => {
    it('should produce wider percentile spread for higher volatility', () => {
      const lowVolInput: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Conservative',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'bonds', percentage: 1.0 }],
          },
        ],
        assetClasses: [bondsAsset],
        events: [
          {
            id: 'savings',
            name: 'Monthly Savings',
            type: 'savings',
            amount: 500,
            frequency: 'monthly',
            targetAccountId: 'account-1',
            startYear: 0,
          },
        ],
        years: 20,
        simulationCount: 1000,
      }

      const highVolAsset: AssetClass = {
        id: 'crypto',
        name: 'Crypto',
        avgReturn: 0.12,
        stdDev: 0.85,
      }

      const highVolInput: MonteCarloInput = {
        ...lowVolInput,
        assetClasses: [highVolAsset],
        accounts: [
          {
            ...lowVolInput.accounts[0],
            assetAllocation: [{ assetClassId: 'crypto', percentage: 1.0 }],
          },
        ],
      }

      const lowVolResult = runMonteCarloSimulation(lowVolInput)
      const highVolResult = runMonteCarloSimulation(highVolInput)

      const lowVolSpread = lowVolResult.yearlyPercentiles[20].p90 - lowVolResult.yearlyPercentiles[20].p10
      const highVolSpread = highVolResult.yearlyPercentiles[20].p90 - highVolResult.yearlyPercentiles[20].p10

      expect(highVolSpread).toBeGreaterThan(lowVolSpread * 3)
    })
  })

  // =============================================================================
  // PROBABILITY OF SUCCESS
  // =============================================================================

  describe('probability of success', () => {
    it('should calculate probability between 0 and 1', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'savings',
            name: 'Monthly Savings',
            type: 'savings',
            amount: 500,
            frequency: 'monthly',
            targetAccountId: 'account-1',
            startYear: 0,
          },
        ],
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.probabilityOfSuccess).toBeGreaterThanOrEqual(0)
      expect(result.probabilityOfSuccess).toBeLessThanOrEqual(1)
    })

    it('should return 100% for zero volatility with positive returns', () => {
      const zeroVolAsset: AssetClass = {
        id: 'cash',
        name: 'Cash',
        avgReturn: 0.02,
        stdDev: 0,
      }

      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Savings',
            type: 'savings',
            currentBalance: 50000,
            assetAllocation: [{ assetClassId: 'cash', percentage: 1.0 }],
          },
        ],
        assetClasses: [zeroVolAsset],
        events: [
          {
            id: 'savings',
            name: 'Monthly Contribution',
            type: 'savings',
            amount: 100,
            frequency: 'monthly',
            targetAccountId: 'account-1',
            startYear: 0,
          },
        ],
        years: 20,
        simulationCount: 100,
      }

      const result = runMonteCarloSimulation(input)
      expect(result.probabilityOfSuccess).toBe(1)
    })
  })

  // =============================================================================
  // INPUT VALIDATION
  // =============================================================================

  describe('input validation', () => {
    it('should throw error for negative account balance', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: -1000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [],
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow()
    })

    it('should throw error when asset allocation does not sum to 1.0', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [
              { assetClassId: 'stocks', percentage: 0.5 },
              { assetClassId: 'bonds', percentage: 0.3 },
            ],
          },
        ],
        assetClasses: [stocksAsset, bondsAsset],
        events: [],
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow()
    })

    it('should throw error for savings event without target account', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'bad-savings',
            name: 'Savings without target',
            type: 'savings',
            amount: 500,
            frequency: 'monthly',
            // Missing targetAccountId
            startYear: 0,
          } as any,
        ],
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow()
    })

    it('should throw error for event targeting non-existent account', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'bad-target',
            name: 'Savings to wrong account',
            type: 'savings',
            amount: 500,
            frequency: 'monthly',
            targetAccountId: 'non-existent',
            startYear: 0,
          },
        ],
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow()
    })

    it('should throw error for zero or negative years', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [],
        years: 0,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow()
    })

    it('should throw error for event start year after simulation end', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'future-event',
            name: 'Future Event',
            type: 'savings',
            amount: 500,
            frequency: 'monthly',
            targetAccountId: 'account-1',
            startYear: 15, // After 10-year simulation ends
          },
        ],
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow()
    })
  })

  // =============================================================================
  // TIME HORIZON
  // =============================================================================

  describe('time horizon', () => {
    it('should produce correct number of yearly data points', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        events: [
          {
            id: 'savings',
            name: 'Monthly',
            type: 'savings',
            amount: 500,
            frequency: 'monthly',
            targetAccountId: 'account-1',
            startYear: 0,
          },
        ],
        years: 30,
        simulationCount: 100,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.yearlyPercentiles).toHaveLength(31)
      result.yearlyPercentiles.forEach((yearData, index) => {
        expect(yearData.year).toBe(index)
      })
    })
  })

  // =============================================================================
  // FUTURE: ONE-TIME EVENTS (Not in Phase 2)
  // =============================================================================

  describe('future: one-time events (Phase 3+)', () => {
    it.skip('should handle one-time savings events (e.g., bonus, inheritance)', () => {
      // Future feature: One-time lump sum contributions
      // Example: Year 5 - receive $50k inheritance
    })

    it.skip('should handle one-time expenditure events (e.g., car purchase, wedding)', () => {
      // Future feature: One-time large expenses
      // Example: Year 3 - buy $30k car
    })

    it.skip('should handle account transfers between accounts', () => {
      // Future feature: Move money from taxable to IRA
      // Example: Year 2 - transfer $10k from brokerage to IRA
    })
  })
})
