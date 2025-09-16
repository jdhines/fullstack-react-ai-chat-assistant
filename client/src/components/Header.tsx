import { Expand, Shrink } from "lucide-react";

interface HeaderProps {
	expanded: boolean;
	toggleExpand: () => void;
}

export function Header({ expanded, toggleExpand }: HeaderProps) {
	return (
		<header className="flex gap-9 p-4 bg-blue-800 justify-between items-center">
			<div className="max-w-[100vw]">
				<img
					src="/krakken-icon.svg"
					alt="Logo"
					className="h-8 w-8 inline-block"
				/>
				<span className="text-white">AI Assistant</span>
			</div>
			<button
				className="hover:bg-blue-700 p-1 rounded"
				onClick={toggleExpand}
				title={expanded ? "Collapse" : "Expand"}
				type="button"
			>
				<span className="text-white cursor-pointer">
					{expanded ? <Shrink /> : <Expand />}
				</span>
			</button>
		</header>
	);
}
