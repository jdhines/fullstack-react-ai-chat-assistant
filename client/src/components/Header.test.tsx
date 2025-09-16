import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";
import "@testing-library/jest-dom";

describe("Header", () => {
	it("renders logo, title, and expand button", () => {
		render(<Header expanded={false} toggleExpand={() => {}} />);
		expect(screen.getByAltText("Logo")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /expand/i })).toBeInTheDocument();
	});

	it("shows 'Expand' icon and title when not expanded", () => {
		render(<Header expanded={false} toggleExpand={() => {}} />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("title", "Expand");
		// The Expand icon is rendered, but since it's an imported component,
		// we can check for its SVG element
		expect(button.querySelector("svg")).toBeInTheDocument();
	});

	it("shows 'Collapse' icon and title when expanded", () => {
		render(<Header expanded={true} toggleExpand={() => {}} />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("title", "Collapse");
		expect(button.querySelector("svg")).toBeInTheDocument();
	});

	it("calls toggleExpand when button is clicked", () => {
		const toggleExpand = vi.fn();
		render(<Header expanded={false} toggleExpand={toggleExpand} />);
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(toggleExpand).toHaveBeenCalledTimes(1);
	});
});

// We recommend installing an extension to run vitest tests.
