import { Outlet } from "@tanstack/react-router";
import { PageLayout } from "~/components/PageLayout";
import ChatProvider from "~/providers/ChatProvider";

export const App = () => {
	return (
		<ChatProvider>
			<PageLayout>
				<Outlet />
			</PageLayout>
		</ChatProvider>
	);
};
