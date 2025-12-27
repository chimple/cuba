import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Switch } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { PAGES } from "./common/constants";
import { mockAuthHandler } from "./tests/__mocks__/serviceConfigMock";

describe("ProtectedRoute", () => {

  it("redirects to login when user is not authenticated", async () => {
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(false);
    mockAuthHandler.getCurrentUser.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Switch>
          <ProtectedRoute path="/protected">
            <div>Protected Content</div>
          </ProtectedRoute>

          <Route path={PAGES.LOGIN}>
            <div>Login Page</div>
          </Route>
        </Switch>
      </MemoryRouter>
    );

    expect(await screen.findByText(/login page/i)).toBeInTheDocument();
  });

  it("renders children when user is authenticated and T&C accepted", async () => {
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(true);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      is_tc_accepted: true,
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Switch>
          <ProtectedRoute path="/protected">
            <div>Protected Content</div>
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/protected content/i)
    ).toBeInTheDocument();
  });

  it("redirects to terms and conditions when T&C not accepted", async () => {
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(true);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      is_tc_accepted: false,
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Switch>
          <ProtectedRoute path="/protected">
            <div>Protected Content</div>
          </ProtectedRoute>

          <Route path={PAGES.TERMS_AND_CONDITIONS}>
            <div>Terms Page</div>
          </Route>
        </Switch>
      </MemoryRouter>
    );

    expect(await screen.findByText(/terms page/i)).toBeInTheDocument();
  });
});
