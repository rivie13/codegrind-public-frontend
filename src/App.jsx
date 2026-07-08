import { Box, ChakraProvider } from '@chakra-ui/react';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AutoBugReportHost from './components/feedback/AutoBugReportHost';
import Root from './components/Root';
import MobileAccessGuard from './components/guards/MobileAccessGuard';
import SessionValidator from './components/auth/SessionValidator';
import { AchievementProvider } from './contexts/AchievementContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GuestProgressProvider, useGuestProgressCtx } from './contexts/GuestProgressProvider';
import { ResponsiveProvider } from './contexts/ResponsiveContext';
import {
  GUEST_CLUSTER_TRIAL_PROBLEM_SLUGS,
  GUEST_LEARNING_TRIAL_PROBLEM_SLUGS,
  isGuestClusterTrialProblemUnlocked,
  isGuestLearningTrialProblemUnlocked,
} from './hooks/guest/useGuestProgress';
import CityPhaserPreviewBootScreen from './components/city/CityPhaserPreviewBootScreen';
import HomePage from './pages/home/Home';

/* ── Lazy page helper ────────────────────────────────────────────── */
const lazyPage = (importFn) => {
  const Component = lazy(importFn);
  return (props) => (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  );
};

const AboutPage = lazyPage(() => import('./pages/info/AboutPage'));
const AchievementTestPage = lazyPage(() => import('./pages/dev/AchievementTestPage'));
const AdTest = lazyPage(() => import('./pages/dev/AdTest'));
const SuccessModalPreviewPage = lazyPage(() => import('./pages/dev/SuccessModalPreviewPage'));
const AIProblems = lazyPage(() => import('./pages/ai/AIProblems'));
const AIProblemsCreate = lazyPage(() => import('./pages/ai/AIProblemsCreate'));
const AIProblemsView = lazyPage(() => import('./pages/ai/AIProblemsView'));
const BlogPage = lazyPage(() => import('./pages/blog/BlogPage'));
const BlogPostPage = lazyPage(() => import('./pages/blog/BlogPostPage'));
const NativeBlogPostPage = lazyPage(() => import('./pages/blog/NativeBlogPostPage'));
const CancelEmailChangePage = lazyPage(() => import('./pages/auth/CancelEmailChangePage'));
const ClusterMap = lazyPage(() => import('./pages/games/ClusterMap'));
const EmailChangeVerificationPage = lazyPage(
  () => import('./pages/auth/EmailChangeVerificationPage')
);
const FAQPage = lazyPage(() => import('./pages/info/FAQPage'));
const EmailVerificationPage = lazyPage(() => import('./pages/auth/EmailVerificationPage'));
const GamesLandingPage = lazyPage(() => import('./pages/games/GamesLandingPage'));
const LeaderboardsPage = lazyPage(() => import('./pages/community/LeaderboardsPage'));
const LearningLandingPage = lazyPage(() => import('./pages/learning/LearningLandingPage'));
const LearningPathActivity = lazyPage(() => import('./pages/learning/LearningPathActivity'));
const LearningPathTowerDefense = lazyPage(
  () => import('./pages/learning/LearningPathTowerDefense')
);
const PricingPage = lazyPage(() => import('./pages/billing/PricingPage'));
const PrivacyPolicyPage = lazyPage(() => import('./pages/legal/PrivacyPolicyPage'));
const ProblemList = lazyPage(() => import('./pages/problems/ProblemList'));
const ProblemWorkspace = lazyPage(() => import('./pages/problems/ProblemWorkspace'));
const ProfileDashboard = lazyPage(() => import('./pages/profile/ProfileDashboard'));
const PublicProfilePage = lazyPage(() => import('./pages/profile/PublicProfilePage'));
const LearningPathMap = lazyPage(() => import('./pages/learning/LearningPathMap'));
const StorePage = lazyPage(() => import('./pages/store/StorePage'));
const SubmissionsPage = lazyPage(() => import('./pages/profile/SubmissionsPage'));
const TowerDefenseProblemList = lazyPage(() => import('./pages/games/TowerDefenseProblemList'));
const TowerDefenseV2 = lazyPage(() => import('./pages/games/TowerDefenseV2'));
const UpdatesPage = lazyPage(() => import('./pages/info/UpdatesPage'));
const SeoLandingPage = lazyPage(() => import('./pages/seo/SeoLandingPage'));
import { SEO_LANDING_PAGES } from './data/seoLandingPages';
import theme from './theme';
import { isStandaloneCityRoute } from './utils/navigation/standaloneCityRoute';
import { normalizeLearningPathId } from './utils/navigation/learningPathUtils';
import { markClientReady } from './utils/phaser/PhaserBackgroundPreloader';
import './styles/animations.css';

