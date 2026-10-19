using System.ComponentModel.DataAnnotations;

namespace SmartKitchen.API.DTOs;

using System.Text.Json.Serialization;

public class SensorDataRequest
{
    [JsonPropertyName("gas")]
    public int GasValue { get; set; }

    [Required]
    public double Temperature { get; set; }

    [Required]
    public double? Humidity { get; set; }

    [Required]
    public double? Distance { get; set; }

    [Required, MinLength(1)]
    public string? Flame { get; set; }

    [Required, MinLength(1)]
    public string? Hand { get; set; }

    [Required, MinLength(1)]
    public string? Basket { get; set; }

    [Required, MinLength(1)]
    public string? LED { get; set; }

    [Required, MinLength(1)]
    public string? GasValve { get; set; }

    [Required, MinLength(1)]
    public string? BuzzerState { get; set; }
}
public class GasControlRequest
{
    [Required]
    public bool EnableGas { get; set; }
}

public class LatestSensorSimpleResponse
{
    public int GasValue { get; set; }

    public double Temperature { get; set; }

    public double Humidity { get; set; }
    public bool FlameDetected { get; set; }

    public string GasValve { get; set; } = "CLOSED";
}
public class GasUiDto
{
    public int Value { get; set; }
    public string Status { get; set; } = "Normal";
}


public class LightUiDto
{
    public bool IsOn { get; set; }
    public string Status { get; set; } = "Off";
}


public class BuzzerUiDto
{
    public bool IsOn { get; set; }
    public string Status { get; set; } = "Off";
}

public class AlertUiDto
{
    public bool IsActive { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ActivityLogItemDto
{
    public string Time { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SeverityIconType { get; set; } = string.Empty;
}

public class DetectionResult
{
    public string State { get; set; } = "Normal";

    public string RiskLevel { get; set; } = "Normal";

    public bool IsAlertActive { get; set; }

    public string AlertMessage { get; set; } = string.Empty;

    public bool LEDRequired { get; set; }

    public bool GasShutdownRequired { get; set; }

    public bool IsRecovering { get; set; }

    public string? Trend { get; set; }

    public string? RiskTransition { get; set; }
}

