namespace MediOrb.API.Models;

public class TriageResult
{
    public string UrgencyLevel { get; set; } = "Medium";
    public DoctorInfo RecommendedDoctor { get; set; } = new();
    public string EstimatedWaitTime { get; set; } = "15-20 minutes";
    public string Reasoning { get; set; } = string.Empty;
    public List<string> SuggestedTests { get; set; } = [];
    public string? AdditionalNotes { get; set; }
}
