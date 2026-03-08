import styled from 'styled-components';

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
