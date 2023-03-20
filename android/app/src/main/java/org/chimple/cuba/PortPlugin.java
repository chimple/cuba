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
        JSObject ret = new JSObject();
        if(((MainActivity)getActivity()).mHttpOverIpcProxy != null){
            ret.put("port", ((MainActivity)getActivity()).mHttpOverIpcProxy.getListeningPort());
            Log.d("Porting", String.valueOf(((MainActivity)getActivity()).mHttpOverIpcProxy.getListeningPort()));
            call.resolve(ret);
        }
        else{
            //TODO wait if no port found 
            call.reject("Not Found");
        }

    }
}
