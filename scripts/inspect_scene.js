import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[UNCAUGHT EXCEPTION]: ${err.stack || err.message}`);
  });

  console.log('Navigating to city page (1080p)...');
  await page.goto('http://localhost:5173/city?scene=apartment-room-01&entry=path-choice&track=beginner&learningPath=python-path&apartmentState=hub&fallback=%2Flearning%2Fpython-path');

  // Wait 8 seconds
  await page.waitForTimeout(8000);

  // Take screenshot before doing anything else
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'apartment_hub_debug.png' });

  // Evaluate simple scene check
  const sceneInfo = await page.evaluate(() => {
    const scene = window.__CODEGRIND_APARTMENT_PREVIEW_SCENE__;
    if (!scene) {
      return { error: 'SCENE NOT FOUND' };
    }
    return {
      sceneReady: scene.isSceneReady,
      mainCameraExists: !!scene.cameras.main,
      mainCameraType: scene.cameras.main ? scene.cameras.main.constructor.name : null,
      mainCameraVisible: scene.cameras.main ? scene.cameras.main.visible : null,
      mainCameraWillRenderType: scene.cameras.main ? typeof scene.cameras.main.willRender : null,
      overlayCameraExists: !!scene.fullscreenOverlayCamera,
      overlayCameraVisible: scene.fullscreenOverlayCamera ? scene.fullscreenOverlayCamera.visible : null,
      childrenCount: scene.children ? scene.children.list.length : 0,
      childrenTypes: scene.children ? scene.children.list.map(c => c.type) : [],
    };
  });

  console.log('SCENE INFO:', sceneInfo);

  await browser.close();
}

run().catch(console.error);
