import { Util } from '../utility/util';

export const createLoginCredentialAuthHandlers = (ctx: any) => {
  const {
    ACTION,
    DOMAIN,
    EVENTS,
    LOGIN_TYPES,
    RoleType,
    authInstance,
    dispatch,
    email,
    getSchoolsForUser,
    latestTcVersion,
    online,
    password,
    presentToast,
    redirectUser,
    schoolCode,
    setAnimatedLoading,
    setAuthError,
    setAuthLoading,
    setAuthUser,
    setEmail,
    setGbUpdated,
    setIsOpsUser,
    setPassword,
    setSchoolCode,
    setStudentCredentialLogin,
    setStudentId,
    setStudentPassword,
    setUser,
    setUserRoles,
    studentId,
    studentPassword,
    t,
    updateLocalAttributes,
  } = ctx;
  // Handler for student credentials login
  const handleStudentLogin = async () => {
    setStudentCredentialLogin(false);
    try {
      if (!online) {
        presentToast({
          message: t(
            'Device is offline. Login requires an internet connection',
          ),
          color: 'danger',
          duration: 3000,
          position: 'bottom',
          buttons: [{ text: 'Dismiss', role: 'cancel' }],
        });
        return;
      }

      setAnimatedLoading(true);
      dispatch(setAuthLoading(true));
      const {
        user: authUser,
        success: result,
        isSpl: isOps,
        userData,
      } = await authInstance.loginWithEmailAndPassword(
        schoolCode.trimEnd() + studentId.trimEnd() + DOMAIN,
        studentPassword.trimEnd(),
        latestTcVersion,
      );
      if (!authUser || !result || !userData || !userData.id) {
        setStudentCredentialLogin(true);
        setAnimatedLoading(false);
        dispatch(setAuthLoading(false));
        dispatch(
          setAuthError({
            key: LOGIN_TYPES.STUDENT,
            message: 'Incorrect credentials - Please check & try again!',
          }),
        );
        return;
      }
      dispatch(setAuthLoading(false));
      dispatch(setAuthUser(authUser));
      dispatch(setUser(userData));
      dispatch(setIsOpsUser(isOps));
      await setUserRoles(userData.id);
      const userSchools = await getSchoolsForUser(userData.id);
      await redirectUser(userSchools, isOps);
      const studentDetails = {
        ...userData,
        parent_id: userData.id,
        last_sign_in_at: authUser.last_sign_in_at,
        login_method: 'student-credentials',
      };
      updateLocalAttributes({
        studentDetails,
      });
      setGbUpdated(true);
      // Log the login event
      Util.logEvent(EVENTS.USER_PROFILE, {
        user_id: userData.id,
        user_name: userData.name,
        user_type: RoleType.STUDENT,
        action_type: ACTION.LOGIN,
        login_type: 'student-credentials',
      });
    } catch (error) {
      setStudentCredentialLogin(true);
      setAnimatedLoading(false);
      dispatch(setAuthLoading(false));
      dispatch(
        setAuthError({
          key: LOGIN_TYPES.STUDENT,
          message: 'Login unsuccessful. Please try again later.',
        }),
      );
      // Abort the student login process
      setSchoolCode('');
      setStudentId('');
      setStudentPassword('');
    }
  };

  // Handler for email login
  const handleEmailLogin = async (email: string, password: string) => {
    try {
      if (!online) {
        presentToast({
          message: t(
            'Device is offline. Login requires an internet connection',
          ),
          color: 'danger',
          duration: 3000,
          position: 'bottom',
          buttons: [{ text: 'Dismiss', role: 'cancel' }],
        });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        dispatch(
          setAuthError({
            key: LOGIN_TYPES.EMAIL,
            message: 'Please enter a valid email address',
          }),
        );
        return;
      }

      // Password validation
      if (password.length < 6 || /\s/.test(password)) {
        dispatch(
          setAuthError({
            key: LOGIN_TYPES.EMAIL,
            message: 'Password must be at least 6 characters',
          }),
        );
        return;
      }

      setAnimatedLoading(true);
      dispatch(setAuthLoading(true));
      const {
        user: authUser,
        success: result,
        isSpl: isOpsUser,
        userData,
      } = await authInstance.signInWithEmail(email, password, latestTcVersion);

      if (authUser && result && userData && userData.id) {
        dispatch(setAuthLoading(false));
        dispatch(setAuthUser(authUser));
        dispatch(setUser(userData));
        dispatch(setIsOpsUser(isOpsUser));
        await setUserRoles(userData.id);

        const userSchools = await getSchoolsForUser(userData.id);
        await redirectUser(userSchools, isOpsUser);

        setAnimatedLoading(false);
        const studentDetails = {
          ...userData,
          parent_id: userData.id,
          last_sign_in_at: authUser.last_sign_in_at,
          login_method: 'email-password',
        };
        updateLocalAttributes({
          studentDetails,
        });
        setGbUpdated(true);
        // Log the login event
        Util.logEvent(EVENTS.USER_PROFILE, {
          user_id: userData.id,
          user_name: userData.name,
          user_type: RoleType.PARENT,
          action_type: ACTION.LOGIN,
          login_type: LOGIN_TYPES.EMAIL,
        });
      } else {
        setAnimatedLoading(false);
        dispatch(setAuthLoading(false));
        dispatch(
          setAuthError({
            key: LOGIN_TYPES.EMAIL,
            message: 'Incorrect credentials - Please check & try again!',
          }),
        );
        // Abort the email login process
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setAnimatedLoading(false);
      dispatch(setAuthLoading(false));
      dispatch(
        setAuthError({
          key: LOGIN_TYPES.EMAIL,
          message: 'Login unsuccessful. Please try again later.',
        }),
      );
      // Abort the email login process
      setEmail('');
      setPassword('');
    }
  };

  return {
    handleEmailLogin,
    handleStudentLogin,
  };
};
