using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using MediOrb.API.Data;
using MediOrb.API.Models;

namespace MediOrb.API.Services;

public class PatientService(AppDbContext db)
{
    private static readonly JsonSerializerOptions _json = new() { PropertyNameCaseInsensitive = true };

    private static readonly Dictionary<string, int> _urgencyPriority = new()
    {
        ["Emergency"] = 4, ["High"] = 3, ["Medium"] = 2, ["Low"] = 1,
    };

    // ── Persist ──────────────────────────────────────────────────

    public async Task UpsertPatientAsync(Patient patient)
    {
        var existing = await db.Patients
            .FirstOrDefaultAsync(p => p.PatientId == patient.PatientId);

        if (existing is null)
        {
            db.Patients.Add(patient);
        }
        else
        {
            // Update mutable fields only
            if (patient.Email is not null)
                existing.Email = patient.Email;
            existing.IsReturning = patient.IsReturning;
        }

        await db.SaveChangesAsync();
    }

    public async Task<Appointment> SaveAppointmentAsync(Appointment appt)
    {
        db.Appointments.Add(appt);
        await db.SaveChangesAsync();
        return appt;
    }

    // ── Lookup ───────────────────────────────────────────────────

    /// <summary>Find a patient by PatientId or Contact number. Returns the patient and their most recent appointment.</summary>
    public async Task<(Patient? patient, Appointment? lastAppt)> LookupAsync(string query)
    {
        query = query.Trim();

        var patient = await db.Patients
            .Include(p => p.Appointments
                .OrderByDescending(a => a.CreatedAt)
                .Take(1))
            .FirstOrDefaultAsync(p =>
                p.PatientId == query ||
                p.Contact   == query);

        if (patient is null) return (null, null);
        return (patient, patient.Appointments.FirstOrDefault());
    }

    // ── Queue ────────────────────────────────────────────────────

    public async Task<List<Appointment>> GetQueueAsync()
    {
        var items = await db.Appointments
            .Include(a => a.Patient)
            .Where(a => a.Status == "Waiting" || a.Status == "InProgress")
            .ToListAsync();

        return items
            .OrderByDescending(a => _urgencyPriority.GetValueOrDefault(a.UrgencyLevel, 2))
            .ThenBy(a => a.CreatedAt)
            .ToList();
    }

    public async Task<(Appointment? appt, bool changed)> UpdateStatusAsync(string appointmentId, string status)
    {
        var appt = await db.Appointments
            .Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);

        if (appt is null)              return (null, false);
        if (appt.Status == status)     return (appt, false);

        appt.Status = status;
        await db.SaveChangesAsync();
        return (appt, true);
    }

    public async Task<(int position, int total)> GetQueuePositionAsync(string appointmentId)
    {
        var queue = await GetQueueAsync();
        var idx   = queue.FindIndex(a => a.AppointmentId == appointmentId);
        return idx >= 0 ? (idx + 1, queue.Count) : (0, queue.Count);
    }

    // ── Helpers ──────────────────────────────────────────────────

    public static List<string> ParseSuggestedTests(string json)
    {
        try   { return JsonSerializer.Deserialize<List<string>>(json, _json) ?? []; }
        catch { return []; }
    }

    public static PatientAlert ToAlert(Appointment a) => new()
    {
        AppointmentId     = a.AppointmentId,
        PatientId         = a.PatientId,
        PatientName       = a.Patient?.Name ?? "Unknown",
        Age               = a.Patient?.Age  ?? 0,
        Gender            = a.Patient?.Gender ?? string.Empty,
        Symptoms          = a.Symptoms,
        UrgencyLevel      = a.UrgencyLevel,
        DoctorName        = a.DoctorName,
        DoctorSpecialty   = a.DoctorSpecialty,
        EstimatedWaitTime = a.EstimatedWaitTime,
        Reasoning         = a.Reasoning,
        SuggestedTests    = ParseSuggestedTests(a.SuggestedTestsJson),
        AdditionalNotes   = a.AdditionalNotes,
        Status            = a.Status,
        CheckedInAt       = a.CreatedAt,
    };
}
