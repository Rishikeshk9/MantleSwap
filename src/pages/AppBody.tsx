import React from 'react'
import styled from 'styled-components'
import { darken, lighten, opacify } from 'polished'

export const BodyWrapper = styled.div`
  position: relative;
  max-width: 420px;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);

  border-radius: 28px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12.9px);
  -webkit-backdrop-filter: blur(12.9px);
  /* padding: 1rem; */
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children }: { children: React.ReactNode }) {
  return <BodyWrapper>{children}</BodyWrapper>
}
