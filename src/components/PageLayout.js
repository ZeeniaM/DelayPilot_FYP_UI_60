import styled, { createGlobalStyle } from 'styled-components';

/**
 * GlobalBlueBackground
 * ─────────────────────────────────────────────────────────────────
 * Injected once by PageLayout (used by every page except LoginPage).
 * Locks html/body/#root to DelayPilot Blue so the background never
 * shows a white split regardless of drawer open/close, scrollbar
 * compensation, or any other layout shift.
 */
export const GlobalBlueBackground = createGlobalStyle`
  html, body, #root {
    background-color: #1A4B8F !important;
    min-height: 100vh;
    margin: 0;
    padding: 0;
  }
`;

export const PageLayout = styled.div`
  box-sizing: border-box;
  margin-left: 1%;
  margin-right: 1%;
  width: calc(100% - 2%);
  max-width: 1600px;

  @media (max-width: 800px) {
    margin: 6%;
    width: calc(100% - 12%);
  }
`;

/**
 * PageLayoutWithBackground
 * Convenience wrapper that renders GlobalBlueBackground + PageLayout
 * so each page only needs one import instead of two.
 */
export const PageLayoutWithBackground = ({ children }) => (
  <>
    <GlobalBlueBackground />
    <PageLayout>{children}</PageLayout>
  </>
);