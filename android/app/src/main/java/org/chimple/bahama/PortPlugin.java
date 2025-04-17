package org.chimple.bahama;

import static android.content.Intent.getIntent;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.widget.Toast;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.auth.api.phone.SmsRetrieverClient;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;


@CapacitorPlugin(name = "Port")
public class PortPlugin extends Plugin {
  private static String _otp;
  private static PortPlugin instance;
  private String fileDataStorage = null;
  public PortPlugin() {
    instance = this; // Assign instance when PortPlugin is created
  }

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
    SmsRetrieverClient client = SmsRetriever.getClient(appContext);
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
    public void saveProceesedXlsxFile(PluginCall call) {
        String fileData = call.getString("fileData"); // Base64 encoded file data
        if (fileData == null || fileData.isEmpty()) {
            call.reject("No file data provided");
            return;
        }

        // ✅ Store file data for later use
        fileDataStorage = fileData;

        // ✅ Open system file picker to save the file
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        intent.putExtra(Intent.EXTRA_TITLE, "ProcessedFile.xlsx");

        call.setKeepAlive(true);
        startActivityForResult(call, intent, "handleFileSaveResult");
    }

    @ActivityCallback
    private void handleFileSaveResult(PluginCall call, ActivityResult result) {
        if (call == null || result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("File save cancelled");
            return;
        }

        Uri uri = result.getData().getData();
        if (uri == null) {
            call.reject("Invalid file URI");
            return;
        }

        if (fileDataStorage == null) {
            call.reject("File data is missing");
            return;
        }

        try (OutputStream outputStream = getContext().getContentResolver().openOutputStream(uri);
             BufferedOutputStream bos = new BufferedOutputStream(outputStream)) {

            byte[] fileBytes = Base64.decode(fileDataStorage, Base64.NO_WRAP);
            bos.write(fileBytes);
            bos.flush();

            fileDataStorage = null; // ✅ Clear stored data after writing
            Toast.makeText(getContext(), "File saved successfully", Toast.LENGTH_SHORT).show();
            call.resolve();
        } catch (IOException e) {
            call.reject("Error saving file: " + e.getMessage());
        }
    }
}


