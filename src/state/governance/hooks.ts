/* eslint-disable prefer-const */
import { defaultAbiCoder, Interface } from '@ethersproject/abi'
import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { MTL, PRELOADED_PROPOSALS } from './../../constants/index'

// eslint-disable-next-line no-restricted-imports
import { abi as GOVERNANCE_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { abi as UNI_ABI } from '@uniswap/governance/build/Uni.json'
import { ChainId, CurrencyAmountGovernance as CurrencyAmount, Token, TokenAmount } from '@uniswap/sdk'
import { useWeb3React } from '@web3-react/core'
import { GOVERNANCE_ADDRESS, MTLTEMP } from 'constants/index'
import { useContract } from 'hooks/useContract'
import { useSingleCallResult, useSingleContractMultipleData } from '../multicall/hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateGasMargin } from '../../utils'
// import {
//   BRAVO_START_BLOCK,
//   MOONBEAN_START_BLOCK,
//   ONE_BIP_START_BLOCK,
//   POLYGON_START_BLOCK,
//   UNISWAP_GRANTS_START_BLOCK,
// } from '../../constants/proposals'
import { useTransactionAdder } from '../transactions/hooks'
import { TransactionType } from '../transactions/types'
import { VoteOption } from './types'
import { useActiveWeb3React } from 'hooks'
import { ethers, utils } from 'ethers'

function useGovernanceV0Contract(): Contract | null {
  return useContract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, false)
}

const useLatestGovernanceContract = useGovernanceV0Contract

function useUniContract() {
  const { chainId } = useWeb3React()
  const uniAddress = useMemo(() => (chainId ? MTLTEMP[chainId]?.address : undefined), [chainId])
  return useContract(uniAddress, UNI_ABI, true)
}

interface ProposalDetail {
  target: string
  functionSig: string
  callData: string
}

export interface ProposalData2 {
  id: string
  title: string
  description: string
  proposer: string
  status: ProposalState
  forCount: CurrencyAmount<Token>
  againstCount: CurrencyAmount<Token>
  startBlock: number
  endBlock: number
  eta: BigNumber
  details: ProposalDetail[]
  governorIndex: number // index in the governance address array for which this proposal pertains
}

export interface ProposalData {
  id: string
  title: string
  description: string
  proposer: string
  status: string
  forCount: number
  againstCount: number
  startBlock: number
  endBlock: number
  details: ProposalDetail[]
}

export interface CreateProposalData {
  targets: string[]
  values: string[]
  signatures: string[]
  calldatas: string[]
  description: string
}

export enum ProposalState {
  UNDETERMINED = -1,
  PENDING,
  ACTIVE,
  CANCELED,
  DEFEATED,
  SUCCEEDED,
  QUEUED,
  EXPIRED,
  EXECUTED
}

const GovernanceInterface = new Interface(GOVERNANCE_ABI)
interface FormattedProposalLog {
  description: string
  details: { target: string; functionSig: string; callData: string }[]
}

const FOUR_BYTES_DIR: { [sig: string]: string } = {
  '0x5ef2c7f0': 'setSubnodeRecord(bytes32,bytes32,address,address,uint64)',
  '0x10f13a8c': 'setText(bytes32,string,string)',
  '0xb4720477': 'sendMessageToChild(address,bytes)',
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0x7b1837de': 'fund(address,uint256)'
}

// /**
//  * Need proposal events to get description data emitted from
//  * new proposal event.
//  */
// function useFormattedProposalCreatedLogs(
//   contract: Contract | null,
//   indices: number[][],
//   fromBlock?: number,
//   toBlock?: number
// ): FormattedProposalLog[] | undefined {
//   // create filters for ProposalCreated events
//   const filter = useMemo(() => {
//     const filter = contract?.filters?.ProposalCreated()
//     if (!filter) return undefined
//     return {
//       ...filter,
//       fromBlock,
//       toBlock,
//     }
//   }, [contract, fromBlock, toBlock])

