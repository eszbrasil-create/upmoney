declare module 'big.js' {
  type BigValue = Big | number | string

  class Big {
    constructor(value?: BigValue)
    plus(value: BigValue): Big
    minus(value: BigValue): Big
    times(value: BigValue): Big
    div(value: BigValue): Big
    round(dp?: number, rm?: number): Big
    eq(value: BigValue): boolean
    gt(value: BigValue): boolean
    toNumber(): number
  }

  namespace Big {
    const roundHalfUp: number
  }

  export default Big
}
