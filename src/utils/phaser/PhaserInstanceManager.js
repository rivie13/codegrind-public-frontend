/**
 * Singleton manager to preserve a Phaser.Game instance across React component lifecycles.
 * This prevents massive performance hits and memory leaks when navigating between routes
 * by reusing the WebGL context and loaded assets instead of rebooting Phaser entirely.
 */

class PhaserInstanceManager {
  constructor() {
    this.gameInstance = null;
    this.containerId = null;
    this.isActiveView = false;
    this.reactIsStable = true; // Track React stability to prevent Phaser boot on crashes

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.log('[PhaserInstanceManager] Tab backgrounded: Freezing engine core.');
          if (this.gameInstance) {
            if (this.gameInstance.loop && typeof this.gameInstance.loop.stop === 'function') {
              this.gameInstance.loop.stop();
            }
            if (this.gameInstance.sound && typeof this.gameInstance.sound.pauseAll === 'function') {
              this.gameInstance.sound.pauseAll();
            }
          }
        } else {
          console.log('[PhaserInstanceManager] Tab foregrounded: Resuming engine core.');
          if (this.gameInstance && this.isActiveView) {
            if (this.gameInstance.loop && typeof this.gameInstance.loop.start === 'function') {
              const callback =
                this.gameInstance.loop.callback || this.gameInstance.step.bind(this.gameInstance);
              this.gameInstance.loop.start(callback);
            }
            if (
              this.gameInstance.sound &&
              typeof this.gameInstance.sound.resumeAll === 'function'
            ) {
              this.gameInstance.sound.resumeAll();
            }
          }
        }
      });
    }
  }

  /**
   * Mark React as unstable (e.g., after hydration errors)
   * This prevents Phaser from auto-booting when React has crashed
   */
  markReactUnstable() {
    console.warn('[PhaserInstanceManager] Marking React as unstable - preventing Phaser boot');
    this.reactIsStable = false;
  }

  /**
   * Mark React as stable (e.g., after successful hydration)
   */
  markReactStable() {
    console.log('[PhaserInstanceManager] Marking React as stable');
    this.reactIsStable = true;
  }

  /**
   * Initializes or returns the existing Phaser Game instance.
   * If the instance already exists, it will be re-attached to the provided container.
   */
  getInstance(Phaser, config) {
    // Prevent Phaser from booting if React is unstable (e.g., after hydration errors)
    if (!this.reactIsStable) {
      console.warn('[PhaserInstanceManager] React is unstable - skipping Phaser instantiation');
      return null;
    }

    if (!this.gameInstance) {
      console.log('[PhaserInstanceManager] Creating new Phaser instance');
      // Store the requested parent container
      this.containerId = config.parent;
      this.isActiveView = !config.isBackgroundPreboot;
      this.gameInstance = new Phaser.Game(config);

      const canvas = this.gameInstance.canvas;
      if (canvas) {
        canvas.addEventListener(
          'webglcontextlost',
          (event) => {
            console.error('[PhaserInstanceManager] WebGL context lost!');
            const bridge =
              this.gameInstance.registry?.get('codegrind:apartment-preview-bridge') ||
              this.gameInstance.registry?.get('apartmentPreviewBridge');
            if (bridge && typeof bridge.trackFunnelEvent === 'function') {
              bridge.trackFunnelEvent('webglContextLost', { reason: 'context_loss_event' });
            }
            // Force destruction and nullification so it will re-initialize next time
            try {
              this.gameInstance.destroy(true);
            } catch {
              // Ignored
            }
            this.gameInstance = null;
          },
          false
        );
      }

      // Guard against Phaser's built-in VisibilityHandler auto-resuming the keyboard
      // manager when the browser sends focus/visibilitychange events on non-city routes.
      // Without this, Phaser's game.resume() resets keyboard.enabled = true even after
      // pauseGame() cleared captures and disabled the keyboard.
      if (this.gameInstance.events && typeof this.gameInstance.events.on === 'function') {
        this.gameInstance.events.on('resume', () => {
          const isCityRoute =
            typeof window !== 'undefined' &&
            (window.location.pathname.startsWith('/city') ||
              window.location.pathname.includes('/standalone-city'));

          if (!this.isActiveView || !isCityRoute) {
            console.log('[PhaserInstanceManager] Intercepting auto-resume while inactive');
            this.pauseGame();
            return;
          }

          if (this.gameInstance && this.gameInstance.input && this.gameInstance.input.keyboard) {
            this.gameInstance.input.keyboard.enabled = false;
          }
        });
      }
    } else {
      console.log('[PhaserInstanceManager] Reusing existing Phaser instance');

      this.isActiveView = !config.isBackgroundPreboot;

      // Auto-resume the global game loop if it was paused
      if (this.gameInstance.isPaused || (this.gameInstance.loop && this.gameInstance.loop.paused)) {
        if (typeof this.gameInstance.resume === 'function') {
          this.gameInstance.resume();
        } else if (this.gameInstance.loop && typeof this.gameInstance.loop.wake === 'function') {
          this.gameInstance.loop.wake();
        }
      }

      // If returning to the same view, we just need to append the existing canvas
      // to the new DOM element that React just mounted.
      const canvas = this.gameInstance.canvas;
      const targetParent = document.getElementById(config.parent);

      if (targetParent && canvas && canvas.parentElement !== targetParent) {
        targetParent.appendChild(canvas);
      }

      // Update dimensions if needed - guard against 0 dimensions to prevent WebGL errors
      if (config.scale && config.scale.width > 0 && config.scale.height > 0) {
        this.gameInstance.scale.resize(config.scale.width, config.scale.height);
      }
    }

    return this.gameInstance;
  }

  /**
   * Pauses the entire Phaser game instance
   */
  pauseGame() {
    if (this.gameInstance) {
      console.log('[PhaserInstanceManager] Pausing whole game');
      this.isActiveView = false;

      // Clear keyboard captures to release keys like WASD, ENTER, SPACE, ESC
      if (this.gameInstance.input && this.gameInstance.input.keyboard) {
        this.gameInstance.input.keyboard.clearCaptures();
        this.gameInstance.input.keyboard.enabled = false;

        // Isolate keyboard event listeners by redirecting target to inert container
        let prebootContainer = document.getElementById('phaser-preboot-container');
        if (!prebootContainer && typeof document !== 'undefined') {
          prebootContainer = document.createElement('div');
          prebootContainer.id = 'phaser-preboot-container';
          prebootContainer.style.position = 'absolute';
          prebootContainer.style.left = '-9999px';
          prebootContainer.style.top = '-9999px';
          prebootContainer.style.width = '800px';
          prebootContainer.style.height = '600px';
          prebootContainer.style.visibility = 'hidden';
          prebootContainer.style.pointerEvents = 'none';
          document.body.appendChild(prebootContainer);
        }

        if (prebootContainer) {
          try {
            if (typeof this.gameInstance.input.keyboard.stopListeners === 'function') {
              this.gameInstance.input.keyboard.stopListeners();
            }
            this.gameInstance.input.keyboard.target = prebootContainer;
            if (typeof this.gameInstance.input.keyboard.startListeners === 'function') {
              this.gameInstance.input.keyboard.startListeners();
            }
          } catch (e) {
            console.error(
              '[PhaserInstanceManager] Error swapping keyboard target to prebootContainer:',
              e
            );
          }
        }
      }

      // Destroy all Key objects on the active scene's keyboard plugin.
      // game.input.keyboard.clearCaptures() only clears the global capture array,
      // but Key objects created via scene.input.keyboard.addKey(code, enableCapture=true)
      // register individual DOM keydown listeners that call preventDefault() independently.
      // These per-key listeners survive clearCaptures() and are re-armed by Phaser's
      // VisibilityHandler auto-resume. removeAllKeys(true, true) destroys them completely.
      const scenePlugin = this.gameInstance.scene;
      if (scenePlugin && typeof scenePlugin.getScene === 'function') {
        const activeScene = scenePlugin.getScene('ApartmentPreviewScene');
        if (activeScene && activeScene.input && activeScene.input.keyboard) {
          if (typeof activeScene.input.keyboard.removeAllKeys === 'function') {
            activeScene.input.keyboard.removeAllKeys(true, true);
          }
        }
      }

      if (typeof this.gameInstance.pause === 'function') {
        this.gameInstance.pause();
      } else if (this.gameInstance.loop && typeof this.gameInstance.loop.sleep === 'function') {
        this.gameInstance.loop.sleep();
      }

      // Complete freeze: stops rendering, physics update, and animation tickers
      if (this.gameInstance.loop && typeof this.gameInstance.loop.stop === 'function') {
        this.gameInstance.loop.stop();
      }

      // Audio freeze: prevents looping sound effects from turning into white noise
      if (this.gameInstance.sound && typeof this.gameInstance.sound.pauseAll === 'function') {
        this.gameInstance.sound.pauseAll();
      }
    }
  }

  /**
   * Resumes the entire Phaser game instance
   */
  resumeGame() {
    if (this.gameInstance) {
      console.log('[PhaserInstanceManager] Resuming whole game');
      this.isActiveView = true;

      if (this.gameInstance.input && this.gameInstance.input.keyboard) {
        this.gameInstance.input.keyboard.enabled = true;

        // Restore window as keyboard target when active in city view
        try {
          if (typeof this.gameInstance.input.keyboard.stopListeners === 'function') {
            this.gameInstance.input.keyboard.stopListeners();
          }
          this.gameInstance.input.keyboard.target = window;
          if (typeof this.gameInstance.input.keyboard.startListeners === 'function') {
            this.gameInstance.input.keyboard.startListeners();
          }
        } catch (e) {
          console.error('[PhaserInstanceManager] Error swapping keyboard target to window:', e);
        }
      }

      if (typeof this.gameInstance.resume === 'function') {
        this.gameInstance.resume();
      } else if (this.gameInstance.loop && typeof this.gameInstance.loop.wake === 'function') {
        this.gameInstance.loop.wake();
      }

      // Wake-up loop instantly when returning to the active view
      if (this.gameInstance.loop && typeof this.gameInstance.loop.start === 'function') {
        const callback =
          this.gameInstance.loop.callback || this.gameInstance.step.bind(this.gameInstance);
        this.gameInstance.loop.start(callback);
      }

      // Wake-up sounds cleanly
      if (this.gameInstance.sound && typeof this.gameInstance.sound.resumeAll === 'function') {
        this.gameInstance.sound.resumeAll();
      }
    }
  }

  /**
   * Pauses the current scene instead of destroying the game
   */
  pauseScene(sceneKey) {
    if (this.gameInstance && this.gameInstance.scene.isActive(sceneKey)) {
      this.gameInstance.scene.pause(sceneKey);
    }
  }

  /**
   * Resumes the scene when returning to the view
   */
  resumeScene(sceneKey) {
    if (this.gameInstance && this.gameInstance.scene.isPaused(sceneKey)) {
      this.gameInstance.scene.resume(sceneKey);
    }
  }
}

export const phaserInstanceManager = new PhaserInstanceManager();
export default phaserInstanceManager;
