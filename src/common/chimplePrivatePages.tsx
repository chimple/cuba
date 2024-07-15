import { lazy } from "react";

export const FallbackComponent: React.FC = () => {
  return <div>This page is not available.</div>;
};

export const TestPage1 = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/test");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const TestPage2 = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/test1");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
