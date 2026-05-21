import { useColorModeValue } from "@chakra-ui/react";

export const useChatTheme = () => {
    return {
        // Backgrounds
        mainBg: useColorModeValue('gray.50', '#000000'),
        cardBg: useColorModeValue('white', 'rgba(255, 255, 255, 0.02)'),
        bgColor: useColorModeValue('white', '#0A0A0A'),
        glassBg: useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.02)'),
        inputBgColor: useColorModeValue("gray.50", "#121212"),
        chatContainerBg: useColorModeValue("linear(to-b, #F7FAFC 0%, #EDF2F7 100%)", "linear(to-b, #0A0A0A 0%, #000000 100%)"),
        
        // Element Backgrounds
        hoverBg: useColorModeValue('gray.50', '#121212'),
        activeBg: useColorModeValue('gray.100', '#1A1A1A'),
        itemActiveBg: useColorModeValue('whiteAlpha.900', 'whiteAlpha.200'),
        itemHoverBg: useColorModeValue('blackAlpha.50', 'whiteAlpha.50'),
        badgeBg: useColorModeValue('blackAlpha.100', 'whiteAlpha.100'),
        timestampBg: useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(30, 30, 30, 0.7)"),
        segmentedControlBg: useColorModeValue('gray.100', 'rgba(255, 255, 255, 0.03)'),
        primaryLightBg: useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)"),
        
        // Borders and Shadows
        cardBorder: useColorModeValue('gray.200', 'whiteAlpha.100'),
        borderColor: useColorModeValue('gray.100', 'whiteAlpha.100'),
        inputBorderColor: useColorModeValue("gray.200", "whiteAlpha.100"),
        segmentedControlBorder: useColorModeValue('gray.200', 'whiteAlpha.100'),
        shadowColor: useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.4)'),
        
        // Text
        textColor: useColorModeValue('black', 'white'),
        mutedColor: "gray.500", // Constant in both modes
        placeholderColor: "gray.500", // Constant in both modes
        badgeColor: useColorModeValue('blackAlpha.700', 'whiteAlpha.700'),
        
        // Misc
        scrollbarThumb: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255, 255, 255, 0.1)'),
        scrollbarThumbHover: useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255, 255, 255, 0.2)'),
        skeletonStart: useColorModeValue('gray.100', '#1A1A1A'),
        skeletonEnd: useColorModeValue('gray.200', '#111111'),
        chatDotPattern: useColorModeValue("rgba(0,0,0,0.03)", "rgba(255,255,255,0.03)"),
    };
};