const APP_READY_EVENT = 'codegrind:app-ready';
const APP_READY_ATTRIBUTE = 'data-codegrind-app-ready';
const CITY_ROUTE_PATH = '/city';
const LEGACY_CITY_PHASER_ROUTE_PATH = '/city/phaser-preview';
const CityPhaserPreviewPage = lazy(() => import('./pages/city/CityPhaserPreviewPage'));

const LOCAL_ONLY_ROUTE_MODULES = import.meta.glob('./local-routes/*.local.jsx', { eager: true });

const getLocalOnlyRoutes = () => {
  return Object.values(LOCAL_ONLY_ROUTE_MODULES).flatMap((moduleValue) => {
    const routes = moduleValue?.default;
    if (!Array.isArray(routes)) return [];
    return routes.filter((route) => route?.path && route?.element);
  });
};

const TowerDefenseSlugRedirect = () => {
  const { titleSlug } = useParams();
  return <Navigate to={`/games/tower-defense/${titleSlug}`} replace />;
};

const LegacyCityPhaserRouteRedirect = () => {
  const location = useLocation();
  return <Navigate to={{ pathname: CITY_ROUTE_PATH, search: location.search }} replace />;
};

const CityPhaserRoute = () => (
  <Suspense fallback={<CityPhaserPreviewBootScreen phase="route" position="absolute" zIndex={1} />}>
    <CityPhaserPreviewPage />
  </Suspense>
);

const FREE_LEARNING_TRIAL_SLUGS = new Set(GUEST_LEARNING_TRIAL_PROBLEM_SLUGS);
const GUEST_TRIAL_PROBLEM_SLUGS = new Set(GUEST_CLUSTER_TRIAL_PROBLEM_SLUGS);

const getSelectedTrialLearningPath = (guest) =>
  normalizeLearningPathId(guest?.selectedTrialLearningPath || guest?.progress?.trialLearningPath);

const getLearningPathForTrialProblemSlug = (titleSlug) => {
  const normalized = String(titleSlug || '')
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith('lp-js-')) return 'javascript-path';
  if (normalized.startsWith('lp-java-')) return 'java-path';
  if (normalized.startsWith('lp-')) return 'python-path';
  return null;
};

const getLearningFallbackPath = (guest, fallback = '/learning/python-path') => {
  const selectedPath = getSelectedTrialLearningPath(guest);
  return selectedPath ? `/learning/${selectedPath}` : fallback;
};

const getClusterFallbackPath = (guest, fallback = '/games/clusters') => {
  const selectedPath = getSelectedTrialLearningPath(guest);
  return selectedPath ? `/learning/${selectedPath}` : fallback;
};

const RequireAuthOrGuestTrialProblem = ({ children, fallback = '/games/clusters' }) => {
  const { isAuthenticated, loading } = useAuth();
  const guest = useGuestProgressCtx();
  const { titleSlug } = useParams();
  const selectedTrialTrack = guest?.selectedTrialTrack || guest?.progress?.pathChoice || null;
  const selectedTrialLearningPath = getSelectedTrialLearningPath(guest);
  const solvedSlugs = Array.isArray(guest?.progress?.problemsSolved)
    ? guest.progress.problemsSolved
    : [];

  if (loading) return null;
  if (isAuthenticated) return children;
  // Guest chose beginner path → can't solve cluster problems
  if (selectedTrialTrack === 'beginner') {
    return <Navigate to={`/learning/${selectedTrialLearningPath || 'python-path'}`} replace />;
  }
  // No path chosen yet → must complete demo & choose via modal first
  if (!selectedTrialTrack) {
    return <Navigate to="/" replace />;
  }
  if (
    titleSlug &&
    GUEST_TRIAL_PROBLEM_SLUGS.has(titleSlug) &&
    isGuestClusterTrialProblemUnlocked(titleSlug, solvedSlugs)
  ) {
    return children;
  }
  return <Navigate to={fallback} replace />;
};

