import { ChainId, JSBI, Percent, Token, WETH } from '@uniswap/sdk'
import { AbstractConnector } from '@web3-react/abstract-connector'

import { fortmatic, injected, portis, walletconnect, walletlink } from '../connectors'

export const ROUTER_ADDRESS = '0x3D9a23b00970154b338E7f0d20D0b6Dca0e9D21e'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export { PRELOADED_PROPOSALS } from './proposals'

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

export const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
export const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C')
export const USDT = new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD')
export const COMP = new Token(ChainId.MAINNET, '0xc00e94Cb662C3520282E6f5717214004A7f26888', 18, 'COMP', 'Compound')
export const MKR = new Token(ChainId.MAINNET, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 18, 'MKR', 'Maker')
export const AMPL = new Token(ChainId.MAINNET, '0xD46bA6D942050d489DBd938a2C909A5d5039A161', 9, 'AMPL', 'Ampleforth')
export const WBTC = new Token(ChainId.MAINNET, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 8, 'WBTC', 'Wrapped BTC')

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS = 13
export const PROPOSAL_LENGTH_IN_BLOCKS = 40_320
export const PROPOSAL_LENGTH_IN_SECS = AVERAGE_BLOCK_TIME_IN_SECS * PROPOSAL_LENGTH_IN_BLOCKS

export const GOVERNANCE_ADDRESS = '0xe1A0b3F13a9E742d0a09B2a308BF1e9314d9145B'

export const TIMELOCK_ADDRESS = '0x5A4E5d6FA5e9fb3e1B920B61E2CB24dC816acA9B'

export const UNI_ADDRESS = '0xAAf8a38363943309cb0B7999344653C540e1E985'
export const MTL: { [chainId in ChainId]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, UNI_ADDRESS, 18, 'MTL', 'Uniswap'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, UNI_ADDRESS, 18, 'MTL', 'Uniswap'),
  [ChainId.ROPSTEN]: new Token(ChainId.ROPSTEN, UNI_ADDRESS, 18, 'MTL', 'Uniswap'),
  [ChainId.G??RLI]: new Token(ChainId.G??RLI, UNI_ADDRESS, 18, 'MTL', 'Uniswap'),
  [ChainId.KOVAN]: new Token(ChainId.KOVAN, UNI_ADDRESS, 18, 'MTL', 'Uniswap'),
  [ChainId.MANTLE_TESTNET]: new Token(ChainId.MANTLE_TESTNET, UNI_ADDRESS, 18, 'MTL', 'Uniswap')
}

export const MTLTEMP: { [chainId: number]: Token } = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, UNI_ADDRESS, 18, 'UNI', 'Uniswap'),
  [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, UNI_ADDRESS, 18, 'UNI', 'Uniswap'),
  [ChainId.ROPSTEN]: new Token(ChainId.ROPSTEN, UNI_ADDRESS, 18, 'UNI', 'Uniswap'),
  [ChainId.G??RLI]: new Token(ChainId.G??RLI, UNI_ADDRESS, 18, 'UNI', 'Uniswap'),
  [ChainId.KOVAN]: new Token(ChainId.KOVAN, UNI_ADDRESS, 18, 'UNI', 'Uniswap'),
  [ChainId.MANTLE_TESTNET]: new Token(ChainId.MANTLE_TESTNET, UNI_ADDRESS, 18, 'MTL', 'Uniswap')
}

export const COMMON_CONTRACT_NAMES: { [address: string]: string } = {
  [UNI_ADDRESS]: 'MTL',
  [GOVERNANCE_ADDRESS]: 'Governance',
  [TIMELOCK_ADDRESS]: 'Timelock'
}

// TODO: specify merkle distributor for mainnet
export const MERKLE_DISTRIBUTOR_ADDRESS: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0x090D4613473dEE047c3f2706764f49E0821D256e'
}

const WETH_ONLY: ChainTokenList = {
  [ChainId.MAINNET]: [WETH[ChainId.MAINNET]],
  [ChainId.ROPSTEN]: [WETH[ChainId.ROPSTEN]],
  [ChainId.RINKEBY]: [WETH[ChainId.RINKEBY]],
  [ChainId.G??RLI]: [WETH[ChainId.G??RLI]],
  [ChainId.KOVAN]: [WETH[ChainId.KOVAN]],
  [ChainId.MANTLE_TESTNET]: [WETH[ChainId.MANTLE_TESTNET]]
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC, USDT, COMP, MKR, WBTC]
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
    [AMPL.address]: [DAI, WETH[ChainId.MAINNET]]
  }
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC, USDT, WBTC]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, USDC, USDT, WBTC]
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [
      new Token(ChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(ChainId.MAINNET, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin')
    ],
    [USDC, USDT],
    [DAI, USDT]
  ]
}

