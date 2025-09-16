import { Link } from "@tanstack/react-router";

export function BackButton({ to }) {
  return (
    <Link
      type="button"
      to={to}
      className="bg-none text-gray-700 py-2 hover:text-blue-500"
    >
      {"< Back"}
    </Link>
  );
}