package org.chimple.bahama;

import static android.content.Intent.getIntent;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "Port")
public class PortPlugin extends Plugin {
  private static String _otp;


//  @PluginMethod
//  public void getPort(PluginCall call) {
//    try {
//      JSObject ret = new JSObject();
//      if (((MainActivity) getActivity()).mHttpOverIpcProxy != null) {
//        ret.put(
//            "port",
//            ((MainActivity) getActivity()).mHttpOverIpcProxy.getListeningPort());
//        Log.d(
//            "Porting",
//            String.valueOf(
//                ((MainActivity) getActivity()).mHttpOverIpcProxy.getListeningPort()));
//        call.resolve(ret);
//      } else {
//        call.reject("Not Found");
//      }
//    } catch (Exception e) {
//      Log.d("error on portPlugin", e.toString());
//      call.reject(e.toString());
//    }
//  }

  private Bundle notificationExtras;

  @Override
  protected void handleOnNewIntent(Intent data) {
    super.handleOnNewIntent(data);
    Bundle extras = data.getExtras();
    if (extras != null) {
      notificationExtras = new Bundle(extras);
      JSObject eventData = new JSObject();
      for (String key : extras.keySet()) {
        Object value = extras.get(key);
        if (value != null) {
          eventData.put(key, value.toString());
        }
      }
      notifyListeners("notificationOpened", eventData);
    }
  }

  @PluginMethod
  public static void sendOtpData(String otp) {
    System.out.println("KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK"+otp);
    _otp = otp;
    bridge.triggerDocumentJSEvent("otpReceived", "{ \"otp\": \"" + otp + "\" }");

  }
  @PluginMethod
  public void otpRetrieve(PluginCall call) {
    System.out.println("GGGGGGGGGGGGGGGGGGGGGRRRRR"+_otp);
    JSObject result = new JSObject();
    result.put("otp",_otp);
    call.resolve(result);
  }

  @PluginMethod
  public void fetchNotificationData(PluginCall call) {
    JSObject result = new JSObject();

    if (notificationExtras != null) {
      for (String key : notificationExtras.keySet()) {
        Object value = notificationExtras.get(key);
        if (value != null) {
          result.put(key, value.toString());
          Log.d("fetchNotificationData", "Added to result: " + key + " = " + value.toString());
        }
      }
      notificationExtras.clear();
    }

    if (result.length() > 0) {
      call.resolve(result);
    } else {
      call.resolve(new JSObject());
    }
  }

  @SuppressLint("Range")
  @PluginMethod
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
      // String selectQuery = "SELECT * FROM 'data' where key='UserId'";
      String selectQuery = "SELECT * FROM data WHERE `key`='UserId'";

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
          Log.d(
              TAG_NAME,
              "The key contains value '" + obj.get(o).toString() + "'");
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
