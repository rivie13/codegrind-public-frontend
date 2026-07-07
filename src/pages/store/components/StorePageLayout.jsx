import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import StoreSelect from './StoreSelect';
import { Link as RouterLink } from 'react-router-dom';
import BottomBannerAd from '../../../components/ads/BottomBannerAd';
import TopBannerAd from '../../../components/ads/TopBannerAd';
import PageTemplate from '../../../components/layout/PageTemplate';
import PageSeo from '../../../components/seo/PageSeo';
import adSlots from '../../../config/adSlots';
import {
  CATALOG_SORT_OPTIONS,
  CATALOG_STATUS_FILTER_OPTIONS,
  STORE_SECTIONS,
} from '../storePage.constants';

const retroButtonProps = {
  borderRadius: 0,
  bg: 'var(--cg-window)',
  color: 'var(--cg-text)',
  border: '1px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontWeight: '600',
  letterSpacing: '0.04em',
  _hover: { bg: 'var(--cg-window-face)', borderColor: 'var(--cg-window-shadow)' },
  _active: { bg: 'var(--cg-window-face)', boxShadow: 'var(--cg-window-inset)' },
};

const buildRetroToggleButtonProps = (isActive, accent = 'var(--cg-link)') => ({
  ...retroButtonProps,
  bg: isActive ? 'var(--cg-window-face)' : 'var(--cg-window)',
  color: isActive ? accent : 'var(--cg-text)',
  boxShadow: isActive ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)',
});

