import { useFeatureValue } from '@growthbook/growthbook-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Redirect,
  Route,
  RouteProps,
  useHistory,
  useLocation,
} from 'react-router-dom';

import { EVENTS, LATEST_TC_VERSION, PAGES } from './common/constants';
import Loading from './components/Loading';
import TermsAndCoditionsModal from './components/termsandconditons/TermsAndCoditionsModal';
import { TableTypes } from './common/constants';
import { ServiceConfig } from './services/ServiceConfig';
import { logAuthDebug } from './utility/authDebug';
import {
  buildTcAnalyticsContext,
  needsTermsAgreement,
  normalizeTcVersion,
} from './utility/termsAndConditions';
import { Util } from './utility/util';

type ProtectedRouteProps = RouteProps & {
  children: ReactNode;
};

const TERMS_MODAL_DEFERRED_PATHS = new Set<string>([
  PAGES.GAME,
  PAGES.LIDO_PLAYER,
  PAGES.LIVE_QUIZ_GAME,
]);

export default function ProtectedRoute({
  children,
  ...rest
}: ProtectedRouteProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null); // initially undefined
  const history = useHistory();
  const location = useLocation();
  const latestTcVersion = useFeatureValue<number>(LATEST_TC_VERSION, 0);
  const requiredTcVersion = normalizeTcVersion(latestTcVersion);
  const [currentUser, setCurrentUser] = useState<TableTypes<'user'> | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const viewedEventKeyRef = useRef('');
  const shouldRequireTerms = needsTermsAgreement(
    currentUser,
    requiredTcVersion,
  );
  const shouldDeferTermsModal = TERMS_MODAL_DEFERRED_PATHS.has(
    location.pathname,
  );
  const shouldShowTermsModal = shouldRequireTerms && !shouldDeferTermsModal;

  useEffect(() => {
    void checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      const user = await authHandler?.getCurrentUser();
      setCurrentUser(user ?? null);
      setIsAuth(!!isUserLoggedIn && !!user);
      if (!isUserLoggedIn || !user) {
        logAuthDebug('ProtectedRoute redirecting to login.', {
          source: 'ProtectedRoute.checkAuth',
          reason: !isUserLoggedIn
            ? 'is_user_logged_in_false'
            : 'current_user_missing',
          from_page: window.location.pathname,
          to_page: PAGES.LOGIN,
        });
      }
    } catch (error) {
      logAuthDebug('ProtectedRoute redirecting to login after auth error.', {
        source: 'ProtectedRoute.checkAuth',
        reason: 'auth_check_exception',
        from_page: window.location.pathname,
        to_page: PAGES.LOGIN,
      });
      setCurrentUser(null);
      setIsAuth(false);
    }
  };

  const handleAgree = async () => {
    if (!currentUser || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await ServiceConfig.getI().apiHandler.updateTcAgreedVersion(
        currentUser.id,
        requiredTcVersion,
      );

      void Util.logEvent(EVENTS.TC_AGREED, {
        agreed_version: requiredTcVersion,
        ...buildTcAnalyticsContext(currentUser),
      });

      setCurrentUser({
        ...currentUser,
        is_tc_accepted: true,
        tc_agreed_version: requiredTcVersion,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTermsClick = () => {
    const from =
      location.pathname + (location.search ?? '') + (location.hash ?? '');

    history.push({
      pathname: PAGES.TERMS_AND_CONDITIONS,
      state: {
        from,
        returnLocation: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          state: location.state,
        },
      },
    });
  };

  const handleTermsModalViewed = () => {
    if (!currentUser || !shouldShowTermsModal) {
      return;
    }

    const eventKey = `${currentUser.id}:${requiredTcVersion}`;
    if (viewedEventKeyRef.current === eventKey) {
      return;
    }

    viewedEventKeyRef.current = eventKey;
    void Util.logEvent(EVENTS.TC_POPUP_VIEWED, {
      target_version: requiredTcVersion,
      current_local_version: currentUser.tc_agreed_version ?? 0,
      ...buildTcAnalyticsContext(currentUser),
    });
  };

  if (isAuth == null) return <Loading isLoading />;

  return (
    <Route {...rest}>
      {isAuth === true ? (
        <>
          {children}
          {shouldShowTermsModal && (
            <TermsAndCoditionsModal
              isSubmitting={isSubmitting}
              onAgree={handleAgree}
              onTermsClick={handleTermsClick}
              onViewed={handleTermsModalViewed}
            />
          )}
        </>
      ) : (
        <Redirect
          to={{
            pathname: PAGES.LOGIN,
          }}
        />
      )}
    </Route>
  );
}
