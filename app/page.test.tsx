import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

describe("Home Page", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders the main heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", {
      name: /Facial Expression Colour Mapper/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("toggles the camera on and off", async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
    vi.stubGlobal("navigator", Object.create(navigator, {
      mediaDevices: { value: { getUserMedia } },
    }));

    render(<Home />);
    const button = screen.getByRole("button", { name: /Start Camera/i });
    fireEvent.click(button);
    fireEvent.click(await screen.findByRole("button", { name: /Stop Camera/i }));
    expect(stop).toHaveBeenCalledOnce();
    expect(button).toHaveTextContent(/Start Camera/i);
  });
});
