import React from "react";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";

export function PageLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// size expander state for header
	const [expanded, setExpanded] = React.useState(false);
	const toggleExpand = () => setExpanded((e) => !e);

	return (
		<main
			className={`min-h-[50vh] fixed bottom-6 right-6 ${expanded ? "max-w-[840px] w-[840px] max-h-[95vh] h-[95vh]" : "w-[560px] max-h-[95vh]"} flex flex-col bg-white rounded-lg shadow-lg border border-gray-200`}
			style={{ zIndex: 50 }}
		>
			<Header expanded={expanded} toggleExpand={toggleExpand} />
			<div className="flex-1 flex flex-col bg-gradient-to-br from-cyan-200 to-blue-200 overflow-y-auto ">
				{children}
			</div>
			<Footer />
		</main>
	);
}
