import React from "react";
import { useCopilotChat } from "@copilotkit/react-core";
import type { Message } from "@copilotkit/runtime-client-gql";

type ChatContextType = {
	visibleMessages: Message[];
	isLoading: boolean;
};

export const ChatContext = React.createContext<ChatContextType | null>(null);

function ChatProvider({ children }: { children: React.ReactNode }) {
	// Use CopilotKit's chat management
	const {
		visibleMessages,
		isLoading,
	} = useCopilotChat();

	return (
		<ChatContext.Provider
			value={{
				visibleMessages,
				isLoading
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}

export default ChatProvider;
