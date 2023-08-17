package org.chimple.bahama;

import android.annotation.SuppressLint;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;


import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "Port")
public class PortPlugin extends Plugin {

    @PluginMethod()
    public void getPort(PluginCall call) {
        try {
            JSObject ret = new JSObject();
            if (((MainActivity) getActivity()).mHttpOverIpcProxy != null) {
                ret.put("port", ((MainActivity) getActivity()).mHttpOverIpcProxy.getListeningPort());
                Log.d("Porting", String.valueOf(((MainActivity) getActivity()).mHttpOverIpcProxy.getListeningPort()));
                call.resolve(ret);
            } else {
                call.reject("Not Found");
            }
        } catch (Exception e) {
            Log.d("error on portPlugin", e.toString());
            call.reject(e.toString());
        }
    }

    @SuppressLint("Range")
    @PluginMethod()
    public void getMigrateUsers(PluginCall call) {
        String TAG_NAME = "getMigrateFile";
        String DB_PATH = "/data/data/org.chimple.bahama/databases/";
        Log.d(TAG_NAME, DB_PATH);
        String DB_NAME = "jsb.sqlite";
        Log.d(TAG_NAME, DB_NAME);
        SQLiteDatabase db = SQLiteDatabase.openDatabase(DB_PATH + DB_NAME, null, 0);
        JSObject ret1 = new JSObject();
        List<Object> listOfUsers = new ArrayList<Object>();

        String ret = null;
        try {
            String selectQuery = "SELECT * FROM 'data' where key='UserId'";
            Cursor c = db.rawQuery(selectQuery, null);
            while (c.moveToNext()) {
                // only return the first value
                if (ret != null) {
                    Log.e(TAG_NAME, "The key contains more than one value.");
                    break;
                }
                ret = c.getString(c.getColumnIndex("value"));
                Log.d(TAG_NAME, "The key contains " + ret);
                JSONArray obj = new JSONArray(ret);
                for (int o = 0; o < obj.length(); o++) {
                    Log.d(TAG_NAME, "The key contains value '" + obj.get(o).toString() + "'");
                    String userId = (String) obj.get(o);
                    String selectQuery1 = "SELECT * FROM 'data' where key='" + userId + "'";
                    Cursor c1 = db.rawQuery(selectQuery1, null);
                    String reg = null;
                    while (c1.moveToNext()) {
                        // only return the first value
                        if (reg != null) {
                            Log.e(TAG_NAME, "The key contains more than one value. reg");
                            break;
                        }
                        reg = c1.getString(c.getColumnIndex("value"));
                        Log.d(TAG_NAME, "The key contains reg " + reg);
                        listOfUsers.add(new JSONObject(reg));
                    }
                }
            }
            c.close();
            ret1.put("users", listOfUsers);
            call.resolve(ret1);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject(e.toString());

        }


    }
}
