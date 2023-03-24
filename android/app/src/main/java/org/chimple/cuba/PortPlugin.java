package org.chimple.cuba;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Port")
public class PortPlugin extends Plugin {

    @PluginMethod()
    public void getPort(PluginCall call) {
        try {
            JSObject ret = new JSObject();
            if(((MainActivity)getActivity()).mHttpOverIpcProxy != null){
                ret.put("port", ((MainActivity)getActivity()).mHttpOverIpcProxy.getListeningPort());
                Log.d("Porting", String.valueOf(((MainActivity)getActivity()).mHttpOverIpcProxy.getListeningPort()));
                call.resolve(ret);
            }
            else{
                call.reject("Not Found");
            }
        }
        catch (Exception e){
            Log.d("error on portPlugin",e.toString());
            call.reject(e.toString());
        }
    }
}
