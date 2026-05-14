import {
  Box,
  Flex,
  Text,
  Switch,
  useColorModeValue
} from "@chakra-ui/react";
import { Sun, Moon, Laptop } from "phosphor-react";
import useTheme from "../../hooks/useTheme";

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark, setTheme } = useTheme();
  
  // Theme-aware colors
  const bgColor = useColorModeValue("rgba(255, 255, 255, 0.25)", "#1a1a1a");
  const borderColor = useColorModeValue("rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.08)");
  const textColor = useColorModeValue("gray.800", "white");
  const descriptionColor = useColorModeValue("gray.600", "gray.400");
  const iconColor = useColorModeValue("#f6ad55", "#ffd700");
  const glassProps = useColorModeValue({
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
  }, {});

  return (
    <Box
      width="100%"
      p={6}
      borderWidth="1px"
      borderRadius="xl"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow={useColorModeValue("0 4px 12px rgba(0, 0, 0, 0.1)", "0 4px 12px rgba(0, 0, 0, 0.2)")}
      className="threads-post-card glass-message-bubble"
      {...glassProps}
    >
      <Text fontSize="xl" fontWeight="bold" mb={5} color={textColor}>
        Appearance
      </Text>

      <Flex 
        direction="column"
        gap={4}
      >
        <Box>
          <Text fontSize="sm" color={descriptionColor} mb={4}>
            Choose how Sociality looks to you. Select a theme or let your system decide.
          </Text>
        </Box>

        <Flex 
          bg={useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(255, 255, 255, 0.05)")}
          p={1}
          borderRadius="14px"
          gap={1}
        >
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Laptop },
          ].map((mode) => {
            const isActive = theme === mode.id;
            const Icon = mode.icon;
            
            return (
              <Flex
                key={mode.id}
                flex={1}
                align="center"
                justify="center"
                py={2.5}
                px={3}
                borderRadius="11px"
                cursor="pointer"
                onClick={() => setTheme(mode.id as any)}
                bg={isActive ? useColorModeValue("white", "whiteAlpha.200") : "transparent"}
                boxShadow={isActive ? "0 2px 8px rgba(0,0,0,0.1)" : "none"}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                color={isActive ? textColor : descriptionColor}
                _hover={{
                  bg: isActive ? (useColorModeValue("white", "whiteAlpha.200")) : (useColorModeValue("rgba(0,0,0,0.02)", "rgba(255,255,255,0.02)"))
                }}
              >
                <Icon 
                  size={18} 
                  weight={isActive ? "fill" : "bold"} 
                  style={{ marginRight: '8px' }} 
                />
                <Text fontSize="sm" fontWeight={isActive ? "bold" : "600"}>
                  {mode.label}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
};

export default ThemeToggle;
