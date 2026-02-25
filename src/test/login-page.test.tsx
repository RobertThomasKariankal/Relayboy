import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";

describe("LoginPage", () => {
  it("toggles between login and register modes", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(await screen.findByLabelText("Email")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByLabelText("Email or Username")).toBeInTheDocument();
  });
});
