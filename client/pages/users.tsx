import React from "react";
import AppWrapper from "../components/AppWrapper";
import styled from "styled-components";
import UsersTable from "../components/UsersTable";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  margin-top: 20px;
  padding-left: 9rem;
  padding-right: 9rem;
  width: 100%;
  max-width: 100%;
`;

const UsersPage = () => {
  return (
    <AppWrapper>
      <Container>
        <UsersTable />
      </Container>
    </AppWrapper>
  );
};

export default UsersPage;
