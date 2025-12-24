import React from "react";

export const IonApp = ({ children }: any) => <div>{children}</div>;
export const IonRouterOutlet = ({ children }: any) => <div>{children}</div>;
export const IonButton = ({ children, onClick }: any) => (
  <button onClick={onClick}>{children}</button>
);
export const IonModal = ({ isOpen, children }: any) =>
  isOpen ? <div>{children}</div> : null;
export const IonToast = () => null;
export const IonAlert = () => null;

export const useIonToast = () => [jest.fn(), jest.fn()];
export const setupIonicReact = jest.fn();
