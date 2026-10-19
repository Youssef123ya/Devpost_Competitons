using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SmartKitchen.API.Data;
using SmartKitchen.API.DTOs;
using SmartKitchen.API.Models;

namespace SmartKitchen.API.Services;

public class FirebaseSyncService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly HttpClient _httpClient;

    public FirebaseSyncService(
        IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
        _httpClient = new HttpClient();
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var json =
                    await _httpClient.GetStringAsync(
                        "https://ai-enhanced-smart-iot-kitchen-default-rtdb.firebaseio.com/sensorData.json",
                        stoppingToken);

                var data =
                    JsonSerializer.Deserialize<SensorDataRequest>(
                        json,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                if (data != null)
                {
                    using var scope =
                        _scopeFactory.CreateScope();

                    var db =
                        scope.ServiceProvider
                            .GetRequiredService<ApplicationDbContext>();

                    db.SensorReadings.Add(
                        new SensorReading
                        {
                            GasValue = data.GasValue,
                            Temperature = data.Temperature,
                            Humidity = data.Humidity ?? 0,
                            Distance = data.Distance ?? 0,

                            MotionDetected =
                                (data.Hand ?? "")
                                    .ToUpper() == "YES",

                            FlameDetected =
                                (data.Flame ?? "")
                                    .ToUpper() == "YES",

                            Basket = data.Basket ?? "CLOSED",
                            Hand = data.Hand ?? "NO",
                            LED = data.LED ?? "OFF",
                            GasValve = data.GasValve ?? "CLOSED",
                            BuzzerState = data.BuzzerState ?? "OFF"
                        });

                    await db.SaveChangesAsync(
                        stoppingToken);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Firebase Sync Error: {ex.Message}");
            }

            await Task.Delay(
                TimeSpan.FromSeconds(5),
                stoppingToken);
        }
    }
}
