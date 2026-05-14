import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
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
import { FiSearch, FiClock, FiSmile, FiTarget, FiCoffee, FiActivity, FiMapPin, FiBox, FiHeart, FiFlag } from 'react-icons/fi';

interface SimpleEmojiPickerProps {
  onEmojiClick: (emojiData: { emoji: string }, event: React.MouseEvent) => void;
  onClose: () => void;
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

// Massive emoji data with names for search
const EMOJI_LIST = [
  // Smileys & People
  { char: '😀', name: 'grinning face smiley happy', cat: 'Smileys & People' },
  { char: '😃', name: 'grinning face big eyes smiley happy', cat: 'Smileys & People' },
  { char: '😄', name: 'grinning face squinting eyes smiley happy', cat: 'Smileys & People' },
  { char: '😁', name: 'beaming face smiley happy', cat: 'Smileys & People' },
  { char: '😆', name: 'grinning squinting face smiley happy', cat: 'Smileys & People' },
  { char: '😅', name: 'grinning face sweat smiley happy', cat: 'Smileys & People' },
  { char: '🤣', name: 'rolling on floor laughing rofl smiley happy', cat: 'Smileys & People' },
  { char: '😂', name: 'face tears joy lol smiley happy', cat: 'Smileys & People' },
  { char: '🙂', name: 'slightly smiling face happy', cat: 'Smileys & People' },
  { char: '🙃', name: 'upside down face', cat: 'Smileys & People' },
  { char: '😉', name: 'winking face wink', cat: 'Smileys & People' },
  { char: '😊', name: 'smiling face eyes happy', cat: 'Smileys & People' },
  { char: '😇', name: 'smiling face halo angel', cat: 'Smileys & People' },
  { char: '🥰', name: 'smiling face hearts love', cat: 'Smileys & People' },
  { char: '😍', name: 'smiling face heart eyes love', cat: 'Smileys & People' },
  { char: '🤩', name: 'star struck eyes', cat: 'Smileys & People' },
  { char: '😘', name: 'face blowing kiss love', cat: 'Smileys & People' },
  { char: '😗', name: 'kissing face', cat: 'Smileys & People' },
  { char: '😚', name: 'kissing face closed eyes', cat: 'Smileys & People' },
  { char: '😙', name: 'kissing face smiling eyes', cat: 'Smileys & People' },
  { char: '😋', name: 'face savoring food hungry yum', cat: 'Smileys & People' },
  { char: '😛', name: 'face tongue out', cat: 'Smileys & People' },
  { char: '😜', name: 'winking face tongue out wink', cat: 'Smileys & People' },
  { char: '🤪', name: 'zany face crazy', cat: 'Smileys & People' },
  { char: '😝', name: 'squinting face tongue out', cat: 'Smileys & People' },
  { char: '🤑', name: 'money mouth face rich', cat: 'Smileys & People' },
  { char: '🤗', name: 'hugging face hug', cat: 'Smileys & People' },
  { char: '🤭', name: 'face hand mouth', cat: 'Smileys & People' },
  { char: '🤫', name: 'shushing face quiet', cat: 'Smileys & People' },
  { char: '🤔', name: 'thinking face hmm', cat: 'Smileys & People' },
  { char: '🤐', name: 'zipper mouth face quiet', cat: 'Smileys & People' },
  { char: '🤨', name: 'face raised eyebrow', cat: 'Smileys & People' },
  { char: '😐', name: 'neutral face', cat: 'Smileys & People' },
  { char: '😑', name: 'expressionless face', cat: 'Smileys & People' },
  { char: '😶', name: 'face without mouth', cat: 'Smileys & People' },
  { char: '😏', name: 'smirking face smirk', cat: 'Smileys & People' },
  { char: '😒', name: 'unamused face bored', cat: 'Smileys & People' },
  { char: '🙄', name: 'face rolling eyes', cat: 'Smileys & People' },
  { char: '😬', name: 'grimacing face', cat: 'Smileys & People' },
  { char: '🤥', name: 'lying face pinocchio', cat: 'Smileys & People' },
  { char: '😔', name: 'pensive face sad', cat: 'Smileys & People' },
  { char: '😪', name: 'sleepy face', cat: 'Smileys & People' },
  { char: '🤤', name: 'drooling face', cat: 'Smileys & People' },
  { char: '😴', name: 'sleeping face zzz', cat: 'Smileys & People' },
  { char: '😷', name: 'face medical mask sick', cat: 'Smileys & People' },
  { char: '🤒', name: 'face thermometer sick', cat: 'Smileys & People' },
  { char: '🤕', name: 'face head bandage sick', cat: 'Smileys & People' },
  { char: '🤢', name: 'nauseated face sick puke', cat: 'Smileys & People' },
  { char: '🤮', name: 'face vomiting puke sick', cat: 'Smileys & People' },
  { char: '🤧', name: 'sneezing face sick', cat: 'Smileys & People' },
  { char: '🥵', name: 'hot face red sweat', cat: 'Smileys & People' },
  { char: '🥶', name: 'cold face blue ice', cat: 'Smileys & People' },
  { char: '🥴', name: 'woozy face dizzy', cat: 'Smileys & People' },
  { char: '😵', name: 'dizzy face', cat: 'Smileys & People' },
  { char: '🤯', name: 'exploding head mind blown', cat: 'Smileys & People' },
  { char: '🤠', name: 'cowboy hat face', cat: 'Smileys & People' },
  { char: '🥳', name: 'partying face celebrate', cat: 'Smileys & People' },
  { char: '😎', name: 'smiling face sunglasses cool', cat: 'Smileys & People' },
  { char: '🤓', name: 'nerd face', cat: 'Smileys & People' },
  { char: '🧐', name: 'face monocle', cat: 'Smileys & People' },
  { char: '😕', name: 'confused face', cat: 'Smileys & People' },
  { char: '😟', name: 'worried face', cat: 'Smileys & People' },
  { char: '🙁', name: 'slightly frowning face', cat: 'Smileys & People' },
  { char: '☹️', name: 'frowning face', cat: 'Smileys & People' },
  { char: '😮', name: 'face open mouth', cat: 'Smileys & People' },
  { char: '😯', name: 'hushed face', cat: 'Smileys & People' },
  { char: '😲', name: 'astonished face', cat: 'Smileys & People' },
  { char: '😳', name: 'flushed face', cat: 'Smileys & People' },
  { char: '🥺', name: 'pleading face puppy eyes', cat: 'Smileys & People' },
  { char: '😦', name: 'frowning face open mouth', cat: 'Smileys & People' },
  { char: '😧', name: 'anguished face', cat: 'Smileys & People' },
  { char: '😨', name: 'fearful face', cat: 'Smileys & People' },
  { char: '😰', name: 'face open mouth cold sweat', cat: 'Smileys & People' },
  { char: '😥', name: 'sad relieved face', cat: 'Smileys & People' },
  { char: '😢', name: 'crying face tear', cat: 'Smileys & People' },
  { char: '😭', name: 'loudly crying face', cat: 'Smileys & People' },
  { char: '😱', name: 'face screaming in fear', cat: 'Smileys & People' },
  { char: '😖', name: 'confounded face', cat: 'Smileys & People' },
  { char: '😣', name: 'persevering face', cat: 'Smileys & People' },
  { char: '😞', name: 'disappointed face', cat: 'Smileys & People' },
  { char: '😓', name: 'downcast face sweat', cat: 'Smileys & People' },
  { char: '😩', name: 'weary face', cat: 'Smileys & People' },
  { char: '😫', name: 'tired face', cat: 'Smileys & People' },
  { char: '🥱', name: 'yawning face', cat: 'Smileys & People' },
  { char: '😤', name: 'face steam nose', cat: 'Smileys & People' },
  { char: '😡', name: 'pouting face angry', cat: 'Smileys & People' },
  { char: '😠', name: 'angry face', cat: 'Smileys & People' },
  { char: '🤬', name: 'face symbols mouth angry swearing', cat: 'Smileys & People' },
  { char: '😈', name: 'smiling face horns devil', cat: 'Smileys & People' },
  { char: '👿', name: 'angry face horns devil', cat: 'Smileys & People' },
  { char: '💀', name: 'skull', cat: 'Smileys & People' },
  { char: '☠️', name: 'skull crossbones', cat: 'Smileys & People' },
  { char: '💩', name: 'pile of poo', cat: 'Smileys & People' },
  { char: '🤡', name: 'clown face', cat: 'Smileys & People' },
  { char: '👹', name: 'ogre', cat: 'Smileys & People' },
  { char: '👺', name: 'goblin', cat: 'Smileys & People' },
  { char: '👻', name: 'ghost', cat: 'Smileys & People' },
  { char: '👽', name: 'alien', cat: 'Smileys & People' },
  { char: '👾', name: 'alien monster', cat: 'Smileys & People' },
  { char: '🤖', name: 'robot', cat: 'Smileys & People' },
  { char: '👋', name: 'waving hand wave hi', cat: 'Smileys & People' },
  { char: '🤚', name: 'raised back of hand', cat: 'Smileys & People' },
  { char: '🖐️', name: 'hand splayed', cat: 'Smileys & People' },
  { char: '✋', name: 'raised hand stop', cat: 'Smileys & People' },
  { char: '🖖', name: 'vulcan salute', cat: 'Smileys & People' },
  { char: '👌', name: 'ok hand', cat: 'Smileys & People' },
  { char: '🤌', name: 'pinched fingers italian', cat: 'Smileys & People' },
  { char: '🤏', name: 'pinching hand small', cat: 'Smileys & People' },
  { char: '✌️', name: 'victory hand peace', cat: 'Smileys & People' },
  { char: '🤞', name: 'crossed fingers luck', cat: 'Smileys & People' },
  { char: '🤟', name: 'love you gesture', cat: 'Smileys & People' },
  { char: '🤘', name: 'sign of horns rock', cat: 'Smileys & People' },
  { char: '🤙', name: 'call me hand', cat: 'Smileys & People' },
  { char: '👈', name: 'backhand index pointing left', cat: 'Smileys & People' },
  { char: '👉', name: 'backhand index pointing right', cat: 'Smileys & People' },
  { char: '👆', name: 'backhand index pointing up', cat: 'Smileys & People' },
  { char: '👇', name: 'backhand index pointing down', cat: 'Smileys & People' },
  { char: '☝️', name: 'index pointing up', cat: 'Smileys & People' },
  { char: '👍', name: 'thumbs up like', cat: 'Smileys & People' },
  { char: '👎', name: 'thumbs down dislike', cat: 'Smileys & People' },
  { char: '✊', name: 'raised fist', cat: 'Smileys & People' },
  { char: '👊', name: 'oncoming fist punch', cat: 'Smileys & People' },
  { char: '🤛', name: 'left facing fist', cat: 'Smileys & People' },
  { char: '🤜', name: 'right facing fist', cat: 'Smileys & People' },
  { char: '👏', name: 'clapping hands clap', cat: 'Smileys & People' },
  { char: '🙌', name: 'raised hands celebrate', cat: 'Smileys & People' },
  { char: '👐', name: 'open hands', cat: 'Smileys & People' },
  { char: '🤲', name: 'palms up together', cat: 'Smileys & People' },
  { char: '🤝', name: 'handshake', cat: 'Smileys & People' },
  { char: '🙏', name: 'folded hands pray please thanks', cat: 'Smileys & People' },
  { char: '✍️', name: 'writing hand', cat: 'Smileys & People' },
  { char: '💅', name: 'nail polish', cat: 'Smileys & People' },
  { char: '🤳', name: 'selfie', cat: 'Smileys & People' },
  { char: '💪', name: 'flexed biceps muscle', cat: 'Smileys & People' },
  { char: '🦾', name: 'mechanical arm', cat: 'Smileys & People' },
  { char: '🦿', name: 'mechanical leg', cat: 'Smileys & People' },
  { char: '🦵', name: 'leg', cat: 'Smileys & People' },
  { char: '🦶', name: 'foot', cat: 'Smileys & People' },
  { char: '👂', name: 'ear', cat: 'Smileys & People' },
  { char: '🦻', name: 'ear hearing aid', cat: 'Smileys & People' },
  { char: '👃', name: 'nose', cat: 'Smileys & People' },
  { char: '🧠', name: 'brain', cat: 'Smileys & People' },
  { char: '🦷', name: 'tooth', cat: 'Smileys & People' },
  { char: '🦴', name: 'bone', cat: 'Smileys & People' },
  { char: '👀', name: 'eyes', cat: 'Smileys & People' },
  { char: '👁️', name: 'eye', cat: 'Smileys & People' },
  { char: '👅', name: 'tongue', cat: 'Smileys & People' },
  { char: '👄', name: 'mouth', cat: 'Smileys & People' },
  { char: '👶', name: 'baby', cat: 'Smileys & People' },
  { char: '🧒', name: 'child', cat: 'Smileys & People' },
  { char: '👦', name: 'boy', cat: 'Smileys & People' },
  { char: '👧', name: 'girl', cat: 'Smileys & People' },
  { char: '🧑', name: 'person', cat: 'Smileys & People' },
  { char: '👱', name: 'person blond hair', cat: 'Smileys & People' },
  { char: '👨', name: 'man', cat: 'Smileys & People' },
  { char: '🧔', name: 'person beard', cat: 'Smileys & People' },
  { char: '👩', name: 'woman', cat: 'Smileys & People' },
  { char: '🧓', name: 'older person', cat: 'Smileys & People' },
  { char: '👴', name: 'old man', cat: 'Smileys & People' },
  { char: '👵', name: 'old woman', cat: 'Smileys & People' },
  
  // Animals & Nature
  { char: '🐶', name: 'dog face animal', cat: 'Animals & Nature' },
  { char: '🐱', name: 'cat face animal', cat: 'Animals & Nature' },
  { char: '🐭', name: 'mouse face animal', cat: 'Animals & Nature' },
  { char: '🐹', name: 'hamster face animal', cat: 'Animals & Nature' },
  { char: '🐰', name: 'rabbit face animal', cat: 'Animals & Nature' },
  { char: '🦊', name: 'fox face animal', cat: 'Animals & Nature' },
  { char: '🐻', name: 'bear face animal', cat: 'Animals & Nature' },
  { char: '🐼', name: 'panda face animal', cat: 'Animals & Nature' },
  { char: '🐨', name: 'koala face animal', cat: 'Animals & Nature' },
  { char: '🐯', name: 'tiger face animal', cat: 'Animals & Nature' },
  { char: '🦁', name: 'lion face animal', cat: 'Animals & Nature' },
  { char: '🐮', name: 'cow face animal', cat: 'Animals & Nature' },
  { char: '🐷', name: 'pig face animal', cat: 'Animals & Nature' },
  { char: '🐽', name: 'pig nose animal', cat: 'Animals & Nature' },
  { char: '🐸', name: 'frog face animal', cat: 'Animals & Nature' },
  { char: '🐵', name: 'monkey face animal', cat: 'Animals & Nature' },
  { char: '🙈', name: 'see no evil monkey', cat: 'Animals & Nature' },
  { char: '🙉', name: 'hear no evil monkey', cat: 'Animals & Nature' },
  { char: '🙊', name: 'speak no evil monkey', cat: 'Animals & Nature' },
  { char: '🐒', name: 'monkey animal', cat: 'Animals & Nature' },
  { char: '🦍', name: 'gorilla animal', cat: 'Animals & Nature' },
  { char: '🦧', name: 'orangutan animal', cat: 'Animals & Nature' },
  { char: '🐶', name: 'dog animal', cat: 'Animals & Nature' },
  { char: '🐕', name: 'dog animal', cat: 'Animals & Nature' },
  { char: '🦮', name: 'guide dog animal', cat: 'Animals & Nature' },
  { char: '🐩', name: 'poodle dog animal', cat: 'Animals & Nature' },
  { char: '🐺', name: 'wolf animal', cat: 'Animals & Nature' },
  { char: '🦊', name: 'fox animal', cat: 'Animals & Nature' },
  { char: '🦝', name: 'raccoon animal', cat: 'Animals & Nature' },
  { char: '🐱', name: 'cat animal', cat: 'Animals & Nature' },
  { char: '🐈', name: 'cat animal', cat: 'Animals & Nature' },
  { char: '🦁', name: 'lion animal', cat: 'Animals & Nature' },
  { char: '🐯', name: 'tiger animal', cat: 'Animals & Nature' },
  { char: '🐅', name: 'tiger animal', cat: 'Animals & Nature' },
  { char: '🐆', name: 'leopard animal', cat: 'Animals & Nature' },
  { char: '🐴', name: 'horse face animal', cat: 'Animals & Nature' },
  { char: '🐎', name: 'horse animal', cat: 'Animals & Nature' },
  { char: '🦄', name: 'unicorn animal', cat: 'Animals & Nature' },
  { char: '🦓', name: 'zebra animal', cat: 'Animals & Nature' },
  { char: '🦌', name: 'deer animal', cat: 'Animals & Nature' },
  { char: '🦬', name: 'bison animal', cat: 'Animals & Nature' },
  { char: '🐮', name: 'cow face animal', cat: 'Animals & Nature' },
  { char: '🐂', name: 'ox animal', cat: 'Animals & Nature' },
  { char: '🐃', name: 'water buffalo animal', cat: 'Animals & Nature' },
  { char: '🐄', name: 'cow animal', cat: 'Animals & Nature' },
  { char: '🐷', name: 'pig face animal', cat: 'Animals & Nature' },
  { char: '🐖', name: 'pig animal', cat: 'Animals & Nature' },
  { char: '🐗', name: 'boar animal', cat: 'Animals & Nature' },
  { char: '🐽', name: 'pig nose animal', cat: 'Animals & Nature' },
  { char: '🐏', name: 'ram animal', cat: 'Animals & Nature' },
  { char: '🐑', name: 'ewe sheep animal', cat: 'Animals & Nature' },
  { char: '🐐', name: 'goat animal', cat: 'Animals & Nature' },
  { char: '🐪', name: 'camel animal', cat: 'Animals & Nature' },
  { char: '🐫', name: 'two hump camel animal', cat: 'Animals & Nature' },
  { char: '🦙', name: 'llama animal', cat: 'Animals & Nature' },
  { char: '🦒', name: 'giraffe animal', cat: 'Animals & Nature' },
  { char: '🐘', name: 'elephant animal', cat: 'Animals & Nature' },
  { char: '🦣', name: 'mammoth animal', cat: 'Animals & Nature' },
  { char: '🦏', name: 'rhinoceros animal', cat: 'Animals & Nature' },
  { char: '🦛', name: 'hippopotamus animal', cat: 'Animals & Nature' },
  { char: '🐭', name: 'mouse face animal', cat: 'Animals & Nature' },
  { char: '🐁', name: 'mouse animal', cat: 'Animals & Nature' },
  { char: '🐀', name: 'rat animal', cat: 'Animals & Nature' },
  { char: '🐹', name: 'hamster face animal', cat: 'Animals & Nature' },
  { char: '🐰', name: 'rabbit face animal', cat: 'Animals & Nature' },
  { char: '🐇', name: 'rabbit animal', cat: 'Animals & Nature' },
  { char: '🐿️', name: 'chipmunk animal', cat: 'Animals & Nature' },
  { char: '🦫', name: 'beaver animal', cat: 'Animals & Nature' },
  { char: '🦔', name: 'hedgehog animal', cat: 'Animals & Nature' },
  { char: '🦇', name: 'bat animal', cat: 'Animals & Nature' },
  { char: '🐻', name: 'bear animal', cat: 'Animals & Nature' },
  { char: '🐨', name: 'koala animal', cat: 'Animals & Nature' },
  { char: '🐼', name: 'panda animal', cat: 'Animals & Nature' },
  { char: '🦥', name: 'sloth animal', cat: 'Animals & Nature' },
  { char: '🦦', name: 'otter animal', cat: 'Animals & Nature' },
  { char: '🦨', name: 'skunk animal', cat: 'Animals & Nature' },
  { char: '🦘', name: 'kangaroo animal', cat: 'Animals & Nature' },
  { char: '🦡', name: 'badger animal', cat: 'Animals & Nature' },
  { char: '🐾', name: 'paw prints animal', cat: 'Animals & Nature' },
  { char: '🦃', name: 'turkey animal', cat: 'Animals & Nature' },
  { char: '🐔', name: 'chicken animal', cat: 'Animals & Nature' },
  { char: '🐓', name: 'rooster animal', cat: 'Animals & Nature' },
  { char: '🐣', name: 'hatching chick animal', cat: 'Animals & Nature' },
  { char: '🐤', name: 'baby chick animal', cat: 'Animals & Nature' },
  { char: '🐥', name: 'front facing baby chick animal', cat: 'Animals & Nature' },
  { char: '🐦', name: 'bird animal', cat: 'Animals & Nature' },
  { char: '🐧', name: 'penguin animal', cat: 'Animals & Nature' },
  { char: '🕊️', name: 'dove peace bird animal', cat: 'Animals & Nature' },
  { char: '🦅', name: 'eagle animal', cat: 'Animals & Nature' },
  { char: '🦆', name: 'duck animal', cat: 'Animals & Nature' },
  { char: '🦢', name: 'swan animal', cat: 'Animals & Nature' },
  { char: '🦉', name: 'owl animal', cat: 'Animals & Nature' },
  { char: '🦤', name: 'dodo animal', cat: 'Animals & Nature' },
  { char: '🦩', name: 'flamingo animal', cat: 'Animals & Nature' },
  { char: '🦚', name: 'peacock animal', cat: 'Animals & Nature' },
  { char: '🦜', name: 'parrot animal', cat: 'Animals & Nature' },
  { char: '🐸', name: 'frog animal', cat: 'Animals & Nature' },
  { char: '🐊', name: 'crocodile animal', cat: 'Animals & Nature' },
  { char: '🐢', name: 'turtle animal', cat: 'Animals & Nature' },
  { char: '🦎', name: 'lizard animal', cat: 'Animals & Nature' },
  { char: '🐍', name: 'snake animal', cat: 'Animals & Nature' },
  { char: '🐲', name: 'dragon face animal', cat: 'Animals & Nature' },
  { char: '🐉', name: 'dragon animal', cat: 'Animals & Nature' },
  { char: '🦕', name: 'sauropod dinosaur animal', cat: 'Animals & Nature' },
  { char: '🦖', name: 't-rex dinosaur animal', cat: 'Animals & Nature' },
  { char: '🐳', name: 'spouting whale animal', cat: 'Animals & Nature' },
  { char: '🐋', name: 'whale animal', cat: 'Animals & Nature' },
  { char: '🐬', name: 'dolphin animal', cat: 'Animals & Nature' },
  { char: '🦭', name: 'seal animal', cat: 'Animals & Nature' },
  { char: '🐟', name: 'fish animal', cat: 'Animals & Nature' },
  { char: '🐠', name: 'tropical fish animal', cat: 'Animals & Nature' },
  { char: '🐡', name: 'blowfish animal', cat: 'Animals & Nature' },
  { char: '🦈', name: 'shark animal', cat: 'Animals & Nature' },
  { char: '🐙', name: 'octopus animal', cat: 'Animals & Nature' },
  { char: '🐚', name: 'spiral shell animal', cat: 'Animals & Nature' },
  { char: '🐌', name: 'snail animal', cat: 'Animals & Nature' },
  { char: '🦋', name: 'butterfly animal', cat: 'Animals & Nature' },
  { char: '🐛', name: 'bug animal', cat: 'Animals & Nature' },
  { char: '🐜', name: 'ant animal', cat: 'Animals & Nature' },
  { char: '🐝', name: 'honeybee animal', cat: 'Animals & Nature' },
  { char: '🪲', name: 'beetle animal', cat: 'Animals & Nature' },
  { char: '🐞', name: 'lady beetle animal', cat: 'Animals & Nature' },
  { char: '🦗', name: 'cricket animal', cat: 'Animals & Nature' },
  { char: '🪳', name: 'cockroach animal', cat: 'Animals & Nature' },
  { char: '🕷️', name: 'spider animal', cat: 'Animals & Nature' },
  { char: '🕸️', name: 'spider web animal', cat: 'Animals & Nature' },
  { char: '🦂', name: 'scorpion animal', cat: 'Animals & Nature' },
  { char: '🦟', name: 'mosquito animal', cat: 'Animals & Nature' },
  { char: '🪱', name: 'worm animal', cat: 'Animals & Nature' },
  { char: '🦠', name: 'microbe animal', cat: 'Animals & Nature' },
  { char: '💐', name: 'bouquet flower', cat: 'Animals & Nature' },
  { char: '🌸', name: 'cherry blossom flower', cat: 'Animals & Nature' },
  { char: '💮', name: 'white flower', cat: 'Animals & Nature' },
  { char: '🏵️', name: 'rosette flower', cat: 'Animals & Nature' },
  { char: '🌹', name: 'rose flower', cat: 'Animals & Nature' },
  { char: '🥀', name: 'wilted flower', cat: 'Animals & Nature' },
  { char: '🌺', name: 'hibiscus flower', cat: 'Animals & Nature' },
  { char: '🌻', name: 'sunflower flower', cat: 'Animals & Nature' },
  { char: '🌼', name: 'blossom flower', cat: 'Animals & Nature' },
  { char: '🌷', name: 'tulip flower', cat: 'Animals & Nature' },
  { char: '🌱', name: 'seedling nature', cat: 'Animals & Nature' },
  { char: '🪴', name: 'potted plant nature', cat: 'Animals & Nature' },
  { char: '🌲', name: 'evergreen tree nature', cat: 'Animals & Nature' },
  { char: '🌳', name: 'deciduous tree nature', cat: 'Animals & Nature' },
  { char: '🌴', name: 'palm tree nature', cat: 'Animals & Nature' },
  { char: '🌵', name: 'cactus nature', cat: 'Animals & Nature' },
  { char: '🌾', name: 'sheaf of rice nature', cat: 'Animals & Nature' },
  { char: '🌿', name: 'herb nature', cat: 'Animals & Nature' },
  { char: '☘️', name: 'shamrock nature', cat: 'Animals & Nature' },
  { char: '🍀', name: 'four leaf clover nature lucky', cat: 'Animals & Nature' },
  { char: '🍁', name: 'maple leaf nature', cat: 'Animals & Nature' },
  { char: '🍂', name: 'fallen leaf nature', cat: 'Animals & Nature' },
  { char: '🍃', name: 'leaf fluttering in wind nature', cat: 'Animals & Nature' },
  
  // Food & Drink
  { char: '🍏', name: 'green apple fruit food', cat: 'Food & Drink' },
  { char: '🍎', name: 'red apple fruit food', cat: 'Food & Drink' },
  { char: '🍐', name: 'pear fruit food', cat: 'Food & Drink' },
  { char: '🍊', name: 'tangerine orange fruit food', cat: 'Food & Drink' },
  { char: '🍋', name: 'lemon fruit food', cat: 'Food & Drink' },
  { char: '🍌', name: 'banana fruit food', cat: 'Food & Drink' },
  { char: '🍉', name: 'watermelon fruit food', cat: 'Food & Drink' },
  { char: '🍇', name: 'grapes fruit food', cat: 'Food & Drink' },
  { char: '🍓', name: 'strawberry fruit food', cat: 'Food & Drink' },
  { char: '🫐', name: 'blueberries fruit food', cat: 'Food & Drink' },
  { char: '🍈', name: 'melon fruit food', cat: 'Food & Drink' },
  { char: '🍒', name: 'cherries fruit food', cat: 'Food & Drink' },
  { char: '🍑', name: 'peach fruit food', cat: 'Food & Drink' },
  { char: '🥭', name: 'mango fruit food', cat: 'Food & Drink' },
  { char: '🍍', name: 'pineapple fruit food', cat: 'Food & Drink' },
  { char: '🥥', name: 'coconut fruit food', cat: 'Food & Drink' },
  { char: '🥝', name: 'kiwi fruit food', cat: 'Food & Drink' },
  { char: '🍅', name: 'tomato vegetable food', cat: 'Food & Drink' },
  { char: '🍆', name: 'eggplant vegetable food', cat: 'Food & Drink' },
  { char: '🥑', name: 'avocado vegetable food', cat: 'Food & Drink' },
  { char: '🥦', name: 'broccoli vegetable food', cat: 'Food & Drink' },
  { char: '🥬', name: 'leafy green vegetable food', cat: 'Food & Drink' },
  { char: '🥒', name: 'cucumber vegetable food', cat: 'Food & Drink' },
  { char: '🌶️', name: 'hot pepper vegetable food spicy', cat: 'Food & Drink' },
  { char: '🫑', name: 'bell pepper vegetable food', cat: 'Food & Drink' },
  { char: '🌽', name: 'corn vegetable food', cat: 'Food & Drink' },
  { char: '🥕', name: 'carrot vegetable food', cat: 'Food & Drink' },
  { char: '🧄', name: 'garlic vegetable food', cat: 'Food & Drink' },
  { char: '🧅', name: 'onion vegetable food', cat: 'Food & Drink' },
  { char: '🍄', name: 'mushroom vegetable food', cat: 'Food & Drink' },
  { char: '🥜', name: 'peanuts food', cat: 'Food & Drink' },
  { char: '🌰', name: 'chestnut food', cat: 'Food & Drink' },
  { char: '🍞', name: 'bread food', cat: 'Food & Drink' },
  { char: '🥐', name: 'croissant food', cat: 'Food & Drink' },
  { char: '🥖', name: 'baguette bread food', cat: 'Food & Drink' },
  { char: '🫓', name: 'flatbread food', cat: 'Food & Drink' },
  { char: '🥨', name: 'pretzel food', cat: 'Food & Drink' },
  { char: '🥯', name: 'bagel food', cat: 'Food & Drink' },
  { char: '🥞', name: 'pancakes food', cat: 'Food & Drink' },
  { char: '🧇', name: 'waffle food', cat: 'Food & Drink' },
  { char: '🧀', name: 'cheese wedge food', cat: 'Food & Drink' },
  { char: '🍖', name: 'meat on bone food', cat: 'Food & Drink' },
  { char: '🍗', name: 'poultry leg chicken food', cat: 'Food & Drink' },
  { char: '🥩', name: 'cut of meat food', cat: 'Food & Drink' },
  { char: '🥓', name: 'bacon food', cat: 'Food & Drink' },
  { char: '🍔', name: 'hamburger burger food', cat: 'Food & Drink' },
  { char: '🍟', name: 'french fries food', cat: 'Food & Drink' },
  { char: '🍕', name: 'pizza slice food', cat: 'Food & Drink' },
  { char: '🌭', name: 'hot dog food', cat: 'Food & Drink' },
  { char: '🥪', name: 'sandwich food', cat: 'Food & Drink' },
  { char: '🌮', name: 'taco food', cat: 'Food & Drink' },
  { char: '🌯', name: 'burrito food', cat: 'Food & Drink' },
  { char: '🫔', name: 'tamale food', cat: 'Food & Drink' },
  { char: '🥙', name: 'stuffed flatbread food', cat: 'Food & Drink' },
  { char: '🧆', name: 'falafel food', cat: 'Food & Drink' },
  { char: '🥚', name: 'egg food', cat: 'Food & Drink' },
  { char: '🍳', name: 'cooking egg breakfast food', cat: 'Food & Drink' },
  { char: '🥘', name: 'shallow pan of food', cat: 'Food & Drink' },
  { char: '🍲', name: 'pot of food stew', cat: 'Food & Drink' },
  { char: '🥣', name: 'bowl with spoon food', cat: 'Food & Drink' },
  { char: '🥗', name: 'green salad food', cat: 'Food & Drink' },
  { char: '🍿', name: 'popcorn food', cat: 'Food & Drink' },
  { char: '🧈', name: 'butter food', cat: 'Food & Drink' },
  { char: '🧂', name: 'salt food', cat: 'Food & Drink' },
  { char: '🥫', name: 'canned food', cat: 'Food & Drink' },
  { char: '🍱', name: 'bento box food', cat: 'Food & Drink' },
  { char: '🍘', name: 'rice cracker food', cat: 'Food & Drink' },
  { char: '🍙', name: 'rice ball food', cat: 'Food & Drink' },
  { char: '🍚', name: 'cooked rice food', cat: 'Food & Drink' },
  { char: '🍛', name: 'curry rice food', cat: 'Food & Drink' },
  { char: '🍜', name: 'steaming bowl ramen noodles food', cat: 'Food & Drink' },
  { char: '🍝', name: 'spaghetti food', cat: 'Food & Drink' },
  { char: '🍠', name: 'roasted sweet potato food', cat: 'Food & Drink' },
  { char: '🍢', name: 'oden food', cat: 'Food & Drink' },
  { char: '🍣', name: 'sushi food', cat: 'Food & Drink' },
  { char: '🍤', name: 'fried shrimp food', cat: 'Food & Drink' },
  { char: '🍥', name: 'fish cake with swirl food', cat: 'Food & Drink' },
  { char: '🥮', name: 'moon cake food', cat: 'Food & Drink' },
  { char: '🍡', name: 'dango food', cat: 'Food & Drink' },
  { char: '🥟', name: 'dumpling food', cat: 'Food & Drink' },
  { char: '🥠', name: 'fortune cookie food', cat: 'Food & Drink' },
  { char: '🥡', name: 'takeout box food', cat: 'Food & Drink' },
  { char: '🦀', name: 'crab animal food', cat: 'Food & Drink' },
  { char: '🦞', name: 'lobster animal food', cat: 'Food & Drink' },
  { char: '🦐', name: 'shrimp animal food', cat: 'Food & Drink' },
  { char: '🦑', name: 'squid animal food', cat: 'Food & Drink' },
  { char: '🦪', name: 'oyster animal food', cat: 'Food & Drink' },
  { char: '🍦', name: 'soft serve ice cream food', cat: 'Food & Drink' },
  { char: '🍧', name: 'shaved ice food', cat: 'Food & Drink' },
  { char: '🍨', name: 'ice cream food', cat: 'Food & Drink' },
  { char: '🍩', name: 'doughnut food', cat: 'Food & Drink' },
  { char: '🍪', name: 'cookie food', cat: 'Food & Drink' },
  { char: '🎂', name: 'birthday cake food', cat: 'Food & Drink' },
  { char: '🍰', name: 'shortcake food', cat: 'Food & Drink' },
  { char: '🧁', name: 'cupcake food', cat: 'Food & Drink' },
  { char: '🥧', name: 'pie food', cat: 'Food & Drink' },
  { char: '🍫', name: 'chocolate bar food', cat: 'Food & Drink' },
  { char: '🍬', name: 'candy food', cat: 'Food & Drink' },
  { char: '🍭', name: 'lollipop food', cat: 'Food & Drink' },
  { char: '🍮', name: 'custard food', cat: 'Food & Drink' },
  { char: '🍯', name: 'honey pot food', cat: 'Food & Drink' },
  { char: '🍼', name: 'baby bottle drink', cat: 'Food & Drink' },
  { char: '🥛', name: 'glass of milk drink', cat: 'Food & Drink' },
  { char: '☕', name: 'hot beverage coffee tea drink', cat: 'Food & Drink' },
  { char: '🫖', name: 'teapot drink', cat: 'Food & Drink' },
  { char: '🍵', name: 'teacup without handle drink', cat: 'Food & Drink' },
  { char: '🍶', name: 'sake drink', cat: 'Food & Drink' },
  { char: '🍾', name: 'bottle with popping cork drink alcohol champagne', cat: 'Food & Drink' },
  { char: '🍷', name: 'wine glass drink alcohol', cat: 'Food & Drink' },
  { char: '🍸', name: 'cocktail glass drink alcohol', cat: 'Food & Drink' },
  { char: '🍹', name: 'tropical drink alcohol', cat: 'Food & Drink' },
  { char: '🍺', name: 'beer mug drink alcohol', cat: 'Food & Drink' },
  { char: '🍻', name: 'clinking beer mugs drink alcohol', cat: 'Food & Drink' },
  { char: '🥂', name: 'clinking glasses drink alcohol', cat: 'Food & Drink' },
  { char: '🥃', name: 'tumbler glass drink alcohol', cat: 'Food & Drink' },
  { char: '🥤', name: 'cup with straw drink', cat: 'Food & Drink' },
  { char: '🧋', name: 'bubble tea drink', cat: 'Food & Drink' },
  { char: '🧃', name: 'beverage box drink', cat: 'Food & Drink' },
  { char: '🧉', name: 'mate drink', cat: 'Food & Drink' },
  { char: '🧊', name: 'ice cube', cat: 'Food & Drink' },
  { char: '🥢', name: 'chopsticks', cat: 'Food & Drink' },
  { char: '🍽️', name: 'fork and knife with plate', cat: 'Food & Drink' },
  { char: '🍴', name: 'fork and knife', cat: 'Food & Drink' },
  { char: '🥄', name: 'spoon', cat: 'Food & Drink' },
  { char: '🔪', name: 'kitchen knife', cat: 'Food & Drink' },
  { char: '🏺', name: 'amphora', cat: 'Food & Drink' },
  
  // Activities
  { char: '⚽', name: 'soccer ball sport', cat: 'Activities' },
  { char: '🏀', name: 'basketball sport', cat: 'Activities' },
  { char: '🏈', name: 'american football sport', cat: 'Activities' },
  { char: '⚾', name: 'baseball sport', cat: 'Activities' },
  { char: '🥎', name: 'softball sport', cat: 'Activities' },
  { char: '🎾', name: 'tennis ball sport', cat: 'Activities' },
  { char: '🏐', name: 'volleyball sport', cat: 'Activities' },
  { char: '🏉', name: 'rugby football sport', cat: 'Activities' },
  { char: '🥏', name: 'flying disc sport', cat: 'Activities' },
  { char: '🎱', name: 'pool ball 8 ball sport', cat: 'Activities' },
  { char: '🪀', name: 'yo-yo toy', cat: 'Activities' },
  { char: '🏓', name: 'ping pong table tennis sport', cat: 'Activities' },
  { char: '🏸', name: 'badminton sport', cat: 'Activities' },
  { char: '🏒', name: 'ice hockey sport', cat: 'Activities' },
  { char: '🏑', name: 'field hockey sport', cat: 'Activities' },
  { char: '🥍', name: 'lacrosse sport', cat: 'Activities' },
  { char: '🏏', name: 'cricket bat and ball sport', cat: 'Activities' },
  { char: '🪃', name: 'boomerang', cat: 'Activities' },
  { char: '🥅', name: 'goal net sport', cat: 'Activities' },
  { char: '⛳', name: 'flag in hole golf sport', cat: 'Activities' },
  { char: '🪁', name: 'kite toy', cat: 'Activities' },
  { char: '🏹', name: 'bow and arrow sport', cat: 'Activities' },
  { char: '🤿', name: 'diving mask sport', cat: 'Activities' },
  { char: '🥊', name: 'boxing glove sport', cat: 'Activities' },
  { char: '🥋', name: 'martial arts uniform sport', cat: 'Activities' },
  { char: '🎽', name: 'running shirt sport', cat: 'Activities' },
  { char: '🛹', name: 'skateboard sport', cat: 'Activities' },
  { char: '🛷', name: 'sled sport', cat: 'Activities' },
  { char: '⛸️', name: 'ice skate sport', cat: 'Activities' },
  { char: '🥌', name: 'curling stone sport', cat: 'Activities' },
  { char: '🎿', name: 'skis sport', cat: 'Activities' },
  { char: '⛷️', name: 'skier sport', cat: 'Activities' },
  { char: '🏂', name: 'snowboarder sport', cat: 'Activities' },
  { char: '🪂', name: 'parachute sport', cat: 'Activities' },
  { char: '🏋️', name: 'person lifting weights sport', cat: 'Activities' },
  { char: '🤼', name: 'people wrestling sport', cat: 'Activities' },
  { char: '🤸', name: 'person cartwheeling sport', cat: 'Activities' },
  { char: '⛹️', name: 'person bouncing ball sport', cat: 'Activities' },
  { char: '🤺', name: 'person fencing sport', cat: 'Activities' },
  { char: '🤾', name: 'person playing handball sport', cat: 'Activities' },
  { char: '🏌️', name: 'person golfing sport', cat: 'Activities' },
  { char: '🏇', name: 'horse racing sport', cat: 'Activities' },
  { char: '🧘', name: 'person in lotus position yoga', cat: 'Activities' },
  { char: '🏄', name: 'person surfing sport', cat: 'Activities' },
  { char: '🏊', name: 'person swimming sport', cat: 'Activities' },
  { char: '🤽', name: 'person playing water polo sport', cat: 'Activities' },
  { char: '🚣', name: 'person rowing boat sport', cat: 'Activities' },
  { char: '🧗', name: 'person climbing sport', cat: 'Activities' },
  { char: '🚵', name: 'person mountain biking sport', cat: 'Activities' },
  { char: '🚴', name: 'person biking sport', cat: 'Activities' },
  { char: '🏆', name: 'trophy win', cat: 'Activities' },
  { char: '🥇', name: '1st place medal win', cat: 'Activities' },
  { char: '🥈', name: '2nd place medal win', cat: 'Activities' },
  { char: '🥉', name: '3rd place medal win', cat: 'Activities' },
  { char: '🏅', name: 'sports medal win', cat: 'Activities' },
  { char: '🎖️', name: 'military medal win', cat: 'Activities' },
  { char: '🏵️', name: 'rosette win', cat: 'Activities' },
  { char: '🎗️', name: 'reminder ribbon win', cat: 'Activities' },
  { char: '🎫', name: 'ticket', cat: 'Activities' },
  { char: '🎟️', name: 'admission tickets', cat: 'Activities' },
  { char: '🎭', name: 'performing arts theater', cat: 'Activities' },
  { char: '🎨', name: 'artist palette paint', cat: 'Activities' },
  { char: '🎬', name: 'clapper board movie', cat: 'Activities' },
  { char: '🎤', name: 'microphone sing', cat: 'Activities' },
  { char: '🎧', name: 'headphone music', cat: 'Activities' },
  { char: '🎼', name: 'musical score music', cat: 'Activities' },
  { char: '🎹', name: 'musical keyboard piano music', cat: 'Activities' },
  { char: '🥁', name: 'drum music', cat: 'Activities' },
  { char: '🎷', name: 'saxophone music', cat: 'Activities' },
  { char: '🎺', name: 'trumpet music', cat: 'Activities' },
  { char: '🎸', name: 'guitar music', cat: 'Activities' },
  { char: '🪕', name: 'banjo music', cat: 'Activities' },
  { char: '🎻', name: 'violin music', cat: 'Activities' },
  { char: '🎲', name: 'game die play', cat: 'Activities' },
  { char: '🧩', name: 'puzzle piece play', cat: 'Activities' },
  { char: '♟️', name: 'chess pawn play', cat: 'Activities' },
  { char: '🎯', name: 'direct hit dart sport', cat: 'Activities' },
  { char: '🎳', name: 'bowling sport', cat: 'Activities' },
  { char: '🎮', name: 'video game controller play', cat: 'Activities' },
  { char: '🎰', name: 'slot machine play', cat: 'Activities' },
  
  // Symbols
  { char: '❤️', name: 'red heart love', cat: 'Symbols' },
  { char: '🧡', name: 'orange heart love', cat: 'Symbols' },
  { char: '💛', name: 'yellow heart love', cat: 'Symbols' },
  { char: '💚', name: 'green heart love', cat: 'Symbols' },
  { char: '💙', name: 'blue heart love', cat: 'Symbols' },
  { char: '💜', name: 'purple heart love', cat: 'Symbols' },
  { char: '🖤', name: 'black heart love', cat: 'Symbols' },
  { char: '🤍', name: 'white heart love', cat: 'Symbols' },
  { char: '🤎', name: 'brown heart love', cat: 'Symbols' },
  { char: '💔', name: 'broken heart sad love', cat: 'Symbols' },
  { char: '❣️', name: 'heart exclamation', cat: 'Symbols' },
  { char: '💕', name: 'two hearts love', cat: 'Symbols' },
  { char: '💞', name: 'revolving hearts love', cat: 'Symbols' },
  { char: '💓', name: 'beating heart love', cat: 'Symbols' },
  { char: '💗', name: 'growing heart love', cat: 'Symbols' },
  { char: '💖', name: 'sparkling heart love', cat: 'Symbols' },
  { char: '💘', name: 'heart with arrow love', cat: 'Symbols' },
  { char: '💝', name: 'heart with ribbon love', cat: 'Symbols' },
  { char: '💟', name: 'heart decoration love', cat: 'Symbols' },
  { char: '🔥', name: 'fire flame hot lit', cat: 'Symbols' },
  { char: '✨', name: 'sparkles sparkle shiny', cat: 'Symbols' },
  { char: '⭐', name: 'star gold', cat: 'Symbols' },
  { char: '🌟', name: 'glowing star', cat: 'Symbols' },
  { char: '⚡', name: 'high voltage lightning bolt', cat: 'Symbols' },
  { char: '🌈', name: 'rainbow', cat: 'Symbols' },
  { char: '☁️', name: 'cloud weather', cat: 'Symbols' },
  { char: '☀️', name: 'sun weather hot', cat: 'Symbols' },
  { char: '❄️', name: 'snowflake cold weather', cat: 'Symbols' },
  { char: '🎉', name: 'party popper celebrate', cat: 'Symbols' },
  { char: '🎁', name: 'gift present', cat: 'Symbols' },
  { char: '🎂', name: 'birthday cake', cat: 'Symbols' },
  { char: '🎈', name: 'balloon party', cat: 'Symbols' },
  { char: '🚀', name: 'rocket ship space', cat: 'Symbols' },
  { char: '🛸', name: 'flying saucer ufo space', cat: 'Symbols' },
  { char: '🎵', name: 'musical note music', cat: 'Symbols' },
  { char: '🎶', name: 'musical notes music', cat: 'Symbols' },
  { char: '💹', name: 'chart increasing with yen', cat: 'Symbols' },
  { char: '✅', name: 'check mark button', cat: 'Symbols' },
  { char: '✔️', name: 'check mark', cat: 'Symbols' },
  { char: '❌', name: 'cross mark x', cat: 'Symbols' },
  { char: '❎', name: 'cross mark button', cat: 'Symbols' },
  { char: '➕', name: 'plus sign', cat: 'Symbols' },
  { char: '➖', name: 'minus sign', cat: 'Symbols' },
  { char: '✖️', name: 'multiplication sign', cat: 'Symbols' },
  { char: '➗', name: 'division sign', cat: 'Symbols' },
  { char: '♾️', name: 'infinity', cat: 'Symbols' },
  { char: '❓', name: 'question mark', cat: 'Symbols' },
  { char: '❔', name: 'white question mark', cat: 'Symbols' },
  { char: '❕', name: 'white exclamation mark', cat: 'Symbols' },
  { char: '❗', name: 'exclamation mark', cat: 'Symbols' },
];

const SimpleEmojiPicker = ({ onEmojiClick, onClose }: SimpleEmojiPickerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState('Smileys & People');
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const cats: any = {};
    EMOJI_LIST.forEach(item => {
      if (!cats[item.cat]) cats[item.cat] = [];
      cats[item.cat].push(item);
    });
    return cats;
  }, []);

  const filteredData = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const result: any = { 'Search Results': [] };
      EMOJI_LIST.forEach(item => {
        if (item.name.toLowerCase().includes(query)) {
          result['Search Results'].push(item);
        }
      });
      return result;
    }
    
    const result: any = {};
    result[activeCategory] = categories[activeCategory] || [];
    return result;
  }, [searchQuery, activeCategory, categories]);

  const handleEmojiClick = (emoji: string, event: React.MouseEvent) => {
    onEmojiClick({ emoji }, event);
  };

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const pickerBg = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(15, 15, 15, 0.9)");
  const pickerBorder = useColorModeValue("gray.200", "whiteAlpha.100");
  const pickerShadow = useColorModeValue("0 25px 50px rgba(0,0,0,0.1)", "0 25px 50px rgba(0,0,0,0.6)");
  const inputBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const textColor = useColorModeValue("black", "white");
  const mutedTextColor = useColorModeValue("gray.500", "whiteAlpha.400");
  const placeholderColor = useColorModeValue("gray.400", "whiteAlpha.300");
  const scrollbarThumb = useColorModeValue("rgba(0,0,0,0.1)", "rgba(255,255,255,0.1)");
  const bottomNavBg = useColorModeValue("gray.50", "rgba(0, 0, 0, 0.3)");

  return (
    <Box
      w="400px"
      h="550px"
      bg={pickerBg}
      backdropFilter="blur(25px) saturate(180%)"
      borderRadius="30px"
      border="1px solid"
      borderColor={pickerBorder}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      boxShadow={pickerShadow}
      animation="pickerPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    >
      <style>
        {`
          @keyframes pickerPop {
            from { opacity: 0; transform: translateY(20px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .emoji-scroll::-webkit-scrollbar { width: 5px; }
          .emoji-scroll::-webkit-scrollbar-track { background: transparent; }
          .emoji-scroll::-webkit-scrollbar-thumb { background: ${scrollbarThumb}; border-radius: 10px; }
        `}
      </style>

      {/* Search Bar */}
      <Box p={4} pb={2}>
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color={mutedTextColor} />
          </InputLeftElement>
          <Input
            placeholder="Search emojis"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg={inputBg}
            border="none"
            borderRadius="15px"
            color={textColor}
            fontSize="sm"
            _placeholder={{ color: placeholderColor }}
            _focus={{ bg: useColorModeValue("gray.200", "whiteAlpha.200"), boxShadow: "none" }}
          />
        </InputGroup>
      </Box>

      {/* Emoji Grid */}
      <Box
        flex="1"
        overflowY="auto"
        px={4}
        className="emoji-scroll"
        ref={scrollRef}
        position="relative"
      >
        <VStack spacing={5} align="stretch" py={2}>
          {Object.entries(filteredData).map(([category, emojis]: [string, any]) => (
            <Box key={category}>
              <Text
                fontSize="10px"
                fontWeight="900"
                color={mutedTextColor}
                mb={3}
                textTransform="uppercase"
                letterSpacing="1.5px"
              >
                {category}
              </Text>
              {emojis.length > 0 ? (
                <Grid templateColumns="repeat(9, 1fr)" gap={1}>
                  {emojis.map((item: any, index: number) => (
                    <Button
                      key={`${category}-${index}`}
                      variant="ghost"
                      fontSize="24px"
                      p={0}
                      h="38px"
                      minW="38px"
                      onClick={(e) => handleEmojiClick(item.char, e)}
                      _hover={{
                        bg: useColorModeValue("blackAlpha.50", "whiteAlpha.100"),
                        transform: "scale(1.2)",
                        zIndex: 2
                      }}
                      _active={{ transform: "scale(0.9)" }}
                      transition="all 0.1s"
                      borderRadius="12px"
                    >
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

      {/* Bottom Navigation */}
      <HStack 
        bg="rgba(0, 0, 0, 0.3)" 
        px={2} 
        py={1.5}
        spacing={1} 
        justify="space-between"
        borderTop="1px solid"
        borderColor="whiteAlpha.50"
      >
        {Object.keys(categories).map((category) => {
          const CatIcon = CATEGORY_ICONS[category] || FiSmile;
          return (
            <IconButton
              key={category}
              aria-label={category}
              icon={<CatIcon size={16} />}
              variant="ghost"
              size="sm"
              borderRadius="full"
              color={activeCategory === category && !searchQuery ? "#00B374" : mutedTextColor}
              _hover={{ color: textColor, bg: useColorModeValue("blackAlpha.50", "whiteAlpha.100") }}
              onClick={() => selectCategory(category)}
            />
          );
        })}
      </HStack>
    </Box>
  );
};

export default SimpleEmojiPicker;