const StorePageLayout = ({
  activeSectionId,
  addAllNotOwnedInSectionToCart,
  batchEquipBusy,
  cartItems,
  cartSlugs,
  cartTotal,
  catalogCategories,
  catalogCategoryFilters,
  catalogPrimarySort,
  catalogSecondarySort,
  catalogStatusFilters,
  checkoutBusy,
  checkoutModal,
  effectiveCatalogItems,
  equipBusySlot,
  filteredCatalogItems,
  handleCheckout,
  handleEquipAllInView,
  inventoryItemIds,
  loadStoreData,
  loading,
  removeFromCart,
  renderControlsBySection,
  renderPreviewBySection,
  setActiveSectionId,
  setCartSlugs,
  setCatalogCategoryFilters,
  setCatalogPrimarySort,
  setCatalogSecondarySort,
  setCatalogStatusFilters,
  toggleCatalogFilter,
  walletAfterCheckout,
  walletBalance,
}) => {
  return (
    <PageTemplate>
      <PageSeo
        title="Data Packet Store"
        description="Spend your Data Packets on unlocks and cosmetics."
        path="/store"
        keywords="codegrind store, data packets, coding game unlocks"
      />

      <Box
        width="100%"
        maxWidth="728px"
        mx="auto"
        mt={4}
        mb={6}
        display={{ base: 'none', md: 'block' }}
      >
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>

      <Container maxW="container.xl" py={{ base: 8, md: 14 }} px={{ base: 3, md: 4 }}>
        <VStack align="stretch" spacing={6}>
          <Box className="cg-panel-window" overflow="hidden">
            <HStack className="cg-titlebar" justify="space-between" px={{ base: 3, md: 4 }} py={2}>
              <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                STORE.EXE
              </Text>
              <Text fontSize="10px" opacity={0.85} textTransform="uppercase">
                Authenticated session
              </Text>
            </HStack>
            <Box p={{ base: 5, md: 7 }} bg="rgba(255,255,255,0.14)">
              <HStack
                justify="space-between"
                align={{ base: 'stretch', md: 'center' }}
                flexWrap="wrap"
                spacing={4}
                flexDirection={{ base: 'column', md: 'row' }}
              >
                <Box>
                  <Text
                    color="var(--cg-link)"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="10px"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                  >
                    DATA PACKET STORE
                  </Text>
                  <Text
                    color="var(--cg-text)"
                    fontSize={{ base: '2xl', md: '3xl' }}
                    fontFamily="var(--cg-font-retro-display)"
                    textTransform="uppercase"
                    mt={1}
                  >
                    {Number.isFinite(walletBalance) ? walletBalance : '—'} DP
                  </Text>
                  <Text
                    color="var(--cg-muted)"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="sm"
                    mt={2}
                  >
                    Preview-first store: pick combinations, inspect exact visuals, and check out in
                    one flow.
                  </Text>
                </Box>
                <HStack
                  spacing={3}
                  width={{ base: '100%', md: 'auto' }}
                  flexDirection={{ base: 'column', sm: 'row' }}
                  align={{ base: 'stretch', sm: 'center' }}
                >
                  <Button
                    {...retroButtonProps}
                    color="var(--cg-link)"
                    size="sm"
                    onClick={loadStoreData}
                    w={{ base: '100%', sm: 'auto' }}
                  >
                    Refresh
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/profile"
                    size="sm"
                    {...retroButtonProps}
                    color="var(--cg-accent-green)"
                    w={{ base: '100%', sm: 'auto' }}
                  >
                    Profile
                  </Button>
                  <Button
                    {...retroButtonProps}
                    color="var(--cg-accent-amber)"
                    size="sm"
                    onClick={checkoutModal.onOpen}
                    isDisabled={cartItems.length === 0}
                    w={{ base: '100%', sm: 'auto' }}
                  >
                    Cart ({cartItems.length})
                  </Button>
                </HStack>
              </HStack>
            </Box>
          </Box>

          <Box className="cg-panel-window" overflow="hidden">
            <HStack className="cg-titlebar" justify="space-between" px={{ base: 3, md: 4 }} py={2}>
              <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                PREVIEW.SETUP
              </Text>
              <Text fontSize="10px" opacity={0.85} textTransform="uppercase">
                Retro desktop catalog
              </Text>
            </HStack>
            <Box p={{ base: 5, md: 6 }} bg="rgba(255,255,255,0.14)">
              {loading ? (
                <HStack
                  spacing={3}
                  color="var(--cg-muted)"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  <Spinner size="sm" color="var(--cg-link)" />
                  <Text>Loading store data...</Text>
                </HStack>
              ) : (
                <>
                  <HStack
                    spacing={2}
                    mb={4}
                    flexWrap={{ base: 'nowrap', md: 'wrap' }}
                    overflowX={{ base: 'auto', md: 'visible' }}
                    pb={{ base: 1, md: 0 }}
                    sx={{
                      '&::-webkit-scrollbar': {
                        height: '6px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(103, 232, 249, 0.35)',
                        borderRadius: '999px',
                      },
                    }}
                  >
                    {STORE_SECTIONS.map((section) => (
                      <Button
                        key={section.id}
                        size="sm"
                        {...buildRetroToggleButtonProps(activeSectionId === section.id)}
                        onClick={() => setActiveSectionId(section.id)}
                        flexShrink={0}
                      >
                        {section.label}
                      </Button>
                    ))}
                  </HStack>

                  <Grid
                    templateColumns={{ base: '1fr', xl: '360px minmax(0, 1fr)' }}
                    templateAreas={{
                      base: '"preview" "controls"',
                      xl: '"controls preview"',
                    }}
                    gap={4}
                    alignItems="start"
                  >
                    <Box
                      gridArea="controls"
                      bg="var(--cg-window)"
                      border="1px solid var(--cg-window-shadow)"
                      borderRadius="0"
                      boxShadow="var(--cg-window-outset)"
                      p={4}
                      maxH={{ base: 'none', xl: '920px' }}
                      overflowY={{ base: 'visible', xl: 'auto' }}
                    >
                      <HStack
                        justify="space-between"
                        mb={3}
                        flexDirection={{ base: 'column', sm: 'row' }}
                        align={{ base: 'flex-start', sm: 'center' }}
                        spacing={2}
                      >
                        <Text
                          color="var(--cg-link)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="10px"
                          letterSpacing="0.08em"
                          textTransform="uppercase"
                        >
                          PREVIEW CONTROLS
                        </Text>
                        <Badge
                          bg="var(--cg-window-face)"
                          color="var(--cg-link)"
                          border="1px solid var(--cg-window-shadow)"
                          borderRadius="0"
                        >
                          {STORE_SECTIONS.find((section) => section.id === activeSectionId)?.label}
                        </Badge>
                      </HStack>

                      {renderControlsBySection()}

                      <Divider my={4} borderColor="var(--cg-window-dark)" />

                      <VStack align="stretch" spacing={3}>
                        <Button
                          size="sm"
                          {...retroButtonProps}
                          color="var(--cg-link)"
                          onClick={handleEquipAllInView}
                          isLoading={batchEquipBusy}
                          loadingText="Equipping"
                          isDisabled={Boolean(equipBusySlot)}
                        >
                          Equip All In View
                        </Button>
                        <Button
                          size="sm"
                          {...retroButtonProps}
                          color="var(--cg-link)"
                          onClick={addAllNotOwnedInSectionToCart}
                        >
                          Add All Not-Owned In View
                        </Button>
                        <Button
                          size="sm"
                          {...retroButtonProps}
                          color="var(--cg-accent-green)"
                          onClick={checkoutModal.onOpen}
                          isDisabled={cartItems.length === 0}
                        >
                          Open Checkout ({cartItems.length})
                        </Button>
                      </VStack>
                    </Box>

                    <Box
                      gridArea="preview"
                      bg="var(--cg-window-face)"
                      border="1px solid var(--cg-window-shadow)"
                      borderRadius="0"
                      boxShadow="var(--cg-window-inset)"
                      p={{ base: 2, md: 3 }}
                      minW={0}
                      overflow="hidden"
                    >
                      {renderPreviewBySection()}
                    </Box>
                  </Grid>

                  <Box mt={4}>
                    <Text
                      color="var(--cg-accent-green)"
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="10px"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      mb={3}
                    >
                      Item Catalog
                    </Text>
                    <VStack align="stretch" spacing={3} mb={4}>
                      <Box>
                        <Text
                          color="var(--cg-link)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="10px"
                          letterSpacing="0.08em"
                          textTransform="uppercase"
                          mb={2}
                        >
                          Status Filters
                        </Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {CATALOG_STATUS_FILTER_OPTIONS.map((option) => {
                            const isActive = catalogStatusFilters.includes(option.id);
                            return (
                              <Button
                                key={option.id}
                                size="xs"
                                {...buildRetroToggleButtonProps(isActive)}
                                onClick={() =>
                                  toggleCatalogFilter(setCatalogStatusFilters, option.id)
                                }
                              >
                                {option.label}
                              </Button>
                            );
                          })}
                        </HStack>
                      </Box>

                      <Box>
                        <Text
                          color="var(--cg-link)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="10px"
                          letterSpacing="0.08em"
                          textTransform="uppercase"
                          mb={2}
                        >
                          Category Filters
                        </Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {catalogCategories.map((category) => {
                            const isActive = catalogCategoryFilters.includes(category);
                            return (
                              <Button
                                key={category}
                                size="xs"
                                {...buildRetroToggleButtonProps(isActive, 'var(--cg-accent-green)')}
                                onClick={() =>
                                  toggleCatalogFilter(setCatalogCategoryFilters, category)
                                }
                              >
                                {category}
                              </Button>
                            );
                          })}
                        </HStack>
                      </Box>

                      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                        <Box>
                          <Text
                            color="var(--cg-link)"
                            fontFamily="var(--cg-font-retro-display)"
                            fontSize="10px"
                            letterSpacing="0.08em"
                            textTransform="uppercase"
                            mb={2}
                          >
                            Primary Sort
                          </Text>
                          <StoreSelect
                            value={catalogPrimarySort}
                            onChange={setCatalogPrimarySort}
                            options={CATALOG_SORT_OPTIONS.map((option) => ({
                              value: option.id,
                              label: option.label,
                            }))}
                          />
                        </Box>
                        <Box>
                          <Text
                            color="var(--cg-link)"
                            fontFamily="var(--cg-font-retro-display)"
                            fontSize="10px"
                            letterSpacing="0.08em"
                            textTransform="uppercase"
                            mb={2}
                          >
                            Secondary Sort
                          </Text>
                          <StoreSelect
                            value={catalogSecondarySort}
                            onChange={setCatalogSecondarySort}
                            options={CATALOG_SORT_OPTIONS.map((option) => ({
                              value: option.id,
                              label: option.label,
                            }))}
                          />
                        </Box>
                      </Grid>
                    </VStack>

                    {effectiveCatalogItems.length === 0 ? (
                      <Text color="var(--cg-muted)" fontFamily="var(--cg-font-retro-display)">
                        No items available yet.
                      </Text>
                    ) : filteredCatalogItems.length === 0 ? (
                      <Text color="var(--cg-muted)" fontFamily="var(--cg-font-retro-display)">
                        No catalog items match your active filters.
                      </Text>
                    ) : (
                      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
                        {filteredCatalogItems.map((item) => {
                          const owned = inventoryItemIds.has(item?.id) || Boolean(item?.owned);
                          const price = Number(item?.dynamicPrice ?? item?.priceDataPackets ?? 0);
                          const inCart = cartSlugs.includes(item.slug);
                          const levelLocked = Boolean(item?.lockedByLevel);

                          return (
                            <Box
                              key={item.id}
                              bg="var(--cg-window-face)"
                              border="1px solid var(--cg-window-shadow)"
                              borderRadius="0"
                              boxShadow="var(--cg-window-outset)"
                              p={4}
                            >
                              <HStack
                                justify="space-between"
                                mb={2}
                                align="start"
                                spacing={2}
                                flexWrap="wrap"
                              >
                                <Text
                                  color="var(--cg-text)"
                                  fontWeight="bold"
                                  fontFamily="var(--cg-font-retro-display)"
                                  noOfLines={1}
                                  maxW={{ base: '100%', sm: '70%' }}
                                >
                                  {item.displayName}
                                </Text>
                                {owned ? (
                                  <Badge
                                    bg="var(--cg-window)"
                                    color="var(--cg-accent-green)"
                                    border="1px solid var(--cg-window-shadow)"
                                    borderRadius="0"
                                  >
                                    Owned
                                  </Badge>
                                ) : levelLocked ? (
                                  <Badge
                                    bg="var(--cg-window)"
                                    color="var(--cg-accent-red)"
                                    border="1px solid var(--cg-window-shadow)"
                                    borderRadius="0"
                                  >
                                    Level {item.requiresLevel || 1} Locked
                                  </Badge>
                                ) : (
                                  <Badge
                                    bg="var(--cg-window)"
                                    color="var(--cg-link)"
                                    border="1px solid var(--cg-window-shadow)"
                                    borderRadius="0"
                                  >
                                    {price} DP
                                  </Badge>
                                )}
                              </HStack>

                              <Text
                                color="var(--cg-muted)"
                                fontFamily="var(--cg-font-retro-display)"
                                fontSize="sm"
                                mb={2}
                                noOfLines={1}
                              >
                                {item.slug}
                              </Text>
                              <Text
                                color="var(--cg-text)"
                                fontFamily="var(--cg-font-retro-display)"
                                fontSize="sm"
                                mb={3}
                              >
                                Category: {item.category || 'misc'} • Requires Level{' '}
                                {item.requiresLevel || 1}
                              </Text>

                              {levelLocked && (
                                <Text
                                  color="var(--cg-accent-red)"
                                  fontFamily="var(--cg-font-retro-display)"
                                  fontSize="xs"
                                  mb={3}
                                >
                                  Locked by level. Reach level {item.requiresLevel || 1} to
                                  purchase.
                                </Text>
                              )}

                              <HStack
                                spacing={2}
                                flexDirection={{ base: 'column', sm: 'row' }}
                                align={{ base: 'stretch', sm: 'center' }}
                              >
                                <Button
                                  size="xs"
                                  {...retroButtonProps}
                                  color="var(--cg-link)"
                                  onClick={() =>
                                    setCartSlugs((prev) => {
                                      if (levelLocked || prev.includes(item.slug)) return prev;
                                      return [...prev, item.slug];
                                    })
                                  }
                                  isDisabled={owned || inCart || levelLocked}
                                  w={{ base: '100%', sm: 'auto' }}
                                >
                                  {levelLocked
                                    ? 'Level Locked'
                                    : inCart
                                      ? 'In Cart'
                                      : 'Add To Cart'}
                                </Button>
                                {inCart && (
                                  <Button
                                    size="xs"
                                    {...retroButtonProps}
                                    color="var(--cg-accent-red)"
                                    onClick={() => removeFromCart(item.slug)}
                                    w={{ base: '100%', sm: 'auto' }}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </HStack>
                            </Box>
                          );
                        })}
                      </SimpleGrid>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </VStack>
      </Container>

      <Modal
        isOpen={checkoutModal.isOpen}
        onClose={checkoutModal.onClose}
        size={{ base: 'full', md: 'lg' }}
        isCentered
      >
        <ModalOverlay bg="rgba(2, 6, 20, 0.76)" />
        <ModalContent
          className="cg-panel-window"
          bg="var(--cg-window-face)"
          border="2px solid var(--cg-window-shadow)"
          borderRadius="0"
          boxShadow="var(--cg-window-outset), 18px 18px 0 rgba(0, 0, 0, 0.24)"
        >
          <ModalHeader
            className="cg-titlebar"
            color="var(--cg-text)"
            fontFamily="var(--cg-font-retro-display)"
          >
            Checkout
          </ModalHeader>
          <ModalCloseButton color="var(--cg-text)" />
          <ModalBody>
            {cartItems.length === 0 ? (
              <Text color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
                Your cart is empty.
              </Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {cartItems.map((item) => {
                  const price = Number(item.dynamicPrice ?? item.priceDataPackets ?? 0);
                  return (
                    <HStack
                      key={item.slug}
                      justify="space-between"
                      align={{ base: 'flex-start', sm: 'center' }}
                      flexDirection={{ base: 'column', sm: 'row' }}
                      spacing={{ base: 2, sm: 3 }}
                      bg="var(--cg-window)"
                      border="1px solid var(--cg-window-shadow)"
                      borderRadius="0"
                      boxShadow="var(--cg-window-outset)"
                      p={3}
                    >
                      <VStack align="start" spacing={0}>
                        <Text
                          color="var(--cg-text)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="sm"
                        >
                          {item.displayName}
                        </Text>
                        <Text
                          color="var(--cg-muted)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="xs"
                        >
                          {item.slug}
                        </Text>
                      </VStack>
                      <HStack
                        width={{ base: '100%', sm: 'auto' }}
                        justify={{ base: 'space-between', sm: 'flex-end' }}
                      >
                        <Badge
                          bg="var(--cg-window-face)"
                          color="var(--cg-link)"
                          border="1px solid var(--cg-window-shadow)"
                          borderRadius="0"
                        >
                          {price} DP
                        </Badge>
                        <Button
                          size="xs"
                          {...retroButtonProps}
                          color="var(--cg-accent-red)"
                          onClick={() => removeFromCart(item.slug)}
                        >
                          Remove
                        </Button>
                      </HStack>
                    </HStack>
                  );
                })}

                <Divider borderColor="var(--cg-window-dark)" />

                <VStack
                  align="stretch"
                  spacing={1}
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="sm"
                >
                  <HStack justify="space-between">
                    <Text color="var(--cg-muted)">Current Balance</Text>
                    <Text color="var(--cg-text)">
                      {Number.isFinite(walletBalance) ? `${walletBalance} DP` : 'Unknown'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="var(--cg-muted)">Total Cost</Text>
                    <Text color="var(--cg-link)">{cartTotal} DP</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="var(--cg-muted)">Balance After</Text>
                    <Text
                      color={
                        walletAfterCheckout !== null && walletAfterCheckout < 0
                          ? 'var(--cg-accent-red)'
                          : 'var(--cg-accent-green)'
                      }
                    >
                      {walletAfterCheckout !== null ? `${walletAfterCheckout} DP` : 'Unknown'}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--cg-window-dark)" bg="rgba(255,255,255,0.08)">
            <HStack width="100%" flexDirection={{ base: 'column-reverse', sm: 'row' }} spacing={3}>
              <Button
                {...retroButtonProps}
                onClick={checkoutModal.onClose}
                w={{ base: '100%', sm: 'auto' }}
              >
                Cancel
              </Button>
              <Button
                {...retroButtonProps}
                color="var(--cg-link)"
                onClick={handleCheckout}
                isLoading={checkoutBusy}
                loadingText="Purchasing"
                isDisabled={
                  cartItems.length === 0 ||
                  (Number.isFinite(walletAfterCheckout) && walletAfterCheckout < 0)
                }
                w={{ base: '100%', sm: 'auto' }}
              >
                Buy Now
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Box
        width="100%"
        maxWidth="728px"
        mx="auto"
        mt={6}
        mb={10}
        pb={12}
        display={{ base: 'none', md: 'block' }}
      >
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
};

export default StorePageLayout;
