import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";
import { fireEvent } from "@testing-library/dom";

describe("Home Page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", {
      name: /Facial Expression Colour Mapper/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("toggles the camera on and off", () => {
    render(<Home />);
    const button = screen.getByRole("button", { name: /Start Camera/i });
    fireEvent.click(button);
    expect(button).toHaveTextContent(/Stop Camera/i);
    fireEvent.click(button);
    expect(button).toHaveTextContent(/Start Camera/i);
  });
});
