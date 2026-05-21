import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Stack,
    Avatar,
    Box,
    Text,
    IconButton,
    Textarea,
    useColorModeValue,
} from "@chakra-ui/react";
import { Camera, X } from "phosphor-react";
import { useEditProfile } from "../hooks/useEditProfile";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
    const {
        inputs,
        handleInputChange,
        updating,
        profilePicUrl,
        setCoverPicUrl,
        coverPicUrl,
        handleProfilePicChange,
        handleCoverPicChange,
        fileRef,
        coverFileRef,
        handleSubmit,
        user,
    } = useEditProfile({ isOpen, onClose });

    const inputBorderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
    const labelColor = useColorModeValue("gray.500", "gray.600");
    const modalBgColor = useColorModeValue("white", "#111111");
    const textColor = useColorModeValue("black", "white");
    const headerBorderColor = useColorModeValue("gray.100", "whiteAlpha.100");
    const saveButtonBg = useColorModeValue("black", "white");
    const saveButtonColor = useColorModeValue("white", "black");
    const saveButtonHoverBg = useColorModeValue("gray.800", "gray.200");
    const iconColor = useColorModeValue("black", "white");
    const placeholderColor = useColorModeValue("blackAlpha.300", "whiteAlpha.300");

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay backdropFilter="blur(12px)" bg={useColorModeValue("blackAlpha.300", "blackAlpha.700")} />
            <ModalContent bg={modalBgColor} color={textColor} borderRadius="24px" border="1px solid" borderColor={headerBorderColor} maxH="90vh" overflow="hidden">
                <ModalHeader px={4} py={3} borderBottom="1px solid" borderColor={headerBorderColor}>
                    <Flex justify="space-between" align="center">
                        <Flex align="center" gap={4}>
                            <IconButton
                                icon={<X size={20} weight="bold" />}
                                variant="ghost"
                                color={iconColor}
                                onClick={onClose}
                                aria-label="Close"
                                borderRadius="full"
                                _hover={{ bg: useColorModeValue("blackAlpha.50", "whiteAlpha.200") }}
                            />
                            <Text fontWeight="800" fontSize="xl">Edit profile</Text>
                        </Flex>
                        <Button
                            bg={saveButtonBg}
                            color={saveButtonColor}
                            borderRadius="full"
                            px={5}
                            size="sm"
                            fontWeight="800"
                            fontSize="xs"
                            onClick={handleSubmit}
                            isLoading={updating}
                            _hover={{ bg: saveButtonHoverBg }}
                            height="32px"
                        >
                            Save
                        </Button>
                    </Flex>
                </ModalHeader>

                <ModalBody p={0}>
                    <Stack spacing={0}>
                        {/* Cover Photo Section */}
                        <Box
                            w="full"
                            h="180px"
                            bg={(coverPicUrl as string) || user?.coverPic ? `url(${(coverPicUrl as string) || user?.coverPic})` : modalBgColor}
                            bgSize="cover"
                            bgPosition="center"
                            position="relative"
                            overflow="hidden"
                            backgroundColor={modalBgColor}
                        >
                            {/* Base darkening layer for button visibility */}
                            <Box position="absolute" inset={0} bg="blackAlpha.100" zIndex={1} />
                            
                            {/* Left Scrim */}
                            <Box 
                                position="absolute" 
                                top={0} 
                                left={0} 
                                w="25%"
                                bottom={0} 
                                bgGradient={`linear(to-r, ${modalBgColor} 0%, ${modalBgColor} 10%, transparent 100%)`}
                                zIndex={2}
                            />
                            {/* Right Scrim */}
                            <Box 
                                position="absolute" 
                                top={0} 
                                right={0} 
                                w="25%"
                                bottom={0} 
                                bgGradient={`linear(to-l, ${modalBgColor} 0%, ${modalBgColor} 15%, transparent 100%)`}
                                zIndex={2}
                            />
                            {/* Bottom Scrim */}
                            <Box 
                                position="absolute" 
                                top={0} 
                                left={0} 
                                right={0} 
                                bottom={0} 
                                bgGradient={`linear(to-t, ${modalBgColor} 0%, ${modalBgColor} 10%, transparent 40%)`}
                                zIndex={2}
                            />
                            <Flex position="absolute" inset={0} align="center" justify="center" gap={6} zIndex={3}>
                                <IconButton
                                    icon={<Camera size={24} weight="bold" />}
                                    bg="blackAlpha.700"
                                    color="white"
                                    borderRadius="full"
                                    aria-label="Upload cover"
                                    onClick={() => coverFileRef.current?.click()}
                                    _hover={{ bg: "blackAlpha.800" }}
                                    size="lg"
                                />
                                <IconButton
                                    icon={<X size={24} weight="bold" />}
                                    bg="blackAlpha.700"
                                    color="white"
                                    borderRadius="full"
                                    aria-label="Remove cover"
                                    _hover={{ bg: "blackAlpha.800" }}
                                    size="lg"
                                    onClick={() => setCoverPicUrl(null)}
                                />
                            </Flex>
                            <input type="file" hidden ref={coverFileRef} onChange={handleCoverPicChange} accept="image/*" />
                        </Box>

                        {/* Avatar Section */}
                        <Box px={4} position="relative" mt="-40px" zIndex={10}>
                            <Box 
                                position="relative" 
                                display="inline-block"
                                cursor="pointer"
                                onClick={() => fileRef.current?.click()}
                                _hover={{ opacity: 0.9 }}
                                transition="all 0.2s"
                            >
                                <Avatar
                                    size="xl"
                                    src={(profilePicUrl as string) || user?.profilePic}
                                    border="4px solid"
                                    borderColor={modalBgColor}
                                />
                            </Box>
                            <input type="file" hidden ref={fileRef} onChange={handleProfilePicChange} accept="image/*" />
                        </Box>

                        <Stack spacing={4} p={4}>
                            {/* Form Fields */}
                            <FormControl border="1px solid" borderColor={inputBorderColor} px={3} py={2} borderRadius="12px" transition="all 0.2s" _focusWithin={{ borderColor: "brand.primary.500" }}>
                                <FormLabel fontSize="11px" fontWeight="500" color={labelColor} mb={0} textTransform="none">Name</FormLabel>
                                <Input
                                    variant="unstyled"
                                    value={inputs.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    fontSize="15px"
                                    fontWeight="600"
                                    h="32px"
                                />
                            </FormControl>

                            <FormControl border="1px solid" borderColor={inputBorderColor} px={3} py={2} borderRadius="12px" transition="all 0.2s" _focusWithin={{ borderColor: "brand.primary.500" }}>
                                <FormLabel fontSize="11px" fontWeight="500" color={labelColor} mb={0} textTransform="none">Bio</FormLabel>
                                <Textarea
                                    variant="unstyled"
                                    value={inputs.bio}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    fontSize="15px"
                                    rows={2}
                                    minH="54px"
                                    maxH="54px"
                                    resize="none"
                                    pt={2}
                                    css={{
                                        '&::-webkit-scrollbar': { display: 'none' },
                                        msOverflowStyle: 'none',
                                        scrollbarWidth: 'none',
                                    }}
                                />
                            </FormControl>

                            <FormControl border="1px solid" borderColor={inputBorderColor} px={3} py={2} borderRadius="12px" transition="all 0.2s" _focusWithin={{ borderColor: "brand.primary.500" }}>
                                <FormLabel fontSize="11px" fontWeight="500" color={labelColor} mb={0} textTransform="none">Location</FormLabel>
                                <Input
                                    variant="unstyled"
                                    value={inputs.location}
                                    onChange={(e) => handleInputChange("location", e.target.value)}
                                    fontSize="15px"
                                    h="32px"
                                />
                            </FormControl>

                            <FormControl border="1px solid" borderColor={inputBorderColor} px={3} py={2} borderRadius="12px" transition="all 0.2s" _focusWithin={{ borderColor: "brand.primary.500" }}>
                                <FormLabel fontSize="11px" fontWeight="500" color={labelColor} mb={0} textTransform="none">Website</FormLabel>
                                <Input
                                    variant="unstyled"
                                    value={inputs.website}
                                    onChange={(e) => handleInputChange("website", e.target.value)}
                                    fontSize="15px"
                                    placeholder="Add your website"
                                    _placeholder={{ color: placeholderColor }}
                                    h="32px"
                                />
                            </FormControl>
                        </Stack>
                    </Stack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
