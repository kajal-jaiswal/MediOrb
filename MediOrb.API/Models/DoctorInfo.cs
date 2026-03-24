namespace MediOrb.API.Models;

public class DoctorInfo
{
    public string Name { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public bool Available { get; set; } = true;
}
