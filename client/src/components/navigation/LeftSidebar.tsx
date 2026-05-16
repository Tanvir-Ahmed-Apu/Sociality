import { 
  Box, 
  VStack, 
  Text,
  Icon, 
  Link, 
  useColorModeValue, 
  Avatar, 
  Flex,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Image
} from "@chakra-ui/react";

import { 
  House, 
  MagnifyingGlass, 
  Heart, 
  User, 
  Chat,
  List, 
  Gear, 
  SignOut 
} from "phosphor-react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "../../atoms";
import { isPathActive } from "./navConfig";
import useLogout from "../../hooks/useLogout";

const NavItem = ({ icon: NavIcon, label, to, isActive, isCreate = false, onClick }: any) => {
  const activeColor = useColorModeValue("black", "white");
  const inactiveColor = useColorModeValue("gray.400", "gray.600");
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");

  const content = (
    <Flex
      p={3}
      borderRadius="12px"
      bg={isCreate ? useColorModeValue("gray.100", "whiteAlpha.100") : "transparent"}
      color={isActive ? activeColor : inactiveColor}
      transition="all 0.2s"
      _hover={{
        bg: hoverBg,
        transform: "scale(1.05)"
      }}
      cursor="pointer"
      justifyContent="center"
      alignItems="center"
      onClick={onClick}
    >
      <Icon as={NavIcon} weight={isActive ? "fill" : "light"} boxSize={7} />
    </Flex>
  );

  if (to) {
    return (
      <Tooltip label={label} placement="right" hasArrow>
        <Link as={RouterLink} to={to} _hover={{ textDecoration: "none" }} w="full">
          {content}
        </Link>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={label} placement="right" hasArrow>
      <Box w="full">{content}</Box>
    </Tooltip>
  );
};


const LeftSidebar = () => {

  const user = useRecoilValue(userAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();
  
  // Custom disclosure for the Create Post modal

  const bgColor = useColorModeValue("white", "#0A0A0A");
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");

  return (
    <Box
      w="80px"
      h="100vh"
      py={8}
      bg={bgColor}
      border="none"
      display="flex"
      flexDirection="column"
      alignItems="center"
      position="relative"
    >
      {/* Logo — cross-fades icon1 → icon2 on hover */}
      <Box
        mb={8}
        cursor="pointer"
        onClick={() => navigate('/')}
        textAlign="center"
        position="relative"
        w="42px"
        h="42px"
        sx={{
          '& .logo-icon2': {
            opacity: 0,
            transition: 'opacity 0.35s ease',
          },
          '& .logo-icon1': {
            opacity: 1,
            transition: 'opacity 0.35s ease',
          },
          '&:hover .logo-icon1': { opacity: 0 },
          '&:hover .logo-icon2': { opacity: 1 },
        }}
      >
        <Image
          className="logo-icon1"
          src="/icon1.svg"
          alt="Sociality Logo"
          boxSize="42px"
          position="absolute"
          top={0}
          left={0}
          filter={useColorModeValue("none", "invert(1)")}
        />
        {/* Hover icon — gradient colours, no filter needed */}
        <Image
          className="logo-icon2"
          src="/icon2.svg"
          alt="Sociality Logo Hover"
          boxSize="42px"
          position="absolute"
          top={0}
          left={0}
        />
      </Box>

      {/* Navigation Items - Centered vertically */}
      <VStack spacing={6} align="center" flex={1} w="full" px={2} justifyContent="center">
        <NavItem 
          icon={House} 
          label="Home" 
          to="/" 
          isActive={isPathActive("/", location.pathname)} 
        />
        <NavItem 
          icon={MagnifyingGlass} 
          label="Search" 
          to="/search" 
          isActive={isPathActive("/search", location.pathname)} 
        />
        
        
        <NavItem 
          icon={Heart} 
          label="Activity" 
          to="/notifications" 
          isActive={isPathActive("/notifications", location.pathname)} 
        />
        <NavItem 
          icon={Chat} 
          label="Messages" 
          to="/chat" 
          isActive={isPathActive("/chat", location.pathname)} 
        />
        <NavItem 
          icon={User} 
          label="Profile" 
          to={`/${user?.username}`} 
          isActive={isPathActive(`/${user?.username}`, location.pathname, user?.username)} 
        />
      </VStack>

      {/* Bottom Section: More Menu */}
      <VStack spacing={4} align="center" mt="auto" w="full" px={2}>
        <Menu placement="right-end">
          <MenuButton
            as={Box}
            p={3}
            borderRadius="12px"
            cursor="pointer"
            color={useColorModeValue("gray.400", "gray.600")}
            _hover={{ 
              bg: useColorModeValue("gray.100", "whiteAlpha.100"),
              color: useColorModeValue("black", "white")
            }}
          >
            <Icon as={List} weight="bold" boxSize={7} />
          </MenuButton>
          <MenuList 
            bg={useColorModeValue("white", "#181818")} 
            border="1px solid" 
            borderColor={borderColor}
            boxShadow="0 8px 32px rgba(0,0,0,0.4)"
            borderRadius="16px"
            p={2}
            minW="200px"
          >
            <MenuItem 
              icon={<Gear size={20} weight="bold" />} 
              onClick={() => navigate('/settings')}
              borderRadius="12px"
              py={3}
              _hover={{ 
                bg: useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(255, 255, 255, 0.08)"),
                backdropFilter: "blur(10px)"
              }}
              fontWeight="600"
            >
              Settings
            </MenuItem>
            <MenuItem 
              icon={<SignOut size={20} weight="bold" />} 
              onClick={logout}
              color="red.500"
              borderRadius="12px"
              py={3}
              _hover={{ 
                bg: useColorModeValue("rgba(229, 62, 62, 0.05)", "rgba(229, 62, 62, 0.1)"),
                backdropFilter: "blur(10px)"
              }}
              fontWeight="600"
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </VStack>

    </Box>
  );
};



export default LeftSidebar;
