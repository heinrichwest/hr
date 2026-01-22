# Firebase Trigger Email Extension Setup

This document outlines the steps to install and configure the Firebase Trigger Email extension for the HR System email notifications.

## Prerequisites

- Firebase CLI installed and authenticated
- Project owner or editor access to the Firebase project
- SMTP credentials for hr@speccon.co.za

## Installation Steps

### 1. Install Firebase Trigger Email Extension

Run the following command from the project root:

```bash
firebase ext:install firebase/firestore-send-email --project=hr-system-9dfae
```

### 2. Extension Configuration

During installation, you will be prompted for the following configuration:

| Setting | Value | Description |
|---------|-------|-------------|
| SMTP connection URI | `smtps://username:password@smtp.provider.com:465` | SMTP server connection string |
| SMTP password | (stored securely) | SMTP authentication password |
| Email documents collection | `mail` | Firestore collection to monitor |
| Default FROM address | `hr@speccon.co.za` | Sender email address |
| Default REPLY-TO address | `hr@speccon.co.za` | Reply-to email address |
| Users collection | (leave empty) | Not using user email preferences |
| Templates collection | (leave empty) | Not using stored templates |

### 3. SMTP Configuration

The extension requires valid SMTP credentials. Store these securely:

**For development/testing:**
- Use a service like Mailtrap for testing without sending real emails

**For production:**
- Configure with SpecCon's SMTP provider
- Credentials should be stored in Firebase Extension Secrets (not in code)

### 4. IAM Permissions

The extension automatically configures the following permissions:

- **Firestore**: Read/write access to the `mail` collection
- **Secret Manager**: Access to stored SMTP credentials

Verify in Firebase Console > Extensions > Trigger Email > Permissions

### 5. Environment Variables

Create a `.env` file in the functions directory (gitignored) for local development:

```env
# SMTP Configuration (for local testing only)
# Production credentials are stored in Firebase Extension configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=hr@speccon.co.za
SMTP_PASSWORD=your-password-here
```

**IMPORTANT:** Never commit SMTP credentials to version control.

## Collection Structure

The extension monitors the `mail` collection for new documents with this structure:

```typescript
{
  to: string[],           // Recipient email addresses
  message: {
    subject: string,      // Email subject
    html: string,         // HTML email body
  },
  from?: string,          // Optional sender (uses default if omitted)
}
```

After processing, the extension adds a `delivery` field:

```typescript
{
  delivery: {
    state: 'PENDING' | 'SUCCESS' | 'ERROR',
    attempts: number,
    error?: string,       // Only present on error
    startTime: Timestamp,
    endTime: Timestamp,
  }
}
```

## Verification

After installation, verify the extension is working:

1. Go to Firebase Console > Extensions
2. Check that "Trigger Email" shows as installed
3. Create a test document in the `mail` collection
4. Check the delivery status updates
5. Verify email arrives in recipient's inbox

## Troubleshooting

### Extension not processing emails
- Check that documents are being created in the `mail` collection
- Verify SMTP credentials are correct
- Check Firebase Functions logs for errors

### Emails not being delivered
- Verify sender email is authenticated with SMTP provider
- Check spam/junk folders
- Review SMTP provider's delivery logs

### Rate limiting
- The extension processes emails sequentially
- For bulk emails, consider batching with delays
- Our rate limiting (10/min per recipient) prevents flooding

## Security Considerations

1. **SMTP Credentials**: Stored in Firebase Extension Secrets, not in code
2. **Firestore Rules**: Only Cloud Functions can write to `mail` collection
3. **Email Logging**: All emails logged to `emailLogs` for audit trail
4. **Rate Limiting**: Implemented to prevent abuse

## Related Files

- `functions/src/types/emailLog.ts` - Email type definitions
- `functions/src/utils/emailLogger.ts` - Email logging utility
- `functions/src/utils/rateLimiter.ts` - Rate limiting utility
- `firestore.rules` - Security rules for mail/emailLogs collections
