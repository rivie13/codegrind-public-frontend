import { Badge, Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import StoreSelect from './components/StoreSelect';
import useStorePageController from './hooks/useStorePageController';
import StorePageLayout from './components/StorePageLayout';
import StoreControlsBySection from './components/StoreControlsBySection';
import StorePreviewBySection from './components/StorePreviewBySection';
import { buildModeLabel, getPackById } from './storePage.constants';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import {
  canLockScreenOrientation,
  releaseScreenOrientation,
  requestScreenOrientation,
} from '../../utils/mobile/screenOrientation';

const detectLandscapeViewport = () => {
  if (typeof window === 'undefined') return true;

  const orientationType = window.screen?.orientation?.type;
  if (typeof orientationType === 'string') {
    if (orientationType.includes('landscape')) return true;
    if (orientationType.includes('portrait')) return false;
  }

  return window.innerWidth >= window.innerHeight;
};

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

const retroInsetBoxProps = {
  bg: 'var(--cg-window-face)',
  border: '1px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-inset)',
  borderRadius: 0,
};

const StorePage = () => {
  const isMobileDevice = useIsMobileDevice();
  const [isLandscapeViewport, setIsLandscapeViewport] = useState(() => detectLandscapeViewport());
  const {
    activeSectionId,
    addAllNotOwnedInSectionToCart,
    addPackToCart,
    backgroundId,
    backgroundPack,
    batchEquipBusy,
    buildQuickslotSummary,
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
    clearQuickslot,
    damageTextPack,
    damageTextPackId,
    deathFxPack,
    deathFxPackId,
    effectiveCatalogItems,
    editorSurface,
    editorThemeOverrides,
    effectId,
    effectPack,
    enemyPack,
    enemyPackId,
    equipBusySlot,
    filteredCatalogItems,
    fontId,
    gameCanvasRef,
    getPackOwnership,
    getSelectablePacks,
    getSelectionEquipState,
    handleCheckout,
    handleDeployableAddToMap,
    handleEquipAllInView,
    handleEquipSelection,
    handleSpecialToggle,
    inventoryItemIds,
    isSpecialActive,
    lightningInternalMode,
    lightningLinkMode,
    loadQuickslot,
    loadStoreData,
    loading,
    monacoOptions,
    pathGradientMode,
    previewEditorRef,
    profileBackgroundPack,
    profileBackgroundPackId,
    profileBadgePack,
    profileBadgePackId,
    profileCallingCardPack,
    profileCardPackId,
    quickslots,
    removeFromCart,
    resolvedPathGradientMode,
    resolvedTdAttackFxMode,
    resetTdCosmeticDefaults,
    resetTdGameplayDefaults,
    saveQuickslot,
    setActiveSectionId,
    setBackgroundId,
    setCartSlugs,
    setCatalogCategoryFilters,
    setCatalogPrimarySort,
    setCatalogSecondarySort,
    setCatalogStatusFilters,
    setDamageTextPackId,
    setDeathFxPackId,
    setEditorSurface,
    setEffectId,
    setEnemyPackId,
    setFontId,
    setLightningInternalMode,
    setLightningLinkMode,
    setMountedAt,
    setPathGradientMode,
    setProfileBackgroundPackId,
    setProfileBadgePackId,
    setProfileCardPackId,
    setTdAttackFxMode,
    setTdBackgroundPackId,
    setTdDeployablePackId,
    setTdDeployableSolo,
    setTdMapPackId,
    setTdPreviewKind,
    setTdSpecialSolo,
    setTdSpecialUpgradePackId,
    setTdTowerUnlockPackId,
    setThemeId,
    setTowerPackId,
    tdAttackFxMode,
    tdBackgroundPackId,
    tdBoardTheme,
    tdDeployableInfo,
    tdDeployablePack,
    tdDeployablePackId,
    tdDeployableSolo,
    tdGameplayAvailableTowerTypes,
    tdGameplayDemoMode,
    tdGeneratedMap,
    tdMapPackId,
    tdPreviewKind,
    tdSpecialInfo,
    tdSpecialSolo,
    tdSpecialUpgradePack,
    tdSpecialUpgradePackId,
    tdTowerUnlockPackId,
    themeId,
    themePack,
    toggleCatalogFilter,
    towerPack,
    towerPackId,
    walletAfterCheckout,
    walletBalance,
  } = useStorePageController();
  const canAutoLockOrientation = canLockScreenOrientation();
  const showPortraitGuard = isMobileDevice && !isLandscapeViewport;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateOrientation = () => {
      setIsLandscapeViewport(detectLandscapeViewport());
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  useEffect(() => {
    if (!showPortraitGuard) return;
    void requestScreenOrientation('landscape');
  }, [showPortraitGuard]);

  useEffect(
    () => () => {
      void releaseScreenOrientation();
    },
    []
  );
  const renderQuickslots = (sectionId) => {
    const slots = quickslots?.[sectionId] ?? [];

    return (
      <Box {...retroInsetBoxProps} p={3}>
        <Text
          color="var(--cg-link)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="10px"
          letterSpacing="0.08em"
          textTransform="uppercase"
          mb={2}
        >
          QUICKSLOTS
        </Text>
        <Text
          color="var(--cg-muted)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="xs"
          mb={3}
        >
          Save this section's current preview combo, then load it later and use Equip All In View.
        </Text>
        <VStack align="stretch" spacing={2}>
          {slots.map((slot, index) => (
            <Box
              key={`${sectionId}-quickslot-${index}`}
              bg="var(--cg-window)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
              boxShadow="var(--cg-window-outset)"
              p={3}
            >
              <HStack
                justify="space-between"
                align={{ base: 'stretch', sm: 'start' }}
                spacing={3}
                flexDirection={{ base: 'column', sm: 'row' }}
              >
                <Box minW={0}>
                  <Text
                    color="var(--cg-text)"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="sm"
                  >
                    Slot {index + 1}
                  </Text>
                  <Text
                    color="var(--cg-muted)"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="xs"
                    noOfLines={2}
                  >
                    {buildQuickslotSummary(sectionId, slot)}
                  </Text>
                </Box>
                <HStack
                  spacing={2}
                  flexWrap="wrap"
                  justify="flex-end"
                  width={{ base: '100%', sm: 'auto' }}
                  flexDirection={{ base: 'column', sm: 'row' }}
                  align={{ base: 'stretch', sm: 'center' }}
                >
                  <Button
                    size="xs"
                    {...retroButtonProps}
                    color="var(--cg-link)"
                    onClick={() => loadQuickslot(sectionId, index)}
                    isDisabled={!slot}
                    w={{ base: '100%', sm: 'auto' }}
                  >
                    Load
                  </Button>
                  <Button
                    size="xs"
                    {...retroButtonProps}
                    color="var(--cg-link)"
                    onClick={() => saveQuickslot(sectionId, index)}
                    w={{ base: '100%', sm: 'auto' }}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    {...retroButtonProps}
                    color="var(--cg-accent-red)"
                    onClick={() => clearQuickslot(sectionId, index)}
                    isDisabled={!slot}
                    w={{ base: '100%', sm: 'auto' }}
                  >
                    Clear
                  </Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    );
  };

  const renderPackSelector = (label, packs, value, onChange, slotOverride = null) => {
    const selectablePacks = getSelectablePacks(packs);
    const hasSelectablePacks = selectablePacks.length > 0;
    const selectedPack = hasSelectablePacks ? getPackById(selectablePacks, value) : packs[0];
    const selectedState = getSelectionEquipState({
      pack: selectedPack,
      packs,
      slotOverride,
    });
    const selectedStatus = selectedState.status;
    const resolvedSlot = selectedState.resolvedSlot;
    const isEquipped = selectedState.isEquipped;
    const selectedRequiresLevel =
      selectedStatus.storeItem?.requiresLevel ?? selectedPack?.requiresLevel ?? 1;

    return (
      <Box key={`${label}-${value}`} {...retroInsetBoxProps} p={3}>
        <Text
          color="var(--cg-muted)"
          fontSize="10px"
          fontFamily="var(--cg-font-retro-display)"
          textTransform="uppercase"
          letterSpacing="0.08em"
          mb={2}
        >
          {label}
        </Text>
        <StoreSelect
          value={hasSelectablePacks ? selectedPack.id : ''}
          onChange={onChange}
          mb={2}
          isDisabled={!hasSelectablePacks}
          options={
            !hasSelectablePacks
              ? [{ value: '', label: 'No unlocked items available' }]
              : selectablePacks.map((pack) => {
                  const status = getPackOwnership(pack);
                  return {
                    value: pack.id,
                    label: buildModeLabel({
                      pack,
                      owned: status.owned,
                      free: status.free,
                      unavailable: status.unavailable,
                      price: status.price,
                      lockedByLevel: status.lockedByLevel,
                      requiresLevel: status.storeItem?.requiresLevel ?? pack?.requiresLevel,
                    }),
                  };
                })
          }
        />

        <HStack
          justify="space-between"
          align={{ base: 'stretch', sm: 'center' }}
          flexDirection={{ base: 'column', sm: 'row' }}
          spacing={{ base: 2, sm: 3 }}
        >
          {selectedStatus.free ? (
            <Badge
              bg="var(--cg-window)"
              color="var(--cg-accent-green)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
            >
              {selectedPack?.defaultUnlocked ? 'Default Unlocked' : 'Free'}
            </Badge>
          ) : selectedStatus.unavailable ? (
            <Badge
              bg="var(--cg-window)"
              color="var(--cg-muted)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
            >
              Catalog Sync Needed
            </Badge>
          ) : selectedStatus.owned ? (
            <Badge
              bg="var(--cg-window)"
              color="var(--cg-accent-green)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
            >
              Owned
            </Badge>
          ) : selectedStatus.lockedByLevel ? (
            <Badge
              bg="var(--cg-window)"
              color="var(--cg-accent-red)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
            >
              Level {selectedRequiresLevel} Locked
            </Badge>
          ) : (
            <Badge
              bg="var(--cg-window)"
              color="var(--cg-link)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
            >
              {selectedStatus.price} DP
            </Badge>
          )}

          <HStack
            spacing={2}
            width={{ base: '100%', sm: 'auto' }}
            flexDirection={{ base: 'column', sm: 'row' }}
            align={{ base: 'stretch', sm: 'center' }}
          >
            <Button
              size="xs"
              {...retroButtonProps}
              color="var(--cg-link)"
              onClick={() => addPackToCart(selectedPack)}
              isDisabled={
                !hasSelectablePacks ||
                selectedStatus.free ||
                selectedStatus.unavailable ||
                selectedStatus.owned ||
                selectedStatus.lockedByLevel ||
                !selectedStatus.storeItem
              }
              w={{ base: '100%', sm: 'auto' }}
            >
              Add To Cart
            </Button>
            <Button
              size="xs"
              {...retroButtonProps}
              bg={isEquipped ? 'var(--cg-panel-shell)' : 'var(--cg-window)'}
              color={isEquipped ? 'var(--cg-accent-green)' : 'var(--cg-link)'}
              boxShadow={isEquipped ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)'}
              onClick={() =>
                handleEquipSelection({
                  pack: selectedPack,
                  packs,
                  slotOverride,
                })
              }
              isLoading={equipBusySlot === resolvedSlot}
              isDisabled={
                batchEquipBusy ||
                !hasSelectablePacks ||
                !resolvedSlot ||
                selectedStatus.unavailable ||
                (!selectedStatus.owned &&
                  !(selectedPack?.defaultUnlocked && !selectedPack?.storeSlug))
              }
              w={{ base: '100%', sm: 'auto' }}
            >
              {isEquipped ? 'Equipped' : 'Equip'}
            </Button>
          </HStack>
        </HStack>

        {selectedStatus.lockedByLevel && (
          <Text
            mt={2}
            color="var(--cg-accent-red)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
          >
            Reach level {selectedRequiresLevel} to buy or equip this pack. You can still preview it
            here.
          </Text>
        )}

        {selectedStatus.unavailable && (
          <Text
            mt={2}
            color="var(--cg-muted)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
          >
            This retro pack exists in the local art catalog, but the store item has not been synced
            into the active catalog yet.
          </Text>
        )}
      </Box>
    );
  };

  const renderPreviewBySection = () => (
    <StorePreviewBySection
      activeSectionId={activeSectionId}
      backgroundPack={backgroundPack}
      damageTextPack={damageTextPack}
      deathFxPack={deathFxPack}
      editorSurface={editorSurface}
      editorThemeOverrides={editorThemeOverrides}
      effectPack={effectPack}
      enemyPack={enemyPack}
      gameCanvasRef={gameCanvasRef}
      lightningInternalMode={lightningInternalMode}
      monacoOptions={monacoOptions}
      pathGradientMode={resolvedPathGradientMode}
      previewEditorRef={previewEditorRef}
      profileBackgroundPack={profileBackgroundPack}
      profileBadgePack={profileBadgePack}
      profileCallingCardPack={profileCallingCardPack}
      setEditorSurface={setEditorSurface}
      tdAttackFxMode={resolvedTdAttackFxMode}
      tdBoardTheme={tdBoardTheme}
      tdGameplayAvailableTowerTypes={tdGameplayAvailableTowerTypes}
      tdGameplayDemoMode={tdGameplayDemoMode}
      tdGeneratedMap={tdGeneratedMap}
      tdPreviewKind={tdPreviewKind}
      themePack={themePack}
      towerPack={towerPack}
    />
  );
  const renderControlsBySection = () => (
    <StoreControlsBySection
      activeSectionId={activeSectionId}
      addPackToCart={addPackToCart}
      backgroundId={backgroundId}
      damageTextPackId={damageTextPackId}
      deathFxPackId={deathFxPackId}
      effectId={effectId}
      enemyPackId={enemyPackId}
      fontId={fontId}
      getPackOwnership={getPackOwnership}
      getSelectablePacks={getSelectablePacks}
      handleDeployableAddToMap={handleDeployableAddToMap}
      handleSpecialToggle={handleSpecialToggle}
      isSpecialActive={isSpecialActive}
      lightningInternalMode={lightningInternalMode}
      lightningLinkMode={lightningLinkMode}
      pathGradientMode={pathGradientMode}
      profileBackgroundPackId={profileBackgroundPackId}
      profileBadgePackId={profileBadgePackId}
      profileCardPackId={profileCardPackId}
      renderPackSelector={renderPackSelector}
      renderQuickslots={renderQuickslots}
      resetTdCosmeticDefaults={resetTdCosmeticDefaults}
      resetTdGameplayDefaults={resetTdGameplayDefaults}
      setBackgroundId={setBackgroundId}
      setDamageTextPackId={setDamageTextPackId}
      setDeathFxPackId={setDeathFxPackId}
      setEffectId={setEffectId}
      setEnemyPackId={setEnemyPackId}
      setFontId={setFontId}
      setLightningInternalMode={setLightningInternalMode}
      setLightningLinkMode={setLightningLinkMode}
      setMountedAt={setMountedAt}
      setPathGradientMode={setPathGradientMode}
      setProfileBackgroundPackId={setProfileBackgroundPackId}
      setProfileBadgePackId={setProfileBadgePackId}
      setProfileCardPackId={setProfileCardPackId}
      setTdAttackFxMode={setTdAttackFxMode}
      setTdBackgroundPackId={setTdBackgroundPackId}
      setTdDeployablePackId={setTdDeployablePackId}
      setTdDeployableSolo={setTdDeployableSolo}
      setTdMapPackId={setTdMapPackId}
      setTdPreviewKind={setTdPreviewKind}
      setTdSpecialSolo={setTdSpecialSolo}
      setTdSpecialUpgradePackId={setTdSpecialUpgradePackId}
      setTdTowerUnlockPackId={setTdTowerUnlockPackId}
      setThemeId={setThemeId}
      setTowerPackId={setTowerPackId}
      tdAttackFxMode={tdAttackFxMode}
      tdBackgroundPackId={tdBackgroundPackId}
      tdDeployableInfo={tdDeployableInfo}
      tdDeployablePack={tdDeployablePack}
      tdDeployablePackId={tdDeployablePackId}
      tdDeployableSolo={tdDeployableSolo}
      tdMapPackId={tdMapPackId}
      tdPreviewKind={tdPreviewKind}
      tdSpecialInfo={tdSpecialInfo}
      tdSpecialSolo={tdSpecialSolo}
      tdSpecialUpgradePack={tdSpecialUpgradePack}
      tdSpecialUpgradePackId={tdSpecialUpgradePackId}
      tdTowerUnlockPackId={tdTowerUnlockPackId}
      themeId={themeId}
      towerPack={towerPack}
      towerPackId={towerPackId}
    />
  );

  if (showPortraitGuard) {
    return (
      <Box px={{ base: 4, md: 6 }} py={{ base: 8, md: 10 }}>
        <Box className="cg-panel-window" maxW="container.md" mx="auto" overflow="hidden">
          <HStack className="cg-titlebar" justify="space-between" px={{ base: 3, md: 4 }} py={2}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
              STORE.ORIENTATION.GUARD
            </Text>
            <Text fontSize="10px" opacity={0.85} textTransform="uppercase">
              Mobile landscape required
            </Text>
          </HStack>
          <VStack
            spacing={5}
            align="stretch"
            p={{ base: 5, md: 7 }}
            bg="rgba(255,255,255,0.14)"
            minH="calc(100dvh - 140px)"
            justify="center"
          >
            <Badge
              alignSelf="flex-start"
              bg="var(--cg-window)"
              color="var(--cg-link)"
              border="1px solid var(--cg-window-shadow)"
              borderRadius="0"
              px={3}
              py={1}
            >
              Store Requires Landscape
            </Badge>
            <Text
              color="var(--cg-text)"
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="700"
              fontFamily="var(--cg-font-retro-display)"
              textTransform="uppercase"
            >
              Rotate your phone to landscape to open the Data Packet Store.
            </Text>
            <Text color="var(--cg-text)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.8">
              The store preview, controls, and cart are locked to landscape on mobile so the layout
              stays usable.
            </Text>
            <Text color="var(--cg-muted)" fontSize={{ base: 'sm', md: 'md' }} lineHeight="1.8">
              {canAutoLockOrientation
                ? 'CodeGrind asked your browser to switch to landscape automatically. If it stayed in portrait, rotate manually or disable rotation lock on your device.'
                : 'This browser does not allow orientation lock here, so rotate your device manually to continue.'}
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              <Button
                {...retroButtonProps}
                color="var(--cg-link)"
                onClick={() => void requestScreenOrientation('landscape')}
              >
                Try Landscape Again
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <StorePageLayout
      activeSectionId={activeSectionId}
      addAllNotOwnedInSectionToCart={addAllNotOwnedInSectionToCart}
      batchEquipBusy={batchEquipBusy}
      cartItems={cartItems}
      cartSlugs={cartSlugs}
      cartTotal={cartTotal}
      catalogCategories={catalogCategories}
      catalogCategoryFilters={catalogCategoryFilters}
      catalogPrimarySort={catalogPrimarySort}
      catalogSecondarySort={catalogSecondarySort}
      catalogStatusFilters={catalogStatusFilters}
      checkoutBusy={checkoutBusy}
      checkoutModal={checkoutModal}
      effectiveCatalogItems={effectiveCatalogItems}
      equipBusySlot={equipBusySlot}
      filteredCatalogItems={filteredCatalogItems}
      handleCheckout={handleCheckout}
      handleEquipAllInView={handleEquipAllInView}
      inventoryItemIds={inventoryItemIds}
      loadStoreData={loadStoreData}
      loading={loading}
      removeFromCart={removeFromCart}
      renderControlsBySection={renderControlsBySection}
      renderPreviewBySection={renderPreviewBySection}
      setActiveSectionId={setActiveSectionId}
      setCartSlugs={setCartSlugs}
      setCatalogCategoryFilters={setCatalogCategoryFilters}
      setCatalogPrimarySort={setCatalogPrimarySort}
      setCatalogSecondarySort={setCatalogSecondarySort}
      setCatalogStatusFilters={setCatalogStatusFilters}
      toggleCatalogFilter={toggleCatalogFilter}
      walletAfterCheckout={walletAfterCheckout}
      walletBalance={walletBalance}
    />
  );
};

export default StorePage;
