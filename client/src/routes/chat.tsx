import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "~/pages/chat";

export const Route = createFileRoute("/chat")({
	head: () => ({
		meta: [{ title: "Chat" }],
	}),
	component: ChatIndexRoute,
});

function ChatIndexRoute() {
	return <ChatPage />;
}