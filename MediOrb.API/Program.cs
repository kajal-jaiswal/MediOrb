using MediOrb.API.Data;
using MediOrb.API.Hubs;
using MediOrb.API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── CORS ──────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:4200"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()));

// ── SQLite + EF Core ──────────────────────────────────────────
var connStr = builder.Configuration.GetConnectionString("Default") ?? "Data Source=mediOrb.db";
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlite(connStr));

// ── SignalR ───────────────────────────────────────────────────
builder.Services.AddSignalR();

// ── HTTP Clients ──────────────────────────────────────────────
builder.Services.AddHttpClient("Groq", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

builder.Services.AddHttpClient("Resend", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// ── Services ──────────────────────────────────────────────────
builder.Services.AddScoped<GroqService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<SmsService>();
builder.Services.AddScoped<PatientService>();

// ── Controllers ───────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddOpenApi();

var app = builder.Build();

// ── Ensure DB exists (creates SQLite file on first run) ───────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// ── Middleware ────────────────────────────────────────────────
app.MapOpenApi();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/openapi/v1.json", "MediOrb.API v1");
    options.RoutePrefix = "swagger";
});

app.MapGet("/", () => Results.Redirect("/swagger"));

app.UseCors();
app.MapControllers();
app.MapHub<PatientHub>("/hubs/patients");

app.Run();
