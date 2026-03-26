using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using MediOrb.API.Models;

namespace MediOrb.API.Services;

public class GroqService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<GroqService> logger)          // Phase D: proper logger injected
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly JsonSerializerOptions _requestOptions = new()
    {
        // No naming policy — preserves 'max_tokens' underscore key
    };

    // Fallback used in POC mode and on parse failure
    private static readonly TriageResult _fallback = new()
    {
        UrgencyLevel = "Medium",
        Confidence   = 0.75f,                     // Phase B
        PrimaryCondition = "General Consultation", // Phase B
        RecommendedDoctor = new DoctorInfo
        {
            Name      = "Dr. Suresh Gupta",
            Specialty = "General Medicine",
            Floor     = "1st Floor",
            Room      = "Room 105",
            Available = true,
        },
        EstimatedWaitTime = "20-30 minutes",
        Reasoning         = "Based on your symptoms, a general consultation is recommended.",
        SuggestedTests    = ["Blood test", "Physical examination"],
        AdditionalNotes   = "Please proceed to the waiting area.",
    };

    public async Task<TriageResult> AnalyzeSymptomsAsync(TriageRequest request)
    {
        var apiKey = configuration["Groq:ApiKey"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "your_groq_api_key_here")
        {
            await Task.Delay(1500); // simulate latency in POC mode
            return _fallback;
        }

        var client = httpClientFactory.CreateClient("Groq");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        // Phase B: system prompt now requests confidence + primaryCondition
        const string systemPrompt = """
            You are a hospital triage AI. Based on symptoms, age, and gender, you MUST assign one of these doctors:
            - Dr. Sarah Chen (Cardiology, Floor 2, Room 201)
            - Dr. James Wilson (Respiratory, Floor 2, Room 204)
            - Dr. Elena Rodriguez (Neurology, Floor 3, Room 312)
            - Dr. Michael Chen (Orthopedics, Floor 1, Room 108)
            - Dr. Priya Sharma (Pediatrics, Floor 1, Room 115)
            - Dr. David Miller (Gastroenterology, Floor 3, Room 302)

            Return a strict JSON object:
            {
              "urgencyLevel": "Low"|"Medium"|"High"|"Emergency",
              "confidence": <float 0.0–1.0 representing how certain you are>,
              "primaryCondition": <2–4 word label e.g. "Suspected Cardiac Event">,
              "recommendedDoctor": { "name": string, "specialty": string, "floor": string, "room": string, "available": true },
              "estimatedWaitTime": string,
              "reasoning": string,
              "suggestedTests": string[],
              "additionalNotes": string
            }
            Return ONLY valid JSON. No markdown. No explanation outside the JSON.
            """;

        var returningCtx = request.IsReturning && !string.IsNullOrEmpty(request.PreviousSymptoms)
            ? $"\n- Previous visit symptoms: \"{request.PreviousSymptoms}\" (factor this history into your assessment)"
            : string.Empty;

        var userPrompt = $"""
            Patient information:
            - Age: {request.Age} years old
            - Gender: {request.Gender}
            - Symptoms: {request.Symptoms}
            - Language preference: {request.Language}{returningCtx}

            Assign the most relevant doctor from the list. Return ONLY valid JSON.
            """;

        var body = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userPrompt   },
            },
            temperature = 0.2,
            max_tokens  = 650,   // slightly higher to fit new fields
        };

        var json = JsonSerializer.Serialize(body, _requestOptions);

        // ── Phase D: retry up to 3 times on transient failures ──────
        HttpResponseMessage? response = null;

        for (int attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                // Re-create StringContent each attempt — HttpContent is not reusable
                var reqContent = new StringContent(json, Encoding.UTF8, "application/json");
                response = await client.PostAsync(
                    "https://api.groq.com/openai/v1/chat/completions", reqContent);

                if (response.IsSuccessStatusCode) break;

                // Do not retry client errors (4xx) — they won't fix themselves
                if ((int)response.StatusCode < 500) break;

                if (attempt < 3)
                {
                    logger.LogWarning(
                        "Groq API attempt {Attempt}/3 returned {Status} — retrying in {Delay}ms",
                        attempt, (int)response.StatusCode, attempt * 1000);
                    await Task.Delay(attempt * 1000);
                }
            }
            catch (HttpRequestException ex)
            {
                if (attempt == 3)
                    throw new InvalidOperationException(
                        $"Groq API unreachable after 3 attempts: {ex.Message}", ex);

                logger.LogWarning(
                    "Groq API attempt {Attempt}/3 threw network error: {Error} — retrying in {Delay}ms",
                    attempt, ex.Message, attempt * 1000);
                await Task.Delay(attempt * 1000);
            }
        }

        if (response == null || !response.IsSuccessStatusCode)
        {
            var errorBody = response != null
                ? await response.Content.ReadAsStringAsync()
                : "No response received";
            throw new InvalidOperationException(
                $"Groq API failed after retries: {response?.StatusCode} — {errorBody}");
        }

        // ── Parse response ─────────────────────────────────────────
        var raw = await response.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(raw);
        var messageContent = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "{}";

        // Strip markdown code fences if present
        var match = Regex.Match(messageContent, @"\{[\s\S]*\}");
        var resultJson = match.Success ? match.Value : messageContent;

        // Phase D: structured log instead of Console.WriteLine (no raw PII)
        logger.LogDebug(
            "Groq response received for PatientId={PatientId} — JSON length {Len} chars",
            request.PatientId, resultJson.Length);

        try
        {
            return JsonSerializer.Deserialize<TriageResult>(resultJson, _jsonOptions) ?? _fallback;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to deserialize Groq response — using fallback");
            return _fallback;
        }
    }
}
