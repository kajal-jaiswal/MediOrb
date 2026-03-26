using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace MediOrb.API.Services;

public class SmsService(IConfiguration configuration, ILogger<SmsService> logger)
{
    public async Task<bool> SendSmsAsync(string toPhone, string message)
    {
        var accountSid  = configuration["Twilio:AccountSid"]  ?? string.Empty;
        var authToken   = configuration["Twilio:AuthToken"]   ?? string.Empty;
        var fromNumber  = configuration["Twilio:FromNumber"]  ?? string.Empty;

        // ── Mock mode ──────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(accountSid) ||
            accountSid.Contains("YOUR_TWILIO_SID_HERE", StringComparison.OrdinalIgnoreCase) ||
            accountSid.Contains("your_account_sid_here", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning(
                "[SMS MOCK] Twilio not configured correctly. Message NOT sent. To: {Phone} | Body: {Message}",
                toPhone, message);
            await Task.Delay(600);
            return true;
        }

        // ── Real Twilio send ───────────────────────────────────────
        try
        {
            TwilioClient.Init(accountSid, authToken);

            // Strip formatting chars, then normalise to E.164 (+91XXXXXXXXXX for India)
            var digits = new string(toPhone.Where(char.IsDigit).ToArray());
            var e164 = toPhone.TrimStart().StartsWith("+")
                ? "+" + digits
                : digits.Length == 10
                    ? $"+91{digits}"
                    : digits.Length == 12 && digits.StartsWith("91")
                        ? $"+{digits}"
                        : $"+91{digits.TrimStart('0')}";

            var msg = await MessageResource.CreateAsync(
                to:   new PhoneNumber(e164),
                from: new PhoneNumber(fromNumber),
                body: message
            );

            if (msg.ErrorCode is not null)
            {
                logger.LogError("Twilio send request failed. Code: {Code}, Message: {Info}, Status: {Status}", 
                                msg.ErrorCode, msg.ErrorMessage, msg.Status);
                return false;
            }

            logger.LogInformation("Twilio SMS sent successfully. SID: {Sid}, Status: {Status} → {To}", 
                                  msg.Sid, msg.Status, e164);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Twilio SMS dispatch failed for {Phone}", toPhone);
            return false;
        }
    }
}
