import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import { BackButton } from "~/components/BackButton";

export const Route = createFileRoute("/new-request")({
	head: () => ({
		meta: [{ title: "New Request" }],
	}),
	component: NewRequestPage,
});
function NewRequestPage() {
	return (
		<div className="px-4 pb-4">
			<div className="flex justify-between mb-8">
				<BackButton to="/" />
			</div>
			<Typography variant="h2" gutterBottom>
				New Request
			</Typography>
			<p>Create a new request.</p>
		</div>
	);
}
