package org.chimple.bahama;

import static android.content.Intent.getIntent;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "Port")
public class PortPlugin extends Plugin {

//  @PluginMethod
//  public void getPort(PluginCall call) {
//    try {
//      JSObject ret = new JSObject();
//      if (((MainActivity) getActivity()).mHttpOverIpcProxy != null) {
//        ret.put(
//          "port",
//          ((MainActivity) getActivity()).mHttpOverIpcProxy.getListeningPort()
//        );
//        Log.d(
//          "Porting",
//          String.valueOf(
//            ((MainActivity) getActivity()).mHttpOverIpcProxy.getListeningPort()
//          )
//        );
//        call.resolve(ret);
//      } else {
//        call.reject("Not Found");
//      }
//    } catch (Exception e) {
//      Log.d("error on portPlugin", e.toString());
//      call.reject(e.toString());
//    }
//  }

  private String notificationType;
  private String rewardProfileId;

  @Override
  protected void handleOnNewIntent(Intent data) {
    super.handleOnNewIntent(data);
    Bundle extras = data.getExtras();
    if (extras != null) {
      this.notificationType = extras.getString("notificationType");
      this.rewardProfileId = extras.getString("rewardProfileId");
      JSObject eventData = new JSObject();
      eventData.put("notificationType", notificationType);
      eventData.put("rewardProfileId", rewardProfileId);
      notifyListeners("notificationOpened", eventData);
    }
  }

  @PluginMethod
  public void fetchNotificationData(PluginCall call) {
    String notificationType = this.notificationType;
    String rewardProfileId = this.rewardProfileId;
    Log.d("MainActivity", "logs of fetchNotificationData" + rewardProfileId);
    if (notificationType != null && rewardProfileId != null) {
      String jsonData =
        "{\"notificationType\": \"" +
        notificationType +
        "\", \"rewardProfileId\": \"" +
        rewardProfileId +
        "\"}";
    } else {
      Log.d("MainActivity", "Notification data not found");
    }
    if (notificationType != null && rewardProfileId != null) {
      JSObject result = new JSObject();
      result.put("notificationType", notificationType);
      result.put("rewardProfileId", rewardProfileId);
      call.resolve(result);
      this.notificationType = null;
      this.rewardProfileId = null;
    } else {
      call.reject("Data not found in Java code");
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
      //      String selectQuery = "SELECT * FROM 'data' where key='UserId'";
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
            "The key contains value '" + obj.get(o).toString() + "'"
          );
          String userId = (String) obj.get(o);
          String selectQuery1 =
            "SELECT * FROM 'data' where key='" + userId + "'";
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
  
@PluginMethod
public void shareContentWithAndroidShare(PluginCall call) {
    try {
        String text = call.getString("text");
        String url = call.getString("url") != null ? call.getString("url") : "";
        String title = call.getString("title");

        JSObject imageFileObject = call.getObject("imageFile"); // Expecting a File in JSON format

        Intent sendIntent = new Intent();
        sendIntent.setAction(Intent.ACTION_SEND);
        sendIntent.putExtra(Intent.EXTRA_TEXT, text + "\n\n" + url);
        sendIntent.setType("text/plain");

        // Check if an imageFile is provided, and convert it to a Uri for sharing
        if (imageFileObject != null) {
            String fileName = imageFileObject.getString("name");
            String filePath = imageFileObject.getString("path"); // Assuming the file path is accessible here

            File imageFile = new File(filePath);
            if (imageFile.exists()) {
                Uri imageUri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        imageFile
                );
                sendIntent.putExtra(Intent.EXTRA_STREAM, imageUri);
                sendIntent.setType("image/*");
                sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                call.reject("Image file does not exist at provided path");
                return;
            }
        }

        Intent shareIntent = Intent.createChooser(sendIntent, title);
        getContext().startActivity(shareIntent);

        call.resolve();
    } catch (Exception e) {
        e.printStackTrace();
        call.reject("Failed to share content: " + e.toString());
    }
}
    @PluginMethod
    public void shareUserId(PluginCall call) {
        try {
            String userId = call.getString("userId");
            if (userId != null) {
                SharedPreferences sharedPreferences = getContext().getSharedPreferences("AppPreferences", Context.MODE_PRIVATE);
                SharedPreferences.Editor editor = sharedPreferences.edit();
                editor.putString("userId", userId);
                editor.apply();
                call.resolve();
            } else {
                call.reject("Key required");
            }
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to share content: " + e.toString());
        }
    }

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
