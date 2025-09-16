import { Link } from "@tanstack/react-router";
import clsx from "clsx";

type HomeLinkProps = {
	to: string;
	type?: "primary" | "secondary" | "default";
	className?: string;
	children: React.ReactNode;
};

export default function HomeLink({
	to,
	type = "default",
	className,
	children,
}: HomeLinkProps) {
	const colorClasses = {
		primary:
			"text-lg from-blue-800 to-blue-900 text-white hover:from-blue-700 hover:to-blue-900",
		secondary:
			"text-md font-semibold from-pink-400 to-pink-500 hover:from-pink-400 hover:to-pink-600",
		default:
			"text-md font-semibold from-white to-gray-50 text-gray-800 hover:to-gray-200",
	};
	const css = clsx(
		`${colorClasses[type]} flex items-end bg-gradient-to-br rounded-2xl p-6 shadow-md`,
		className,
	);

	return (
		<Link to={to} className={css}>
			{children}
		</Link>
	);
}
