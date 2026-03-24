using Microsoft.AspNetCore.SignalR;

namespace MediOrb.API.Hubs;

public class PatientHub : Hub
{
    /// <summary>Called by doctor clients to subscribe to real-time patient alerts.</summary>
    public async Task JoinDoctorRoom()
        => await Groups.AddToGroupAsync(Context.ConnectionId, "doctors");

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "doctors");
        await base.OnDisconnectedAsync(exception);
    }
}
