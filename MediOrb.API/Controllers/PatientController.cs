using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MediOrb.API.Hubs;
using MediOrb.API.Services;

namespace MediOrb.API.Controllers;

[ApiController]
public class PatientController(
    PatientService patientService,
    IHubContext<PatientHub> hubContext,
    ILogger<PatientController> logger) : ControllerBase
{
    // GET /api/patients/lookup?query=PAT-XXX or 9876543210
    [HttpGet("api/patients/lookup")]
    public async Task<IActionResult> Lookup([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(new { error = "query is required" });

        var (patient, lastAppt) = await patientService.LookupAsync(query);
        if (patient is null)
            return NotFound(new { error = "No patient record found. Please register as a new patient." });

        return Ok(new
        {
            patientId        = patient.PatientId,
            name             = patient.Name,
            age              = patient.Age,
            gender           = patient.Gender,
            contact          = patient.Contact,
            email            = patient.Email,
            isReturning      = true,
            lastVisit        = lastAppt?.CreatedAt,
            previousSymptoms = lastAppt?.Symptoms,
        });
    }

    // GET /api/queue
    [HttpGet("api/queue")]
    public async Task<IActionResult> GetQueue()
    {
        var queue  = await patientService.GetQueueAsync();
        var result = queue.Select(PatientService.ToAlert).ToList();
        return Ok(result);
    }

    // GET /api/queue/position/{appointmentId}
    [HttpGet("api/queue/position/{appointmentId}")]
    public async Task<IActionResult> GetPosition(string appointmentId)
    {
        var (pos, total) = await patientService.GetQueuePositionAsync(appointmentId);
        return Ok(new { position = pos, totalWaiting = total });
    }

    // PUT /api/queue/{appointmentId}/status
    [HttpPut("api/queue/{appointmentId}/status")]
    public async Task<IActionResult> UpdateStatus(string appointmentId, [FromBody] UpdateStatusRequest req)
    {
        var validStatuses = new[] { "Waiting", "InProgress", "Completed", "Transferred" };
        if (!validStatuses.Contains(req.Status))
            return BadRequest(new { error = $"Status must be one of: {string.Join(", ", validStatuses)}" });

        var (appt, changed) = await patientService.UpdateStatusAsync(appointmentId, req.Status);
        if (appt is null)
            return NotFound(new { error = "Appointment not found" });

        if (changed)
        {
            await hubContext.Clients.Group("doctors").SendAsync(
                "PatientStatusUpdated",
                new { appointmentId, status = req.Status, patientName = appt.Patient?.Name ?? string.Empty });

            logger.LogInformation("Status → {Status} for {AppointmentId}", req.Status, appointmentId);
        }

        return Ok(new { success = true, status = req.Status });
    }
}

public record UpdateStatusRequest([Required] string Status);
