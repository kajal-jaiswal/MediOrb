using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using MediOrb.API.Models;

namespace MediOrb.API.Services;

public class GroqService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly JsonSerializerOptions _requestOptions = new()
    {
        // No naming policy to preserve the underscore in 'max_tokens'
    };

    private static readonly TriageResult _fallback = new()
    {
        UrgencyLevel = "Medium",
        RecommendedDoctor = new DoctorInfo
        {
            Name = "Dr. Suresh Gupta",
            Specialty = "General Medicine",
            Floor = "1st Floor",
            Room = "Room 105",
            Available = true
        },
        EstimatedWaitTime = "20-30 minutes",
        Reasoning = "Based on your symptoms, a general consultation is recommended.",
        SuggestedTests = ["Blood test", "Physical examination"],
        AdditionalNotes = "Please proceed to the waiting area."
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
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        const string systemPrompt = """
            You are a hospital triage AI. Based on patient symptoms, age, and gender, return a JSON object with:
            { "urgencyLevel": "Low"|"Medium"|"High"|"Emergency", "recommendedDoctor": { "name": string, "specialty": string, "floor": string, "room": string, "available": bool }, "estimatedWaitTime": string, "reasoning": string, "suggestedTests": string[], "additionalNotes": string }
            Return ONLY valid JSON, no markdown, no explanation.
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

            Provide triage routing. Return ONLY valid JSON.
            """;

        var body = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userPrompt   }
            },
            temperature = 0.3,
            max_tokens = 600,
        };

        var json = JsonSerializer.Serialize(body, _requestOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException($"Groq API call failed with {response.StatusCode}: {errorBody}");
            }
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            throw new InvalidOperationException("Groq API call failed: " + ex.Message, ex);
        }

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

        try
        {
            return JsonSerializer.Deserialize<TriageResult>(resultJson, _jsonOptions) ?? _fallback;
        }
        catch
        {
            return _fallback;
        }
    }
}
