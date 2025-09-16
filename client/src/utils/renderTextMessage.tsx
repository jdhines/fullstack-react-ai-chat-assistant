import React from "react";
import { AdaptiveCard } from "~/components/adaptivecards-react/adaptive-card";
import { isAdaptiveCardMessage, parseAdaptiveCard } from "~/types/ChatMessageProps";

/**
 * Custom renderer for text messages that can handle adaptive cards
 */
export const renderTextMessage = React.memo((props: { message: any }) => {
	console.log({props});
	const { message } = props;
	const content = message.content;

	// Check if the content is an adaptive card
	if (isAdaptiveCardMessage(content)) {
		const adaptiveCardPayload = parseAdaptiveCard(content);
		if (adaptiveCardPayload) {
			return (
				<div className="adaptive-card-container">
					<AdaptiveCard
						payload={adaptiveCardPayload}
						onError={(error) => {
							console.error("Adaptive card error:", error);
						}}
					/>
				</div>
			);
		}
	}

	// For non-adaptive card content, create a simple text renderer
	// that mimics CopilotKit's default behavior
	return (
		<div style={{ whiteSpace: 'pre-wrap' }}>
			{content}
		</div>
	);
});

renderTextMessage.displayName = 'RenderTextMessage';
