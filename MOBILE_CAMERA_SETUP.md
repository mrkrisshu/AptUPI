# Mobile Camera Access Setup Guide

## Issue: Camera Not Working on Mobile Devices

The QR scanner requires camera access, which has specific requirements on mobile devices. This guide provides solutions to enable camera access.

## Root Cause

Mobile browsers require **HTTPS** for camera access due to security policies. When accessing the app via HTTP (like `http://192.168.1.119:3001`), camera permissions are blocked.

## Solutions

### Solution 1: Use Localhost (Recommended for Testing)

1. **On the same device (computer):**
   - Access: `http://localhost:3001`
   - Camera should work as localhost is exempt from HTTPS requirement

### Solution 2: Enable HTTPS for Local Development

1. **Install mkcert for local HTTPS certificates:**
   ```bash
   # Install mkcert (Windows)
   choco install mkcert
   # OR download from: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Create local certificates:**
   ```bash
   mkcert -install
   mkcert localhost 192.168.1.119
   ```

3. **Use the HTTPS development script:**
   ```bash
   npm run dev:https
   ```

4. **Access via HTTPS:**
   - Local: `https://localhost:3001`
   - Network: `https://192.168.1.119:3001`

### Solution 3: Use ngrok for Public HTTPS URL

1. **Install ngrok:**
   ```bash
   # Download from: https://ngrok.com/download
   # OR install via npm
   npm install -g ngrok
   ```

2. **Create tunnel:**
   ```bash
   ngrok http 3001
   ```

3. **Use the provided HTTPS URL:**
   - Example: `https://abc123.ngrok.io`

### Solution 4: Deploy to HTTPS Hosting

1. **Deploy to platforms with automatic HTTPS:**
   - Vercel: `vercel --prod`
   - Netlify: Connect GitHub repository
   - Railway: `railway deploy`

## Mobile Browser Permissions

### Chrome Mobile
1. Tap the lock icon in address bar
2. Select "Permissions"
3. Enable "Camera"
4. Refresh the page

### Safari Mobile
1. Go to Settings > Safari > Camera
2. Select "Ask" or "Allow"
3. Refresh the page

### Firefox Mobile
1. Tap the shield icon
2. Select "Permissions"
3. Enable "Camera"
4. Refresh the page

## Troubleshooting

### Camera Still Not Working?

1. **Check HTTPS:** Ensure you're using `https://` not `http://`
2. **Clear browser cache:** Hard refresh (Ctrl+Shift+R)
3. **Check permissions:** Allow camera access when prompted
4. **Try different browser:** Test with Chrome, Safari, Firefox
5. **Check camera usage:** Close other apps using camera
6. **Restart browser:** Close and reopen browser app

### Error Messages

- **"Camera access requires HTTPS"** → Use HTTPS solution above
- **"Camera access denied"** → Check browser permissions
- **"No camera found"** → Check if camera is available/working
- **"Camera not supported"** → Try different browser

## Quick Test

1. **Test camera access:**
   - Open browser developer tools (F12)
   - Go to Console tab
   - Run: `navigator.mediaDevices.getUserMedia({video: true})`
   - Should show camera stream or permission prompt

2. **Test QR scanner:**
   - Navigate to the app
   - Click "Scan QR to Pay"
   - Allow camera permissions
   - Camera should activate

## Current App Improvements

The QR scanner component has been enhanced with:

✅ **Better error handling** - Specific error messages for different issues
✅ **Permission checking** - Explicit camera permission requests
✅ **HTTPS detection** - Warns when HTTPS is required
✅ **Mobile optimization** - Prefers back camera on mobile devices
✅ **User guidance** - Clear instructions for mobile users
✅ **Refresh option** - Easy way to retry camera access

## Production Deployment

For production deployment, ensure:

1. **SSL Certificate** - Valid HTTPS certificate
2. **Domain Setup** - Proper domain configuration
3. **Camera Permissions** - Test on various mobile devices
4. **Fallback Options** - Manual merchant ID entry

## Support

If camera access still doesn't work:

1. Use the "Enter Merchant ID Instead" option
2. Check browser compatibility
3. Ensure device has working camera
4. Try on different device/browser

The app provides fallback options for devices without camera access or when camera permissions are denied.