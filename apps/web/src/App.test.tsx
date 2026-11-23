import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./firebase", () => ({
  auth: {},
  setSessionPersistence: vi.fn()
}));

vi.mock("./contexts/AuthContext", () => ({
  useAuth: () => ({
    firebaseUser: null,
    loading: false,
    logout: vi.fn(),
    getIdToken: vi.fn()
  })
}));

describe("GuildPH homepage", () => {
  it("renders the primary headline", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Find Your Gaming Community." })).toBeTruthy();
  });
});
