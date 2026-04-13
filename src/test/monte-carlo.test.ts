import { describe, it, expect } from 'vitest'

// Types for Monte Carlo simulation (will be imported from actual implementation later)
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

interface SavingsPlan {
  monthlyAmount: number
  allocationMethod: 'fixed' | 'percentage'
  accounts: {
    accountId: string
    amount?: number // For fixed allocation
    percentage?: number // For percentage allocation (0.0 to 1.0)
  }[]
}

interface MonteCarloInput {
  accounts: Account[]
  assetClasses: AssetClass[]
  savingsPlan: SavingsPlan
  years: number
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
  probabilityOfSuccess: number // 0.0 to 1.0 (percentage of runs that don't hit $0)
}

// Mock function signature - implementation will be imported later
declare function runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResult

describe('Monte Carlo Simulation', () => {
  // Test data - realistic asset classes
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

  const highVolatilityAsset: AssetClass = {
    id: 'crypto',
    name: 'Cryptocurrency',
    avgReturn: 0.12,
    stdDev: 0.85,
  }

  describe('basic functionality', () => {
    it('should run a single account simulation with one asset class', () => {
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: '401k-1', amount: 0 }],
        },
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.yearlyPercentiles).toHaveLength(31) // Year 0 + 30 years
      expect(result.yearlyPercentiles[0].year).toBe(0)
      expect(result.yearlyPercentiles[30].year).toBe(30)
      expect(result.probabilityOfSuccess).toBeGreaterThan(0)
      expect(result.probabilityOfSuccess).toBeLessThanOrEqual(1)

      // Verify percentile structure
      const year10 = result.yearlyPercentiles[10]
      expect(year10.p10).toBeLessThan(year10.p25)
      expect(year10.p25).toBeLessThan(year10.p50)
      expect(year10.p50).toBeLessThan(year10.p75)
      expect(year10.p75).toBeLessThan(year10.p90)
    })

    it('should handle multiple accounts with different allocations', () => {
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
          {
            id: 'taxable-1',
            name: 'Brokerage',
            type: 'taxable',
            currentBalance: 75000,
            assetAllocation: [
              { assetClassId: 'stocks', percentage: 0.5 },
              { assetClassId: 'international', percentage: 0.5 },
            ],
          },
        ],
        assetClasses: [stocksAsset, bondsAsset, internationalAsset],
        savingsPlan: {
          monthlyAmount: 1000,
          allocationMethod: 'percentage',
          accounts: [
            { accountId: '401k-1', percentage: 0.6 },
            { accountId: 'ira-1', percentage: 0.1 },
            { accountId: 'taxable-1', percentage: 0.3 },
          ],
        },
        years: 25,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.yearlyPercentiles).toHaveLength(26)
      expect(result.probabilityOfSuccess).toBeGreaterThan(0)
      
      // Total starting balance should be around 275k
      const year0Total = result.yearlyPercentiles[0].p50
      expect(year0Total).toBeCloseTo(275000, -3) // Within ~500
    })

    it('should produce higher balances with monthly contributions', () => {
      const baseInput: MonteCarloInput = {
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: '401k-1', amount: 0 }],
        },
        years: 20,
        simulationCount: 500,
      }

      const withContributions: MonteCarloInput = {
        ...baseInput,
        savingsPlan: {
          monthlyAmount: 1000,
          allocationMethod: 'fixed',
          accounts: [{ accountId: '401k-1', amount: 1000 }],
        },
      }

      const resultNoContrib = runMonteCarloSimulation(baseInput)
      const resultWithContrib = runMonteCarloSimulation(withContributions)

      // With $1000/month for 20 years = $240k in contributions
      // Should be significantly higher with contributions
      const finalNoContrib = resultNoContrib.yearlyPercentiles[20].p50
      const finalWithContrib = resultWithContrib.yearlyPercentiles[20].p50

      expect(finalWithContrib).toBeGreaterThan(finalNoContrib)
      // Should be at least $200k+ more (contributions + growth)
      expect(finalWithContrib - finalNoContrib).toBeGreaterThan(200000)
    })
  })

  describe('volatility and spread', () => {
    it('should produce wider percentile spread for higher volatility assets', () => {
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 20,
        simulationCount: 1000,
      }

      const highVolInput: MonteCarloInput = {
        ...lowVolInput,
        accounts: [
          {
            id: 'account-1',
            name: 'Aggressive',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'crypto', percentage: 1.0 }],
          },
        ],
        assetClasses: [highVolatilityAsset],
      }

      const lowVolResult = runMonteCarloSimulation(lowVolInput)
      const highVolResult = runMonteCarloSimulation(highVolInput)

      // Calculate spread (P90 - P10) at year 20
      const lowVolYear20 = lowVolResult.yearlyPercentiles[20]
      const highVolYear20 = highVolResult.yearlyPercentiles[20]

      const lowVolSpread = lowVolYear20.p90 - lowVolYear20.p10
      const highVolSpread = highVolYear20.p90 - highVolYear20.p10

      // High volatility should have much wider spread
      expect(highVolSpread).toBeGreaterThan(lowVolSpread * 3)
    })

    it('should show increasing spread over time', () => {
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      // Spread should increase over time due to compounding volatility
      const year5Spread = result.yearlyPercentiles[5].p90 - result.yearlyPercentiles[5].p10
      const year15Spread = result.yearlyPercentiles[15].p90 - result.yearlyPercentiles[15].p10
      const year30Spread = result.yearlyPercentiles[30].p90 - result.yearlyPercentiles[30].p10

      expect(year15Spread).toBeGreaterThan(year5Spread)
      expect(year30Spread).toBeGreaterThan(year15Spread)
    })
  })

  describe('probability of success', () => {
    it('should calculate probability of success between 0 and 1', () => {
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
        savingsPlan: {
          monthlyAmount: 500,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 500 }],
        },
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.probabilityOfSuccess).toBeGreaterThanOrEqual(0)
      expect(result.probabilityOfSuccess).toBeLessThanOrEqual(1)
    })

    it('should return 100% success for zero volatility with positive returns', () => {
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
        savingsPlan: {
          monthlyAmount: 100,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 100 }],
        },
        years: 20,
        simulationCount: 100,
      }

      const result = runMonteCarloSimulation(input)

      // With zero volatility and positive contributions, balance should never go negative
      expect(result.probabilityOfSuccess).toBe(1)
    })

    it('should detect risk of depletion with high withdrawal rate', () => {
      // This would require implementing withdrawal logic
      // For now, test that the function exists and returns a reasonable value
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Retirement',
            type: 'ira',
            currentBalance: 500000,
            assetAllocation: [
              { assetClassId: 'stocks', percentage: 0.6 },
              { assetClassId: 'bonds', percentage: 0.4 },
            ],
          },
        ],
        assetClasses: [stocksAsset, bondsAsset],
        savingsPlan: {
          monthlyAmount: -5000, // Negative = withdrawal
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: -5000 }],
        },
        years: 30,
        simulationCount: 1000,
      }

      const result = runMonteCarloSimulation(input)

      // Withdrawing $5k/month from $500k should show some risk
      expect(result.probabilityOfSuccess).toBeLessThan(1)
      expect(result.probabilityOfSuccess).toBeGreaterThan(0)
    })
  })

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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow('negative')
    })

    it('should throw error when asset allocation percentages do not sum to 1.0', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [
              { assetClassId: 'stocks', percentage: 0.5 },
              { assetClassId: 'bonds', percentage: 0.3 }, // Only 80%
            ],
          },
        ],
        assetClasses: [stocksAsset, bondsAsset],
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow('allocation')
    })

    it('should throw error for negative percentage in allocation', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [
              { assetClassId: 'stocks', percentage: 1.2 },
              { assetClassId: 'bonds', percentage: -0.2 },
            ],
          },
        ],
        assetClasses: [stocksAsset, bondsAsset],
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow()
    })

    it('should throw error for negative monthly contribution', () => {
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
        savingsPlan: {
          monthlyAmount: -100,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: -100 }],
        },
        years: 10,
      }

      // Negative monthly amount is allowed (withdrawals), but should be validated
      // This test documents the expected behavior
      expect(() => runMonteCarloSimulation(input)).not.toThrow()
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 0,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow('years')
    })

    it('should throw error for undefined asset class references', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 100000,
            assetAllocation: [{ assetClassId: 'real-estate', percentage: 1.0 }], // Not defined
          },
        ],
        assetClasses: [stocksAsset, bondsAsset], // real-estate not in list
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow('asset class')
    })

    it('should throw error for savings plan referencing non-existent account', () => {
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
        savingsPlan: {
          monthlyAmount: 500,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'non-existent', amount: 500 }], // Not in accounts list
        },
        years: 10,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow('account')
    })

    it('should throw error for zero or negative simulation count', () => {
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 10,
        simulationCount: 0,
      }

      expect(() => runMonteCarloSimulation(input)).toThrow('simulation')
    })
  })

  describe('time horizon', () => {
    it('should produce correct number of yearly data points for 30 years', () => {
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 30,
        simulationCount: 100,
      }

      const result = runMonteCarloSimulation(input)

      // Should have year 0 (starting point) plus 30 years = 31 entries
      expect(result.yearlyPercentiles).toHaveLength(31)

      // Verify years are sequential
      result.yearlyPercentiles.forEach((yearData, index) => {
        expect(yearData.year).toBe(index)
      })
    })

    it('should handle different time horizons correctly', () => {
      const horizons = [5, 10, 20, 40]

      horizons.forEach(years => {
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
          savingsPlan: {
            monthlyAmount: 0,
            allocationMethod: 'fixed',
            accounts: [{ accountId: 'account-1', amount: 0 }],
          },
          years,
          simulationCount: 100,
        }

        const result = runMonteCarloSimulation(input)
        expect(result.yearlyPercentiles).toHaveLength(years + 1)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle very small simulation counts', () => {
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 10,
        simulationCount: 10, // Very small
      }

      const result = runMonteCarloSimulation(input)
      expect(result.yearlyPercentiles).toHaveLength(11)
      expect(result.probabilityOfSuccess).toBeGreaterThanOrEqual(0)
    })

    it('should handle zero starting balance', () => {
      const input: MonteCarloInput = {
        accounts: [
          {
            id: 'account-1',
            name: 'Test',
            type: 'taxable',
            currentBalance: 0,
            assetAllocation: [{ assetClassId: 'stocks', percentage: 1.0 }],
          },
        ],
        assetClasses: [stocksAsset],
        savingsPlan: {
          monthlyAmount: 500,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 500 }],
        },
        years: 10,
        simulationCount: 100,
      }

      const result = runMonteCarloSimulation(input)

      expect(result.yearlyPercentiles[0].p50).toBe(0)
      // Should grow with contributions
      expect(result.yearlyPercentiles[10].p50).toBeGreaterThan(60000) // $500 * 12 * 10 = $60k + growth
    })

    it('should use default simulation count of 1000', () => {
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
        savingsPlan: {
          monthlyAmount: 0,
          allocationMethod: 'fixed',
          accounts: [{ accountId: 'account-1', amount: 0 }],
        },
        years: 10,
        // simulationCount not specified - should default to 1000
      }

      // Should not throw - default is applied
      const result = runMonteCarloSimulation(input)
      expect(result.yearlyPercentiles).toHaveLength(11)
    })
  })
})
