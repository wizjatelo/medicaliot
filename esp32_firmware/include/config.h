#ifndef CONFIG_H
#define CONFIG_H

// Device Identity
#define DEVICE_CODE "MD001"
#define FIRMWARE_VERSION "1.0.0"

// LoRa Pins (Heltec WiFi LoRa 32 V3)
#define LORA_SS 8
#define LORA_RST 12
#define LORA_DIO0 14

// LoRa Parameters
#define LORA_FREQUENCY 868E6
#define LORA_BANDWIDTH 125E3
#define LORA_SPREADING_FACTOR 9
#define LORA_CODING_RATE 5
#define LORA_TX_POWER 20

// Pin Definitions
#define SERVO_PIN 13
#define IR_SENSOR_PIN 34
#define BUZZER_PIN 25
#define LED_RED_PIN 26
#define LED_GREEN_PIN 27
#define CONFIRM_BUTTON_PIN 0

// Fingerprint Scanner (UART2)
#define FP_RX_PIN 16
#define FP_TX_PIN 17
#define FP_BAUD 57600
#define FP_MAX_ATTEMPTS 3

// RTC
#define RTC_SDA_PIN 21
#define RTC_SCL_PIN 22

// OLED
#define OLED_WIDTH 128
#define OLED_HEIGHT 64

// Timing
#define PILL_DETECT_TIMEOUT_SEC 10
#define CONFIRM_TIMEOUT_SEC 900
#define HEARTBEAT_INTERVAL_MIN 60
#define ALERT_BUZZ_DURATION_MS 500
#define ALERT_BUZZ_REPEATS 3

// Storage
#define SCHEDULE_FILE "/schedule.json"
#define EVENT_BUFFER_FILE "/events.json"
#define MAX_BUFFERED_EVENTS 500

#endif