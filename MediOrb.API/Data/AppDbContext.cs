using Microsoft.EntityFrameworkCore;
using MediOrb.API.Models;

namespace MediOrb.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Appointment> Appointments => Set<Appointment>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        // Unique index on PatientId string (used as FK)
        model.Entity<Patient>()
            .HasIndex(p => p.PatientId)
            .IsUnique();

        // Index on Contact for fast lookup
        model.Entity<Patient>()
            .HasIndex(p => p.Contact);

        // Unique index on AppointmentId
        model.Entity<Appointment>()
            .HasIndex(a => a.AppointmentId)
            .IsUnique();

        // FK from Appointment.PatientId → Patient.PatientId (string-keyed)
        model.Entity<Appointment>()
            .HasOne(a => a.Patient)
            .WithMany(p => p.Appointments)
            .HasForeignKey(a => a.PatientId)
            .HasPrincipalKey(p => p.PatientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
