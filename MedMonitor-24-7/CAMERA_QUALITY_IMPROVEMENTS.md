# 🏥 Camera Quality Improvements - Complete

## ✅ What Was Created

### 1. **camera_hd.py** - High-Quality Camera Capture Service
Advanced preprocessing pipeline with the following features:

**Camera Hardware Optimization:**
- ✅ Force 1920x1080 Full HD resolution
- ✅ Force MJPEG codec (`cv2.VideoWriter_fourcc('MJPG')`)
- ✅ Reduce auto exposure (`CAP_PROP_AUTO_EXPOSURE = 0.25`, `EXPOSURE = -6`)
- ✅ Manual focus and autofocus disabled
- ✅ Optimized brightness, contrast, saturation
- ✅ Buffer size minimized to reduce lag
- ✅ Camera warmup (30 frames before streaming)

**Advanced Image Enhancement Pipeline:**
- ✅ **Denoising**: `fastNlMeansDenoisingColored()` - removes noise while preserving edges
- ✅ **LAB Color Space**: Convert to LAB for better processing
- ✅ **CLAHE Contrast**: Clip Limit Adaptive Histogram Equalization on L-channel
- ✅ **Sharpening Kernel**: 9-point kernel for digit clarity
- ✅ **Bilateral Filter**: Reduce noise while keeping edges sharp

**HTTP Endpoints:**
- `http://localhost:8000/stream` - Raw camera stream
- `http://localhost:8000/stream-enhanced` - Enhanced & processed stream
- `http://localhost:8000/snapshot` - Single raw frame
- `http://localhost:8000/snapshot-enhanced` - Single enhanced frame
- `http://localhost:8000/health` - Health check

### 2. **ocr_optimized.py** - Advanced OCR with ROI Extraction

**Features:**
- ✅ Fetches enhanced frames from camera service
- ✅ **ROI Extraction**: Specific regions for each vital sign:
  - HR (Heart Rate): Top right
  - SpO2: Upper right
  - BP (Blood Pressure): Left middle
  - RR (Respiratory Rate): Right middle
  - Temp: Right lower
  - Pulse: Center
  - etCO2: Right lower

- ✅ **Upscaling**: 2x cubic interpolation for better OCR
- ✅ **Adaptive Thresholding**: For varying lighting conditions
- ✅ **EasyOCR Whitelist**: Digits only `'0123456789./'`
- ✅ **Value Validation**:
  - HR: 40-220 bpm
  - SpO2: 70-100%
  - RR: 5-40
  - Temp: 30-110
  - BP: xxx/xx format validation
  - etCO2: 0-100

- ✅ **Confidence Threshold**: 0.4+
- ✅ **Debug Mode**: Saves ROI images automatically
- ✅ **Continuous Processing**: Extracts every 5 seconds
- ✅ **JSON Output**: Saves to `vital_signs_latest.json`

---

## 🚀 How to Run

### Step 1: Start Camera Service
```batch
START_CAMERA_HD.bat
```
Wait for: `🚀 Flask Server Ready!`

The camera will:
1. Detect USB camera
2. Force 1920x1080 resolution
3. Set MJPEG codec
4. Optimize exposure
5. Warm up (30 frames)
6. Stream enhanced frames

### Step 2: Start OCR Service (In New Terminal)
```batch
START_OCR_OPTIMIZED.bat
```

The OCR will:
1. Connect to camera service
2. Fetch enhanced frames every 5 seconds
3. Extract ROI for each vital sign
4. Validate and save to JSON
5. Display results in console

---

## 📊 Expected Output

### Console Output (OCR Service):
```
[Iteration #1] 16:49:25
----------------------------------------------------------------------

✅ VITAL SIGNS EXTRACTED:

   ❤️  Heart Rate: 127 bpm
   🫁 SpO2: 100 %
   💉 Blood Pressure: 138/83 
   🌬️  Respiratory Rate: 16 
   🌡️  Temperature: 102.8 °C
   💓 Pulse: 126 bpm
   💨 etCO2: 61 

✅ Saved to vital_signs_latest.json

⏳ Waiting 5 seconds...
```

