import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "fs";
import path from "path";
import ResetPassword from "./ResetPassword";
import { PAGES } from "../common/constants";

jest.mock("i18next", () => ({
  t: (key: string) => key,
}));

const mockHistoryPush = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useHistory: () => ({
      push: mockHistoryPush,
    }),
    useLocation: () => ({
      search: "",
      pathname: "/reset-password",
    }),
  };
});

jest.mock("ionicons/icons", () => ({
  eye: "eye",
  eyeOff: "eyeOff",
}));

jest.mock("@ionic/react", () => ({
  IonButton: ({ children, onClick, className, id }: any) => (
    <button type="button" onClick={onClick} className={className} id={id}>
      {children}
    </button>
  ),
  IonInput: ({ type, value, placeholder, className, onIonChange }: any) => (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      className={className}
      onChange={(e) => onIonChange?.({ detail: { value: e.target.value } })}
    />
  ),
  IonIcon: ({ icon, onClick, className }: any) => (
    <button
      type="button"
      data-testid={`icon-${String(icon)}`}
      className={className}
      onClick={onClick}
    >
      {String(icon)}
    </button>
  ),
}));

const mockAuthHandler = {
  updateUser: jest.fn(),
};

jest.mock("../services/ServiceConfig", () => ({
  ServiceConfig: {
    getI: () => ({
      authHandler: mockAuthHandler,
    }),
  },
}));

