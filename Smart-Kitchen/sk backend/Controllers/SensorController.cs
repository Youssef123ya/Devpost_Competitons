using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using SmartKitchen.API.Data;
using SmartKitchen.API.DTOs;
using SmartKitchen.API.Hubs;
using SmartKitchen.API.Models;
using SmartKitchen.API.Services;

namespace SmartKitchen.API.Controllers;

[ApiController]
[Route("api/sensors")]
public class SensorController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IDetectionService _detectionService;
    private readonly IAlertService _alertService;
    private readonly IHubContext<SafetyHub> _hubContext;

    public SensorController(
        ApplicationDbContext db,
        IDetectionService detectionService,
        IAlertService alertService,
        IHubContext<SafetyHub> hubContext)
    {
        _db = db;
        _detectionService = detectionService;
        _alertService = alertService;
        _hubContext = hubContext;
    }
    [HttpPost("data")]
    [Consumes("application/json")]
    public async Task<IActionResult> PostSensorData(
    [FromHeader(Name = "Content-Type")] string? contentType,
    [FromBody] SensorDataRequest request,
    CancellationToken cancellationToken)
    {
         if (!ModelState.IsValid)
    {
        return BadRequest(new
        {
            StatusCode = 400,
            Message = "All fields are required.",
            Errors = ModelState
        });
        }
        var headers = new
        {
            ContentType = contentType
        };

        
        var body = new
        {
            request.GasValue,
            request.Temperature,
            request.Humidity,
            request.Distance,
            request.Flame,
            request.Hand,
            request.Basket,
            request.LED,
            request.GasValve,
            request.BuzzerState
        };

        Console.WriteLine($"Header: {headers.ContentType}");

        Console.WriteLine(
            System.Text.Json.JsonSerializer.Serialize(body));

        var previousAlert =
            await _alertService.GetLatestAlertAsync(
                cancellationToken);

        _db.Database.SetCommandTimeout(60);

        var previousReading =
            await _db.SensorReadings
                .AsNoTracking()
                .OrderByDescending(s => s.Id)
                .FirstOrDefaultAsync(cancellationToken);

        var previousRequest =
            previousReading is null
                ? null
                : new SensorDataRequest
                {
                    GasValue = previousReading.GasValue,

                    Temperature = previousReading.Temperature,

                    Humidity = previousReading.Humidity,

                    Distance = previousReading.Distance,

                    Flame = previousReading.FlameDetected
                        ? "YES"
                        : "NO",

                    Hand = previousReading.MotionDetected
                        ? "YES"
                        : "NO",

                    LED = previousReading.LED,

                    GasValve = previousReading.GasValve,

                    Basket = previousReading.Basket,

                    BuzzerState = previousReading.BuzzerState
                };
        var normalizedRequest =
     new SensorDataRequest
     {
         GasValue = request.GasValue,
         Temperature = request.Temperature,
         Humidity = request.Humidity,
         Distance = request.Distance,

         Flame = request.Flame,
         Hand = request.Hand,
         LED = request.LED,
         GasValve = request.GasValve,
         Basket = request.Basket,
         BuzzerState = request.BuzzerState
     };
        


        var detection =
            _detectionService.Classify(
                normalizedRequest,
                previousRequest);
        if (detection.Trend == "Increasing")
        {
            _db.ActivityLogEntries.Add(
                new ActivityLogEntry
                {
                    Time = DateTime.UtcNow,
                    Title = "Gas Level Increasing",
                    Description =
                        "Gas concentration continues to rise.",
                    SeverityIconType = "warning"
                });
        }

        if (detection.Trend == "Decreasing")
        {
            _db.ActivityLogEntries.Add(
                new ActivityLogEntry
                {
                    Time = DateTime.UtcNow,
                    Title = "Gas Leak Improving",
                    Description =
                        "Gas concentration is decreasing.",
                    SeverityIconType = "info"
                });
        }
        if (detection.RiskTransition ==
    "Warning->High")
        {
            _db.ActivityLogEntries.Add(
                new ActivityLogEntry
                {
                    Time = DateTime.UtcNow,
                    Title = "Risk Level Increased",
                    Description =
                        "Gas concentration reached a higher risk category.",
                    SeverityIconType = "warning"
                });
        }

        if (detection.RiskTransition ==
            "High->Critical")
        {
            _db.ActivityLogEntries.Add(
                new ActivityLogEntry
                {
                    Time = DateTime.UtcNow,
                    Title = "Critical Gas Leak Detected",
                    Description =
                        "Emergency threshold exceeded. Safety actions activated.",
                    SeverityIconType = "critical"
                });
        }
        if (detection.RiskTransition ==
    "Critical->High")
        {
            _db.ActivityLogEntries.Add(
                new ActivityLogEntry
                {
                    Time = DateTime.UtcNow,
                    Title = "Risk Level Reduced",
                    Description =
                        "Gas concentration dropped below the critical threshold.",
                    SeverityIconType = "info"
                });
        }

        if (detection.RiskTransition ==
            "Warning->Normal")
        {
            _db.ActivityLogEntries.Add(
                new ActivityLogEntry
                {
                    Time = DateTime.UtcNow,
                    Title = "Environment Restored",
                    Description =
                        "All sensor readings returned to safe levels.",
                    SeverityIconType = "success"
                });
        }
        _db.SensorReadings.Add(
new SensorReading
{
    GasValue = normalizedRequest.GasValue,

    Light = false,

    Buzzer =
        NormalizeHardwareState(
            normalizedRequest.BuzzerState,
            "OFF") == "ON",

    Temperature = normalizedRequest.Temperature,

    Humidity = normalizedRequest.Humidity ?? 0,

    MotionDetected =
        NormalizeHardwareState(
            normalizedRequest.Hand,
            "NO") == "YES",

    FlameDetected =
        NormalizeHardwareState(
            normalizedRequest.Flame,
            "NO") == "YES",

    Distance = normalizedRequest.Distance ?? 0,

    LED = NormalizeHardwareState(
        normalizedRequest.LED,
        "OFF"),

    GasValve = NormalizeHardwareState(
        normalizedRequest.GasValve,
        "CLOSED"),

    Basket = NormalizeHardwareState(
        normalizedRequest.Basket,
        (normalizedRequest.Distance ?? 0) < 50
            ? "OPEN"
            : "CLOSED"),

    Hand = NormalizeHardwareState(
        normalizedRequest.Hand,
        "NO"),

    BuzzerState = NormalizeHardwareState(
        normalizedRequest.BuzzerState,
        "OFF"),

    State = detection.State
});

        await _db.SaveChangesAsync(
            cancellationToken);

        await _alertService.HandleDetectionAsync(
    detection,
    previousAlert.IsActive,
    true,
    cancellationToken);
        if (detection.GasShutdownRequired)
        {
            Console.WriteLine(
    "AUTO SHUTDOWN TRIGGERED");
            await _alertService.SetGasControlStateAsync(
                false,
                "sensor",
                cancellationToken);
        }
        if (detection.State == "NORMAL")
        {
            await _alertService.SetGasControlStateAsync(
                true,
                "sensor",
                cancellationToken);
        }


        if (detection.State == "NORMAL")
        {
            var gasControl =
                await _alertService.GetGasControlStateAsync(
                    cancellationToken);

            if (!gasControl.IsEnabled)
            {
                await _alertService.SetGasControlStateAsync(
                    true,   
                    "sensor",
                    cancellationToken);
            }
        }

        var latestAlert =
     await _alertService.GetLatestAlertAsync(
         cancellationToken);

        var response =
            new
            {
                GasValue = normalizedRequest.GasValue,

                Temperature = normalizedRequest.Temperature,

                Humidity = normalizedRequest.Humidity,

                GasValve = NormalizeHardwareState(
                    normalizedRequest.GasValve,
                    "CLOSED")
            };
        await _hubContext.Clients.All.SendAsync(
            "SensorUpdated",
            response,
            cancellationToken);

        await _hubContext.Clients.All.SendAsync(
            "AlertUpdated",
            latestAlert,
            cancellationToken);
        if (!previousAlert.IsActive &&
            latestAlert.IsActive)
        {
            await _hubContext.Clients.All.SendAsync(
                "PushNotification",
                "Emergency Leak! Gas Leak in Kitchen",
                cancellationToken);
        }

        return Ok(new
        {
            StatusCode = 200,
            Message = "Sensor data received successfully."
        });

    }
    [HttpPost("firebase-sync")]
    public async Task<IActionResult> SyncFirebase(
    CancellationToken cancellationToken)
    {
        using var client = new HttpClient();

        var json =
            await client.GetStringAsync(
                "https://ai-enhanced-smart-iot-kitchen-default-rtdb.firebaseio.com/sensorData.json",
                cancellationToken);

        var firebaseData =
            JsonSerializer.Deserialize<SensorDataRequest>(
                json,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

        if (firebaseData is null)
        {
            return BadRequest(new
            {
                StatusCode = 400,
                Message = "No data found in Firebase."
            });
        }

        var detection =
            _detectionService.Classify(
                firebaseData,
                null);

        _db.SensorReadings.Add(
            new SensorReading
            {
                GasValue = firebaseData.GasValue,

                Temperature = firebaseData.Temperature,

                Humidity = firebaseData.Humidity ?? 0,

                Distance = firebaseData.Distance ?? 0,

                MotionDetected =
                    NormalizeHardwareState(
                        firebaseData.Hand,
                        "NO") == "YES",

                FlameDetected =
                    NormalizeHardwareState(
                        firebaseData.Flame,
                        "NO") == "YES",

                LED = NormalizeHardwareState(
                    firebaseData.LED,
                    "OFF"),

                GasValve = NormalizeHardwareState(
                    firebaseData.GasValve,
                    "CLOSED"),

                Basket = NormalizeHardwareState(
                    firebaseData.Basket,
                    "CLOSED"),

                Hand = NormalizeHardwareState(
                    firebaseData.Hand,
                    "NO"),

                BuzzerState = NormalizeHardwareState(
                    firebaseData.BuzzerState,
                    "OFF"),

                Buzzer =
                    NormalizeHardwareState(
                        firebaseData.BuzzerState,
                        "OFF") == "ON",

                State = detection.State
            });

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            StatusCode = 200,
            Message = "Firebase data synced successfully."
        });
    }
    [HttpGet("latest")]
    public async Task<IActionResult> GetLatestReading(
    CancellationToken cancellationToken)
    {
        var latest =
            await _db.SensorReadings
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

        if (latest is null)
        {
            return NotFound("No sensor data found.");
        }

        return Ok(
      new
      {
          GasValue = latest.GasValue,

          Temperature = latest.Temperature,

          Humidity = latest.Humidity,

          Flame = latest.FlameDetected ? "YES" : "NO",

   

          IsEnabled =
              NormalizeHardwareState(
                  latest.GasValve,
                  "CLOSED") == "OPEN"
      });
    }

    private static string NormalizeHardwareState(
        string? value,
        string fallback)
    {
        return string.IsNullOrWhiteSpace(value)
            ? fallback
            : value.Trim().ToUpperInvariant();
    }
}
