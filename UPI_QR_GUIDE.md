# UPI QR Code Scanner Integration Guide

## Overview

Your AptPay application now supports scanning **real UPI QR codes** from popular payment apps like:
- Google Pay (GPay)
- PhonePe
- Paytm
- BHIM
- Any UPI-compliant payment app

## How It Works

### 1. UPI QR Code Detection
The app can automatically detect and parse various UPI QR code formats:

#### Standard UPI URL Format
```
upi://pay?pa=merchant@bank&pn=MerchantName&am=100&tn=TransactionNote
```

#### Alternative Formats
- Plain text with UPI ID and amount
- JSON-based merchant QR codes
- Custom merchant-specific formats

### 2. Supported QR Code Parameters

| Parameter | Description | Example |
|-----------|-------------|----------|
| `pa` | Payee Address (UPI ID) | `merchant@paytm` |
| `pn` | Payee Name | `Tea Shop` |
| `am` | Amount | `100` |
| `tn` | Transaction Note | `Payment for tea` |
| `mc` | Merchant Code | `1234` |
| `tr` | Transaction Reference | `TXN123` |

## Usage Instructions

### Step 1: Connect Your Wallet
1. Open the AptPay application
2. Click "Connect Wallet"
3. Connect your Petra wallet
4. Ensure you have USDC balance

### Step 2: Scan UPI QR Code
1. Click "Scan UPI QR Code" (blue button)
2. Point your camera at any UPI QR code
3. The app will automatically detect and parse the QR code
4. You'll see the merchant details extracted from the QR code

### Step 3: Complete Payment
1. Review the merchant information:
   - Merchant name
   - UPI ID
   - Original amount (if specified)
2. Enter the amount you want to pay in USDC
3. Confirm the payment
4. Sign the transaction with your Petra wallet

### Step 4: Payment Processing
The system will:
1. Create a payment record
2. Transfer USDC from your wallet to the treasury
3. Initiate UPI payout to the merchant (if configured)
4. Provide transaction confirmation

## Testing with Real QR Codes

### Where to Find UPI QR Codes
1. **Local Merchants**: Tea shops, restaurants, retail stores
2. **Online Merchants**: E-commerce checkout pages
3. **Payment Apps**: Generate QR codes in GPay, PhonePe, etc.
4. **Bill Payments**: Utility bills, subscription services

### Example Test Scenarios

#### Scenario 1: Tea Shop Payment
1. Find a local tea shop with a UPI QR code
2. Scan the QR code with AptPay
3. Enter amount (e.g., 20 USDC for ₹20 tea)
4. Complete payment

#### Scenario 2: Restaurant Bill
1. Ask for UPI QR code at restaurant
2. Scan with AptPay
3. Pay bill amount in USDC equivalent
4. Show transaction confirmation

#### Scenario 3: Online Purchase
1. Go to any Indian e-commerce site
2. Add items to cart and proceed to checkout
3. Select UPI payment option
4. Scan the displayed QR code with AptPay
5. Complete payment

## Technical Features

### QR Code Format Support
- ✅ Standard UPI URL format (`upi://pay?...`)
- ✅ Alternative text formats
- ✅ JSON-based merchant codes
- ✅ Custom merchant formats
- ✅ Amount parsing from various fields
- ✅ Merchant name extraction

### Error Handling
- Invalid QR code detection
- Insufficient balance warnings
- Network error recovery
- Transaction failure handling

### Debug Features
- Real-time QR code data display
- Scan attempt counter
- Raw data preview
- Parsing status indicators

## Comparison: Test vs Real UPI QR Codes

| Feature | Test QR Generator | Real UPI QR Scanner |
|---------|------------------|--------------------|
| Purpose | Development/Demo | Production Use |
| QR Source | Generated in-app | External merchants |
| Data Format | Custom JSON | Standard UPI format |
| Merchant Info | Predefined | Real merchant data |
| Amount | Fixed test amounts | Variable real amounts |
| Use Case | Testing & Demo | Actual payments |

## Troubleshooting

### Common Issues

#### QR Code Not Detected
- Ensure good lighting
- Hold camera steady
- Try different angles
- Check if QR code is clear and undamaged

#### "Not a Valid UPI QR Code" Error
- QR code might be for a different service
- Try scanning a known UPI payment QR code
- Check debug info for raw data

#### Payment Fails
- Check wallet connection
- Ensure sufficient USDC balance
- Verify network connectivity
- Try again after a few seconds

### Debug Information
The scanner provides detailed debug information:
- Scan attempt count
- Raw QR code data
- Parsing status
- Error messages

## Security Considerations

### Safe Practices
1. **Verify Merchant**: Always check merchant name and UPI ID
2. **Amount Verification**: Confirm amount before payment
3. **Transaction Review**: Review all details before signing
4. **Receipt Keeping**: Save transaction hash for records

### What We Don't Store
- Your private keys (handled by Petra wallet)
- Sensitive payment data
- Personal information beyond transaction records

## Integration Benefits

### For Users
- Pay any UPI merchant with crypto
- No need for traditional banking
- Instant cross-border payments
- Lower transaction fees

### For Merchants
- Accept crypto payments via existing UPI QR codes
- No additional setup required
- Instant settlement in local currency
- Broader customer base

## Next Steps

1. **Test with Various QR Codes**: Try different merchants and payment apps
2. **Monitor Transactions**: Check transaction history in your wallet
3. **Provide Feedback**: Report any issues or suggestions
4. **Scale Usage**: Use for regular payments once comfortable

## Support

If you encounter any issues:
1. Check the debug information in the scanner
2. Verify your wallet connection and balance
3. Try with a different UPI QR code
4. Check the browser console for technical errors

---

**Note**: This integration bridges traditional UPI payments with blockchain technology, enabling seamless crypto-to-fiat transactions for everyday purchases.