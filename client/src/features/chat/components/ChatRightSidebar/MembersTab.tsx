import React from 'react';
import { Box, VStack } from '@chakra-ui/react';
import SectionTitle from './SectionTitle';
import ParticipantItem from './ParticipantItem';

const MembersTab = ({ participants, setShowAllMembers, isAdmin, currentUser, setRemovingParticipant }: any) => {
  return (
    <Box>
      <SectionTitle count={participants.length} onSeeAll={() => setShowAllMembers(true)}>Top Active</SectionTitle>
      <VStack align="stretch" spacing={3}>
        {participants.slice(0, 5).map((p: any) => (
          <ParticipantItem 
            key={`${p.platform}-${p.id}`} 
            participant={p} 
            isAdminView={isAdmin} 
            currentUser={currentUser}
            setRemovingParticipant={setRemovingParticipant}
          />
        ))}
      </VStack>
    </Box>
  );
};

export default MembersTab;
