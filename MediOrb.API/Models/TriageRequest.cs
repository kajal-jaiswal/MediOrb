using System.ComponentModel.DataAnnotations;

namespace MediOrb.API.Models;

public class TriageRequest
{
    // ── Patient identity (required for DB persistence) ────────
    public string PatientId { get; set; } = string.Empty;
    public string AppointmentId { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string? Email { get; set; }

    // ── Returning patient context ─────────────────────────────
    public bool IsReturning { get; set; }
    public string? PreviousSymptoms { get; set; }

    // ── Triage data ───────────────────────────────────────────
    [Required, MinLength(5)]
    public string Symptoms { get; set; } = string.Empty;

    [Range(1, 120)]
    public int Age { get; set; }

    [Required]
    public string Gender { get; set; } = string.Empty;

    public string Language { get; set; } = "English";
}
