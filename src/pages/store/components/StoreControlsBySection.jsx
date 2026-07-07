import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import StoreSelect from './StoreSelect';
import {
  EDITOR_BACKGROUND_PACKS,
  EDITOR_EFFECT_PACKS,
  EDITOR_THEME_PACKS,
  ENEMY_PACKS,
  OPEN_SOURCE_FONT_PACKS,
  PROFILE_BACKGROUND_PACKS,
  PROFILE_BADGE_PACKS,
  PROFILE_CALLING_CARD_PACKS,
  TD_DAMAGE_TEXT_PACKS,
  TD_DEPLOYABLE_PACKS,
  TD_DEATH_FX_PACKS,
  TD_SPECIAL_UPGRADE_PACKS,
  TD_TOWER_UNLOCK_PACKS,
} from '../../../data/cosmetics/quickCosmeticPacks';
import {
  DEPLOYABLE_PREVIEW_POSITIONS,
  TD_PREVIEW_KIND,
  getDeployableKeyFromPack,
} from '../tdGameplayPreview.utils';
import {
  EDITOR_BACKGROUND_PACK_OPTIONS,
  EDITOR_EFFECT_PACK_OPTIONS,
  EDITOR_FONT_PACK_OPTIONS,
  EDITOR_THEME_PACK_OPTIONS,
  LIGHTNING_INTERNAL_MODES,
  LIGHTNING_LINK_MODES,
  TD_ATTACK_FX_PACKS,
  TD_BACKGROUND_PACK_OPTIONS,
  TD_MAP_PACK_OPTIONS,
  TD_PATH_GRADIENT_PACKS,
  TD_PREVIEW_KIND_OPTIONS,
  TD_TOWER_PACK_OPTIONS,
  buildModeLabel,
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

const buildRetroChoiceButtonProps = (isActive, accent = 'var(--cg-link)') => ({
  ...retroButtonProps,
  bg: isActive ? 'var(--cg-window-face)' : 'var(--cg-window)',
  color: isActive ? accent : 'var(--cg-text)',
  boxShadow: isActive ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)',
});

const retroInsetBoxProps = {
  bg: 'var(--cg-window-face)',
  border: '1px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-inset)',
  borderRadius: 0,
  p: 3,
};