//   const useLogsResult = useLogs(filter)

//   return useMemo(() => {
//     return useLogsResult?.logs
//       ?.map((log: any) => {
//         const parsed = GovernanceInterface.parseLog(log).args
//         return parsed
//       })
//       ?.filter((parsed: any) => indices.flat().some((i) => i === parsed.id.toNumber()))
//       ?.map((parsed: any) => {
//         let description!: string

//         const startBlock = parseInt(parsed.startBlock?.toString())
//         try {
//           description = parsed.description
//         } catch (error) {
//           // replace invalid UTF-8 in the description with replacement characters
//           // eslint-disable-next-line @typescript-eslint/no-unused-vars
//           let onError = Utf8ErrorFuncs.replace

//           // // Bravo proposal reverses the codepoints for U+2018 (‘) and U+2026 (…)
//           // if (startBlock === BRAVO_START_BLOCK) {
//           //   const U2018 = [0xe2, 0x80, 0x98].toString()
//           //   const U2026 = [0xe2, 0x80, 0xa6].toString()
//           //   onError = (reason, offset, bytes, output) => {
//           //     if (reason === Utf8ErrorReason.UNEXPECTED_CONTINUE) {
//           //       const charCode = [bytes[offset], bytes[offset + 1], bytes[offset + 2]].reverse().toString()
//           //       if (charCode === U2018) {
//           //         output.push(0x2018)
//           //         return 2
//           //       } else if (charCode === U2026) {
//           //         output.push(0x2026)
//           //         return 2
//           //       }
//           //     }
//           //     return Utf8ErrorFuncs.replace(reason, offset, bytes, output)
//           //   }
//           // }

//           description = JSON.parse(`{}`) || ''
//         }

//         // some proposals omit newlines
//         // if (
//         //   startBlock === BRAVO_START_BLOCK ||
//         //   startBlock === ONE_BIP_START_BLOCK ||
//         //   startBlock === MOONBEAN_START_BLOCK
//         // ) {
//         //   description = description.replace(/ {2}/g, '\n').replace(/\d\. /g, '\n$&')
//         // }

//         return {
//           description,
//           details: parsed.targets.map((target: string, i: number) => {
//             const signature = parsed.signatures[i]
//             let calldata = parsed.calldatas[i]
//             let name: string
//             let types: string
//             if (signature === '') {
//               const fourbyte = calldata.slice(0, 10)
//               const sig = FOUR_BYTES_DIR[fourbyte] ?? 'UNKNOWN()'
//               if (!sig) throw new Error('Missing four byte sig')
//               ;[name, types] = sig.substring(0, sig.length - 1).split('(')
//               calldata = `0x${calldata.slice(10)}`
//             } else {
//               ;[name, types] = signature.substring(0, signature.length - 1).split('(')
//             }
//             const decoded = defaultAbiCoder.decode(types.split(','), calldata)
//             return {
//               target,
//               functionSig: name,
//               callData: decoded.join(', '),
//             }
//           }),
//         }
//       })
//   }, [indices, useLogsResult])
// }

const V0_PROPOSAL_IDS = [[1], [2], [3], [4]]

