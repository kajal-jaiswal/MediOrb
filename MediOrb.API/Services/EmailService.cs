using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using MediOrb.API.Models;

namespace MediOrb.API.Services;

public class EmailService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<EmailService> logger)
{
    private static readonly Dictionary<string, string> _urgencyColors = new()
    {
        ["Low"]       = "#10B981",
        ["Medium"]    = "#F59E0B",
        ["High"]      = "#F97316",
        ["Emergency"] = "#EF4444",
    };

    public async Task<bool> SendAppointmentEmailAsync(EmailNotificationRequest req)
    {
        var apiKey = configuration["Resend:ApiKey"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(apiKey) ||
            apiKey.Contains("your_resend_api_key_here", StringComparison.OrdinalIgnoreCase) ||
            apiKey.Contains("YOUR_RESEND_API_KEY_HERE", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning(
                "[EMAIL MOCK] Resend API key not configured correctly. Email will NOT be delivered. Recipient: {Email}",
                req.Email);
            await Task.Delay(800);
            return false;
        }

        var urgencyColor = _urgencyColors.GetValueOrDefault(req.Urgency, "#F59E0B");
        var htmlBody = BuildEmailHtml(req, urgencyColor);

        var payload = new
        {
            from    = "MediOrb <onboarding@resend.dev>",
            to      = new[] { req.Email },
            subject = $"Appointment Confirmed — {req.PatientName} ({req.AppointmentId})",
            html    = htmlBody,
        };

        var client = httpClientFactory.CreateClient("Resend");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var json    = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync("https://api.resend.com/emails", content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Email dispatch failed");
            return false;
        }
    }

    private static string BuildEmailHtml(EmailNotificationRequest req, string urgencyColor)
    {
        var css = @"
          body{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:#0A0F1C;color:#fff;margin:0;padding:0}
          .wrap{max-width:560px;margin:40px auto;padding:0 20px}
          .card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px}
          .logo{text-align:center;font-weight:800;font-size:20px;color:#818CF8;margin-bottom:20px}
          .badge{display:inline-block;background:rgba(16,185,129,0.15);color:#10B981;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid rgba(16,185,129,0.3);margin-bottom:16px}
          h1{color:#fff;font-size:22px;margin:0 0 6px}
          .sub{color:#A1A1AA;font-size:14px;margin:0 0 24px}
          .row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
          .row:last-child{border-bottom:none}
          .key{color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}
          .val{color:#fff;font-size:14px;font-weight:600;text-align:right}
          .ai{background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:16px;margin-top:20px;color:#c7c7d4;font-size:13px;line-height:1.6}
          .footer{text-align:center;color:#3f3f46;font-size:11px;margin-top:24px}
        ";

        return $"""
            <!DOCTYPE html>
            <html><head><meta charset="utf-8"><style>{css}</style></head>
            <body>
            <div class="wrap">
              <div class="card">
                <div class="logo">&#x2B21; MediOrb</div>
                <div><span class="badge">&#x2713; Appointment Confirmed</span></div>
                <h1>Hello, {req.PatientName}</h1>
                <p class="sub">Your check-in is complete. Here are your appointment details.</p>
                <div>
                  <div class="row"><span class="key">Patient ID</span><span class="val" style="color:#818CF8;font-family:monospace">{req.PatientId}</span></div>
                  <div class="row"><span class="key">Appointment</span><span class="val" style="color:#818CF8;font-family:monospace">{req.AppointmentId}</span></div>
                  <div class="row"><span class="key">Doctor</span><span class="val">{req.DoctorName}</span></div>
                  <div class="row"><span class="key">Department</span><span class="val">{req.Specialty}</span></div>
                  <div class="row"><span class="key">Location</span><span class="val">{req.Floor} &middot; {req.Room}</span></div>
                  <div class="row"><span class="key">Priority</span><span class="val" style="color:{urgencyColor}">{req.Urgency}</span></div>
                </div>
                <div class="ai">
                  <strong style="color:#A1A1AA;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">AI Recommendation</strong><br><br>
                  {req.Reasoning}
                </div>
              </div>
              <div class="footer">Sent by MediOrb AI Kiosk &middot; Groq Llama 3 &middot; Confidential</div>
            </div>
            </body></html>
            """;
    }
}