const RequireAuthOrProTrialTrack = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const guest = useGuestProgressCtx();
  const selectedTrialTrack = guest?.selectedTrialTrack || guest?.progress?.pathChoice || null;

  if (loading) return null;
  if (isAuthenticated) return children;
  if (selectedTrialTrack === 'beginner') {
    return <Navigate to={getClusterFallbackPath(guest, '/learning')} replace />;
  }

  return children;
};

const RequireAuthOrBeginnerTrialTrack = ({ children, pathId = null }) => {
  const { isAuthenticated, loading } = useAuth();
  const guest = useGuestProgressCtx();
  const { pathSlug } = useParams();
  const selectedTrialTrack = guest?.selectedTrialTrack || guest?.progress?.pathChoice || null;
  const selectedTrialLearningPath = getSelectedTrialLearningPath(guest);
  const requestedPath = normalizeLearningPathId(pathId || pathSlug);

  if (loading) return null;
  if (isAuthenticated) return children;
  if (selectedTrialTrack === 'pro') {
    return <Navigate to="/games/clusters" replace />;
  }
  if (selectedTrialLearningPath && requestedPath && selectedTrialLearningPath !== requestedPath) {
    return <Navigate to={`/learning/${selectedTrialLearningPath}`} replace />;
  }
  return children;
};

const RequireAuthOrLearningTrialNode = ({ children, fallback = '/learning/python-path' }) => {
  const { isAuthenticated, loading } = useAuth();
  const guest = useGuestProgressCtx();
  const { pathSlug, nodeId } = useParams();
  const selectedTrialTrack = guest?.selectedTrialTrack || guest?.progress?.pathChoice || null;
  const selectedTrialLearningPath = getSelectedTrialLearningPath(guest);

  if (loading) return null;
  if (isAuthenticated) return children;

  if (selectedTrialTrack === 'pro') {
    return <Navigate to="/games/clusters" replace />;
  }

  const normalizedPath = normalizeLearningPathId(pathSlug);
  if (selectedTrialLearningPath && normalizedPath && selectedTrialLearningPath !== normalizedPath) {
    return <Navigate to={`/learning/${selectedTrialLearningPath}`} replace />;
  }

  const isM0Node =
    (normalizedPath === 'python-path' &&
      typeof nodeId === 'string' &&
      nodeId.startsWith('py-m0-')) ||
    (normalizedPath === 'javascript-path' &&
      typeof nodeId === 'string' &&
      nodeId.startsWith('js-m0-')) ||
    (normalizedPath === 'java-path' &&
      typeof nodeId === 'string' &&
      nodeId.startsWith('java-m0-'));

  if (isM0Node) return children;
  return <Navigate to={getLearningFallbackPath(guest, fallback)} replace />;
};

const RequireAuthOrLearningTrialProblem = ({ children, fallback = '/learning/python-path' }) => {
  const { isAuthenticated, loading } = useAuth();
  const guest = useGuestProgressCtx();
  const { titleSlug, pathSlug } = useParams();
  const selectedTrialTrack = guest?.selectedTrialTrack || guest?.progress?.pathChoice || null;
  const selectedTrialLearningPath = getSelectedTrialLearningPath(guest);
  const solvedSlugs = Array.isArray(guest?.progress?.problemsSolved)
    ? guest.progress.problemsSolved
    : [];

  if (loading) return null;
  if (isAuthenticated) return children;
  // Guest chose pro path → can't solve learning problems
  if (selectedTrialTrack === 'pro') {
    return <Navigate to="/games/clusters" replace />;
  }

  const requestedPath =
    normalizeLearningPathId(pathSlug) || getLearningPathForTrialProblemSlug(titleSlug);
  if (selectedTrialLearningPath && requestedPath && selectedTrialLearningPath !== requestedPath) {
    return <Navigate to={`/learning/${selectedTrialLearningPath}`} replace />;
  }

  // No path chosen yet → must complete demo & choose via modal first
  if (!selectedTrialTrack) {
    return <Navigate to="/" replace />;
  }
  if (
    titleSlug &&
    FREE_LEARNING_TRIAL_SLUGS.has(titleSlug) &&
    isGuestLearningTrialProblemUnlocked(titleSlug, solvedSlugs)
  ) {
    return children;
  }
  return <Navigate to={getLearningFallbackPath(guest, fallback)} replace />;
};

