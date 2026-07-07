import { Box, Button, Stack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

// Memoized action buttons component
const ActionButtons = React.memo(({ user, onShowAuth }) => {
  const MotionBox = motion(Box);

  return (
    <Stack
      spacing={{ base: 4, md: 6 }}
      direction={{ base: 'column', md: 'row' }}
      align="center"
      justify="center"
      width="100%"
    >
      <MotionBox
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.3, type: 'spring', bounce: 0.3 }}
        mb={{ base: 4, md: 0 }}
        width={{ base: '100%', md: 'auto' }}
        maxW={{ base: '360px', md: 'none' }}
        display="flex"
        justifyContent="center"
      >
        {user ? (
          <Link to="/profile" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Button
              size="lg"
              bg="transparent"
              color="#00ffff"
              border="1px solid #00ffff"
              borderRadius="sm"
              fontSize={{ base: 'sm', md: 'md' }}
              px={{ base: 6, md: 8 }}
              py={{ base: 5, md: 6 }}
              width={{ base: '100%', md: 'auto' }}
              boxShadow="0 0 10px rgba(0, 255, 255, 0.3)"
              _hover={{
                bg: 'rgba(0, 255, 255, 0.1)',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)',
                transform: 'translateY(-2px)',
              }}
              transition="all 0.2s ease"
              fontFamily="monospace"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: '5px',
                left: '5px',
                width: '8px',
                height: '8px',
                borderTop: '1px solid #00ffff',
                borderLeft: '1px solid #00ffff',
              }}
              _after={{
                content: '""',
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                borderBottom: '1px solid #00ffff',
                borderRight: '1px solid #00ffff',
              }}
            >
              MY PROFILE
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            bg="transparent"
            color="#00ffff"
            border="1px solid #00ffff"
            borderRadius="sm"
            fontSize={{ base: 'sm', md: 'md' }}
            px={{ base: 6, md: 8 }}
            py={{ base: 5, md: 6 }}
            width={{ base: '100%', md: 'auto' }}
            boxShadow="0 0 10px rgba(0, 255, 255, 0.3)"
            _hover={{
              bg: 'rgba(0, 255, 255, 0.1)',
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)',
              transform: 'translateY(-2px)',
            }}
            transition="all 0.2s ease"
            onClick={onShowAuth}
            fontFamily="monospace"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: '5px',
              left: '5px',
              width: '8px',
              height: '8px',
              borderTop: '1px solid #00ffff',
              borderLeft: '1px solid #00ffff',
            }}
            _after={{
              content: '""',
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              width: '8px',
              height: '8px',
              borderBottom: '1px solid #00ffff',
              borderRight: '1px solid #00ffff',
            }}
          >
            SIGN UP / LOGIN
          </Button>
        )}
      </MotionBox>

      <MotionBox
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.7, type: 'spring', bounce: 0.3 }}
        width={{ base: '100%', md: 'auto' }}
        maxW={{ base: '360px', md: 'none' }}
        display="flex"
        justifyContent="center"
      >
        <Link to="/learning" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Button
            size="lg"
            bg="linear-gradient(135deg, #00FF8C, #00FFFF)"
            color="black"
            borderRadius="sm"
            fontSize={{ base: 'sm', md: 'md' }}
            px={{ base: 6, md: 8 }}
            py={{ base: 5, md: 6 }}
            width={{ base: '100%', md: 'auto' }}
            boxShadow="0 0 18px rgba(0, 255, 255, 0.45)"
            _hover={{
              boxShadow: '0 0 24px rgba(0, 255, 255, 0.65)',
              transform: 'translateY(-2px)',
            }}
            transition="all 0.2s ease"
            fontFamily="monospace"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: '5px',
              left: '5px',
              width: '8px',
              height: '8px',
              borderTop: '1px solid rgba(0, 0, 0, 0.6)',
              borderLeft: '1px solid rgba(0, 0, 0, 0.6)',
            }}
            _after={{
              content: '""',
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              width: '8px',
              height: '8px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.6)',
              borderRight: '1px solid rgba(0, 0, 0, 0.6)',
            }}
          >
            LEARNING PATH DEMO
          </Button>
        </Link>
      </MotionBox>

      <MotionBox
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2.1, type: 'spring', bounce: 0.3 }}
        width={{ base: '100%', md: 'auto' }}
        display="flex"
        justifyContent="center"
      >
        <Link to="/about" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Button
            size="lg"
            bg="transparent"
            color="#ff00de"
            border="1px solid #ff00de"
            borderRadius="sm"
            fontSize={{ base: 'sm', md: 'md' }}
            px={{ base: 6, md: 8 }}
            py={{ base: 5, md: 6 }}
            width={{ base: '80%', md: 'auto' }}
            boxShadow="0 0 10px rgba(255, 0, 222, 0.3)"
            _hover={{
              bg: 'rgba(255, 0, 222, 0.1)',
              boxShadow: '0 0 15px rgba(255, 0, 222, 0.5)',
              transform: 'translateY(-2px)',
            }}
            transition="all 0.2s ease"
            fontFamily="monospace"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: '5px',
              left: '5px',
              width: '8px',
              height: '8px',
              borderTop: '1px solid #ff00de',
              borderLeft: '1px solid #ff00de',
            }}
            _after={{
              content: '""',
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              width: '8px',
              height: '8px',
              borderBottom: '1px solid #ff00de',
              borderRight: '1px solid #ff00de',
            }}
          >
            ABOUT
          </Button>
        </Link>
      </MotionBox>
    </Stack>
  );
});

export default ActionButtons;
