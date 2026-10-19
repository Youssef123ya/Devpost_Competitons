#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ESP32Servo.h>
#include <DHT.h>
#include <time.h>

// ================= WIFI =================
const char* ssid = "Android";
const char* password = "11223344";

// API URL
const char* apiURL = "https://nonimperialistically-unlibellous-tanika.ngrok-free.dev/api/sensors/data";

// إرسال كل 10 ثواني
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 10000;

// ================= PINS =================
#define IR_PIN          4
#define TRIG_PIN        25
#define ECHO_PIN        33
#define LIGHT_PIN       2
#define MQ2_PIN         34
#define FLAME_PIN       27
#define RELAY_PIN       23
#define BIN_SERVO_PIN   26
#define GAS_SERVO_PIN   18
#define DHT_PIN         16
#define DHT_TYPE        DHT22
#define BUZZER_PIN      22

// ================= OBJECTS =================
Servo binServo;
Servo gasServo;
DHT dht(DHT_PIN, DHT_TYPE);

// ================= SETTINGS =================
const int BIN_OPEN_ANGLE  = 90;
const int BIN_CLOSE_ANGLE = 0;

const int GAS_OPEN_ANGLE  = 0;
const int GAS_CLOSE_ANGLE = 90;

const int MQ2_THRESHOLD = 2000;
const float TEMP_THRESHOLD = 60.0;
const int DISTANCE_THRESHOLD = 80;

// ================= STATES =================
bool binOpened = false;
bool dangerMode = false;

// ================= WIFI =================
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    Serial.print(" Status=");
    Serial.println(WiFi.status());

    if (millis() - start > 15000) {
      Serial.println("\nWiFi Failed (timeout)");
      return;
    }
  }

  Serial.println("\nWiFi Connected");
  Serial.println(WiFi.localIP());
}

// ================= DISTANCE =================
float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 999;

  return duration * 0.034 / 2.0;
}

// ================= SEND API =================
void sendToAPI(float distance,
               int gasValue,
               float temperature,
               float humidity,
               bool flameDetected,
               bool handDetected,
               bool binOpened,
               bool dangerMode) {

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  http.begin(client, apiURL);
  http.addHeader("Content-Type", "application/json");

  http.setTimeout(10000);
  http.setReuse(false);

  String json = "{";
  json += "\"gasValue\":" + String(gasValue) + ",";
  json += "\"temperature\":" + String(temperature, 2) + ",";
  json += "\"humidity\":" + String(humidity, 2) + ",";
  json += "\"distance\":" + String(distance, 2) + ",";
  json += "\"flame\":\"" + String(flameDetected ? "YES" : "NO") + "\",";
  json += "\"hand\":\"" + String(handDetected ? "YES" : "NO") + "\",";
  json += "\"basket\":\"" + String(binOpened ? "OPEN" : "CLOSED") + "\",";
  json += "\"led\":\"" + String(digitalRead(LIGHT_PIN) ? "ON" : "OFF") + "\",";
  json += "\"gasValve\":\"" + String(dangerMode ? "CLOSED" : "OPEN") + "\",";
  json += "\"buzzerState\":\"" + String(digitalRead(BUZZER_PIN) ? "ON" : "OFF") + "\"";
  json += "}";

  int httpCode = http.POST(json);

  Serial.print("HTTP Code: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    Serial.println(http.getString());
  } else {
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(IR_PIN, INPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(FLAME_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);

  dht.begin();

  binServo.attach(BIN_SERVO_PIN);
  gasServo.attach(GAS_SERVO_PIN);

  binServo.write(BIN_CLOSE_ANGLE);
  gasServo.write(GAS_OPEN_ANGLE);

  digitalWrite(LIGHT_PIN, LOW);
  digitalWrite(RELAY_PIN, HIGH);

  connectWiFi();
  configTime(2 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  Serial.println("System Started...");
}

// ================= LOOP =================
void loop() {

  unsigned long now = millis();

  bool handDetected = (digitalRead(IR_PIN) == LOW);

  static unsigned long irDetectStart = 0;
  static unsigned long irLostStart = 0;

  // BIN CONTROL
  if (handDetected) {
    irLostStart = 0;

    if (!binOpened) {
      if (irDetectStart == 0) irDetectStart = now;

      if (now - irDetectStart >= 2000) {
        binServo.write(BIN_OPEN_ANGLE);
        binOpened = true;
      }
    }
  } else {
    irDetectStart = 0;

    if (binOpened) {
      if (irLostStart == 0) irLostStart = now;

      if (now - irLostStart >= 5000) {
        binServo.write(BIN_CLOSE_ANGLE);
        binOpened = false;
      }
    }
  }

  // DISTANCE / LIGHT
  float distance = getDistance();

  digitalWrite(LIGHT_PIN, distance < DISTANCE_THRESHOLD);

  // SENSORS
  int gasValue = analogRead(MQ2_PIN);
  int flameValue = digitalRead(FLAME_PIN);

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT ERROR");
    return;
  }

  bool gasLeak = gasValue > MQ2_THRESHOLD;
  bool flameDetected = (flameValue == LOW);
  bool highTemp = (!isnan(temperature) && temperature > TEMP_THRESHOLD);

  bool danger = gasLeak || flameDetected || highTemp;

  if (danger) {
    gasServo.write(GAS_CLOSE_ANGLE);
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(BUZZER_PIN, HIGH);
    dangerMode = true;
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    gasServo.write(GAS_OPEN_ANGLE);
    digitalWrite(RELAY_PIN, HIGH);
    dangerMode = false;
  }

  // API SEND
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();

    sendToAPI(distance,
              gasValue,
              temperature,
              humidity,
              flameDetected,
              handDetected,
              binOpened,
              dangerMode);
  }

  // SERIAL OUTPUT
  Serial.println("{");

  Serial.print("  \"gasValue\": ");
  Serial.println(gasValue);

  Serial.print("  \"temperature\": ");
  Serial.println(temperature, 2);

  Serial.print("  \"humidity\": ");
  Serial.println(humidity, 2);

  Serial.print("  \"distance\": ");
  Serial.println(distance, 2);

  Serial.print("  \"flame\": \"");
  Serial.print(flameDetected ? "YES" : "NO");
  Serial.println("\",");

  Serial.print("  \"hand\": \"");
  Serial.print(handDetected ? "YES" : "NO");
  Serial.println("\",");

  Serial.print("  \"basket\": \"");
  Serial.print(binOpened ? "OPEN" : "CLOSED");
  Serial.println("\",");

  Serial.print("  \"led\": \"");
  Serial.print(digitalRead(LIGHT_PIN) ? "ON" : "OFF");
  Serial.println("\",");

  Serial.print("  \"gasValve\": \"");
  Serial.print(dangerMode ? "CLOSED" : "OPEN");
  Serial.println("\",");

  Serial.print("  \"buzzerState\": \"");
  Serial.print(digitalRead(BUZZER_PIN) ? "ON" : "OFF");
  Serial.println("\"");

  Serial.println("}");

  delay(500);
}