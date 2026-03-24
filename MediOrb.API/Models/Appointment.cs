namespace MediOrb.API.Models;

public class Appointment
{
    public int Id { get; set; }
    public string AppointmentId { get; set; } = string.Empty;   // APP-XXXXXXXXX
    public string PatientId { get; set; } = string.Empty;       // FK → Patient.PatientId

    // Symptoms & triage
    public string Symptoms { get; set; } = string.Empty;
    public string UrgencyLevel { get; set; } = "Medium";
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorSpecialty { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string EstimatedWaitTime { get; set; } = string.Empty;
    public string Reasoning { get; set; } = string.Empty;
    public string SuggestedTestsJson { get; set; } = "[]";
    public string? AdditionalNotes { get; set; }

    // Queue status: Waiting | InProgress | Completed | Transferred
    public string Status { get; set; } = "Waiting";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Patient? Patient { get; set; }
}
