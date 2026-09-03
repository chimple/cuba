package org.chimple.bahama;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

/** Shows the launch artwork before Capacitor creates its web view. */
public final class SplashActivity extends Activity {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable launchMainActivity = () -> {
        startActivity(new Intent(this, MainActivity.class));
        finish();
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
        handler.postDelayed(
            launchMainActivity,
            getResources().getInteger(R.integer.splash_screen_duration_ms)
        );
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(launchMainActivity);
        super.onDestroy();
    }
}
