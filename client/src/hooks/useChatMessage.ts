import React from "react";
import { ChatContext } from "../providers/ChatProvider";

/*
  Although this hook is simple for now and is just a wrapper around the context,
  it serves several important purposes:
  * It provides a clear, semantic API (useChatMessages) for consuming chat state/actions.
  * It allows you to add logic or refactor internals later without changing all usages.
  * It enforces the error check if the context is missing.
*/
export function useChatMessages() {
	const context = React.useContext(ChatContext);
	if (!context) {
		throw new Error("useChatMessages must be used within a ChatProvider");
	}
	const {
		visibleMessages,
		isLoading,
	} = context;
	return {
		visibleMessages,
		isLoading,
	};
}
