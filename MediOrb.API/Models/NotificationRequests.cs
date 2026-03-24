using System.ComponentModel.DataAnnotations;

namespace MediOrb.API.Models;

public class EmailNotificationRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientId { get; set; } = string.Empty;
    public string AppointmentId { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string Urgency { get; set; } = string.Empty;
    public string Reasoning { get; set; } = string.Empty;
    public string Symptoms { get; set; } = string.Empty;
}

public class SmsNotificationRequest
{
    [Required]
    public string Phone { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;
}
