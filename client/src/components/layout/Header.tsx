import { Box, Flex, Image, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <Flex justifyContent="center" align="center" py={4}>
      {/* Logo — cross-fades icon1 → icon2 on hover */}
      <Box
        position="relative"
        w="44px"
        h="44px"
        cursor="pointer"
        onClick={() => navigate("/")}
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
          alt="Sociality logo"
          w="44px"
          h="44px"
          src="/icon1.svg"
          position="absolute"
          top={0}
          left={0}
          filter={useColorModeValue("none", "invert(1)")}
        />
        <Image
          className="logo-icon2"
          alt="Sociality logo hover"
          w="44px"
          h="44px"
          src="/icon2.svg"
          position="absolute"
          top={0}
          left={0}
        />
      </Box>
    </Flex>
  );
};

export default Header;

