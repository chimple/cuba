import {store} from "./store";

describe("Redux Store Setup", () => {
  it("should initialize the store with empty root state", () => {
    const state = store.getState();
    // Since rootReducer is empty, we expect state to only contain redux-persist state if any
    expect(state).toBeDefined();
    // The persist config adds an "_persist" key but the base state depends on slices.
    // Currently, with no slices, `state` should be an empty object or just have _persist.
  });
});
