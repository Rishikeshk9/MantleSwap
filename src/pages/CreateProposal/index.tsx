import React, { useEffect } from 'react'
import { defaultAbiCoder } from '@ethersproject/abi'
import { getAddress, isAddress } from '@ethersproject/address'
import { Web3Provider } from '@ethersproject/providers'
import { Currency, CurrencyAmountGovernance as CurrencyAmount, Token } from '@uniswap/sdk'
import { useWeb3React } from '@web3-react/core'
import { ButtonError } from '../../components/Button'
import { BlueCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from '../../lib/utils/tryParseCurrencyAmount'
import { Wrapper } from '../../pages/Pool/styleds'
import { useCallback, useMemo, useState } from 'react'
import {
  CreateProposalData,
  ProposalState,
  useCreateProposalCallback,
  useLatestProposalId,
  useProposalData,
  useProposalThreshold,
  useUserVotes,
  useUserVotes2
} from '../../state/governance/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from '../../theme'

import { CreateProposalTabs } from '../../components/NavigationTabs'
import { MTLTEMP } from '../../constants'
import AppBody from '../AppBody'
import { ProposalActionDetail } from './ProposalActionDetail'
import { ProposalAction, ProposalActionSelector, ProposalActionSelectorModal } from './ProposalActionSelector'
import { ProposalEditor } from './ProposalEditor'
import { ProposalSubmissionModal } from './ProposalSubmissionModal'
import { ButtonWhite } from '../../components/Button'
import { parseEther } from 'ethers/lib/utils'

const PageWrapper = styled(AutoColumn)`
  padding: 0px 8px 0px;

  @media only screen and (max-width: ${({ theme }) => `768px`}) {
    padding: 0px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `480px`}) {
    padding-top: 0px;
  }
`

const CreateProposalButton = ({
  proposalThreshold,
  hasActiveOrPendingProposal,
  hasEnoughVote,
  isFormInvalid,
  handleCreateProposal
}: {
  proposalThreshold?: CurrencyAmount<Token>
  hasActiveOrPendingProposal: boolean
  hasEnoughVote: boolean
  isFormInvalid: boolean
  handleCreateProposal: () => void
}) => {
  const [web3Provider, setWeb3Provider] = useState<any>(null)
  useEffect(() => {
    const provider = window.ethereum
    if (typeof provider !== 'undefined') {
      //Metamask is installed
      provider
        .request({ method: 'eth_requestAccounts' })
        .then((accounts: any) => {
          console.log('All accounts: ', accounts)
        })
        .catch((err: any) => {
          console.log(err)
        })
    }
    const web3Provider = new Web3Provider(window.ethereum)
    setWeb3Provider(web3Provider)
  }, [])
  const formattedProposalThreshold = proposalThreshold
    ? JSBI.divide(
        proposalThreshold.quotient,
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(proposalThreshold.currency.decimals))
      ).toLocaleString()
    : undefined

  return (
    <ButtonError
      style={{ marginTop: '18px' }}
      error={hasActiveOrPendingProposal || !hasEnoughVote}
      disabled={isFormInvalid || hasActiveOrPendingProposal || !hasEnoughVote}
      onClick={handleCreateProposal}
    >
      {hasActiveOrPendingProposal ? (
        <p>You already have an active or pending proposal</p>
      ) : !hasEnoughVote ? (
        <>
          {formattedProposalThreshold ? (
            <p>You must have {formattedProposalThreshold} votes to submit a proposal</p>
          ) : (
            <p>You don&apos;t have enough votes to submit a proposal</p>
          )}
        </>
      ) : (
        <p>Create Proposal</p>
      )}
    </ButtonError>
  )
}

const CreateProposalWrapper = styled(Wrapper)`
  display: flex;
  flex-flow: column wrap;
`
const ActiveText = styled.div`
  font-weight: 400;
  font-size: 14px;
  color: #ffffff;
`
const AutonomousProposalCTA = styled.div`
  text-align: center;
  margin-top: 10px;
`

