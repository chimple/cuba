import React, { useEffect, useState } from 'react';

const shouldShowOpenApkSplash = import.meta.env.VITE_OPEN_APK_SPLASH === 'true';
const splashSrc = 'assets/open-apk-splash.png';
const splashDurationMs = 1000;

const OpenApkStartupSplash: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [showSplash, setShowSplash] = useState(shouldShowOpenApkSplash);

  useEffect(() => {
    if (!shouldShowOpenApkSplash) return;

    const timeoutId = window.setTimeout(
      () => setShowSplash(false),
      splashDurationMs,
    );

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!showSplash) return <>{children}</>;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        alignItems: 'center',
        background: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <img
        src={splashSrc}
        alt=""
        style={{
          height: '100vh',
          objectFit: 'cover',
          width: '100%',
        }}
      />
    </div>
  );
};

export default OpenApkStartupSplash;