describe("ResetPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAuthHandler.updateUser.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the reset password form fields and save button", () => {
    render(<ResetPassword />);

    expect(screen.getByText("reset password")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter new password")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("starts with both password inputs masked", () => {
    render(<ResetPassword />);

    expect(screen.getByPlaceholderText("Enter new password")).toHaveAttribute(
      "type",
      "password"
    );
    expect(screen.getByPlaceholderText("Confirm password")).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("toggles the new password input visibility", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getAllByTestId("icon-eyeOff")[0]);
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getAllByTestId("icon-eye")[0]);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("toggles the confirm password input visibility independently", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    const confirmInput = screen.getByPlaceholderText("Confirm password");
    const eyeIcons = screen.getAllByTestId("icon-eyeOff");

    await user.click(eyeIcons[1]);
    expect(confirmInput).toHaveAttribute("type", "text");
    expect(screen.getByPlaceholderText("Enter new password")).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("does not change the confirm input type when only the new password eye icon is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.click(screen.getAllByTestId("icon-eyeOff")[0]);

    expect(screen.getByPlaceholderText("Enter new password")).toHaveAttribute(
      "type",
      "text"
    );
    expect(screen.getByPlaceholderText("Confirm password")).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("does not change the new password input type when only the confirm eye icon is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.click(screen.getAllByTestId("icon-eyeOff")[1]);

    expect(screen.getByPlaceholderText("Enter new password")).toHaveAttribute(
      "type",
      "password"
    );
    expect(screen.getByPlaceholderText("Confirm password")).toHaveAttribute(
      "type",
      "text"
    );
  });

  it("toggles the confirm password input back to password on a second click", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.click(screen.getAllByTestId("icon-eyeOff")[1]);
    expect(screen.getByPlaceholderText("Confirm password")).toHaveAttribute(
      "type",
      "text"
    );

    await user.click(screen.getAllByTestId("icon-eye")[1]);
    expect(screen.getByPlaceholderText("Confirm password")).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("shows a validation message when the new password is shorter than 6 characters", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "12345");
    await user.type(screen.getByPlaceholderText("Confirm password"), "12345");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();
    expect(mockAuthHandler.updateUser).not.toHaveBeenCalled();
  });

  it("shows the short-password validation when both fields are empty", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();
    expect(mockAuthHandler.updateUser).not.toHaveBeenCalled();
  });

  it("accepts a password with exactly 6 characters", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123456");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123456");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledWith({
        password: "123456",
      });
    });
  });

  it("shows a validation message when the passwords do not match", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123456");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123457");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockAuthHandler.updateUser).not.toHaveBeenCalled();
  });

  it("shows mismatch when confirm password is empty but the new password is valid", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123456");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockAuthHandler.updateUser).not.toHaveBeenCalled();
  });

  it("accepts whitespace-only passwords if they meet the length and match rules", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "      ");
    await user.type(screen.getByPlaceholderText("Confirm password"), "      ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledWith({
        password: "      ",
      });
    });
  });

  it("accepts matching passwords with symbols", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "abc$12!");
    await user.type(screen.getByPlaceholderText("Confirm password"), "abc$12!");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledWith({
        password: "abc$12!",
      });
    });
  });

  it("calls updateUser with the entered password when validation passes", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secure1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledWith({
        password: "secure1",
      });
    });
  });

  it("submits the latest typed password values after editing both fields", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.clear(screen.getByPlaceholderText("Enter new password"));
    await user.type(screen.getByPlaceholderText("Enter new password"), "latest7");

    await user.type(screen.getByPlaceholderText("Confirm password"), "wrong77");
    await user.clear(screen.getByPlaceholderText("Confirm password"));
    await user.type(screen.getByPlaceholderText("Confirm password"), "latest7");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledWith({
        password: "latest7",
      });
    });
  });

  it("calls updateUser each time Save is clicked with valid matching passwords", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secure1");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledTimes(2);
    });
  });

  it("shows a success message and redirects to login after 2 seconds", async () => {
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "secure1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "secure1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Password reset successful. Redirecting to login...")
    ).toBeInTheDocument();
    expect(mockHistoryPush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1999);
    });
    expect(mockHistoryPush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockHistoryPush).toHaveBeenCalledWith(PAGES.LOGIN);
  });

  it("keeps showing the success message before the redirect timer finishes", async () => {
    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "secure1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "secure1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Password reset successful. Redirecting to login...")
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(
      screen.getByText("Password reset successful. Redirecting to login...")
    ).toBeInTheDocument();
    expect(mockHistoryPush).not.toHaveBeenCalled();
  });

  it("does not redirect when updateUser returns a falsy value", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockAuthHandler.updateUser.mockResolvedValue(false);

    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secure1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledWith({
        password: "secure1",
      });
    });

    expect(
      screen.queryByText("Password reset successful. Redirecting to login...")
    ).not.toBeInTheDocument();
    expect(mockHistoryPush).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("error in updating user....");

    consoleSpy.mockRestore();
  });

  it("leaves the page without any message when updateUser fails on the first valid attempt", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockAuthHandler.updateUser.mockResolvedValue(false);

    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secure1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByText("Password must be at least 6 characters.")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Passwords do not match.")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Password reset successful. Redirecting to login...")
    ).not.toBeInTheDocument();
  });

  it("keeps the previous validation message when updateUser later fails", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockAuthHandler.updateUser.mockResolvedValue(false);

    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      screen.getByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Enter new password"));
    await user.clear(screen.getByPlaceholderText("Confirm password"));
    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secure1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAuthHandler.updateUser).toHaveBeenCalledWith({
        password: "secure1",
      });
    });

    expect(
      screen.getByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();
  });

  it("replaces an old validation message with the success message after a valid retry", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      screen.getByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Enter new password"));
    await user.clear(screen.getByPlaceholderText("Confirm password"));
    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secure1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Password reset successful. Redirecting to login...")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Password must be at least 6 characters.")
    ).not.toBeInTheDocument();
  });

  it("replaces a mismatch error with the short-password error on the next invalid save", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123456");
    await user.type(screen.getByPlaceholderText("Confirm password"), "654321");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Enter new password"));
    await user.clear(screen.getByPlaceholderText("Confirm password"));
    await user.type(screen.getByPlaceholderText("Enter new password"), "123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Passwords do not match.")).not.toBeInTheDocument();
  });

  it("keeps showing the current validation message while the user types until save is clicked again", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Enter new password"), "456789");

    expect(
      screen.getByText("Password must be at least 6 characters.")
    ).toBeInTheDocument();
  });

  it("shows the mismatch message after correcting length but keeping different values", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await user.clear(screen.getByPlaceholderText("Enter new password"));
    await user.clear(screen.getByPlaceholderText("Confirm password"));
    await user.type(screen.getByPlaceholderText("Enter new password"), "123456");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123457");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("renders exactly two eye toggle icons", () => {
    render(<ResetPassword />);

    expect(screen.getAllByTestId("icon-eyeOff")).toHaveLength(2);
  });

  it("applies the reset-password-text-box class to both inputs", () => {
    render(<ResetPassword />);

    expect(screen.getByPlaceholderText("Enter new password")).toHaveClass(
      "reset-password-text-box"
    );
    expect(screen.getByPlaceholderText("Confirm password")).toHaveClass(
      "reset-password-text-box"
    );
  });

  it("applies the reset-password-eye-icon class to both eye toggle buttons", () => {
    render(<ResetPassword />);

    const icons = screen.getAllByTestId("icon-eyeOff");
    expect(icons[0]).toHaveClass("reset-password-eye-icon");
    expect(icons[1]).toHaveClass("reset-password-eye-icon");
  });

  it("renders the save button with the expected id and class", () => {
    render(<ResetPassword />);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("id", "reset-password-button-inner");
    expect(button).toHaveClass("reset-password-button");
  });

  it("schedules two redirects when two successful saves happen before timers run", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secure1");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockHistoryPush).toHaveBeenCalledTimes(2);
    expect(mockHistoryPush).toHaveBeenNthCalledWith(1, PAGES.LOGIN);
    expect(mockHistoryPush).toHaveBeenNthCalledWith(2, PAGES.LOGIN);
  });

  it("keeps the entered field values after a validation failure", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "123");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByPlaceholderText("Enter new password")).toHaveValue("123");
    expect(screen.getByPlaceholderText("Confirm password")).toHaveValue("123");
  });

  it("keeps the entered field values after a successful save", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText("Enter new password"), "secure1");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secure1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Password reset successful. Redirecting to login...")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter new password")).toHaveValue("secure1");
    expect(screen.getByPlaceholderText("Confirm password")).toHaveValue("secure1");
  });

  it("keeps the reset password CSS eye icon positioning contract", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/pages/ResetPassword.css"),
      "utf8"
    );

    expect(css).toMatch(
      /\.reset-password-eye-icon\s*\{[\s\S]*position:\s*absolute;/
    );
    expect(css).toMatch(
      /\.reset-password-eye-icon\s*\{[\s\S]*right:\s*10px;/
    );
  });

  it("keeps the reset password button CSS contract", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/pages/ResetPassword.css"),
      "utf8"
    );

    expect(css).toMatch(
      /#reset-password-button-inner\s*\{[\s\S]*display:\s*flex;/
    );
    expect(css).toMatch(
      /#reset-password-button-inner\s*\{[\s\S]*--background:\s*#cfec91;/
    );
  });

  it("keeps the reset password CSS layout contract", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/pages/ResetPassword.css"),
      "utf8"
    );

    expect(css).toMatch(
      /\.reset-password-main-div\s*\{[\s\S]*display:\s*flex;/
    );
    expect(css).toMatch(
      /\.reset-password-field-div\s*\{[\s\S]*position:\s*relative;/
    );
  });
});
