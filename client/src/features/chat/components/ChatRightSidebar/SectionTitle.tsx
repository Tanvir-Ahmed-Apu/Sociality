import React from 'react';
import { Flex, Heading, Text, HStack, Icon } from '@chakra-ui/react';
import { FiChevronRight } from 'react-icons/fi';

const SectionTitle = ({ children, count, onSeeAll }: any) => (
  <Flex justify="space-between" align="center" mb={3}>
    <Heading size="xs" color="gray.500" textTransform="uppercase" letterSpacing="1px" fontSize="11px">
      {children} {count !== undefined && <Text as="span" ml={1}>({count})</Text>}
    </Heading>
    {onSeeAll && (
      <HStack spacing={1} color="gray.500" cursor="pointer" _hover={{ color: "white" }} onClick={onSeeAll}>
        <Text fontSize="11px" fontWeight="700">See All</Text>
        <Icon as={FiChevronRight} size={12} />
      </HStack>
    )}
  </Flex>
);

export default SectionTitle;
