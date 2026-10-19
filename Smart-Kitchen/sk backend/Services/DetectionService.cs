using SmartKitchen.API.DTOs;

namespace SmartKitchen.API.Services;

public class DetectionService : IDetectionService
{
    private static string GetGasRiskLevel(int gasValue)
    {
        if (gasValue >= 1200)
            return "Critical";

        if (gasValue >= 700)
            return "High";

        if (gasValue >= 500)
            return "Warning";

        return "Normal";
    }

    private static string GetTemperatureRiskLevel(double temperature)
    {
        if (temperature >= 60)
            return "Critical";

        if (temperature >= 50)
            return "High";

        if (temperature >= 35)
            return "Warning";

        return "Normal";
    }

    public DetectionService()
    {
    }

    public DetectionResult Classify(
        SensorDataRequest current,
        SensorDataRequest? previous)
    {
        if (IsZeroState(current))
        {
            return new DetectionResult
            {
                State = "UPDATING",
                IsAlertActive = false,
                AlertMessage = "Updating"
            };
        }

        var warnings = new List<string>();

        var gasValue = current.GasValue;
        var temperature = current.Temperature;

        var gasRisk = GetGasRiskLevel(gasValue);
        var tempRisk = GetTemperatureRiskLevel(temperature);

        var flameDetected =
            string.Equals(
                current.Flame,
                "YES",
                StringComparison.OrdinalIgnoreCase);

        if (flameDetected)
        {
            warnings.Add("Fire Detected");
        }
        else if (gasValue > 1200)
        {
            warnings.Add("Gas Leak Detected");
        }
        else if (temperature >= 35 &&
                 gasValue > 700 &&
                 gasValue <= 1200)
        {
            warnings.Add("Cooking Activity Detected");
        }
        else
        {
            warnings.Add("Environment Safe");
        }

        string state;

        if (flameDetected)
        {
            state = "FIRE";
        }
        else if (gasValue > 1200)
        {
            state = "GAS_LEAK";
        }
        else if (temperature >= 35 &&
                 gasValue > 700 &&
                 gasValue <= 1200)
        {
            state = "COOKING";
        }
        else if (temperature < 35 &&
                 gasValue <= 700)
        {
            state = "NORMAL";
        }
        else
        {
            state = "UPDATING";
        }

        var riskLevel = "Normal";

        if (gasValue > 1200 ||
            temperature >= 60)
        {
            riskLevel = "Critical";
        }
        else if (gasValue > 700 ||
                 temperature >= 50)
        {
            riskLevel = "High";
        }
        else if (gasValue > 500 ||
                 temperature >= 35)
        {
            riskLevel = "Warning";
        }

        var critical =
            state == "FIRE" || state == "GAS_LEAK";

        Console.WriteLine($"RiskLevel={riskLevel}");
        Console.WriteLine($"Critical={critical}");
        Console.WriteLine($"GasShutdownRequired={critical}");

        var previousRisk = "Normal";

        if (previous != null)
        {
            previousRisk =
                GetGasRiskLevel(
                    previous.GasValue);
        }

        string? trend = null;

        if (previous != null)
        {
            var gasDelta =
                gasValue -
                previous.GasValue;

            if (gasDelta > 50)
            {
                trend = "Increasing";
            }
            else if (gasDelta < -50)
            {
                trend = "Decreasing";
            }
        }

        string? transition = null;

        if (previousRisk != riskLevel)
        {
            transition =
                $"{previousRisk}->{riskLevel}";
        }

        return new DetectionResult
        {
            State = state,
            RiskLevel = riskLevel,
            LEDRequired = critical,
            GasShutdownRequired = critical,
            Trend = trend,
            RiskTransition = transition,
            IsAlertActive = critical,
            AlertMessage = string.Join(", ", warnings)
        };
    }

    public string GetGasStatus(int gasValue)
    {
        if (gasValue <= 500)
        {
            return "Normal";
        }

        if (gasValue <= 1200)
        {
            return "Cooking";
        }

        return "Gas Leak";
    }

    public string GetLightStatus(bool light)
    {
        return light ? "On" : "Off";
    }

    public string GetBuzzerStatus(bool buzzer)
    {
        return buzzer ? "On" : "Off";
    }

    private static bool IsZeroState(
        SensorDataRequest request)
    {
        return request.GasValue == 0
               && request.Temperature == 0
               && (request.Humidity ?? 0) == 0
               && (request.Distance ?? 0) == 0
               && (request.Flame ?? "NO") == "NO"
               && (request.Hand ?? "NO") == "NO"
               && (request.LED ?? "OFF") == "OFF"
               && (request.GasValve ?? "CLOSED") == "CLOSED"
               && (request.Basket ?? "CLOSED") == "CLOSED"
               && (request.BuzzerState ?? "OFF") == "OFF";
    }
}