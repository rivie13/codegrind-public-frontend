import { Box, ChakraProvider } from '@chakra-ui/react';
import { Route, Routes } from 'react-router-dom';
import AutoBugReportHost from './components/feedback/AutoBugReportHost';
import SessionValidator from './components/auth/SessionValidator';
import Root from './components/Root';
import MobileAccessGuard from './components/guards/MobileAccessGuard';
import { AchievementProvider } from './contexts/AchievementContext';
import { AuthProvider } from './contexts/AuthContext';
import { GuestProgressProvider } from './contexts/GuestProgressProvider';
import { ResponsiveProvider } from './contexts/ResponsiveContext';
import { SEO_LANDING_PAGES } from './data/seoLandingPages';
import AboutPage from './pages/info/AboutPage';
import FAQPage from './pages/info/FAQPage';
import UpdatesPage from './pages/info/UpdatesPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import HomePage from './pages/home/Home';
import SeoLandingPage from './pages/seo/SeoLandingPage';
import NativeBlogPostPage from './pages/blog/NativeBlogPostPage';
import theme from './theme';

function PublicApp() {
  return (
    <ChakraProvider theme={theme}>
      <Box
        width="100%"
        minHeight="100vh"
        height="auto"
        bg="transparent"
        overflow="visible"
        display="flex"
        alignItems="stretch"
        className="app-container cg-desktop-workspace"
      >
        <ResponsiveProvider>
          <AuthProvider>
            <GuestProgressProvider>
              <AchievementProvider>
                <SessionValidator>
                  <AutoBugReportHost />
                  <Routes>
                    <Route element={<MobileAccessGuard />}>
                      <Route element={<Root />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/updates" element={<UpdatesPage />} />
                        {SEO_LANDING_PAGES.map((page) => (
                          <Route
                            key={page.id}
                            path={page.path}
                            element={<SeoLandingPage pageId={page.id} />}
                          />
                        ))}
                        <Route path="/blog/codegrind/:slug" element={<NativeBlogPostPage />} />
                      </Route>
                    </Route>
                  </Routes>
                </SessionValidator>
              </AchievementProvider>
            </GuestProgressProvider>
          </AuthProvider>
        </ResponsiveProvider>
      </Box>
    </ChakraProvider>
  );
}

export default PublicApp;
