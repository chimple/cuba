package org.chimple.bahama;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import com.eidu.integration.ResultItem;
import com.eidu.integration.RunLearningUnitResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.auth.api.phone.SmsRetrieverClient;
import com.google.android.gms.tasks.Task;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "Port")
public class PortPlugin extends Plugin {
  private static String _otp;
  private static PortPlugin instance;
  public PortPlugin() {
    instance = this; // Assign instance when PortPlugin is created
  }
  private static final String TAG = "Logger001";



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
    _otp = otp;
    if (getInstance().bridge != null) {
      getInstance().bridge.triggerDocumentJSEvent("otpReceived", "{ \"otp\": \"" + otp + "\" }");
    }

  }

  @PluginMethod
  public static void sendLaunch(String courseid, String chapterid, String lessonid) {
    if (getInstance().bridge != null) {
      String jsonPayload = "{ \"courseid\": \"" + courseid + "\", \"chapterid\": \"" + chapterid + "\", \"lessonid\": \"" + lessonid + "\" }";
      getInstance().bridge.triggerDocumentJSEvent("sendLaunch", jsonPayload);
    }
  }


  @PluginMethod
  public static void isNumberSelected() {
    if (getInstance().bridge != null) {
      getInstance().bridge.triggerDocumentJSEvent("isPhoneNumberSelected");
    }

  }
  @PluginMethod
  public void otpRetrieve(PluginCall call) {
    JSObject result = new JSObject();
    result.put("otp",_otp);
    call.resolve(result);
  }

  @PluginMethod
  public void requestPermission(PluginCall call) {
    Context appContext = MainActivity.getAppContext();
    SmsRetrieverClient client = SmsRetriever.getClient(appContext /* context */);
    Task<Void> task = client.startSmsRetriever();
    MainActivity.promptPhoneNumbers();
    call.resolve(null);
  }

  @PluginMethod
  public void numberRetrieve(PluginCall call) {
     String phoneNumber =  MainActivity.getPhoneNumber();
      JSObject result = new JSObject();
      result.put("number", phoneNumber);
      call.resolve(result);
  }

  @PluginMethod
  public void lessonEndData(PluginCall call) {
    String phoneNumber =  MainActivity.getPhoneNumber();
    JSObject result = new JSObject();
    result.put("number", phoneNumber);
    call.resolve(result);
  }
  public static PortPlugin getInstance() {
    return instance;
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

  @PluginMethod
  public void launchLesson(PluginCall call) {
    if (MainActivity.instance != null) {
      MainActivity.instance.handleRequest();
      call.resolve();
    } else {
      Log.e("YourTag", "MainActivity instance is null.");
      call.reject("MainActivity instance is null.");
    }
  }


  @PluginMethod
  public void sendLaunchData(PluginCall call) {
    JSObject result = new JSObject();
    Intent curr_intent = instance.getActivity().getIntent();

    // Log all extras in the intent
    Bundle extras = curr_intent.getExtras();
    if (extras != null) {
      for (String key : extras.keySet()) {
        Log.d(TAG, "Intent Extra [" + key + "] = " + extras.get(key));
      }
    } else {
      Log.d(TAG, "No extras found in the intent.");
    }

    // Extract values from the intent
    String learningUnitId = curr_intent.getStringExtra("learningUnitId");
    long inactivityTimeoutInMs = curr_intent.getLongExtra("inactivityTimeoutInMs", -1);

    Log.d(TAG, "Received learningUnitId: " + learningUnitId);
    Log.d(TAG, "Received inactivityTimeoutInMs: " + inactivityTimeoutInMs);

    if (learningUnitId != null && learningUnitId.contains("_")) {
      // Split the learningUnitId into course, chapter, and lesson
      String[] parts = learningUnitId.split("_");
      if (parts.length == 3) {
        String courseId = parts[0];
        String chapterId = parts[1];
        String lessonId = parts[2];

        // Put all values into the result JSObject
        result.put("courseId", courseId);
        result.put("chapterId", chapterId);
        result.put("lessonId", lessonId);
        result.put("inactivityTimeoutInMs", inactivityTimeoutInMs != -1 ? inactivityTimeoutInMs : 0);

        Log.d(TAG, "Result Data: " + result.toString());
        call.resolve(result);
        return;
      } else {
        Log.e(TAG, "Invalid learningUnitId format: " + learningUnitId);
      }
    } else {
      Log.e(TAG, "learningUnitId is missing or not formatted correctly.");
    }

    call.reject("Failed to extract data from intent");
  }


  @PluginMethod
  public void sendDataToNative(PluginCall call) {
    try {
      String eventName = call.getString("eventName");
      JSONObject params = call.getObject("params");

      Log.d("PortPlugin", "🔥 Event received: " + eventName);
      Log.d("PortPlugin", "📊 Parameters: " + params.toString());

      // You can process this data further (e.g., save to local storage, send to another API, etc.)

      // Extract score from params
      int score = params.has("score") ? params.getInt("score") : -1; // Default to -1 if missing
      Log.d("PortPlugin", "🎯 Extracted Score: " + score);

      if(Objects.equals(eventName, "lessonEnd")) {
//        MainActivity.instance.sendResultToEidu((float) score);
      }

      call.resolve(); // Acknowledge successful execution
    } catch (Exception e) {
      call.reject("❌ Error processing event", e);
    }
  }


  @PluginMethod
  public void sendEiduResult(PluginCall call) {
    try {
      String resultType = call.getString("resultType");
      Float score = call.getFloat("score");

      // Ensure duration is not null, default to 0 if missing
      int duration = call.getInt("duration");

      String additionalData = call.getString("additionalData");
      JSONArray itemsArray = call.getArray("items");

      // Convert JSONArray to List<ResultItem>
      List<ResultItem> resultItems = new ArrayList<>();
      if (itemsArray != null) {
        for (int i = 0; i < itemsArray.length(); i++) {
          JSONObject itemObj = itemsArray.getJSONObject(i);
          ResultItem resultItem = ResultItem.fromJson(itemObj); // ✅ Correct conversion
          resultItems.add(resultItem);
        }
      }

      // Create RunLearningUnitResult instance based on resultType
      RunLearningUnitResult result;
      switch (resultType) {
        case "SUCCESS":
          result = RunLearningUnitResult.ofSuccess(score, duration, additionalData, resultItems);
          break;
        case "ABORT":
          result = RunLearningUnitResult.ofAbort(score, duration, additionalData, resultItems);
          break;
        case "TIMEOUT_INACTIVITY":
          result = RunLearningUnitResult.ofTimeoutInactivity(score, duration, additionalData, resultItems);
          break;
        case "TIME_UP":
          result = RunLearningUnitResult.ofTimeUp(score, duration, additionalData, resultItems);
          break;
        case "ERROR":
          String errorDetails = call.getString("errorDetails");
          result = RunLearningUnitResult.ofError(score, duration, errorDetails, additionalData, resultItems);
          break;
        default:
          call.reject("Invalid resultType");
          return;
      }

      // Convert result to Intent and send to EIDU
      Intent intent = result.toIntent();
      getActivity().setResult(Activity.RESULT_OK, intent);
      getActivity().finish();

      call.resolve();
    } catch (Exception e) {
      call.reject("Error sending result to EIDU", e);
    }
  }

}
