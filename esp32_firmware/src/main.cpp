#include <Arduino.h>
#include <LoRa.h>
#include <Wire.h>
#include <RTClib.h>
#include <Adafruit_Fingerprint.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include <U8g2lib.h>
#include "../include/config.h"

// Hardware instances
RTC_DS3231 rtc;
HardwareSerial fpSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fpSerial);
Servo pillServo;
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

// State variables
int pillsRemaining = 30;
bool rtcSynced = false;
DateTime nextDoseTime;

void setup() {
  Serial.begin(115200);
  Wire.begin(RTC_SDA_PIN, RTC_SCL_PIN);
  
  // Initialize OLED
  u8g2.begin();
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);
  u8g2.drawStr(0, 15, "MediDispense");
  u8g2.drawStr(0, 30, "Initializing...");
  u8g2.sendBuffer();
  
  // Initialize pins
  pinMode(IR_SENSOR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(CONFIRM_BUTTON_PIN, INPUT_PULLUP);
  
  // Initialize servo
  pillServo.attach(SERVO_PIN);
  pillServo.write(0);
  
  // Initialize RTC
  if (!rtc.begin()) {
    Serial.println("RTC not found!");
  } else {
    rtcSynced = true;
    Serial.println("RTC initialized");
  }
  
  // Initialize fingerprint scanner
  fpSerial.begin(FP_BAUD, SERIAL_8N1, FP_RX_PIN, FP_TX_PIN);
  if (finger.verifyPassword()) {
    Serial.println("Fingerprint sensor found");
  }
  
  // Initialize LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa init failed!");
  } else {
    LoRa.setSpreadingFactor(LORA_SPREADING_FACTOR);
    LoRa.setSignalBandwidth(LORA_BANDWIDTH);
    LoRa.setCodingRate4(LORA_CODING_RATE);
    LoRa.setTxPower(LORA_TX_POWER);
    Serial.println("LoRa initialized");
  }
  
  u8g2.clearBuffer();
  u8g2.drawStr(0, 15, "Ready");
  u8g2.sendBuffer();
}

// Function prototypes
void checkSchedule();
void dispenseDose();
bool verifyFingerprint();
bool detectPill();
bool waitForConfirmation();
void sendLoRaPacket(String eventType, String status);
void displayMessage(String line1, String line2 = "");
void buzzAlert(int repeats);

unsigned long lastHeartbeat = 0;
bool doseInProgress = false;

void loop() {
  unsigned long now = millis();
  
  // Send heartbeat every hour
  if (now - lastHeartbeat > HEARTBEAT_INTERVAL_MIN * 60000) {
    sendHeartbeat();
    lastHeartbeat = now;
  }
  
  // Check if it's time for a dose
  if (!doseInProgress && rtcSynced) {
    checkSchedule();
  }
  
  delay(1000);
}

void checkSchedule() {
  DateTime now = rtc.now();
  
  // TODO: Load schedule from SPIFFS and check if current time matches
  // For demo, trigger at specific times
  if (now.hour() == 9 && now.minute() == 0 && now.second() < 5) {
    dispenseDose();
  }
}

void dispenseDose() {
  doseInProgress = true;
  
  displayMessage("Time for", "medication!");
  buzzAlert(ALERT_BUZZ_REPEATS);
  digitalWrite(LED_RED_PIN, HIGH);
  
  // Step 1: Verify fingerprint
  displayMessage("Please scan", "fingerprint");
  
  if (!verifyFingerprint()) {
    displayMessage("Fingerprint", "failed!");
    sendLoRaPacket("DOSE_MISSED", "FAILED");
    digitalWrite(LED_RED_PIN, LOW);
    doseInProgress = false;
    return;
  }
  
  // Step 2: Dispense pill
  displayMessage("Dispensing", "pill...");
  pillServo.write(90);  // Open dispenser
  delay(1000);
  pillServo.write(0);   // Close dispenser
  
  // Step 3: Detect pill
  if (!detectPill()) {
    displayMessage("Dispense", "failed!");
    sendLoRaPacket("DISPENSE_FAIL", "FAILED");
    digitalWrite(LED_RED_PIN, LOW);
    doseInProgress = false;
    return;
  }
  
  pillsRemaining--;
  
  // Step 4: Wait for confirmation
  displayMessage("Press button", "to confirm");
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, HIGH);
  
  if (waitForConfirmation()) {
    displayMessage("Dose", "confirmed!");
    sendLoRaPacket("DOSE_TAKEN", "CONFIRMED");
  } else {
    displayMessage("Timeout!", "");
    sendLoRaPacket("DOSE_TAKEN", "NOT_CONFIRMED");
  }
  
  digitalWrite(LED_GREEN_PIN, LOW);
  delay(2000);
  displayMessage("Next dose:", "13:00");
  
  doseInProgress = false;
}

bool verifyFingerprint() {
  for (int attempt = 0; attempt < FP_MAX_ATTEMPTS; attempt++) {
    int result = finger.getImage();
    if (result == FINGERPRINT_OK) {
      result = finger.image2Tz();
      if (result == FINGERPRINT_OK) {
        result = finger.fingerSearch();
        if (result == FINGERPRINT_OK) {
          Serial.print("Fingerprint matched ID: ");
          Serial.println(finger.fingerID);
          return true;
        }
      }
    }
    delay(1000);
  }
  return false;
}

bool detectPill() {
  unsigned long startTime = millis();
  
  while (millis() - startTime < PILL_DETECT_TIMEOUT_SEC * 1000) {
    if (digitalRead(IR_SENSOR_PIN) == LOW) {  // Pill detected
      return true;
    }
    delay(100);
  }
  
  return false;
}

bool waitForConfirmation() {
  unsigned long startTime = millis();
  
  while (millis() - startTime < CONFIRM_TIMEOUT_SEC * 1000) {
    if (digitalRead(CONFIRM_BUTTON_PIN) == LOW) {  // Button pressed
      delay(50);  // Debounce
      if (digitalRead(CONFIRM_BUTTON_PIN) == LOW) {
        return true;
      }
    }
    delay(100);
  }
  
  return false;
}

void sendLoRaPacket(String eventType, String status) {
  DateTime now = rtc.now();
  
  char dateStr[9];
  sprintf(dateStr, "%04d%02d%02d", now.year(), now.month(), now.day());
  
  char timeStr[5];
  sprintf(timeStr, "%02d%02d", now.hour(), now.minute());
  
  String packet = String(DEVICE_CODE) + "," + 
                  String(dateStr) + "," + 
                  String(timeStr) + "," + 
                  eventType + "," + 
                  status + "," + 
                  String(pillsRemaining);
  
  Serial.println("Sending: " + packet);
  
  LoRa.beginPacket();
  LoRa.print(packet);
  LoRa.endPacket();
}

void sendHeartbeat() {
  DateTime now = rtc.now();
  
  String packet = String(DEVICE_CODE) + ",HEARTBEAT," + 
                  String(pillsRemaining) + "," + 
                  String(rtcSynced ? 1 : 0);
  
  LoRa.beginPacket();
  LoRa.print(packet);
  LoRa.endPacket();
  
  Serial.println("Heartbeat sent");
}

void displayMessage(String line1, String line2) {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);
  u8g2.drawStr(0, 15, line1.c_str());
  if (line2.length() > 0) {
    u8g2.drawStr(0, 35, line2.c_str());
  }
  u8g2.sendBuffer();
}

void buzzAlert(int repeats) {
  for (int i = 0; i < repeats; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(ALERT_BUZZ_DURATION_MS);
    digitalWrite(BUZZER_PIN, LOW);
    delay(300);
  }
}
