import { ResizingTextArea, TextInput } from '../../components/TextInput'
import React, { memo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

const ProposalEditorHeader = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
`

const ProposalTitle = memo(styled(TextInput)`
  margin-top: 10.5px;
  margin-bottom: 7.5px;
`)

const ProposalEditorContainer = styled.div`
  margin-top: 10px;
  padding: 0.75rem 1rem 0.75rem 1rem;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.bg1};
  background-color: ${({ theme }) => theme.bg1};
`

export const ProposalEditor = ({
  className,
  title,
  body,
  onTitleInput,
  onBodyInput
}: {
  className?: string
  title: string
  body: string
  onTitleInput: (title: string) => void
  onBodyInput: (body: string) => void
}) => {
  const bodyPlaceholder = `## Summary

Insert your summary here

## Methodology
  
Insert your methodology here

## Conclusion
  
Insert your conclusion here
  
  `

  return (
    <ProposalEditorContainer className={className}>
      <ProposalEditorHeader>Proposal</ProposalEditorHeader>
      <ProposalTitle value={title} onUserInput={onTitleInput} placeholder={`Proposal Title`} fontSize="1.25rem" />
      <hr />
      <ResizingTextArea value={body} onUserInput={onBodyInput} placeholder={bodyPlaceholder} fontSize="1rem" />
    </ProposalEditorContainer>
  )
}
