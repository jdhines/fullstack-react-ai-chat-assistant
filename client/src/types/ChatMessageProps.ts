export interface ChatMessageProps {
	id: string;
	role: "user" | "bot";
	type: "text";
	messageContent: string | null;
	timestamp?: Date;
}

// Helper function to detect if a message content contains an adaptive card JSON
export function isAdaptiveCardMessage(content: string | null): boolean {
	if (!content) return false;

	try {
		const parsed = JSON.parse(content);
		// Check if it has adaptive card structure
		return parsed && typeof parsed === 'object' &&
			   (parsed.type === 'AdaptiveCard' || parsed.$schema?.toLowerCase().includes('adaptivecard'));
	} catch {
		return false;
	}
}

// Helper function to parse adaptive card content from message
export function parseAdaptiveCard(content: string | null): object | null {
	if (!content || !isAdaptiveCardMessage(content)) return null;

	try {
		return JSON.parse(content);
	} catch {
		return null;
	}
}
