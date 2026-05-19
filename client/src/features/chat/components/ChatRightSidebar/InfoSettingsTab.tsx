import React from 'react';
import { VStack, Box, HStack, Text, Button, SimpleGrid, Icon, Image, useColorModeValue } from '@chakra-ui/react';
import { FiFileText, FiTrash2 } from 'react-icons/fi';
import SectionTitle from './SectionTitle';
import { PLATFORMS } from './constants';

const InfoSettingsTab = ({
  user, details, isFederated, isAdmin, summary, media, files, starredMessages, copyToClipboard, setShowDeleteAlert
}: any) => {
  return (
    <>
      {isFederated && (
        <VStack align="stretch" spacing={4}>
          <Box bg={useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.08)")} p={5} borderRadius="24px" border="1px solid" borderColor={useColorModeValue("brand.primary.100", "rgba(0, 179, 116, 0.2)")}>
            <SectionTitle>Room Code</SectionTitle>
            <HStack justify="space-between">
              <Text fontWeight="800" fontSize="xl" color={useColorModeValue("black", "white")} letterSpacing="3px" fontFamily="monospace">
                {details?.roomCode || user.roomCode || "••••••••"}
              </Text>
              <Button size="sm" variant="solid" bg="brand.primary.500" color="white" onClick={() => copyToClipboard(details?.roomCode || user.roomCode, "Room Code")} borderRadius="12px" fontSize="xs" fontWeight="800" px={4} _hover={{ bg: "brand.primary.600" }}>
                COPY
              </Button>
            </HStack>
          </Box>
          <Box bg={useColorModeValue("gray.50", "black")} p={5} borderRadius="24px" border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.50")}>
            <SectionTitle>Connected Platforms</SectionTitle>
            <SimpleGrid columns={1} spacing={3}>
              {['sociality', 'telegram', 'discord'].map(p => {
                if (!summary?.[p]) return null;
                const plat = PLATFORMS[p];
                return (
                  <HStack key={p} spacing={4} p={3} borderRadius="18px" bg={useColorModeValue("white", "whiteAlpha.50")} border="1px solid" borderColor={useColorModeValue("gray.100", "transparent")}>
                    <Box bg={`${plat.color}15`} p={2} borderRadius="12px"><Icon as={plat.icon} color={plat.color} size="20px" /></Box>
                    <VStack align="start" spacing={0}><Text fontSize="sm" fontWeight="800" color={useColorModeValue("black", "white")}>{plat.label}</Text><Text fontSize="xs" color="gray.500">{summary[p]} participants</Text></VStack>
                  </HStack>
                );
              })}
            </SimpleGrid>
          </Box>
        </VStack>
      )}

      {/* Assets (Media, Files, Starred) - Always visible */}
      <VStack align="stretch" spacing={4}>
        <Box bg={useColorModeValue("gray.50", "black")} p={4} borderRadius="22px" border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.50")}>
          <SectionTitle count={media.length}>Media</SectionTitle>
          {media.length > 0 ? (
            <SimpleGrid columns={3} spacing={3}>
              {media.slice(0, 3).map((m: any, i: number) => (
                <Image key={m._id || i} src={m.img} borderRadius="14px" h="70px" w="full" objectFit="cover" cursor="pointer" />
              ))}
            </SimpleGrid>
          ) : <Text fontSize="xs" color="gray.600">No media shared yet</Text>}
        </Box>

        <Box bg={useColorModeValue("gray.50", "black")} p={4} borderRadius="22px" border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.50")}>
          <SectionTitle count={files.length}>Files</SectionTitle>
          <VStack align="stretch" spacing={3}>
            {files.slice(0, 2).map((f: any) => (
              <HStack key={f._id} spacing={3} p={2} borderRadius="12px" bg={useColorModeValue("white", "whiteAlpha.100")}>
                <Icon as={FiFileText} color="brand.primary.500" size={14} /><Text fontSize="xs" fontWeight="700" color={useColorModeValue("black", "white")} noOfLines={1}>{f.fileName}</Text>
              </HStack>
            ))}
            {files.length === 0 && <Text fontSize="xs" color="gray.600">No files shared yet</Text>}
          </VStack>
        </Box>

        {starredMessages.length > 0 && (
          <Box bg={useColorModeValue("gray.50", "black")} p={4} borderRadius="22px" border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.50")}>
            <SectionTitle count={starredMessages.length}>Starred Messages</SectionTitle>
            <VStack align="stretch" spacing={3}>
              {starredMessages.slice(0, 2).map((m: any) => (
                <Box key={m._id} p={3} borderRadius="12px" bg={useColorModeValue("white", "whiteAlpha.50")} border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                  <Text fontSize="xs" color={useColorModeValue("gray.800", "whiteAlpha.800")} noOfLines={2}>"{m.text}"</Text>
                  <Text fontSize="10px" color="gray.500" mt={1}>{m.sender?.username}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>

      {isFederated && isAdmin && (
        <Button
          leftIcon={<FiTrash2 size={16} />} variant="ghost" colorScheme="red" color="red.400" size="md" justifyContent="flex-start" _hover={{ bgGradient: useColorModeValue("linear(to-b, gray.50 0%, white 100%)", "linear(to-b, #0A0A0A 0%, #000000 100%)") }}
          onClick={() => setShowDeleteAlert(true)} fontWeight="800" fontSize="sm" textTransform="uppercase" borderRadius="18px" py={6}
        >
          Delete Group permanently
        </Button>
      )}
    </>
  );
};

export default InfoSettingsTab;
