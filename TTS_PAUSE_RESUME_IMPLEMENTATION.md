# 🔊 TTS Pause/Resume Implementation Guide

## 📅 Date: 2025-11-19

## ✨ Overview

Implemented proper pause/resume functionality for Text-to-Speech (TTS) in MapScreenV2.tsx. The TTS can now pause at the current position and resume from where it left off, instead of restarting from the beginning.

---

## 🎯 Problem Solved

### **Previous Behavior:**
- ❌ Clicking Pause would stop TTS completely
- ❌ Clicking Resume would restart from the beginning
- ❌ No way to continue from paused position

### **New Behavior:**
- ✅ Clicking Pause saves current position
- ✅ Clicking Resume continues from paused position
- ✅ Clicking Stop resets to beginning
- ✅ Auto-restart when modal opens again

---

## 🛠️ Technical Implementation

### **Challenge:**
`react-native-tts` does not support true pause/resume functionality on all platforms. The native `Tts.pause()` and `Tts.resume()` methods are unreliable.

### **Solution:**
Implemented a **segment-based approach**:
1. Split the full text into smaller segments (sentences)
2. Track which segment is currently playing
3. When paused, save the current segment index
4. When resumed, continue from the saved segment

---

## 📊 New State Variables

```typescript
// TTS state
const [isTtsPlaying, setIsTtsPlaying] = useState(false);
const [isTtsPaused, setIsTtsPaused] = useState(false);
const [ttsTextSegments, setTtsTextSegments] = useState<string[]>([]);
const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
const [isTtsInitialized, setIsTtsInitialized] = useState(false);
```

**Explanation:**
- `ttsTextSegments`: Array of text segments (sentences)
- `currentSegmentIndex`: Index of currently playing segment
- `isTtsInitialized`: Flag to ensure TTS is initialized

---

## 🔧 New Functions

### **1. splitTextIntoSegments(text: string): string[]**
Splits text into sentences for better control.

```typescript
const splitTextIntoSegments = (text: string): string[] => {
  const segments = text
    .split(/([.!?]+\s+)/)
    .filter(segment => segment.trim().length > 0)
    .reduce((acc: string[], curr, index, array) => {
      if (index % 2 === 0 && array[index + 1]) {
        acc.push(curr + array[index + 1]);
      } else if (index % 2 === 0) {
        acc.push(curr);
      }
      return acc;
    }, []);
  
  return segments.length > 0 ? segments : [text];
};
```

### **2. startTtsReading(location: ILocation)**
Starts reading from the beginning, splits text into segments.

```typescript
const startTtsReading = async (location: ILocation) => {
  // ... prepare text ...
  
  // Split text into segments
  const segments = splitTextIntoSegments(textToRead);
  setTtsTextSegments(segments);
  setCurrentSegmentIndex(0);
  
  // Start speaking first segment
  Tts.speak(segments[0]);
  setIsTtsPlaying(true);
  setIsTtsPaused(false);
};
```

### **3. pauseTtsReading()**
Pauses TTS and saves current position.

```typescript
const pauseTtsReading = async () => {
  await Tts.stop();
  setIsTtsPlaying(false);
  setIsTtsPaused(true);
  // currentSegmentIndex is preserved
};
```

### **4. resumeTtsReading()**
Resumes TTS from saved position.

```typescript
const resumeTtsReading = async () => {
  if (ttsTextSegments.length > 0 && currentSegmentIndex < ttsTextSegments.length) {
    // Resume from current segment
    Tts.speak(ttsTextSegments[currentSegmentIndex]);
    setIsTtsPlaying(true);
    setIsTtsPaused(false);
  }
};
```

### **5. stopTtsReading()**
Stops TTS completely and resets to beginning.

```typescript
const stopTtsReading = async () => {
  await Tts.stop();
  setIsTtsPlaying(false);
  setIsTtsPaused(false);
  setCurrentSegmentIndex(0);
  setTtsTextSegments([]);
};
```

---

## 🎨 Button States

### **State 1: Playing**
```
[⏸️ Pause]  [⏹️ Stop]
```
- User can pause or stop
- TTS is actively reading

### **State 2: Paused**
```
[🔊 Resume]  [⏹️ Stop]
```
- User can resume from current position or stop
- TTS is paused, position saved

### **State 3: Stopped**
```
(No buttons shown - auto-restart when modal opens)
```
- TTS is stopped
- Next play will start from beginning

---

## 📝 Event Listener Updates

### **Updated `tts-finish` listener:**
```typescript
Tts.addEventListener('tts-finish', (event) => {
  // When a segment finishes, play the next one
  setCurrentSegmentIndex(prevIndex => {
    const nextIndex = prevIndex + 1;
    if (nextIndex < ttsTextSegments.length) {
      // Play next segment
      setTimeout(() => {
        Tts.speak(ttsTextSegments[nextIndex]);
      }, 100);
      return nextIndex;
    } else {
      // All segments finished
      setIsTtsPlaying(false);
      setIsTtsPaused(false);
      return 0; // Reset to beginning
    }
  });
});
```

**How it works:**
1. When a segment finishes, increment `currentSegmentIndex`
2. If more segments exist, play the next one
3. If all segments finished, reset to beginning

---

## 🎯 User Flow

### **Scenario 1: Normal Playback**
1. User opens modal → TTS starts automatically
2. TTS reads segment 1, 2, 3... until end
3. All segments finish → TTS stops

### **Scenario 2: Pause and Resume**
1. User opens modal → TTS starts (segment 1)
2. TTS is reading segment 3
3. User clicks **Pause** → TTS stops, saves index 3
4. User clicks **Resume** → TTS continues from segment 3
5. TTS reads segment 3, 4, 5... until end

### **Scenario 3: Stop and Restart**
1. User opens modal → TTS starts (segment 1)
2. TTS is reading segment 3
3. User clicks **Stop** → TTS stops, resets to index 0
4. User closes and reopens modal → TTS starts from segment 1

---

## 📊 Files Modified

| File | Changes |
|------|---------|
| `MapScreenV2.tsx` | - Added 3 new state variables<br>- Added `splitTextIntoSegments()` function<br>- Updated `startTtsReading()`<br>- Added `pauseTtsReading()`<br>- Added `resumeTtsReading()`<br>- Updated `stopTtsReading()`<br>- Updated `tts-finish` event listener<br>- Updated button rendering logic |

---

## ✅ Testing Checklist

- [ ] Open modal → TTS starts automatically
- [ ] Click Pause → TTS pauses, shows Resume button
- [ ] Click Resume → TTS continues from paused position (not from beginning)
- [ ] Click Stop → TTS stops completely
- [ ] Close modal → TTS stops automatically
- [ ] Reopen modal → TTS starts from beginning
- [ ] Let TTS finish all segments → TTS stops automatically

---

## 🎉 Summary

Successfully implemented pause/resume functionality for TTS using a segment-based approach. Users can now:
- ✅ Pause TTS at any point
- ✅ Resume from paused position
- ✅ Stop and restart from beginning
- ✅ Enjoy seamless audio playback control

**Developed by: AI Assistant**  
**Date: 2025-11-19**