### JSON Output (vital_signs_latest.json):
```json
{
  "heart_rate": 127,
  "spo2": 100,
  "blood_pressure": "138/83",
  "respiratory_rate": 16,
  "temperature": 102.8,
  "pulse": 126,
  "etco2": 61,
  "timestamp": "2025-05-25T16:49:25.020976"
}
```

---

## 🔍 Debug Mode

If you want to save cropped ROI images for inspection, the OCR will automatically save them to `ocr_debug_images/` folder:
- `roi_hr_*.jpg` - Heart rate region
- `roi_spo2_*.jpg` - SpO2 region
- `roi_bp_*.jpg` - Blood pressure region
- etc.

---

## 📸 Visual Quality Check

While services are running:
1. **Open browser**: http://localhost:8000/stream-enhanced
2. Check if digits are:
   - ✅ Sharp and clear
   - ✅ High contrast (white/bright on dark)
   - ✅ Large and readable
   - ✅ No blur or glare

If not optimal, adjust ROI coordinates in `ocr_optimized.py` based on your specific monitor layout.

---

## 🔧 Fine-Tuning

### If Extraction Still Low:
1. **Check camera settings** in `camera_hd.py`:
   - Line 61: `cap.set(cv2.CAP_PROP_EXPOSURE, -6)` - try -8, -10, -12
   - Line 65: `cap.set(cv2.CAP_PROP_BRIGHTNESS, 30)` - adjust 0-100
   - Line 66: `cap.set(cv2.CAP_PROP_CONTRAST, 90)` - adjust 0-100

2. **Adjust ROI regions** in `ocr_optimized.py`:
   - Line 115-125: `roi_map` coordinates
   - Take screenshots and measure where digits actually appear

3. **Increase upscaling** in `ocr_optimized.py`:
   - Line 149: Change `scale=2` to `scale=3`

4. **Lower confidence threshold**:
   - Line 154: Change `confidence > 0.4` to `0.3`

---

## 🎯 Key Improvements vs. Old Version

| Feature | Old | New |
|---------|-----|-----|
| Resolution | Variable | **1920x1080 forced** |
| Codec | Unknown | **MJPEG forced** |
| Exposure | Auto | **Manual -6** |
| Preprocessing | None | **Full pipeline** |
| Denoising | No | **fastNlMeansDenoising** |
| Contrast | No | **CLAHE on LAB** |
| Sharpening | No | **9-point kernel** |
| OCR on | Full image | **ROI cropped** |
| Upscaling | No | **2x cubic** |
| Whitelist | No | **Digits only** |
| Confidence | 0.3 | **0.4** |

---

## ⚠️ Troubleshooting

### "No camera available!"
- Check USB camera is connected
- Try changing camera index in line 50: `cap = cv2.VideoCapture(1)` to `0` or `2`

### "Connection refused" when starting OCR
- Make sure camera service is running first
- Check http://localhost:8000/health returns OK

### All values are null
- Camera service is running but not capturing
- Check http://localhost:8000/snapshot-enhanced loads an image
- Verify ROI coordinates are correct for your monitor

### Values are wrong
- ROI regions are outside actual digit areas
- Adjust coordinates in `roi_map` (line 115)
- Check debug images in `ocr_debug_images/` folder

---

## 📝 Files Created

1. ✅ `camera_hd.py` - High-quality camera service (8.2 KB)
2. ✅ `ocr_optimized.py` - Advanced OCR with ROI (10.5 KB)
3. ✅ `START_CAMERA_HD.bat` - Quick launcher for camera
4. ✅ `START_OCR_OPTIMIZED.bat` - Quick launcher for OCR

---

## 🎉 Next Steps

1. Start both services
2. Check visual quality on http://localhost:8000/stream-enhanced
3. Verify JSON output
4. Fine-tune ROI coordinates if needed
5. Monitor continuous extraction for 1-2 minutes

Success target: All 7 vital signs extracted with correct values! ✅
