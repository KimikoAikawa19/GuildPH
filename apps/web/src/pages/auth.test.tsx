import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

vi.mock("../firebase", () => ({
  auth: {},
  setSessionPersistence: vi.fn()
}));

describe("Login page", () => {
  it("renders authentication fields", () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Log in" })).toBeTruthy();
    expect(screen.getByLabelText("Email address")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });
});
