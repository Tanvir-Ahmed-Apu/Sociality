import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { LeftSidebar, RightSidebar, BottomNav, Header } from "../navigation";

interface MainLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const MainLayout = ({ children, fullWidth = false }: MainLayoutProps) => {
  const sidebarWidth = { base: "0px", lg: "80px" };
  const bgColor = useColorModeValue("white", "#0a0a0a");

  return (
    <Box w="full" minH="100vh" bg={bgColor}>
      {/* Sidebar - Fixed on the left for desktop */}
      <Box display={{ base: "none", lg: "block" }} position="fixed" left="0" top="0" h="100vh" zIndex={100}>
        <LeftSidebar />
      </Box>

      {/* Main Content Area */}
      <Flex
        ml={sidebarWidth}
        w="full"
        mx="auto"
        justify="center"
      >
        {/* Center Content */}
        <Box 
          w="full"
          maxW={fullWidth ? "full" : "1200px"} 
          minH="100vh" 
          pb={{ base: "calc(80px + env(safe-area-inset-bottom))", lg: 0 }}
          px={fullWidth ? 0 : { base: 2, sm: 4, md: 6 }}
        >
          <Box display={{ base: "block", lg: "none" }} mb={fullWidth ? 0 : 4}>
            <Header />
          </Box>
          <Flex justify="center" h="full">
            <Box w="full" maxW={fullWidth ? "full" : { base: "full", lg: "650px" }}> 
              {children}
            </Box>
          </Flex>
        </Box>
      </Flex>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </Box>
  );
};

export default MainLayout;
