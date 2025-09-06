# AptPay Testing Guide

## Fixed Issues ✅

### JavaScript Errors Resolved:
- Fixed transaction format in PaymentFlow component
- Corrected Aptos wallet adapter integration
- Resolved 'in' operator errors
- Updated error handling for better debugging

## Testing the Application

### 1. QR Scanner Testing

#### On Computer (Desktop Browser):
1. **Open the app**: http://localhost:3001
2. **Click "Generate Test QR Code"** (yellow button)
3. **Copy the generated QR code** and display it on your phone screen
4. **Click "Scan QR Code"** to test the scanner
5. **Point your computer's camera** at the phone screen showing the QR code
6. **Watch the debug information** for scan attempts and results

#### On Mobile Device:
1. **Connect to the same network** as your computer
2. **Open**: http://192.168.1.119:3001 (or your computer's IP)
3. **Allow camera permissions** when prompted
4. **Test QR scanning** with the generated test QR code

### 2. Wallet Connection Testing

1. **Install a compatible Aptos wallet**:
   - Petra Wallet (Chrome Extension)
   - Martian Wallet
   - Pontem Wallet

2. **Connect wallet**:
   - Click the wallet icon in the top-right
   - Select your wallet from the dropdown
   - Approve the connection

3. **Verify connection**:
   - Check that your wallet address appears
   - Verify APT balance is displayed
   - Ensure the balance updates correctly

### 3. Payment Flow Testing

1. **Generate test QR code** with sample merchant data
2. **Scan the QR code** to initiate payment flow
3. **Review payment details**:
   - Merchant information
   - Amount in INR
   - Equivalent APT amount
   - Exchange rate

4. **Test payment process**:
   - Click "Pay X APT" button
   - Approve transaction in wallet
   - Monitor transaction status
   - Check for success/error messages

### 4. Debug Information

#### QR Scanner Debug Panel:
- **Scan attempts counter**: Shows how many times scanner tried to read
- **Camera status**: Available/Not Available
- **Raw scan data**: Shows what was actually scanned
- **Parse results**: Shows if QR data was valid JSON

#### Console Logs:
- Open browser DevTools (F12)
- Check Console tab for detailed error messages
- Look for wallet connection status
- Monitor transaction progress

## Common Issues & Solutions

### QR Scanner Not Working:
1. **Camera permissions**: Ensure browser has camera access
2. **HTTPS requirement**: Use mobile device on network IP for camera access
3. **Lighting**: Ensure good lighting for QR code scanning
4. **Distance**: Hold QR code at appropriate distance from camera

### Wallet Connection Issues:
1. **Install wallet extension**: Ensure compatible wallet is installed
2. **Network settings**: Verify wallet is set to Aptos Testnet
3. **Browser compatibility**: Use Chrome/Edge for best compatibility

### Payment Errors:
1. **Insufficient balance**: Ensure wallet has enough APT for transaction
2. **Network issues**: Check internet connection
3. **Transaction format**: Fixed in latest update

## Test Data

### Sample QR Code Data:
```json
{
  "merchantId": "TEST_MERCHANT_001",
  "merchantName": "Test Coffee Shop",
  "amount": 100,
  "currency": "INR",
  "description": "Coffee and Snacks",
  "upiId": "testmerchant@paytm"
}
```

### Test Scenarios:
1. **Valid QR Code**: Use generated test QR code
2. **Invalid QR Code**: Scan random QR code to test error handling
3. **Network disconnection**: Test offline behavior
4. **Wallet disconnection**: Test wallet disconnect during payment

## Success Indicators

✅ **QR Scanner Working**:
- Camera feed appears
- Debug info shows scan attempts
- Valid QR codes are parsed correctly
- Navigation to payment flow works

✅ **Wallet Integration Working**:
- Wallet connects successfully
- Balance displays correctly
- Transaction signing works
- Status updates properly

✅ **Payment Flow Working**:
- Merchant data displays correctly
- APT amount calculation is accurate
- Transaction submits successfully
- Success/error states work properly

## Next Steps

After testing, you can:
1. **Deploy to production** with real merchant QR codes
2. **Integrate real UPI payment gateway**
3. **Add more wallet providers**
4. **Implement push notifications**
5. **Add transaction history**

---

**Note**: This is a testnet application. Use only test funds and test merchant data.