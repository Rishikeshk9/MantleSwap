import React, { useState, useContext } from 'react'
import { useActiveWeb3React } from '../../hooks'

import Modal from '../Modal'
import { AutoColumn, ColumnCenter } from '../Column'
import styled, { ThemeContext } from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CustomLightSpinner } from '../../theme'
import { X, ArrowUpCircle } from 'react-feather'
import { ButtonPrimary } from '../Button'
import Circle from '../../assets/images/blue-loader.svg'
import { useVoteCallback, useUserVotes } from '../../state/governance/hooks'
import { getContract, getEtherscanLink } from '../../utils'
import { ExternalLink } from '../../theme/components'
import { TokenAmount } from '@uniswap/sdk'
import { GOVERNANCE_ADDRESS } from '../../constants'
import { abi as GOVERNANCE_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

const ConfirmOrLoadingWrapper = styled.div`
  width: 100%;
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`
async function OnCastVote(web3Provider: any, accountAddress: any, proposalId: any, vote: boolean): Promise<any> {
  try {
    if (!web3Provider && !accountAddress) return
    const governanceContract = getContract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, web3Provider, accountAddress)
    // call borrowAmount function to borrow the amount
    const tx = await governanceContract.castVote(proposalId, vote)
    const reciept = await tx.wait()
    console.log('proposal successful!', reciept)
    return reciept
  } catch (error) {
    console.log('Error in Borrowing: ', error)
    return false
  }
}
interface VoteModalProps {
  isOpen: boolean
  onDismiss: () => void
  support: boolean // if user is for or against proposal
  proposalId: string | undefined // id for the proposal to vote on
  provider: any
}

export default function VoteModal({ isOpen, onDismiss, proposalId, support, provider }: VoteModalProps) {
  const { account, chainId } = useActiveWeb3React()
  const {
    voteCallback
  }: {
    voteCallback: (proposalId: string | undefined, support: boolean) => Promise<string> | undefined
  } = useVoteCallback()
  const availableVotes: TokenAmount | undefined = useUserVotes()
  console.log('VoteModal', proposalId, support)
  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState<boolean>(false)

  // get theme for colors
  const theme = useContext(ThemeContext)

  // wrapper to reset state on modal close
  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onVote() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!voteCallback) return

    // try delegation and store hash

    // const hash = await voteCallback(proposalId, support)?.catch(error => {
    //   setAttempting(false)
    //   console.log(error)
    // })
    const reciept = await OnCastVote(provider, account, proposalId, support)
    if (reciept) {
      setHash(reciept.transactionHash)
      setAttempting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <TYPE.mediumHeader fontWeight={500}>{`Vote ${
                support ? 'for ' : 'against'
              } proposal ${proposalId}`}</TYPE.mediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOndismiss} />
            </RowBetween>
            <TYPE.largeHeader>{availableVotes?.toSignificant(4)} Votes</TYPE.largeHeader>
            <ButtonPrimary onClick={onVote}>
              <TYPE.mediumHeader color="white">{`Vote ${
                support ? 'for ' : 'against'
              } proposal  ${proposalId}`}</TYPE.mediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <ConfirmOrLoadingWrapper>
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOndismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
          </ConfirmedIcon>
          <AutoColumn gap="100px" justify={'center'}>
            <AutoColumn gap="12px" justify={'center'}>
              <TYPE.largeHeader>Submitting Vote</TYPE.largeHeader>
            </AutoColumn>
            <TYPE.subHeader>Confirm this transaction in your wallet</TYPE.subHeader>
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
      {hash && (
        <ConfirmOrLoadingWrapper>
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOndismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary1} />
          </ConfirmedIcon>
          <AutoColumn gap="100px" justify={'center'}>
            <AutoColumn gap="12px" justify={'center'}>
              <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            </AutoColumn>
            {chainId && (
              <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')} style={{ marginLeft: '4px' }}>
                <TYPE.subHeader>View transaction on Etherscan</TYPE.subHeader>
              </ExternalLink>
            )}
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
    </Modal>
  )
}
