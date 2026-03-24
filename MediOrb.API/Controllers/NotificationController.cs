using Microsoft.AspNetCore.Mvc;
using MediOrb.API.Models;
using MediOrb.API.Services;

namespace MediOrb.API.Controllers;

[ApiController]
[Route("api/notify")]
public class NotificationController(
    EmailService emailService,
    SmsService smsService) : ControllerBase
{
    [HttpPost("email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendEmail([FromBody] EmailNotificationRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var success = await emailService.SendAppointmentEmailAsync(request);
        return Ok(new { success });
    }

    [HttpPost("sms")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendSms([FromBody] SmsNotificationRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var success = await smsService.SendSmsAsync(request.Phone, request.Message);
        return Ok(new { success });
    }
}
