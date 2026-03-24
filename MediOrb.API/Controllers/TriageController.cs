using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MediOrb.API.Hubs;
using MediOrb.API.Models;
using MediOrb.API.Services;

namespace MediOrb.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TriageController(
    GroqService groqService,
    PatientService patientService,
    IHubContext<PatientHub> hubContext,
    ILogger<TriageController> logger) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<TriageResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Analyze([FromBody] TriageRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await groqService.AnalyzeSymptomsAsync(request);

            // Persist + broadcast (non-blocking so API responds fast)
            if (!string.IsNullOrEmpty(request.PatientId))
            {
                _ = PersistAndBroadcastAsync(request, result)
                    .ContinueWith(t =>
                        logger.LogWarning(t.Exception, "DB persist/broadcast failed for {PatientId}", request.PatientId),
                        TaskContinuationOptions.OnlyOnFaulted);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Triage analysis failed for symptoms: {Symptoms}", request.Symptoms);
            return StatusCode(500, new { error = "AI service unavailable. Please try again." });
        }
    }

    private async Task PersistAndBroadcastAsync(TriageRequest req, TriageResult result)
    {
        // Upsert patient
        var patient = new Patient
        {
            PatientId   = req.PatientId,
            Name        = req.PatientName,
            Age         = req.Age,
            Gender      = req.Gender,
            Contact     = req.Contact,
            Email       = req.Email,
            IsReturning = req.IsReturning,
        };
        await patientService.UpsertPatientAsync(patient);

        // Save appointment
        var appt = new Appointment
        {
            AppointmentId     = req.AppointmentId,
            PatientId         = req.PatientId,
            Symptoms          = req.Symptoms,
            UrgencyLevel      = result.UrgencyLevel,
            DoctorName        = result.RecommendedDoctor.Name,
            DoctorSpecialty   = result.RecommendedDoctor.Specialty,
            Floor             = result.RecommendedDoctor.Floor,
            Room              = result.RecommendedDoctor.Room,
            EstimatedWaitTime = result.EstimatedWaitTime,
            Reasoning         = result.Reasoning,
            SuggestedTestsJson = JsonSerializer.Serialize(result.SuggestedTests),
            AdditionalNotes   = result.AdditionalNotes,
            Status            = "Waiting",
        };
        await patientService.SaveAppointmentAsync(appt);

        // Build alert and broadcast to all connected doctors
        var alert = new PatientAlert
        {
            AppointmentId     = appt.AppointmentId,
            PatientId         = req.PatientId,
            PatientName       = req.PatientName,
            Age               = req.Age,
            Gender            = req.Gender,
            Symptoms          = req.Symptoms,
            UrgencyLevel      = result.UrgencyLevel,
            DoctorName        = result.RecommendedDoctor.Name,
            DoctorSpecialty   = result.RecommendedDoctor.Specialty,
            EstimatedWaitTime = result.EstimatedWaitTime,
            Reasoning         = result.Reasoning,
            SuggestedTests    = result.SuggestedTests,
            AdditionalNotes   = result.AdditionalNotes,
            Status            = "Waiting",
            CheckedInAt       = appt.CreatedAt,
        };

        await hubContext.Clients.Group("doctors")
            .SendAsync("NewPatientAlert", alert);

        logger.LogInformation(
            "Broadcast NewPatientAlert → {PatientName} urgency={Urgency} appt={AppointmentId}",
            req.PatientName, result.UrgencyLevel, appt.AppointmentId);
    }
}
