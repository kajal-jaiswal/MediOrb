namespace MediOrb.API.Models;

public class TriageResult
{
    // ── Existing fields — DO NOT change (API contract) ──────────
    public string UrgencyLevel { get; set; } = "Medium";
    public DoctorInfo RecommendedDoctor { get; set; } = new();
    public string EstimatedWaitTime { get; set; } = "15-20 minutes";
    public string Reasoning { get; set; } = string.Empty;
    public List<string> SuggestedTests { get; set; } = [];
    public string? AdditionalNotes { get; set; }

    // ── Phase B additions — additive only, nullable ──────────────
    // Null when not returned by AI; old frontends safely ignore these.
    public float?  Confidence       { get; set; }
    public string? PrimaryCondition { get; set; }
}