const retroSectionLabelProps = {
  color: 'var(--cg-muted)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const StoreControlsBySection = ({
  activeSectionId,
  addPackToCart,
  backgroundId,
  damageTextPackId,
  deathFxPackId,
  effectId,
  enemyPackId,
  fontId,
  getPackOwnership,
  getSelectablePacks,
  handleDeployableAddToMap,
  handleSpecialToggle,
  isSpecialActive,
  lightningInternalMode,
  lightningLinkMode,
  pathGradientMode,
  profileBackgroundPackId,
  profileBadgePackId,
  profileCardPackId,
  renderPackSelector,
  renderQuickslots,
  resetTdCosmeticDefaults,
  resetTdGameplayDefaults,
  setBackgroundId,
  setDamageTextPackId,
  setDeathFxPackId,
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
  tdDeployableInfo,
  tdDeployablePack,
  tdDeployablePackId,
  tdDeployableSolo,
  tdMapPackId,
  tdPreviewKind,
  tdSpecialInfo,
  tdSpecialSolo,
  tdSpecialUpgradePack,
  tdSpecialUpgradePackId,
  tdTowerUnlockPackId,
  themeId,
  towerPack,
  towerPackId,
}) => {
  if (activeSectionId === 'editor') {
    return (
      <VStack align="stretch" spacing={4}>
        {renderQuickslots('editor')}
        {renderPackSelector('Font Colors', EDITOR_THEME_PACK_OPTIONS, themeId, setThemeId)}
        {renderPackSelector('Font Pack', EDITOR_FONT_PACK_OPTIONS, fontId, setFontId)}
        {renderPackSelector(
          'Background',
          EDITOR_BACKGROUND_PACK_OPTIONS,
          backgroundId,
          setBackgroundId
        )}
        {renderPackSelector('Effects', EDITOR_EFFECT_PACK_OPTIONS, effectId, setEffectId)}
      </VStack>
    );
  }

  if (activeSectionId === 'td') {
    return (
      <VStack align="stretch" spacing={4}>
        {renderQuickslots('td')}
        <HStack spacing={2} flexWrap="wrap">
          {TD_PREVIEW_KIND_OPTIONS.map((option) => (
            <Button
              key={option.id}
              size="xs"
              {...buildRetroChoiceButtonProps(tdPreviewKind === option.id)}
              onClick={() => setTdPreviewKind(option.id)}
            >
              {option.name}
            </Button>
          ))}
        </HStack>

        <HStack spacing={2} flexWrap="wrap">
          <Button
            size="xs"
            {...retroButtonProps}
            color="var(--cg-accent-amber)"
            onClick={resetTdCosmeticDefaults}
          >
            Default Cosmetic View
          </Button>
          <Button
            size="xs"
            {...retroButtonProps}
            color="var(--cg-link)"
            onClick={resetTdGameplayDefaults}
          >
            Default Gameplay View
          </Button>
        </HStack>

        {tdPreviewKind === TD_PREVIEW_KIND.COSMETIC ? (
          <>
            {renderPackSelector(
              'TD Map Pack',
              TD_MAP_PACK_OPTIONS,
              tdMapPackId,
              setTdMapPackId,
              'td.mapPack'
            )}
            {renderPackSelector(
              'Background Pack',
              TD_BACKGROUND_PACK_OPTIONS,
              tdBackgroundPackId,
              setTdBackgroundPackId,
              'td.backgroundPack'
            )}
            {renderPackSelector(
              'Tower Pack',
              TD_TOWER_PACK_OPTIONS,
              towerPackId,
              setTowerPackId,
              'td.towerPack'
            )}
            {renderPackSelector('Enemy Scheme', ENEMY_PACKS, enemyPackId, setEnemyPackId)}
            {renderPackSelector(
              'Damage Text',
              TD_DAMAGE_TEXT_PACKS,
              damageTextPackId,
              setDamageTextPackId
            )}
            {renderPackSelector('Death FX', TD_DEATH_FX_PACKS, deathFxPackId, setDeathFxPackId)}

            {renderPackSelector(
              'Path Gradient',
              TD_PATH_GRADIENT_PACKS,
              pathGradientMode,
              setPathGradientMode,
              'td.pathGradient'
            )}

            {renderPackSelector(
              'TD Attack FX',
              TD_ATTACK_FX_PACKS,
              tdAttackFxMode,
              setTdAttackFxMode,
              'td.attackFx'
            )}

            {towerPack?.id === 'lightning-core' && (
              <>
                <Box>
                  <Text {...retroSectionLabelProps} mb={2}>
                    Inside Lightning
                  </Text>
                  <StoreSelect
                    value={lightningInternalMode}
                    onChange={setLightningInternalMode}
                    options={LIGHTNING_INTERNAL_MODES.map((mode) => ({
                      value: mode.id,
                      label: mode.name,
                    }))}
                  />
                </Box>
                <Box>
                  <Text {...retroSectionLabelProps} mb={2}>
                    Tower Link Beam
                  </Text>
                  <StoreSelect
                    value={lightningLinkMode}
                    onChange={setLightningLinkMode}
                    options={LIGHTNING_LINK_MODES.map((mode) => ({
                      value: mode.id,
                      label: mode.name,
                    }))}
                  />
                </Box>
              </>
            )}
          </>
        ) : (
          <>
            {renderPackSelector(
              'Tower Unlock',
              TD_TOWER_UNLOCK_PACKS,
              tdTowerUnlockPackId,
              setTdTowerUnlockPackId
            )}

            <Accordion allowToggle>
              {/* ── Tower Special Upgrades ── */}
              <AccordionItem
                border="1px solid var(--cg-window-shadow)"
                borderRadius="0"
                boxShadow="var(--cg-window-outset)"
                bg="var(--cg-window)"
                mb={2}
              >
                <h3>
                  <AccordionButton
                    py={2}
                    px={3}
                    borderRadius="0"
                    _hover={{ bg: 'var(--cg-window-face)' }}
                  >
                    <Box flex="1" textAlign="left">
                      <Text {...retroSectionLabelProps} color="var(--cg-link)">
                        TOWER SPECIAL UPGRADES
                      </Text>
                    </Box>
                    <AccordionIcon color="var(--cg-link)" />
                  </AccordionButton>
                </h3>
                <AccordionPanel px={3} pb={3}>
                  <VStack align="stretch" spacing={3}>
                    <StoreSelect
                      value={tdSpecialUpgradePackId}
                      onChange={setTdSpecialUpgradePackId}
                      size="sm"
                      options={getSelectablePacks(TD_SPECIAL_UPGRADE_PACKS).map((pack) => {
                        const st = getPackOwnership(pack);
                        return {
                          value: pack.id,
                          label: buildModeLabel({
                            pack,
                            owned: st.owned,
                            free: st.free,
                            unavailable: st.unavailable,
                            price: st.price,
                          }),
                        };
                      })}
                    />

                    {tdSpecialInfo ? (
                      <Box {...retroInsetBoxProps}>
                        <Text
                          color="var(--cg-text)"
                          fontSize="sm"
                          fontFamily="var(--cg-font-retro-display)"
                          mb={1}
                        >
                          {tdSpecialInfo.towerName} • Tier {tdSpecialInfo.tier} •{' '}
                          {tdSpecialInfo.name}
                        </Text>
                        <Text
                          color="var(--cg-link)"
                          fontSize="xs"
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {tdSpecialInfo.effectText}
                        </Text>
                        {tdSpecialInfo.baseCost !== null && (
                          <Text
                            color="var(--cg-muted)"
                            fontSize="xs"
                            fontFamily="var(--cg-font-retro-display)"
                            mt={1}
                          >
                            In-match cost: {tdSpecialInfo.baseCost} credits
                          </Text>
                        )}
                        {tdSpecialInfo.details && (
                          <Text
                            color="var(--cg-muted)"
                            fontSize="xs"
                            fontFamily="var(--cg-font-retro-display)"
                            mt={1}
                          >
                            Effect values: {tdSpecialInfo.details}
                          </Text>
                        )}
                      </Box>
                    ) : (
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Select a special upgrade to view details.
                      </Text>
                    )}

                    <Button
                      size="sm"
                      {...retroButtonProps}
                      color={isSpecialActive ? 'var(--cg-accent-red)' : 'var(--cg-link)'}
                      bg={isSpecialActive ? 'var(--cg-panel-shell)' : 'var(--cg-window)'}
                      boxShadow={
                        isSpecialActive ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)'
                      }
                      onClick={handleSpecialToggle}
                      isDisabled={!tdSpecialInfo}
                    >
                      {isSpecialActive ? 'Deactivate on Grid' : 'Activate on Grid'}
                    </Button>

                    <Button
                      size="sm"
                      {...retroButtonProps}
                      color={tdSpecialSolo ? 'var(--cg-accent-amber)' : 'var(--cg-muted)'}
                      bg={tdSpecialSolo ? 'var(--cg-panel-shell)' : 'var(--cg-window)'}
                      boxShadow={
                        tdSpecialSolo ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)'
                      }
                      onClick={() => setTdSpecialSolo((prev) => !prev)}
                    >
                      {tdSpecialSolo
                        ? 'Solo View: ON — showing selected tower only'
                        : 'Solo View: OFF — all towers visible'}
                    </Button>

                    {(() => {
                      const st = getPackOwnership(tdSpecialUpgradePack);
                      return (
                        <HStack
                          justify="space-between"
                          align={{ base: 'stretch', sm: 'center' }}
                          flexDirection={{ base: 'column', sm: 'row' }}
                          spacing={{ base: 2, sm: 3 }}
                        >
                          {st.free ? (
                            <Badge
                              bg="var(--cg-window)"
                              color="var(--cg-accent-green)"
                              border="1px solid var(--cg-window-shadow)"
                              borderRadius="0"
                            >
                              {tdSpecialUpgradePack?.defaultUnlocked ? 'Default Unlocked' : 'Free'}
                            </Badge>
                          ) : st.owned ? (
                            <Badge
                              bg="var(--cg-window)"
                              color="var(--cg-accent-green)"
                              border="1px solid var(--cg-window-shadow)"
                              borderRadius="0"
                            >
                              Owned
                            </Badge>
                          ) : (
                            <Badge
                              bg="var(--cg-window)"
                              color="var(--cg-link)"
                              border="1px solid var(--cg-window-shadow)"
                              borderRadius="0"
                            >
                              {st.price} DP
                            </Badge>
                          )}
                          <Button
                            size="xs"
                            {...retroButtonProps}
                            color="var(--cg-link)"
                            onClick={() => addPackToCart(tdSpecialUpgradePack)}
                            isDisabled={
                              st.free ||
                              st.unavailable ||
                              st.owned ||
                              st.lockedByLevel ||
                              !st.storeItem
                            }
                            w={{ base: '100%', sm: 'auto' }}
                          >
                            Add To Cart
                          </Button>
                        </HStack>
                      );
                    })()}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              {/* ── Deployables ── */}
              <AccordionItem
                border="1px solid var(--cg-window-shadow)"
                borderRadius="0"
                boxShadow="var(--cg-window-outset)"
                bg="var(--cg-window)"
              >
                <h3>
                  <AccordionButton
                    py={2}
                    px={3}
                    borderRadius="0"
                    _hover={{ bg: 'var(--cg-window-face)' }}
                  >
                    <Box flex="1" textAlign="left">
                      <Text {...retroSectionLabelProps} color="var(--cg-link)">
                        DEPLOYABLES
                      </Text>
                    </Box>
                    <AccordionIcon color="var(--cg-link)" />
                  </AccordionButton>
                </h3>
                <AccordionPanel px={3} pb={3}>
                  <VStack align="stretch" spacing={3}>
                    <StoreSelect
                      value={tdDeployablePackId}
                      onChange={setTdDeployablePackId}
                      size="sm"
                      options={getSelectablePacks(TD_DEPLOYABLE_PACKS).map((pack) => {
                        const st = getPackOwnership(pack);
                        return {
                          value: pack.id,
                          label: buildModeLabel({
                            pack,
                            owned: st.owned,
                            free: st.free,
                            unavailable: st.unavailable,
                            price: st.price,
                          }),
                        };
                      })}
                    />

                    {tdDeployableInfo ? (
                      <Box {...retroInsetBoxProps}>
                        <Text
                          color="var(--cg-text)"
                          fontSize="sm"
                          fontFamily="var(--cg-font-retro-display)"
                          mb={1}
                        >
                          {tdDeployableInfo.title}
                        </Text>
                        <Text
                          color="var(--cg-link)"
                          fontSize="xs"
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {tdDeployableInfo.description}
                        </Text>
                        <Text
                          color="var(--cg-muted)"
                          fontSize="xs"
                          fontFamily="var(--cg-font-retro-display)"
                          mt={1}
                        >
                          Placement: {tdDeployableInfo.placementType ?? 'any'} • Trigger:{' '}
                          {tdDeployableInfo.trigger ?? 'burst'}
                        </Text>
                        {(tdDeployableInfo.radius !== null ||
                          tdDeployableInfo.duration !== null) && (
                          <Text
                            color="var(--cg-muted)"
                            fontSize="xs"
                            fontFamily="var(--cg-font-retro-display)"
                            mt={1}
                          >
                            Radius: {tdDeployableInfo.radius ?? 'n/a'} • Duration:{' '}
                            {tdDeployableInfo.duration != null
                              ? `${tdDeployableInfo.duration}ms`
                              : 'n/a'}{' '}
                            • Uses: {tdDeployableInfo.uses ?? 'n/a'}
                          </Text>
                        )}
                        <Text
                          color="var(--cg-muted)"
                          fontSize="xs"
                          fontFamily="var(--cg-font-retro-display)"
                          mt={1}
                        >
                          Unlock cost:{' '}
                          {tdDeployableInfo.defaultUnlocked
                            ? 'Default Unlocked'
                            : `${tdDeployableInfo.unlockCost} DP`}
                        </Text>
                      </Box>
                    ) : (
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Select a deployable to view details.
                      </Text>
                    )}

                    <Button
                      size="sm"
                      {...retroButtonProps}
                      color="var(--cg-accent-green)"
                      onClick={handleDeployableAddToMap}
                      isDisabled={
                        !tdDeployablePack ||
                        !DEPLOYABLE_PREVIEW_POSITIONS[getDeployableKeyFromPack(tdDeployablePack)]
                      }
                    >
                      Add to Map
                    </Button>

                    <Button
                      size="sm"
                      {...retroButtonProps}
                      color={tdDeployableSolo ? 'var(--cg-accent-amber)' : 'var(--cg-muted)'}
                      bg={tdDeployableSolo ? 'var(--cg-panel-shell)' : 'var(--cg-window)'}
                      boxShadow={
                        tdDeployableSolo ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)'
                      }
                      onClick={() => setTdDeployableSolo((prev) => !prev)}
                    >
                      {tdDeployableSolo
                        ? 'Solo View: ON — towers hidden, deployable focus'
                        : 'Solo View: OFF — all towers visible'}
                    </Button>

                    {(() => {
                      const st = getPackOwnership(tdDeployablePack);
                      const isDefaultFree = Boolean(tdDeployablePack?.defaultUnlocked);
                      return (
                        <HStack
                          justify="space-between"
                          align={{ base: 'stretch', sm: 'center' }}
                          flexDirection={{ base: 'column', sm: 'row' }}
                          spacing={{ base: 2, sm: 3 }}
                        >
                          {st.free || isDefaultFree ? (
                            <Badge
                              bg="var(--cg-window)"
                              color="var(--cg-accent-green)"
                              border="1px solid var(--cg-window-shadow)"
                              borderRadius="0"
                            >
                              {isDefaultFree ? 'Default Unlocked' : 'Free'}
                            </Badge>
                          ) : st.owned ? (
                            <Badge
                              bg="var(--cg-window)"
                              color="var(--cg-accent-green)"
                              border="1px solid var(--cg-window-shadow)"
                              borderRadius="0"
                            >
                              Owned
                            </Badge>
                          ) : (
                            <Badge
                              bg="var(--cg-window)"
                              color="var(--cg-link)"
                              border="1px solid var(--cg-window-shadow)"
                              borderRadius="0"
                            >
                              {st.price} DP
                            </Badge>
                          )}
                          <Button
                            size="xs"
                            {...retroButtonProps}
                            color="var(--cg-link)"
                            onClick={() => addPackToCart(tdDeployablePack)}
                            isDisabled={
                              st.free ||
                              isDefaultFree ||
                              st.unavailable ||
                              st.owned ||
                              st.lockedByLevel ||
                              !st.storeItem
                            }
                            w={{ base: '100%', sm: 'auto' }}
                          >
                            Add To Cart
                          </Button>
                        </HStack>
                      );
                    })()}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </>
        )}

        <Button
          size="sm"
          {...retroButtonProps}
          color="var(--cg-link)"
          onClick={() => setMountedAt(Date.now())}
        >
          Restart TD Preview
        </Button>
      </VStack>
    );
  }

  if (activeSectionId === 'profile') {
    return (
      <VStack align="stretch" spacing={4}>
        {renderQuickslots('profile')}
        {renderPackSelector(
          'Profile Background',
          PROFILE_BACKGROUND_PACKS,
          profileBackgroundPackId,
          setProfileBackgroundPackId,
          'profile.background'
        )}
        {renderPackSelector(
          'Calling Card',
          PROFILE_CALLING_CARD_PACKS,
          profileCardPackId,
          setProfileCardPackId,
          'profile.callingCard'
        )}
        {renderPackSelector(
          'Badge',
          PROFILE_BADGE_PACKS,
          profileBadgePackId,
          setProfileBadgePackId,
          'profile.badge'
        )}
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={5}>
      <Text {...retroSectionLabelProps} color="var(--cg-link)">
        EDITOR
      </Text>
      {renderPackSelector('Font Colors', EDITOR_THEME_PACKS, themeId, setThemeId)}
      {renderPackSelector('Font Pack', OPEN_SOURCE_FONT_PACKS, fontId, setFontId)}
      {renderPackSelector('Background', EDITOR_BACKGROUND_PACKS, backgroundId, setBackgroundId)}
      {renderPackSelector('Effects', EDITOR_EFFECT_PACKS, effectId, setEffectId)}

      <Divider borderColor="var(--cg-window-dark)" />

      <Text {...retroSectionLabelProps} color="var(--cg-link)">
        TOWER DEFENSE
      </Text>
      {renderPackSelector(
        'TD Map Pack',
        TD_MAP_PACK_OPTIONS,
        tdMapPackId,
        setTdMapPackId,
        'td.mapPack'
      )}
      {renderPackSelector(
        'Background Pack',
        TD_BACKGROUND_PACK_OPTIONS,
        tdBackgroundPackId,
        setTdBackgroundPackId,
        'td.backgroundPack'
      )}
      {renderPackSelector(
        'Tower Pack',
        TD_TOWER_PACK_OPTIONS,
        towerPackId,
        setTowerPackId,
        'td.towerPack'
      )}
      {renderPackSelector('Enemy Scheme', ENEMY_PACKS, enemyPackId, setEnemyPackId)}
      {renderPackSelector(
        'Tower Unlock',
        TD_TOWER_UNLOCK_PACKS,
        tdTowerUnlockPackId,
        setTdTowerUnlockPackId
      )}
      {renderPackSelector(
        'Special Upgrade Unlock',
        TD_SPECIAL_UPGRADE_PACKS,
        tdSpecialUpgradePackId,
        setTdSpecialUpgradePackId
      )}
      {renderPackSelector(
        'Deployable Unlock',
        TD_DEPLOYABLE_PACKS,
        tdDeployablePackId,
        setTdDeployablePackId
      )}
      {renderPackSelector(
        'Damage Text',
        TD_DAMAGE_TEXT_PACKS,
        damageTextPackId,
        setDamageTextPackId
      )}
      {renderPackSelector('Death FX', TD_DEATH_FX_PACKS, deathFxPackId, setDeathFxPackId)}

      <Divider borderColor="var(--cg-window-dark)" />

      <Text {...retroSectionLabelProps} color="var(--cg-link)">
        PROFILE
      </Text>
      {renderPackSelector(
        'Profile Background',
        PROFILE_BACKGROUND_PACKS,
        profileBackgroundPackId,
        setProfileBackgroundPackId,
        'profile.background'
      )}
      {renderPackSelector(
        'Calling Card',
        PROFILE_CALLING_CARD_PACKS,
        profileCardPackId,
        setProfileCardPackId,
        'profile.callingCard'
      )}
      {renderPackSelector(
        'Badge',
        PROFILE_BADGE_PACKS,
        profileBadgePackId,
        setProfileBadgePackId,
        'profile.badge'
      )}
    </VStack>
  );
};

export default StoreControlsBySection;
