package org.chimple.bahama; // Use your correct package name

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import world.respect.librespect.RespectConsumerManager;
import world.respect.librespect.RespectSingleSignOnRequest;
import world.respect.librespect.RespectSingleSignOnResult;

@CapacitorPlugin(name = "NativeSSOPlugin")
public class NativeSSOPlugin extends Plugin {

    @PluginMethod
    public void requestLogin(com.getcapacitor.PluginCall call) {
        RespectConsumerManager respectConsumerManager = new RespectConsumerManager();
        RespectSingleSignOnRequest authRequest = new RespectSingleSignOnRequest.Builder()
                .addScope("oneroster-scopes")
                .build();

        RespectSingleSignOnResult result = respectConsumerManager.requestSingleSignOn(authRequest);
        if (result != null) {
            JSObject ret = new JSObject();
            ret.put("userId", result.getUserId());
            ret.put("displayName", result.getDisplayName());
            ret.put("token", result.getToken().getBearer());
            call.resolve(ret);
        } else {
            call.reject("SSO Failed");
        }
    }
}
