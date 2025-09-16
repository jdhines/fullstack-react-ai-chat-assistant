import { Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { BackButton } from "~/components/BackButton";

export const Route = createFileRoute("/track-request")({
	head: () => ({
		meta: [{ title: "Track Request" }],
	}),
	component: TrackRequestPage,
});

function TrackRequestPage() {
	return (
		<div className="px-4 pb-4">
			<div className="flex justify-between mb-8">
				<BackButton to="/" />
			</div>
			<Typography variant="h2">Track Request</Typography>
			<p>Track your requests</p>
		</div>
	);
}
