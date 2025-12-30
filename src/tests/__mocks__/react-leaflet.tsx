import React from "react";

/* Minimal mock for react-leaflet used in tests.
   - Exports simple components that render children
   - Exports `useMap` which returns a mock map with `fitBounds` and `setView`
*/

export const MapContainer: React.FC<any> = ({ children }) => <div>{children}</div>;
export const TileLayer: React.FC<any> = ({ children }) => <div>{children}</div>;
export const Marker: React.FC<any> = ({ children }) => <div>{children}</div>;
export const Popup: React.FC<any> = ({ children }) => <div>{children}</div>;
export const Circle: React.FC<any> = ({ children }) => <div>{children}</div>;
export const Polyline: React.FC<any> = ({ children }) => <div>{children}</div>;

export const useMap = jest.fn(() => ({
  fitBounds: jest.fn(),
  setView: jest.fn(),
}));