export interface WalletInfo {
  connector?: AbstractConnector
  name: string
  iconName: string
  description: string
  href: string | null
  color: string
  primary?: true
  mobile?: true
  mobileOnly?: true
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D'
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    iconName: 'walletConnectIcon.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true
  },
  WALLET_LINK: {
    connector: walletlink,
    name: 'Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5'
  },
  COINBASE_LINK: {
    name: 'Open in Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Open in Coinbase Wallet app.',
    href: 'https://go.cb-w.com/mtUDhEZPy1',
    color: '#315CF5',
    mobile: true,
    mobileOnly: true
  },
  FORTMATIC: {
    connector: fortmatic,
    name: 'Fortmatic',
    iconName: 'fortmaticIcon.png',
    description: 'Login using Fortmatic hosted wallet',
    href: null,
    color: '#6748FF',
    mobile: true
  },
  Portis: {
    connector: portis,
    name: 'Portis',
    iconName: 'portisIcon.png',
    description: 'Login using Portis hosted wallet',
    href: null,
    color: '#4A6C9B',
    mobile: true
  }
}

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

// used for rewards deadlines
export const BIG_INT_SECONDS_IN_WEEK = JSBI.BigInt(60 * 60 * 24 * 7)

export const BIG_INT_ZERO = JSBI.BigInt(0)

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH
export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

export const ZERO_PERCENT = new Percent('0')
export const ONE_HUNDRED_PERCENT = new Percent('1')

// SDN OFAC addresses
export const BLOCKED_ADDRESSES: string[] = [
  '0x7F367cC41522cE07553e823bf3be79A889DEbe1B',
  '0xd882cFc20F52f2599D84b8e8D58C7FB62cfE344b',
  '0x901bb9583b24D97e995513C6778dc6888AB6870e',
  '0xA7e5d5A720f06526557c513402f2e6B5fA20b008',
  '0x8576aCC5C05D6Ce88f4e49bf65BdF0C62F91353C'
]
export const networks = [
  // {
  //   title: 'Ethereum Mainnet',
  //   chainId: '1',
  //   imgSrc: 'https://etherscan.io/images/svg/brands/ethereum-1.svg',
  //   rpcUrl: 'https://mainnet.infura.io/v3/63273290f2b64f1d956e2a607d17b196',
  //   nativeCurrency: {
  //     name: 'Ether',
  //     symbol: 'ETH',
  //     decimals: 18
  //   },
  //   blockExplorerUrls: ['https://etherscan.io']
  // },
  // {
  //   title: 'polygon Mainnet',
  //   chainId: '137',
  //   imgSrc: 'https://polygonscan.com/images/svg/brands/polygon.svg',
  //   rpcUrl: 'https://polygon-rpc.com/',
  //   nativeCurrency: {
  //     name: 'MATIC',
  //     symbol: 'MATIC',
  //     decimals: 18
  //   },
  //   blockExplorerUrls: ['https://polygonscan.com/']
  // },
  {
    title: 'polygon Testnet',
    chainId: '80001',
    imgSrc: 'https://polygonscan.com/images/svg/brands/polygon.svg',
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/npgkrja2S9UatBgIdLd2Kz6EtHrbvFFs',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    blockExplorerUrls: ['https://mumbai.polygonscan.com/']
  },

  {
    title: 'Mantle Testnet',
    chainId: '5001',
    imgSrc: 'https://polygonscan.com/images/svg/brands/polygon.svg',
    rpcUrl: 'https://rpc.testnet.mantle.xyz',
    nativeCurrency: {
      name: 'BIT',
      symbol: 'BIT',
      decimals: 18
    },
    blockExplorerUrls: ['https://explorer.testnet.mantle.xyz']
  }
  // {
  //   title: 'Avax Mainnet',
  //   chainId: '43114',
  //   imgSrc: '	https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
  //   rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  //   nativeCurrency: {
  //     name: 'Avalanche',
  //     symbol: 'AVAX',
  //     decimals: 18
  //   },
  //   blockExplorerUrls: ['https://snowtrace.io']
  // },
  // {
  //   title: 'Arbitrum One',
  //   chainId: '42161',
  //   imgSrc: 'https://app.uniswap.org/static/media/arbitrum_logo.ec8e5080.svg',
  //   rpcUrl: 'https://arb1.arbitrum.io/rpc',
  //   nativeCurrency: {
  //     name: 'Ether',
  //     symbol: 'ETH',
  //     decimals: 18
  //   },
  //   blockExplorerUrls: ['https://arbiscan.io']
  // },
  // {
  //   title: 'Optimism',
  //   chainId: '10',
  //   imgSrc: 'https://app.uniswap.org/static/media/optimistic_ethereum.34412af2.svg',
  //   rpcUrl: 'https://mainnet.optimism.io/',
  //   nativeCurrency: {
  //     name: 'Ether',
  //     symbol: 'ETH',
  //     decimals: 18
  //   },
  //   blockExplorerUrls: ['https://optimistic.etherscan.io']
  // },
  // {
  //   title: 'Aurora Mainnet',
  //   chainId: '1313161554',
  //   imgSrc: 'https://aurorascan.dev/images/svg/brands/main.svg?v=22.10.2.0',
  //   rpcUrl: 'https://mainnet.aurora.dev',
  //   nativeCurrency: {
  //     name: 'Ether',
  //     symbol: 'ETH',
  //     decimals: 18
  //   },
  //   blockExplorerUrls: ['https://aurorascan.dev']
  // }
]

export const LOAN_CONTRACT = '0xf3d68F4B244e3Ff6c50ad90E9A24077742d8E3a5'
//export const GARGANTUA_TOKEN = '0xbC43694f435b7F79981D478f50bD022bf90c376A'
