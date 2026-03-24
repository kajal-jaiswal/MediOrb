namespace MediOrb.API.Models;

/// <summary>DTO pushed to doctor dashboard via SignalR.</summary>
public class PatientAlert
{
    public string AppointmentId { get; set; } = string.Empty;
    public string PatientId { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Symptoms { get; set; } = string.Empty;
    public string UrgencyLevel { get; set; } = "Medium";
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorSpecialty { get; set; } = string.Empty;
    public string EstimatedWaitTime { get; set; } = string.Empty;
    public string Reasoning { get; set; } = string.Empty;
    public List<string> SuggestedTests { get; set; } = [];
    public string? AdditionalNotes { get; set; }
    public string Status { get; set; } = "Waiting";
    public DateTime CheckedInAt { get; set; } = DateTime.UtcNow;
}
