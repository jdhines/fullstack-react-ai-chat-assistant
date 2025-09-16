import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "./Footer";

// Mock useNavigate from @tanstack/react-router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => {
	const actual = vi.importActual("@tanstack/react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
		useLocation: () => ({ pathname: "/" }),
	};
});

describe("Footer", () => {
	beforeEach(() => {
		mockNavigate.mockClear();
	});

	it("calls navigate when a tab is clicked", async () => {
		render(<Footer />);
		const chatTab = screen.getByRole("tab", { name: /chat/i });
		await userEvent.click(chatTab);
		expect(mockNavigate).toHaveBeenCalled();
	});
});
