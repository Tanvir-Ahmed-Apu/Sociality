import { Box, useColorModeValue } from "@chakra-ui/react";
import AppRoutes from "./routes/AppRoutes";

import useOAuthCallback from "./hooks/useOAuthCallback";
import useInitializeUser from "./hooks/useInitializeUser";

/**
 * Main application component
 * Provides the layout structure and routing for the application
 */
function App() {
	// Initialize user state from tab-specific storage
	useInitializeUser();

	// Handle OAuth callback on any page
	useOAuthCallback();

	return (
		<Box 
            position={"relative"} 
            w='full' 
            minH="100vh" 
            bg={useColorModeValue("white", "var(--chakra-colors-brand-dark-600)")}
        >
			<AppRoutes />
		</Box>
	);
}

export default App;
