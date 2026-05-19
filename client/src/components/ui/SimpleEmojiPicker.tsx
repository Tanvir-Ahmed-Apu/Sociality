import { useState, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  Text,
  Grid,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSearch, FiSmile, FiTarget, FiCoffee, FiActivity, FiMapPin, FiBox, FiHeart, FiFlag } from 'react-icons/fi';

interface SimpleEmojiPickerProps {
  onEmojiClick: (emojiData: { emoji: string }, event: React.MouseEvent) => void;
}

const CATEGORY_ICONS: any = {
  'Smileys & People': FiSmile,
  'Animals & Nature': FiTarget,
  'Food & Drink': FiCoffee,
  'Activities': FiActivity,
  'Travel & Places': FiMapPin,
  'Objects': FiBox,
  'Symbols': FiHeart,
  'Flags': FiFlag,
};

import { EMOJI_LIST } from './emoji';

const SimpleEmojiPicker = ({ onEmojiClick }: SimpleEmojiPickerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState('Smileys & People');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Theme colors
  const pickerBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(15,15,15,0.9)");
  const pickerBorder = useColorModeValue("gray.200", "whiteAlpha.100");
  const pickerShadow = useColorModeValue("0 25px 50px rgba(0,0,0,0.1)", "0 25px 50px rgba(0,0,0,0.6)");
  const inputBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const inputFocusBg = useColorModeValue("gray.200", "whiteAlpha.200");
  const textColor = useColorModeValue("black", "white");
  const mutedColor = useColorModeValue("gray.500", "whiteAlpha.400");
  const placeholderColor = useColorModeValue("gray.400", "whiteAlpha.300");
  const hoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const scrollbarThumb = useColorModeValue("rgba(0,0,0,0.1)", "rgba(255,255,255,0.1)");
  const bottomNavBg = useColorModeValue("gray.50", "rgba(0,0,0,0.3)");

  const categories = useMemo(() => {
    const grouped: Record<string, typeof EMOJI_LIST> = {};
    for (const item of EMOJI_LIST) {
      (grouped[item.cat] ??= []).push(item);
    }
    return grouped;
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return { [activeCategory]: categories[activeCategory] ?? [] };
    const q = searchQuery.toLowerCase().trim();
    return { 'Search Results': EMOJI_LIST.filter(e => e.name.includes(q)) };
  }, [searchQuery, activeCategory, categories]);

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    scrollRef.current?.scrollTo(0, 0);
  };

  return (
    <Box
      w="400px" h="550px" bg={pickerBg}
      backdropFilter="blur(25px) saturate(180%)"
      borderRadius="30px" border="1px solid" borderColor={pickerBorder}
      display="flex" flexDirection="column" overflow="hidden"
      boxShadow={pickerShadow}
      animation="pickerPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    >
      <style>{`
        @keyframes pickerPop {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .emoji-scroll::-webkit-scrollbar { width: 5px; }
        .emoji-scroll::-webkit-scrollbar-track { background: transparent; }
        .emoji-scroll::-webkit-scrollbar-thumb { background: ${scrollbarThumb}; border-radius: 10px; }
      `}</style>

      {/* Search */}
      <Box p={4} pb={2}>
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color={mutedColor} />
          </InputLeftElement>
          <Input
            placeholder="Search emojis" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            bg={inputBg} border="none" borderRadius="15px"
            color={textColor} fontSize="sm"
            _placeholder={{ color: placeholderColor }}
            _focus={{ bg: inputFocusBg, boxShadow: "none" }}
          />
        </InputGroup>
      </Box>

      {/* Emoji Grid */}
      <Box flex="1" overflowY="auto" px={4} className="emoji-scroll" ref={scrollRef}>
        <VStack spacing={5} align="stretch" py={2}>
          {Object.entries(filteredData).map(([category, emojis]) => (
            <Box key={category}>
              <Text fontSize="10px" fontWeight="900" color={mutedColor} mb={3}
                textTransform="uppercase" letterSpacing="1.5px">
                {category}
              </Text>
              {emojis.length > 0 ? (
                <Grid templateColumns="repeat(9, 1fr)" gap={1}>
                  {emojis.map((item, i) => (
                    <Button key={`${category}-${i}`} variant="ghost" fontSize="24px"
                      p={0} h="38px" minW="38px" borderRadius="12px" transition="all 0.1s"
                      onClick={e => onEmojiClick({ emoji: item.char }, e)}
                      _hover={{ bg: hoverBg, transform: "scale(1.2)", zIndex: 2 }}
                      _active={{ transform: "scale(0.9)" }}>
                      {item.char}
                    </Button>
                  ))}
                </Grid>
              ) : (
                <Text fontSize="xs" color={placeholderColor} textAlign="center" py={4}>
                  No emojis found
                </Text>
              )}
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Category Navigation */}
      <HStack bg={bottomNavBg} px={2} py={1.5} spacing={1} justify="space-between"
        borderTop="1px solid" borderColor="whiteAlpha.50">
        {Object.keys(categories).map(cat => {
          const CatIcon = CATEGORY_ICONS[cat] || FiSmile;
          return (
            <IconButton key={cat} aria-label={cat} icon={<CatIcon size={16} />}
              variant="ghost" size="sm" borderRadius="full"
              color={activeCategory === cat && !searchQuery ? "#00B374" : mutedColor}
              _hover={{ color: textColor, bg: hoverBg }}
              onClick={() => selectCategory(cat)}
            />
          );
        })}
      </HStack>
    </Box>
  );
};

export default SimpleEmojiPicker;

