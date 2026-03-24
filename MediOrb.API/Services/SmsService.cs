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
        if (string.IsNullOrWhiteSpace(accountSid) || accountSid == "your_account_sid_here")
        {
            logger.LogWarning(
                "[SMS MOCK] Twilio not configured. Set Twilio:AccountSid / AuthToken / FromNumber in appsettings.json. " +
                "Message NOT sent. To: {Phone} | Body: {Message}", toPhone, message);
            await Task.Delay(600); // simulate latency
            return true;           // return true so POC demo still works
        }

        // ── Real Twilio send ───────────────────────────────────────
        try
        {
            TwilioClient.Init(accountSid, authToken);

            // Normalise to E.164 (+91XXXXXXXXXX for India)
            var e164 = toPhone.StartsWith("+")
                ? toPhone
                : $"+91{toPhone.TrimStart('0')}";

            var msg = await MessageResource.CreateAsync(
                to:   new PhoneNumber(e164),
                from: new PhoneNumber(fromNumber),
                body: message
            );

            if (msg.ErrorCode is not null)
            {
                logger.LogError("Twilio returned error {Code}: {Info}", msg.ErrorCode, msg.ErrorMessage);
                return false;
            }

            logger.LogInformation("Twilio SMS sent. SID: {Sid} → {To}", msg.Sid, e164);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Twilio SMS dispatch failed for {Phone}", toPhone);
            return false;
        }
    }
}
