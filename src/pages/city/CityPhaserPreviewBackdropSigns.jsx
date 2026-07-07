import CityPhaserAnimatedWindowViewSign from './CityPhaserAnimatedWindowViewSign';
import { WINDOW_VIEW_SIGN_OVERLAYS } from './CityPhaserPreviewBackdropSigns.config';

export default function CityPhaserPreviewBackdropSigns({ animationTickMs, backdropRect }) {
  if (!backdropRect) {
    return null;
  }

  return WINDOW_VIEW_SIGN_OVERLAYS.map((signOverlay) => (
    <CityPhaserAnimatedWindowViewSign
      key={signOverlay.id}
      animationTickMs={animationTickMs}
      backdropRect={backdropRect}
      filter={signOverlay.filter}
      frameDelayMs={signOverlay.frameDelayMs}
      framePlacement={signOverlay.framePlacement}
      frameSources={signOverlay.frames}
      opacity={signOverlay.opacity}
      signId={signOverlay.id}
      transform={signOverlay.transform}
    />
  ));
}
