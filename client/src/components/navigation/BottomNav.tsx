import { Flex, IconButton, useColorModeValue, Box } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "../../atoms";
import { getNavItems, isPathActive } from "./navConfig";

const BottomNav = () => {
  const user = useRecoilValue(userAtom);
  const location = useLocation();
  const bgColor = useColorModeValue("white", "var(--chakra-colors-brand-dark-500)");
  const borderColor = useColorModeValue("blackAlpha.200", "whiteAlpha.200");

  const navItems = getNavItems(user?.username).filter(item => item.mobile);

  const NavButton = ({ icon: NavIcon, to, active }: { icon: any, to: string, active: boolean }) => (
    <IconButton
      as={RouterLink}
      to={to}
      aria-label="nav-item"
      variant="ghost"
      icon={<NavIcon weight={active ? "fill" : "bold"} size={28} />}
      color={active ? "brand.primary.500" : "inherit"}
      _hover={{ bg: "transparent" }}
      _active={{ bg: "transparent" }}
    />
  );

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      height="calc(64px + env(safe-area-inset-bottom))"
      bg={bgColor}
      borderTop="1px solid"
      borderColor={borderColor}
      zIndex={1000}
      px={4}
      pb="env(safe-area-inset-bottom)"
      display={{ base: "block", lg: "none" }}
    >
      <Flex justify="space-around" align="center" h="full">
        {navItems.map((item) => (
          <NavButton 
            key={item.to}
            icon={item.icon} 
            to={item.to} 
            active={isPathActive(item.to, location.pathname, user?.username)} 
          />
        ))}
      </Flex>
    </Box>
  );
};

export default BottomNav;

