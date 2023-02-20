import { Currency } from '../currency'
import JSBI from 'jsbi'
import { BigintIsh, Rounding } from '../../constants'
import { Fraction } from './fraction'
export declare class CurrencyAmount<T extends Currency> extends Fraction {
  readonly currency: T
  /**
   * Helper that calls the constructor with the ETHER currency
   * @param amount ether amount in wei
   */
  static fromRawAmount<T extends Currency>(currency: T, rawAmount: BigintIsh): CurrencyAmount<T>

  static ether(amount: BigintIsh): CurrencyAmount
  protected constructor(currency: Currency, amount: BigintIsh)
  get raw(): JSBI
  add(other: CurrencyAmount): CurrencyAmount
  subtract(other: CurrencyAmount): CurrencyAmount
  toSignificant(significantDigits?: number, format?: object, rounding?: Rounding): string
  toFixed(decimalPlaces?: number, format?: object, rounding?: Rounding): string
  toExact(format?: object): string
}
