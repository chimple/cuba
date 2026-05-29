import { useFeatureValue } from '@growthbook/growthbook-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import {
  EVENTS,
  LATEST_TC_VERSION,
  PAGES,
  TableTypes,
} from '../../common/constants';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setUser } from '../../redux/slices/auth/authSlice';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  buildTcAnalyticsContext,
  getUserTcAgreedVersion,
  needsTermsAgreement,
  normalizeTcVersion,
} from '../../utility/termsAndConditions';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';
import TermsAndCoditionsModal from './TermsAndCoditionsModal';

const TERMS_MODAL_DEFERRED_PATHS = new Set<string>([
  PAGES.GAME,
  PAGES.LIDO_PLAYER,
  PAGES.LIVE_QUIZ_GAME,
]);

const TERMS_MODAL_HIDDEN_PATHS = new Set<string>([
  PAGES.LOGIN,
  PAGES.RESET_PASSWORD,
  PAGES.TERMS_AND_CONDITIONS,
  PAGES.APP_UPDATE,
]);

const TermsGate: React.FC = () => {
  const dispatch = useAppDispatch();
  const history = useHistory();
  const location = useLocation();
  const latestTcVersion = useFeatureValue<number>(LATEST_TC_VERSION, 0);
  const requiredTcVersion = normalizeTcVersion(latestTcVersion);
  const reduxUser = useAppSelector((state) => state.auth.user);
  const [currentUser, setCurrentUser] = useState<TableTypes<'user'> | null>(
    reduxUser ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticAgreements, setOptimisticAgreements] = useState<
    Record<string, number>
  >({});
  const viewedEventKeyRef = useRef('');

  useEffect(() => {
    setCurrentUser(reduxUser ?? null);
  }, [reduxUser]);

  useEffect(() => {
    if (reduxUser?.id || TERMS_MODAL_HIDDEN_PATHS.has(location.pathname)) {
      return;
    }

    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const authHandler = ServiceConfig.getI()?.authHandler;
        const user = await authHandler?.getCurrentUser();
        if (!isMounted || !user?.id) {
          return;
        }

        setCurrentUser(user);
        dispatch(setUser(user));
      } catch (error) {
        logger.error('Failed to resolve user for terms gate', error);
      }
    };

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [dispatch, location.pathname, reduxUser?.id]);

  const effectiveUser = useMemo(() => {
    if (!currentUser?.id) {
      return currentUser;
    }

    const optimisticVersion = optimisticAgreements[currentUser.id] ?? 0;
    if (optimisticVersion <= getUserTcAgreedVersion(currentUser)) {
      return currentUser;
    }

    return {
      ...currentUser,
      is_tc_accepted: true,
      tc_agreed_version: optimisticVersion,
    };
  }, [currentUser, optimisticAgreements]);

  const shouldRequireTerms = needsTermsAgreement(
    effectiveUser,
    requiredTcVersion,
  );
  const shouldDeferTermsModal = TERMS_MODAL_DEFERRED_PATHS.has(
    location.pathname,
  );
  const shouldHideTermsModal = TERMS_MODAL_HIDDEN_PATHS.has(location.pathname);
  const shouldShowTermsModal =
    !shouldHideTermsModal && !shouldDeferTermsModal && shouldRequireTerms;

  const handleAgree = () => {
    if (!effectiveUser?.id || isSubmitting) {
      return;
    }

    const agreedUser: TableTypes<'user'> = {
      ...effectiveUser,
      is_tc_accepted: true,
      tc_agreed_version: requiredTcVersion,
    };

    setIsSubmitting(true);
    setOptimisticAgreements((previous) => ({
      ...previous,
      [effectiveUser.id]: requiredTcVersion,
    }));
    setCurrentUser(agreedUser);
    ServiceConfig.getI().authHandler.currentUser = { ...agreedUser };
    dispatch(setUser(agreedUser));

    void (async () => {
      try {
        await ServiceConfig.getI().apiHandler.updateTcAgreedVersion(
          effectiveUser.id,
          requiredTcVersion,
        );
      } catch (error) {
        logger.error('Failed to persist T&C agreement', error);
      } finally {
        setIsSubmitting(false);
        void Util.logEvent(EVENTS.TC_AGREED, {
          agreed_version: requiredTcVersion,
          ...buildTcAnalyticsContext(effectiveUser),
        });
      }
    })();
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
    if (!currentUser?.id || !shouldShowTermsModal) {
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

  if (!shouldShowTermsModal) {
    return null;
  }

  return (
    <TermsAndCoditionsModal
      isSubmitting={isSubmitting}
      onAgree={handleAgree}
      onTermsClick={handleTermsClick}
      onViewed={handleTermsModalViewed}
    />
  );
};

export default TermsGate;
