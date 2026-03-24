namespace MediOrb.API.Models;

public class Patient
{
    public int Id { get; set; }
    public string PatientId { get; set; } = string.Empty;   // PAT-XXXXXXXXX
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool IsReturning { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Appointment> Appointments { get; set; } = [];
}
