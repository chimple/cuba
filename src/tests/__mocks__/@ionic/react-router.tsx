import React from "react";
import { MemoryRouter } from "react-router-dom";

export const IonReactRouter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <MemoryRouter>{children}</MemoryRouter>;
};
