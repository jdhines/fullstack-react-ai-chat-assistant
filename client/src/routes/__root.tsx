import '@copilotkit/react-ui/styles.css'
import { createRootRoute } from "@tanstack/react-router";
import { CopilotKit } from '@copilotkit/react-core'
import { App } from "~/components/App";
import { useState, useEffect } from 'react';

const COPILOTKIT_URL = "http://localhost:4000/copilotkit";
const BACKEND_URL = "http://localhost:8000";

/*
  Optional: create a .env file in the root of your project with the following content:
	VITE_COPILOTKIT_URL=http://localhost:4000/copilotkit
	Then use this line to import it:
	const COPILOTKIT_URL = import.meta.env.VITE_COPILOTKIT_URL;
*/
const userInfo = {
	homeAccountId: "beware-the-krakken-1234",
}


const SessionAwareCopilotKit = () => {
	const [threadId, setThreadId] = useState<string | undefined>(undefined);
	const [sessionCheckComplete, setSessionCheckComplete] = useState(false);

	useEffect(() => {
		// Check for recent session when component mounts
		const checkForRecentSession = async () => {
			try {
				console.log("🔍 Checking for recent session for user:", userInfo.homeAccountId);
				const response = await fetch(`${BACKEND_URL}/session/${userInfo.homeAccountId}`);
				const sessionInfo = await response.json();

				if (sessionInfo.has_recent_session && sessionInfo.thread_id) {
					console.log("🔄 Found recent session, using thread_id:", sessionInfo.thread_id);
					setThreadId(sessionInfo.thread_id);
				} else {
					console.log("🆕 No recent session found, CopilotKit will create new thread");
					// Don't set threadId, let CopilotKit create a new one
				}
			} catch (error) {
				console.error("❌ Error checking for recent session:", error);
				// Continue without threadId, let CopilotKit create a new one
			} finally {
				setSessionCheckComplete(true);
			}
		};

		checkForRecentSession();
	}, []);

	// Don't render CopilotKit until session check is complete
	if (!sessionCheckComplete) {
		return null; // Let the chat page handle loading UI
	}

	console.log("🚀 Initializing CopilotKit with:", {
		user_id: userInfo.homeAccountId,
		threadId: threadId || "new"
	});

	return (
		<CopilotKit
			runtimeUrl={COPILOTKIT_URL}
			agent="sample_agent"
			properties={{
				user_id: userInfo.homeAccountId,
			}}
			// Only pass threadId if we found a recent session
			{...(threadId ? { threadId } : {})}
		>
			<App />
		</CopilotKit>
	);
};

export const Route = createRootRoute({
	component: SessionAwareCopilotKit,
});
