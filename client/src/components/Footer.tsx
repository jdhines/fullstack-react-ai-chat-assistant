import { Tab, Tabs } from "@mui/material";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import {
	ClipboardList,
	ClipboardPlus,
	Home,
	MessageSquare,
} from "lucide-react"; // Ensure you have these icons installed
//React footer component with 3 material UI Tabs that navigate to chat, track-request, and new-request pages
import type React from "react";

export function Footer() {
	const location = useLocation();
	const navigate = useNavigate();

	function getActiveTab(pathname: string) {
		if (pathname === "/") return "/";
		if (pathname.startsWith("/chat")) return "/chat";
		if (pathname.startsWith("/new-request")) return "/new-request";
		if (pathname.startsWith("/track-request")) return "/track-request";
		return false; // No tab selected
	}

	const activeTab = getActiveTab(location.pathname);

	const handleChange = (event: React.SyntheticEvent, newValue: string) => {
		console.log("Tab changed to:", newValue);
		navigate({ to: newValue });
	};

	return (
		<div className="bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200">
			<Tabs
				value={activeTab}
				onChange={handleChange}
				variant="fullWidth"
				indicatorColor="primary"
				textColor="primary"
			>
				<Tab value="/" title="Home" aria-label="Home" icon={<Home />} />
				<Tab
					value="/chat"
					title="Chat"
					aria-label="Chat"
					icon={<MessageSquare />}
				/>
				<Tab
					value="/new-request"
					title="New Request"
					aria-label="New Request"
					icon={<ClipboardPlus />}
				/>
				<Tab
					value="/track-request"
					title="Track Request"
					aria-label="Track Request"
					icon={<ClipboardList />}
				/>
			</Tabs>
		</div>
	);
}
