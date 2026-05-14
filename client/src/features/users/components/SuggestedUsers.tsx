import { Box, Flex, Skeleton, SkeletonCircle, Text, IconButton, useColorModeValue } from "@chakra-ui/react";
import ContentCard from "../../../components/ui/ContentCard";
import { useEffect, useState } from "react";
import SuggestedUser from "./SuggestedUser";
import useShowToast from "../../../hooks/useShowToast";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { fetchWithSession } from "../../../utils/api";

import { User } from "../../../utils/api";

const SuggestedUsers = () => {
    const [loading, setLoading] = useState(true);
    const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
    const showToast = useShowToast();
    const [sliderRef, setSliderRef] = useState<any>(null);

    // Theme-aware colors - ensuring dark text in light mode for visibility
    const containerBgColor = useColorModeValue("white", "#111111");
    const titleTextColor = useColorModeValue("gray.800", "white");
    const buttonTextColor = useColorModeValue("gray.800", "white");
    const buttonBgColor = useColorModeValue("gray.100", "rgba(30, 30, 30, 0.7)");

    useEffect(() => {
        const getSuggestedUsers = async () => {
            setLoading(true);
            try {
                const res = await fetchWithSession("/api/users/suggested");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setSuggestedUsers(data); // Only set if data is an array
                    } else {
                        showToast("Error", "Invalid data format", "error");
                    }
                } else {
                    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch suggested users' }));
                    showToast("Error", errorData.error || 'Failed to fetch suggested users', "error");
                }
            } catch (error: any) {
                showToast("Error", error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        getSuggestedUsers();
    }, [showToast]);

    // Custom arrow components for the slider with light mode compatibility
    const PrevArrow = (props: any) => {
        const { onClick } = props;
        return (
            <IconButton
                aria-label="Previous slide"
                icon={<ChevronLeftIcon />}
                onClick={onClick}
                position="absolute"
                left="-12px"
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                bg={useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(30, 30, 30, 0.7)")}
                color={useColorModeValue("gray.700", "white")}
                borderWidth="1px"
                borderColor={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.1)")}
                borderRadius="full"
                size="sm"
                boxShadow={useColorModeValue("0 2px 8px rgba(0, 0, 0, 0.1)", "none")}
                _hover={{
                    bg: useColorModeValue("rgba(255, 255, 255, 1)", "rgba(40, 40, 40, 0.8)"),
                    transform: "translateY(-50%) scale(1.1)",
                    borderColor: useColorModeValue("rgba(0, 179, 116, 0.3)", "rgba(255, 255, 255, 0.2)"),
                }}
                transition="all 0.2s ease"
                className="transparent-nav-button"
            />
        );
    };

    const NextArrow = (props: any) => {
        const { onClick } = props;
        return (
            <IconButton
                aria-label="Next slide"
                icon={<ChevronRightIcon />}
                onClick={onClick}
                position="absolute"
                right="-12px"
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                bg={useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(30, 30, 30, 0.7)")}
                color={useColorModeValue("gray.700", "white")}
                borderWidth="1px"
                borderColor={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.1)")}
                borderRadius="full"
                size="sm"
                boxShadow={useColorModeValue("0 2px 8px rgba(0, 0, 0, 0.1)", "none")}
                _hover={{
                    bg: useColorModeValue("rgba(255, 255, 255, 1)", "rgba(40, 40, 40, 0.8)"),
                    transform: "translateY(-50%) scale(1.1)",
                    borderColor: useColorModeValue("rgba(0, 179, 116, 0.3)", "rgba(255, 255, 255, 0.2)"),
                }}
                transition="all 0.2s ease"
                className="transparent-nav-button"
            />
        );
    };

    const settings = {
        dots: false,
        infinite: suggestedUsers.length > 3,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        prevArrow: <PrevArrow />,
        nextArrow: <NextArrow />,
        cssEase: "cubic-bezier(0.4, 0, 0.2, 1)", // Smooth transition
        centerMode: false,
        variableWidth: false,
        swipeToSlide: true, // Allow users to swipe to next slide
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                    infinite: suggestedUsers.length > 3,
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    return (
        <ContentCard
            position="relative"
            py={5}
            px={3}
            mb={6}
            className="transparent-slider-container" // Apply our custom class for the container
        >
            <Text mb={4} fontWeight={"bold"} color={titleTextColor} fontSize="lg" px={2}>
                Suggested Users
            </Text>
            {loading ? (
                <Flex direction={"row"} gap={4} px={2}>
                    {[0, 1, 2].map((_, idx) => (
                        <Flex
                            key={idx}
                            gap={2}
                            alignItems={"center"}
                            p={4}
                            borderRadius={"2xl"}
                            bg={useColorModeValue("white", "#0a0a0a")} // Slightly darker for skeleton background contrast
                            flex="1"
                            flexDirection="column"
                            minH="180px"
                            justifyContent="center"
                            border="none"
                            className="suggested-user-card"
                        >
                            <SkeletonCircle size={"16"} mb={2} />
                            <Skeleton h={"10px"} w={"80px"} mb={2} />
                            <Skeleton h={"10px"} w={"60px"} mb={4} />
                            <Skeleton h={"30px"} w={"100px"} />
                        </Flex>
                    ))}
                </Flex>
            ) : (
                <Box px={2} position="relative" className="transparent-slider-wrapper">
                    <Slider {...settings} ref={(slider: any) => setSliderRef(slider)} className="transparent-slider">
                        {Array.isArray(suggestedUsers) && suggestedUsers.map((user) => (
                            <SuggestedUser key={user._id} user={user} />
                        ))}
                    </Slider>
                </Box>
            )}
            {!loading && Array.isArray(suggestedUsers) && suggestedUsers.length === 0 && (
                <Text color={useColorModeValue("gray.600", "gray.400")} textAlign="center" py={4}>
                    No suggested users available at the moment.
                </Text>
            )}
        </ContentCard>
    );
};

export default SuggestedUsers;