function App({ router: Router = BrowserRouter, routerProps = {} }) {
  const localOnlyRoutes = getLocalOnlyRoutes();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    let cancelled = false;

    const signalReady = () => {
      if (cancelled) return;
      document.body?.setAttribute(APP_READY_ATTRIBUTE, 'true');
      window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
      // Mark client as ready for SSR-safe progression checks
      markClientReady();
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(signalReady);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Log cookies when the app first loads
    // logger.info('App mounted, current cookies:');
    // logger.debug(document.cookie);

    // Listen for beforeunload to check cookies before navigation/refresh
    const handleBeforeUnload = () => {
      // logger.info('Page about to unload, cookies:');
      // logger.debug(document.cookie);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const isStandaloneCityPhaserPreview =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    isStandaloneCityRoute(window.location.pathname);

  if (isStandaloneCityPhaserPreview) {
    return (
      <ChakraProvider theme={theme}>
        <Box
          width="100%"
          minHeight="100vh"
          sx={{ minHeight: '100dvh' }}
          bg="#070b12"
          overflow="hidden"
          position="relative"
        >
          <Router {...routerProps}>
            <Routes>
              <Route
                path={LEGACY_CITY_PHASER_ROUTE_PATH}
                element={<LegacyCityPhaserRouteRedirect />}
              />
              <Route path={CITY_ROUTE_PATH} element={<CityPhaserRoute />} />
            </Routes>
          </Router>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Box
        width="100%"
        minHeight="100vh"
        sx={{ minHeight: '100dvh' }}
        height="auto"
        bg="transparent"
        overflow="visible"
        display="flex"
        alignItems="stretch"
        className="app-container cg-desktop-workspace"
      >
        <ResponsiveProvider>
          <Router {...routerProps}>
            <AuthProvider>
              <GuestProgressProvider>
                <AchievementProvider>
                  <SessionValidator>
                    <AutoBugReportHost />
                    <Routes>
                      <Route element={<MobileAccessGuard />}>
                        <Route element={<Root />}>
                          {/* Public Routes */}
                          <Route path="/" element={<HomePage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/blog" element={<BlogPage />} />
                          <Route path="/blog/:year/:month/:day/:slug" element={<BlogPostPage />} />
                          <Route path="/blog/codegrind/:slug" element={<NativeBlogPostPage />} />
                          <Route path="/leaderboards" element={<LeaderboardsPage />} />
                          <Route path="/profile/:userId" element={<PublicProfilePage />} />
                          <Route path="/faq" element={<FAQPage />} />
                          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                          <Route path="/updates" element={<UpdatesPage />} />
                          <Route
                            path={LEGACY_CITY_PHASER_ROUTE_PATH}
                            element={<LegacyCityPhaserRouteRedirect />}
                          />
                          <Route path={CITY_ROUTE_PATH} element={<CityPhaserRoute />} />
                          {SEO_LANDING_PAGES.map((page) => (
                            <Route
                              key={page.id}
                              path={page.path}
                              element={<SeoLandingPage pageId={page.id} />}
                            />
                          ))}
                          {import.meta.env.DEV && <Route path="/ad-test" element={<AdTest />} />}
                          <Route
                            path="/learning"
                            element={
                              <RequireAuthOrBeginnerTrialTrack>
                                <LearningLandingPage />
                              </RequireAuthOrBeginnerTrialTrack>
                            }
                          />
                          <Route path="/ai-problems" element={<AIProblems />} />
                          <Route path="/games" element={<GamesLandingPage />} />
                          <Route
                            path="/games/clusters"
                            element={
                              <RequireAuthOrProTrialTrack>
                                <ClusterMap />
                              </RequireAuthOrProTrialTrack>
                            }
                          />
                          <Route
                            path="/games/clusters/:clusterId"
                            element={
                              <RequireAuthOrProTrialTrack>
                                <ClusterMap />
                              </RequireAuthOrProTrialTrack>
                            }
                          />

                          {/* Problems list - public for browsing (auth required to solve) */}
                          <Route path="/problems" element={<ProblemList />} />
                          <Route
                            path="/problems/:titleSlug"
                            element={
                              <RequireAuthOrGuestTrialProblem>
                                <ProblemWorkspace />
                              </RequireAuthOrGuestTrialProblem>
                            }
                          />

                          <Route
                            path="/games/tower-defense/:titleSlug"
                            element={
                              <RequireAuthOrGuestTrialProblem>
                                <TowerDefenseV2 />
                              </RequireAuthOrGuestTrialProblem>
                            }
                          />
                          <Route
                            path="/games/tower-defense/play/:titleSlug"
                            element={<TowerDefenseSlugRedirect />}
                          />

                          {localOnlyRoutes.map((route) => (
                            <Route
                              key={`local-only-${route.path}`}
                              path={route.path}
                              element={route.element}
                            />
                          ))}

                          {/* Learning path routes — accessible to guests for trial (M0) */}
                          <Route
                            path="/learning/python"
                            element={<Navigate to="/learning/python-path" replace />}
                          />
                          <Route
                            path="/learning/javascript"
                            element={<Navigate to="/learning/javascript-path" replace />}
                          />
                          <Route
                            path="/learning/java"
                            element={<Navigate to="/learning/java-path" replace />}
                          />
                          <Route
                            path="/learning/:pathSlug"
                            element={
                              <RequireAuthOrBeginnerTrialTrack>
                                <LearningPathMap />
                              </RequireAuthOrBeginnerTrialTrack>
                            }
                          />
                          <Route
                            path="/learning/:pathSlug/:nodeId"
                            element={
                              <RequireAuthOrLearningTrialNode>
                                <LearningPathActivity />
                              </RequireAuthOrLearningTrialNode>
                            }
                          />
                          <Route
                            path="/learning/:pathSlug/tower/:nodeId"
                            element={
                              <RequireAuthOrLearningTrialNode>
                                <LearningPathTowerDefense />
                              </RequireAuthOrLearningTrialNode>
                            }
                          />
                          <Route
                            path="/learning/:pathSlug/problems/:titleSlug"
                            element={
                              <RequireAuthOrLearningTrialProblem>
                                <ProblemWorkspace />
                              </RequireAuthOrLearningTrialProblem>
                            }
                          />
                          <Route
                            path="/learning/problems/:titleSlug"
                            element={
                              <RequireAuthOrLearningTrialProblem>
                                <ProblemWorkspace />
                              </RequireAuthOrLearningTrialProblem>
                            }
                          />

                          {/* Protected Routes - wrapped in ProtectedRoute */}
                          <Route element={<ProtectedRoute />}>
                            <Route path="/profile" element={<ProfileDashboard />} />
                            <Route path="/profile/submissions" element={<SubmissionsPage />} />
                            <Route path="/store" element={<StorePage />} />
                            {import.meta.env.DEV && (
                              <Route path="/achievements/test" element={<AchievementTestPage />} />
                            )}
                            {import.meta.env.DEV && (
                              <Route
                                path="/dev/success-modal-preview"
                                element={<SuccessModalPreviewPage />}
                              />
                            )}

                            {/* Pricing and payment routes - protected */}
                            <Route path="/pricing" element={<PricingPage />} />
                            <Route path="/upgrade" element={<PricingPage />} />

                            {/* AI Problems routes should be protected too */}
                            <Route path="/ai-problems/create" element={<AIProblemsCreate />} />
                            <Route path="/ai-problems/browse" element={<AIProblemsView />} />
                            <Route path="/ai-problems/:titleSlug" element={<ProblemWorkspace />} />

                            {/* Tower Defense game routes (v2) */}
                            <Route
                              path="/games/tower-defense"
                              element={<TowerDefenseProblemList />}
                            />
                          </Route>
                        </Route>
                        <Route path="/verify-email" element={<EmailVerificationPage />} />
                        <Route
                          path="/verify-email-change"
                          element={<EmailChangeVerificationPage />}
                        />
                        <Route path="/cancel-email-change" element={<CancelEmailChangePage />} />
                      </Route>
                    </Routes>
                  </SessionValidator>
                </AchievementProvider>
              </GuestProgressProvider>
            </AuthProvider>
          </Router>
        </ResponsiveProvider>
      </Box>
      
    </ChakraProvider>
  );
}

export default App;
