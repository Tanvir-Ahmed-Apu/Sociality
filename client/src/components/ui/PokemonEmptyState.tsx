import React from 'react';
import { Box, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import './PokemonEmptyState.css';

const PokemonEmptyState = ({ message = "No posts to display. Try following some users or check back later!" }) => {
  const textColor = useColorModeValue("gray.600", "gray.400");
  const bgColor = useColorModeValue("rgba(255, 255, 255, 0.1)", "rgba(30, 30, 30, 0.3)");

  return (
    <VStack spacing={6} py={12} px={4}>
      <Box
        position="relative"
        className="pokemon-container"
      >
        {/* Psyduck SVG - fainted/dead animation */}
        <Box className="pokemon-psyduck">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="psyduck-svg"
          >
            {/* Psyduck body */}
            <ellipse cx="60" cy="80" rx="25" ry="20" fill="#FFD700" className="psyduck-body" />
            
            {/* Psyduck head */}
            <circle cx="60" cy="50" r="22" fill="#FFD700" className="psyduck-head" />
            
            {/* Psyduck bill */}
            <ellipse cx="60" cy="58" rx="8" ry="4" fill="#FF8C00" className="psyduck-bill" />
            
            {/* Psyduck eyes (X marks for fainted) */}
            <g className="psyduck-eyes">
              {/* Left eye X */}
              <path d="M48 45 L52 49 M52 45 L48 49" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              {/* Right eye X */}
              <path d="M68 45 L72 49 M72 45 L68 49" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            </g>
            
            {/* Psyduck crest */}
            <path d="M60 28 Q55 25 50 30 Q60 20 70 30 Q65 25 60 28" fill="#FFD700" className="psyduck-crest" />
            
            {/* Psyduck wings */}
            <ellipse cx="35" cy="70" rx="8" ry="12" fill="#FFD700" className="psyduck-wing-left" />
            <ellipse cx="85" cy="70" rx="8" ry="12" fill="#FFD700" className="psyduck-wing-right" />
            
            {/* Psyduck feet */}
            <ellipse cx="50" cy="95" rx="6" ry="4" fill="#FF8C00" className="psyduck-foot-left" />
            <ellipse cx="70" cy="95" rx="6" ry="4" fill="#FF8C00" className="psyduck-foot-right" />
          </svg>
        </Box>

        {/* Floating stars around Psyduck */}
        <div className="floating-stars">
          <div className="star star-1">⭐</div>
          <div className="star star-2">✨</div>
          <div className="star star-3">💫</div>
          <div className="star star-4">⭐</div>
          <div className="star star-5">✨</div>
        </div>

        {/* Swirl effect */}
        <div className="swirl-effect">
          <div className="swirl swirl-1"></div>
          <div className="swirl swirl-2"></div>
          <div className="swirl swirl-3"></div>
        </div>
      </Box>

      {/* Message */}
      <Box
        bg={bgColor}
        backdropFilter="blur(8px)"
        borderRadius="xl"
        p={6}
        maxW="400px"
        textAlign="center"
        border="1px solid rgba(255, 255, 255, 0.1)"
        className="message-container"
      >
        <Text 
          color={textColor} 
          fontSize="lg" 
          fontWeight="medium"
          className="empty-message"
        >
          {message}
        </Text>
      </Box>
    </VStack>
  );
};

export default PokemonEmptyState;
