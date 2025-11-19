# 🔊 Text-to-Speech (TTS) Feature - Updated Version

## 📅 Date: 2025-11-19 (Updated)

## ✨ Overview

Text-to-Speech (TTS) functionality in MapScreenV2 modal that automatically reads location information in Vietnamese when users click the "Xem" (View) button.

---

## 🎯 Recent Updates (2025-11-19)

### **1. Replaced Material Icons with Custom SVG Icons** ✅
- **Before**: Used `IconButton` from `react-native-paper` with Material Design icons
- **After**: Using custom SVG icons from `Travel/src/assets/assets/svg/`:
  - `Volume.svg` - Play/Restart button (speaker icon)
  - `CirclePause.svg` - Pause button (pause icon with circle)
  - `Circle.svg` - Stop button (circle icon, red color)

### **2. Relocated TTS Control Buttons** ✅
- **Before**: Buttons were in the modal header next to location name
- **After**: Buttons are now BELOW the 4 main menu buttons:
  - "Thông tin chi tiết" (Details)
  - "Lễ hội tại đây" (Festivals here)
  - "Hình ảnh & Video" (Images & Videos)
  - "Quy tắc ứng xử văn minh" (Civilized behavior rules)
- **Layout**: Buttons arranged in a horizontal row with centered alignment

### **3. Fixed Pause Button Functionality** ✅
- **Problem**: Pause button didn't work (TTS kept playing)
- **Root Cause**: `react-native-tts` pause/resume not reliably supported on all platforms
- **Solution**: Changed pause behavior:
  - **Pause**: Stops TTS and sets `isTtsPaused = true`
  - **Resume**: Restarts TTS from the beginning (not from pause point)
- **Note**: This is a workaround since true pause/resume is not available

---

## 🎨 UI Design

### **Button Layout**
```
┌─────────────────────────────────────────┐
│         Nhà Văn Hóa Sơn Trà             │
│                                         │
│  Description text...                    │
│  Address...                             │
│  [Image]                                │
│                                         │
│  [Thông tin chi tiết]                   │
│  [Lễ hội tại đây]                       │
│  [Hình ảnh & Video]                     │
│  [Quy tắc ứng xử văn minh]              │
│                                         │
│      [🔊]  [⏸️]  [⏹️]                   │  ← TTS Controls
│                                         │
└─────────────────────────────────────────┘
```

### **Button States**
- **Not Playing**: Shows 🔊 (Volume/Play) button only
- **Playing**: Shows ⏸️ (CirclePause) and ⏹️ (Circle/Stop) buttons
- **Paused**: Shows 🔊 (Volume/Resume) button only

### **Button Styling**
```typescript
// Play/Resume Button
- Background: colors.primary_100 (light primary color)
- Icon: Volume.svg with colors.primary_600
- Size: 50x50 with 30x30 icon
- Border radius: 50 (circular)

// Pause Button
- Background: colors.primary_100
- Icon: CirclePause.svg with colors.primary_600
- Size: 50x50 with 30x30 icon
- Border radius: 50 (circular)

// Stop Button
- Background: #FFEBEE (light red)
- Icon: Circle.svg with #F44336 (red)
- Size: 50x50 with 30x30 icon
- Border radius: 50 (circular)
```

---

## 🛠️ Technical Implementation

### **SVG Icons Used**
```typescript
import {
  BackSvg,
  CirclePlay,
  CirclePause,
  Circle,
  Volume
} from '../../../assets/assets/ImageSvg';
```

### **Key Changes in Code**

#### **1. Removed IconButton**
```typescript
// Before
import {Button, Modal, IconButton} from 'react-native-paper';

// After
import {Button, Modal} from 'react-native-paper';
```

#### **2. Updated toggleTtsPause() Function**
```typescript
const toggleTtsPause = async () => {
  try {
    if (isTtsPaused) {
      // Resume - restart reading from beginning
      if (selectedLocation) {
        await startTtsReading(selectedLocation);
      }
      setIsTtsPaused(false);
    } else {
      // Pause - stop TTS but keep paused state
      await Tts.stop();
      setIsTtsPlaying(false);
      setIsTtsPaused(true);
    }
  } catch (error) {
    console.error('Error toggling TTS pause:', error);
  }
};
```

#### **3. New TTS Buttons with SVG**
```typescript
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: sizes._16sdp,
  gap: sizes._16sdp,
}}>
  {/* Play/Resume Button */}
  {(!isTtsPlaying || isTtsPaused) && (
    <TouchableOpacity onPress={...}>
      <Volume width={sizes._30sdp} height={sizes._30sdp} fill={colors.primary_600} />
    </TouchableOpacity>
  )}
  
  {/* Pause Button */}
  {isTtsPlaying && !isTtsPaused && (
    <TouchableOpacity onPress={toggleTtsPause}>
      <CirclePause width={sizes._30sdp} height={sizes._30sdp} fill={colors.primary_600} />
    </TouchableOpacity>
  )}
  
  {/* Stop Button */}
  {isTtsPlaying && (
    <TouchableOpacity onPress={stopTtsReading}>
      <Circle width={sizes._30sdp} height={sizes._30sdp} fill="#F44336" />
    </TouchableOpacity>
  )}
</View>
```

---

## 📊 Files Modified

| File | Changes |
|------|---------|
| `MapScreenV2.tsx` | - Added SVG imports<br>- Removed IconButton import<br>- Updated toggleTtsPause()<br>- Moved TTS buttons below menu<br>- Replaced IconButton with TouchableOpacity + SVG |

---

## 🎉 Summary

All 3 requested improvements have been successfully implemented:
1. ✅ **SVG Icons**: Replaced Material icons with custom SVG icons from the app's assets
2. ✅ **Relocated Buttons**: Moved TTS controls from header to below the 4 menu buttons
3. ✅ **Fixed Pause**: Pause button now works (stops TTS, resume restarts from beginning)

**Developed by: AI Assistant**  
**Date: 2025-11-19**

