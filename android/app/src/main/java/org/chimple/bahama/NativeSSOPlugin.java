package org.chimple.bahama; // Use your correct package name

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

//import world.respect.librespect.RespectConsumerManager;
//import world.respect.librespect.RespectSingleSignOnRequest;
//import world.respect.librespect.RespectSingleSignOnResult;

@CapacitorPlugin(name = "NativeSSOPlugin")
public class NativeSSOPlugin extends Plugin {

//    @PluginMethod
//    public void requestLogin(com.getcapacitor.PluginCall call) {
//        RespectConsumerManager respectConsumerManager = new RespectConsumerManager();
//        RespectSingleSignOnRequest authRequest = new RespectSingleSignOnRequest.Builder()
//                .addScope("oneroster-scopes")
//                .build();
//
//        RespectSingleSignOnResult result = respectConsumerManager.requestSingleSignOn(authRequest);
//        if (result != null) {
//            JSObject ret = new JSObject();
//            ret.put("userId", result.getUserId());
//            ret.put("displayName", result.getDisplayName());
//            ret.put("token", result.getToken().getBearer());
//            call.resolve(ret);
//        } else {
//            call.reject("SSO Failed");
//        }
//    }

    @PluginMethod
    public void requestLogin(com.getcapacitor.PluginCall call) {
        // Get parameters from the JavaScript side
        String givenName = call.getString("givenName", "John"); // Default to "John" if not provided
        String locale = call.getString("locale", "en-US"); // Default to "en-US" if not provided

        // Construct the URL with dynamic parameters
        String url = "https://example.org/topic/learningUnit1/?" +
                "respectLaunchVersion=1" +
                "&auth=[secret]" +
                "&given_name=" + givenName +
                "&locale=" + locale +
                "&http_proxy=http://localhost:8098/" +
                "&endpoint_lti_ags=http://localhost:8097/api/ags" +
                "&endpoint=http://localhost:8097/api/xapi" +
                "&actor={ \"name\" : [\"Project Tin Can\"], \"mbox\" : [\"mailto:tincan@scorm.com\"] }" +
                "&registration=760e3480-ba55-4991-94b0-01820dbd23a2" +
                "&activity_id=https://example.org/topic/learningUnit1/";

        // Create a response object
        JSObject ret = new JSObject();
        ret.put("url", url); // Add the URL to the response

        call.resolve(ret); // Resolve the call with the URL
    }
}
