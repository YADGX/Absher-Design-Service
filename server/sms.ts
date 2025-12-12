/**
 * SMS Service
 * This service handles sending SMS messages to contacts.
 * 
 * For production, you'll need to configure an SMS provider:
 * - Twilio: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 * - Custom SMS Gateway: Update sendSMS function with your provider's API
 */

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Format a phone number for SMS (ensure it includes country code)
 * Saudi Arabia numbers should be formatted as +966XXXXXXXXX
 */
function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0, replace with +966 (Saudi Arabia country code)
  if (cleaned.startsWith('0')) {
    cleaned = '+966' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    // If doesn't start with +, assume it's missing country code
    cleaned = '+966' + cleaned;
  }
  
  return cleaned;
}

/**
 * Send SMS using configured provider
 * Currently uses a placeholder implementation.
 * Replace with your actual SMS provider integration.
 */
export async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    // Check for Twilio configuration
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      // Use Twilio
      const twilio = await import('twilio');
      const client = twilio.default(twilioAccountSid, twilioAuthToken);
      
      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      });
      
      return {
        success: true,
        messageId: result.sid,
      };
    }
    
    // Custom SMS Gateway - Replace this with your provider's API
    // Example for a generic HTTP-based SMS API:
    const smsApiUrl = process.env.SMS_API_URL;
    const smsApiKey = process.env.SMS_API_KEY;
    
    if (smsApiUrl && smsApiKey) {
      const response = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${smsApiKey}`,
        },
        body: JSON.stringify({
          to: formattedPhone,
          message: message,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`SMS API returned ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        messageId: data.messageId || data.id,
      };
    }
    
    // Development mode: Log SMS instead of sending
    console.log('='.repeat(60));
    console.log('SMS (Development Mode - Not Actually Sent)');
    console.log('='.repeat(60));
    console.log(`To: ${formattedPhone}`);
    console.log(`Message:\n${message}`);
    console.log('='.repeat(60));
    
    return {
      success: true,
      messageId: 'dev-' + Date.now(),
    };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate the alert SMS message in Arabic
 */
export function generateAlertMessage(
  lastLocation: { lat: string; lng: string; address?: string } | null,
  destination: { lat: string; lng: string; address?: string } | null
): string {
  const lastLocationText = lastLocation?.address 
    ? lastLocation.address
    : lastLocation
    ? `${lastLocation.lat}, ${lastLocation.lng}`
    : 'غير متوفر';
  
  const destinationText = destination?.address
    ? destination.address
    : destination
    ? `${destination.lat}, ${destination.lng}`
    : 'غير متوفر';
  
  return `رسالة تنبيهية
هذه رسالة تلقائية من تطبيق أبشر.

حان وقت عودة المستخدم ولكن لم يتم تأكيد عودته. نرجو منكم التواصل مع المستخدم والتأكد من سلامته، وإذا لزم الأمر تصعيد الموضوع للجهات المعنية.

آخر موقع محفوظ للمستخدم:
${lastLocationText}

الوجهة المحددة من قبل المستخدم (نطاق دائري بسعة 10 كم):
${destinationText}`;
}


