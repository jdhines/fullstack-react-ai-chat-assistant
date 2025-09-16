import { BackButton } from "~/components/BackButton";
interface ChatHeaderProps {
	onNewChat: () => void;
}

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
	return (
		<div
			id="chat-header"
			className="sticky top-0 z-10 shrink-0 flex px-4 justify-between items-center border border-gray-100 bg-white"
		>
			<BackButton to="/" />
			<button
				type="button"
				onClick={onNewChat}
				className="text-blue-500 bg-none p-2"
			>
				+ New Chat
			</button>
		</div>
	);
}
