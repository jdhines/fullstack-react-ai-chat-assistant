import { ChatHeader } from "~/components/ChatHeader";
import { CopilotChat } from '@copilotkit/react-ui'
import { useCopilotChat } from "@copilotkit/react-core";
import { isAdaptiveCardMessage } from "~/types/ChatMessageProps";
import { renderTextMessage } from "~/utils/renderTextMessage";
import React from "react";


export function ChatPage() {
	const { reset, visibleMessages, isLoading } = useCopilotChat();

	//TODO: remove this logging when no longer needed
	React.useEffect(() => {
		console.log("Visible messages:", visibleMessages);
	}, [visibleMessages]);

	// Show loading state while session is being restored or chat is initializing
	if (isLoading && visibleMessages.length === 0) {
		return (
			<div id="chat-page" className="h-[100vh] overflow-hidden flex flex-col flex-1 bg-white">
				<ChatHeader onNewChat={reset} />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
						<p className="text-gray-600">Loading chat session...</p>
					</div>
				</div>
			</div>
		);
	}

	// TODO: the use of this to use a custom RenderTextMessage function is an example only
	/*
		It doesn't actually work, as there backend isn't handling adaptive cards yet,
		and hence not sending anything that the isAdaptiveCardMessage function would return true for.
	*/
	const hasAdaptiveCards = visibleMessages.some((msg: any) => isAdaptiveCardMessage(msg.content))

	return (
		<div id="chat-page" className="h-[100vh] overflow-hidden flex flex-col flex-1 bg-white">
			<ChatHeader onNewChat={reset} />
			<CopilotChat
				instructions={"You are assisting the user as best as you can. Answer in the best way possible given the data you have."}
				labels={{
					title: "Sidebar Assistant",
					initial: "How can I help you today?",
				}}
				{...(hasAdaptiveCards ? { RenderTextMessage: renderTextMessage } : {})}
			/>
		</div>
	);
}