function countToIndices(count: number | undefined, skip = 0) {
  return typeof count === 'number' ? new Array(count - skip).fill(0).map((_, i) => [i + 1 + skip]) : []
}
/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
export function useDataFromEventLogs() {
  const { library } = useActiveWeb3React()
  const [formattedEvents, setFormattedEvents] = useState<any>()
  const govContract = useGovernanceV0Contract()

  // create filter for these specific events
  const filter = { ...govContract?.filters?.['ProposalCreated'](), fromBlock: 0, toBlock: 'latest' }
  const eventParser = new ethers.utils.Interface(GOVERNANCE_ABI)

  useEffect(() => {
    async function fetchData() {
      const pastEvents = await library?.getLogs(filter)
      // reverse events to get them from newest to odlest
      const formattedEventData = pastEvents
        ?.map((event: any) => {
          const eventParsed = eventParser.parseLog(event).args
          return {
            description: eventParsed.description,
            details: eventParsed.targets.map((target: string, i: number) => {
              const signature = eventParsed.signatures[i]
              const [name, types] = signature.substr(0, signature.length - 1).split('(')

              const calldata = eventParsed.calldatas[i]
              const decoded = utils.defaultAbiCoder.decode(types.split(','), calldata)

              return {
                target,
                functionSig: name,
                callData: decoded.join(', ')
              }
            })
          }
        })
        .reverse()
      setFormattedEvents(formattedEventData)
    }
    if (!formattedEvents) {
      fetchData()
    }
  }, [eventParser, filter, library, formattedEvents])

  return formattedEvents
}
// get count of all proposals made
export function useProposalCount(): number | undefined {
  const gov = useGovernanceV0Contract()
  const res = useSingleCallResult(gov, 'proposalCount')
  if (res.result && !res.loading) {
    return parseInt(res.result[0])
  }
  return undefined
}
const enumerateProposalState = (state: number) => {
  const proposalStates = ['pending', 'active', 'canceled', 'defeated', 'succeeded', 'queued', 'expired', 'executed']
  return proposalStates[state]
}
export function useDelegateCallback(): (delegatee: string | undefined) => undefined | Promise<string> {
  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const uniContract = useUniContract()

  return useCallback(
    (delegatee: string | undefined) => {
      if (!library || !chainId || !account || !isAddress(delegatee ?? '')) return undefined
      const args = [delegatee]
      if (!uniContract) throw new Error('No MTL Contract!')
      return uniContract.estimateGas.delegate(...args, {}).then(estimatedGasLimit => {
        return uniContract
          .delegate(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Delegated votes`
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, chainId, library, uniContract]
  )
}

// get data for all past and active proposals
export function useAllProposalData() {
  const proposalCount = useProposalCount()
  const govContract = useGovernanceV0Contract()

  const proposalIndexes = []
  for (let i = 1; i <= (proposalCount ?? 0); i++) {
    proposalIndexes.push([i])
  }

  // get metadata from past events
  const formattedEvents = useDataFromEventLogs()

  // get all proposal entities
  const allProposals = useSingleContractMultipleData(govContract, 'proposals', proposalIndexes)

  // get all proposal states
  const allProposalStates = useSingleContractMultipleData(govContract, 'state', proposalIndexes)

  if (formattedEvents && allProposals && allProposalStates) {
    allProposals.reverse()
    allProposalStates.reverse()

    return allProposals
      .filter((p: any, i: any) => {
        return Boolean(p.result) && Boolean(allProposalStates[i]?.result) && Boolean(formattedEvents[i])
      })
      .map((p: any, i: any) => {
        const description = PRELOADED_PROPOSALS.get(allProposals.length - i - 1) || formattedEvents[i].description
        const formattedProposal: ProposalData = {
          id: allProposals[i]?.result?.id.toString(),
          title: description?.split(/# |\n/g)[1] || 'Untitled',
          description: description || 'No description.',
          proposer: allProposals[i]?.result?.proposer,
          status: enumerateProposalState(allProposalStates[i]?.result?.[0]) ?? 'Undetermined',
          forCount: parseFloat(ethers.utils.formatUnits(allProposals[i]?.result?.forVotes.toString(), 18)),
          againstCount: parseFloat(ethers.utils.formatUnits(allProposals[i]?.result?.againstVotes.toString(), 18)),
          startBlock: parseInt(allProposals[i]?.result?.startBlock?.toString()),
          endBlock: parseInt(allProposals[i]?.result?.endBlock?.toString()),
          details: formattedEvents[i].details
        }
        return formattedProposal
      })
  } else {
    return []
  }
}

// export function useProposalData2(governorIndex: number, id: string): ProposalData | undefined {
//   const { data } = useAllProposalData()
//   return data.filter((p: any) => p.governorIndex === governorIndex)?.find((p: any) => p.id === id)
// }

export function useProposalData(id: string): ProposalData | undefined {
  const allProposalData = useAllProposalData()
  return allProposalData?.find((p: any) => p.id === id)
}

// export function useQuorum(governorIndex: number): CurrencyAmount<Token> | undefined {
//   const latestGovernanceContract = useLatestGovernanceContract()
//   const quorumVotes = useSingleCallResult(latestGovernanceContract, 'quorumVotes')?.result?.[0]
//   const { chainId } = useWeb3React()
//   const uni = useMemo(() => (chainId ? UNI[chainId] : undefined), [chainId])
//   const LATEST_GOVERNOR_INDEX = 2;
//   if (
//     !latestGovernanceContract ||
//     !quorumVotes ||
//     chainId !== ChainId.MAINNET ||
//     !uni ||
//     governorIndex !== LATEST_GOVERNOR_INDEX
//   )
//     return undefined

//   return CurrencyAmount.fromRawAmount(uni, quorumVotes)
// }

// get the users delegatee if it exists
export function useUserDelegatee(): string {
  const { account } = useWeb3React()
  const uniContract = useUniContract()
  const { result } = useSingleCallResult(uniContract, 'delegates', [account ?? undefined])
  return result?.[0] ?? undefined
}
// gets the users current votes
export function useUserVotes2(): { loading: boolean; votes: CurrencyAmount<Token> | undefined } {
  const { account, chainId } = useWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const { result, loading } = useSingleCallResult(uniContract, 'getCurrentVotes', [account ?? undefined])
  return useMemo(() => {
    const uni = chainId ? MTLTEMP[chainId] : undefined
    return { loading, votes: uni && result ? CurrencyAmount?.fromRawAmount(uni, result?.[0]) : undefined }
  }, [chainId, loading, result])
}
// gets the users current votes
export function useUserVotes(): TokenAmount | undefined {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const uni = chainId ? MTL[chainId] : undefined
  const votes = useSingleCallResult(uniContract, 'getCurrentVotes', [account ?? undefined])?.result?.[0]
  return votes && uni ? new TokenAmount(uni, votes) : undefined
}

// fetch available votes as of block (usually proposal start block)
export function useUserVotesAsOfBlock(block: number | undefined): TokenAmount | undefined {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const uni = chainId ? MTL[chainId] : undefined
  const votes = useSingleCallResult(uniContract, 'getPriorVotes', [account ?? undefined, block ?? undefined])
    ?.result?.[0]
  return votes && uni ? new TokenAmount(uni, votes) : undefined
}

// export function useDelegateCallback(): (delegatee: string | undefined) => undefined | Promise<string> {
//   const { account, chainId, provider } = useWeb3React()
//   const addTransaction = useTransactionAdder()

//   const uniContract = useUniContract()

//   return useCallback(
//     (delegatee: string | undefined) => {
//       if (!provider || !chainId || !account || !delegatee || !isAddress(delegatee ?? '')) return undefined
//       const args = [delegatee]
//       if (!uniContract) throw new Error('No UNI Contract!')
//       return uniContract.estimateGas.delegate(...args, {}).then((estimatedGasLimit) => {
//         return uniContract
//           .delegate(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
//           .then((response: TransactionResponse) => {
//             addTransaction(response, {
//               type: TransactionType.DELEGATE,
//               delegatee,
//             })
//             return response.hash
//           })
//       })
//     },
//     [account, addTransaction, chainId, provider, uniContract]
//   )
// }

export function useVoteCallback(): {
  voteCallback: (proposalId: string | undefined, support: boolean) => undefined | Promise<string>
} {
  const { account } = useActiveWeb3React()

  const govContract = useGovernanceV0Contract()
  const addTransaction = useTransactionAdder()

  const voteCallback = useCallback(
    (proposalId: string | undefined, support: boolean) => {
      if (!account || !govContract || !proposalId) return
      const args = [proposalId, support]
      return govContract.estimateGas.castVote(...args, {}).then(estimatedGasLimit => {
        return govContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Voted ${support ? 'for ' : 'against'} proposal ${proposalId}`
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, govContract]
  )
  return { voteCallback }
}

// export function useQueueCallback(): (proposalId: string | undefined) => undefined | Promise<string> {
//   const { account, chainId } = useWeb3React()
//   const latestGovernanceContract = useLatestGovernanceContract()
//   const addTransaction = useTransactionAdder()

//   return useCallback(
//     (proposalId: string | undefined) => {
//       if (!account || !latestGovernanceContract || !proposalId || !chainId) return
//       const args = [proposalId]
//       return latestGovernanceContract.estimateGas.queue(...args, {}).then((estimatedGasLimit) => {
//         return latestGovernanceContract
//           .queue(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
//           .then((response: TransactionResponse) => {
//             addTransaction(response, {
//               type: TransactionType.QUEUE,
//               governorAddress: latestGovernanceContract.address,
//               proposalId: parseInt(proposalId),
//             })
//             return response.hash
//           })
//       })
//     },
//     [account, addTransaction, latestGovernanceContract, chainId]
//   )
// }

// export function useExecuteCallback(): (proposalId: string | undefined) => undefined | Promise<string> {
//   const { account, chainId } = useWeb3React()
//   const latestGovernanceContract = useLatestGovernanceContract()
//   const addTransaction = useTransactionAdder()

//   return useCallback(
//     (proposalId: string | undefined) => {
//       if (!account || !latestGovernanceContract || !proposalId || !chainId) return
//       const args = [proposalId]
//       return latestGovernanceContract.estimateGas.execute(...args, {}).then((estimatedGasLimit) => {
//         return latestGovernanceContract
//           .execute(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
//           .then((response: TransactionResponse) => {
//             addTransaction(response, {
//               type: TransactionType.EXECUTE,
//               governorAddress: latestGovernanceContract.address,
//               proposalId: parseInt(proposalId),
//             })
//             return response.hash
//           })
//       })
//     },
//     [account, addTransaction, latestGovernanceContract, chainId]
//   )
// }

export function useCreateProposalCallback(): (
  createProposalData: CreateProposalData | undefined
) => undefined | Promise<string> {
  const { account, chainId } = useWeb3React()
  const latestGovernanceContract = useLatestGovernanceContract()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (createProposalData: CreateProposalData | undefined) => {
      if (!account || !latestGovernanceContract || !createProposalData || !chainId) return undefined

      const args = [
        createProposalData.targets,
        createProposalData.values,
        createProposalData.signatures,
        createProposalData.calldatas,
        createProposalData.description
      ]

      return latestGovernanceContract.estimateGas.propose(...args).then(estimatedGasLimit => {
        return latestGovernanceContract
          .propose(...args, { gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: 'SUBMIT_PROPOSAL'
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract, chainId]
  )
}

export function useLatestProposalId(address: string | undefined): string | undefined {
  const latestGovernanceContract = useLatestGovernanceContract()
  const res = useSingleCallResult(latestGovernanceContract, 'latestProposalIds', [address])
  return res?.result?.[0]?.toString()
}

export function useProposalThreshold(): CurrencyAmount<Token> | undefined {
  const { chainId } = useWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()
  const res = useSingleCallResult(latestGovernanceContract, 'proposalThreshold')
  const uni = useMemo(() => (chainId ? MTLTEMP[chainId] : undefined), [chainId])

  if (res?.result?.[0] && uni) {
    return CurrencyAmount?.fromRawAmount(uni, res.result[0])
  }

  return undefined
}
