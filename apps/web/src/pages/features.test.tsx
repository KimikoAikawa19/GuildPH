import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DiscoveryPage from "./DiscoveryPage";
import PremiumPage from "./PremiumPage";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ getIdToken: vi.fn().mockResolvedValue("test-token") })
}));

vi.mock("../services/api", () => ({
  apiRequest: vi.fn((path: string) => Promise.resolve(path === "/communities" ? [] : [
    { id: "plan-1", name: "Premium", price: 99, benefits: ["Advanced analytics"] }
  ]))
}));

describe("GuildPH feature pages", () => {
  it("renders community discovery", async () => {
    render(<MemoryRouter><DiscoveryPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Discover your next squad" })).toBeTruthy();
  });

  it("renders premium membership", async () => {
    render(<MemoryRouter><PremiumPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Build a stronger community" })).toBeTruthy();
  });
});
