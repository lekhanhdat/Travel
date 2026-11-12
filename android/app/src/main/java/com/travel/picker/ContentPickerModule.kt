package com.travel.picker

import android.app.Activity
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

/**
 * Fallback image picker used when the system photo picker (PICK_IMAGES) is missing
 * (react-native-image-picker then fails with "No Activity found"). Opens the generic
 * content chooser and copies the chosen image into the cache, returning an asset shaped
 * like react-native-image-picker's: { uri, fileName, type, fileSize, width, height }.
 */
class ContentPickerModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), ActivityEventListener {

  private var pending: Promise? = null

  init {
    context.addActivityEventListener(this)
  }

  override fun getName() = "ContentPicker"

  @ReactMethod
  fun pickImage(promise: Promise) {
    val activity = context.currentActivity
    if (activity == null) {
      promise.reject("no_activity", "No activity")
      return
    }
    pending?.reject("cancelled", "Superseded")
    pending = promise
    val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "image/*"
    }
    try {
      activity.startActivityForResult(Intent.createChooser(intent, null), REQUEST)
    } catch (e: Exception) {
      pending = null
      promise.reject("unavailable", e.message)
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST) return
    val promise = pending ?: return
    pending = null
    val uri = data?.data
    if (resultCode != Activity.RESULT_OK || uri == null) {
      promise.resolve(null) // cancelled
      return
    }
    try {
      promise.resolve(copyToCache(uri))
    } catch (e: Exception) {
      promise.reject("read_failed", e.message)
    }
  }

  override fun onNewIntent(intent: Intent) {}

  private fun copyToCache(uri: Uri): com.facebook.react.bridge.WritableMap {
    val resolver = context.contentResolver
    val type = resolver.getType(uri) ?: "image/jpeg"
    var name = "picked_${System.currentTimeMillis()}.${type.substringAfter('/', "jpg")}"
    resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
      if (it.moveToFirst() && !it.isNull(0)) name = it.getString(0)
    }
    val out = File(context.cacheDir, "picked_${System.currentTimeMillis()}_$name")
    resolver.openInputStream(uri).use { input ->
      requireNotNull(input) { "Cannot open $uri" }
      out.outputStream().use { input.copyTo(it) }
    }
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(out.absolutePath, bounds)
    return Arguments.createMap().apply {
      putString("uri", Uri.fromFile(out).toString())
      putString("fileName", name)
      putString("type", type)
      putDouble("fileSize", out.length().toDouble())
      putInt("width", bounds.outWidth)
      putInt("height", bounds.outHeight)
    }
  }

  companion object {
    private const val REQUEST = 47_101
  }
}