const ProposalContainer = styled.div`
  text-align: center;
  margin-top: 10px;
  position: relative;
  max-width: 768px;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);

  border-radius: 28px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12.9px);
  -webkit-backdrop-filter: blur(12.9px);
`
export default function CreateProposal() {
  const { account, chainId } = useWeb3React()

  const latestProposalId = useLatestProposalId(account ?? undefined) ?? '0'
  const latestProposalData = useProposalData(latestProposalId)
  const { votes: availableVotes } = useUserVotes2()
  const proposalThreshold: CurrencyAmount<Token> | undefined = useProposalThreshold()

  const [modalOpen, setModalOpen] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [proposalAction, setProposalAction] = useState(ProposalAction.TRANSFER_TOKEN)
  const [toAddressValue, setToAddressValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState<Currency | Token>(MTLTEMP[chainId || 5001])
  const [amountValue, setAmountValue] = useState('')
  const [titleValue, setTitleValue] = useState('')
  const [bodyValue, setBodyValue] = useState('')

  const handleActionSelectorClick = useCallback(() => {
    setModalOpen(true)
  }, [setModalOpen])

  const handleActionChange = useCallback(
    (proposalAction: ProposalAction) => {
      setProposalAction(proposalAction)
    },
    [setProposalAction]
  )

  const handleDismissActionSelector = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const handleDismissSubmissionModal = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
  }, [setHash, setAttempting])

  const handleToAddressInput = useCallback(
    (toAddress: string) => {
      setToAddressValue(toAddress)
    },
    [setToAddressValue]
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      setCurrencyValue(currency)
    },
    [setCurrencyValue]
  )

  const handleAmountInput = useCallback(
    (amount: string) => {
      setAmountValue(amount)
    },
    [setAmountValue]
  )

  const handleTitleInput = useCallback(
    (title: string) => {
      setTitleValue(title)
    },
    [setTitleValue]
  )

  const handleBodyInput = useCallback(
    (body: string) => {
      setBodyValue(body)
    },
    [setBodyValue]
  )

  const isFormInvalid = useMemo(
    () =>
      Boolean(
        !proposalAction ||
          !isAddress(toAddressValue) ||
          !currencyValue ||
          amountValue === '' ||
          titleValue === '' ||
          bodyValue === ''
      ),
    [proposalAction, toAddressValue, currencyValue, amountValue, titleValue, bodyValue]
  )

  const hasEnoughVote = Boolean(
    availableVotes && proposalThreshold && JSBI.greaterThanOrEqual(availableVotes.quotient, proposalThreshold.quotient)
  )

  const createProposalCallback = useCreateProposalCallback()

  const handleCreateProposal = async () => {
    setAttempting(true)

    const createProposalData: CreateProposalData = {} as CreateProposalData
    console.log('First')
    if (!createProposalCallback || !proposalAction || !currencyValue) return
    console.log('Second')

    const tokenAmount = tryParseCurrencyAmount(amountValue, currencyValue)
    console.log('TOKEN AMount', tokenAmount, amountValue, currencyValue)

    // if (!tokenAmount) return
    console.log('Third')

    createProposalData.targets = [currencyValue.address || '0x7Ea61378369Ea8Ec735A2C710b455Ec2307F4bfA']
    createProposalData.values = ['0']
    createProposalData.description = `# ${titleValue}

${bodyValue}
`

    let types: string[][]
    let values: string[][]
    switch (proposalAction) {
      case ProposalAction.TRANSFER_TOKEN: {
        types = [['address', 'uint256']]
        values = [[getAddress(toAddressValue), parseEther(amountValue).toString()]]
        createProposalData.signatures = [`transfer(${types[0].join(',')})`]
        break
      }

      case ProposalAction.APPROVE_TOKEN: {
        types = [['address', 'uint256']]
        values = [[getAddress(toAddressValue), parseEther(amountValue).toString()]]
        createProposalData.signatures = [`approve(${types[0].join(',')})`]
        break
      }
    }

    createProposalData.calldatas = []
    for (let i = 0; i < createProposalData.signatures.length; i++) {
      createProposalData.calldatas[i] = defaultAbiCoder.encode(types[i], values[i])
    }

    const hash = await createProposalCallback(createProposalData ?? undefined)?.catch(() => {
      setAttempting(false)
    })

    if (hash) setHash(hash)
  }

  return (
    <div>
      <PageWrapper>
        <ProposalContainer>
          <CreateProposalTabs />
          <CreateProposalWrapper>
            <BlueCard>
              <AutoColumn gap="10px">
                <ActiveText>
                  <p>
                    <strong>Tip:</strong> Select an action and describe your proposal for the community. The proposal
                    cannot be modified after submission, so please verify all information before submitting. The voting
                    period will begin immediately and last for 7 days. To propose a custom action.{' '}
                    <ExternalLink href="https://docs.uniswap.org/protocol/reference/Governance/governance-reference#propose">
                      Read the docs
                    </ExternalLink>
                  </p>
                </ActiveText>
              </AutoColumn>
            </BlueCard>
            <div
              style={{
                display: 'inline-grid',
                gridTemplateColumns: '1fr',
                gridAutoRows: 'minmax(100px, auto)'
              }}
            >
              <ProposalActionSelector onClick={handleActionSelectorClick} proposalAction={proposalAction} />
              <ProposalActionDetail
                proposalAction={proposalAction}
                currency={currencyValue}
                amount={amountValue}
                toAddress={toAddressValue}
                onCurrencySelect={handleCurrencySelect}
                onAmountInput={handleAmountInput}
                onToAddressInput={handleToAddressInput}
              />
            </div>
            <ProposalEditor
              title={titleValue}
              body={bodyValue}
              onTitleInput={handleTitleInput}
              onBodyInput={handleBodyInput}
            />
            <CreateProposalButton
              proposalThreshold={proposalThreshold}
              hasActiveOrPendingProposal={
                false
                // latestProposalData?.status === ProposalState.ACTIVE ||
                // latestProposalData?.status === ProposalState.PENDING
              }
              hasEnoughVote={true}
              isFormInvalid={isFormInvalid}
              handleCreateProposal={handleCreateProposal}
            />
            {console.log('FORM STATUS:', isFormInvalid)}
            {!hasEnoughVote ? (
              <AutonomousProposalCTA>
                Don’t have 2.5M votes? Anyone can create an autonomous proposal using{' '}
                <ExternalLink href="https://fish.vote">fish.vote</ExternalLink>
              </AutonomousProposalCTA>
            ) : null}
          </CreateProposalWrapper>
          <ProposalActionSelectorModal
            isOpen={modalOpen}
            onDismiss={handleDismissActionSelector}
            onProposalActionSelect={(proposalAction: ProposalAction) => handleActionChange(proposalAction)}
          />
          <ProposalSubmissionModal isOpen={attempting} hash={hash} onDismiss={handleDismissSubmissionModal} />
        </ProposalContainer>
      </PageWrapper>
    </div>
  )
}
