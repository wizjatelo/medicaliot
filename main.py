#!/usr/bin/env python3
"""
MediDispense — LoRa Bridge
Reads LoRa serial data from USB dongle and publishes to MQTT broker.
"""

import os
import json
import time
import serial
import paho.mqtt.client as mqtt
from datetime import datetime
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

SERIAL_PORT   = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
BAUD_RATE     = int(os.getenv("BAUD_RATE", 115200))
MQTT_HOST     = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT     = int(os.getenv("MQTT_PORT", 1883))
MQTT_USER     = os.getenv("MQTT_USERNAME", "lora_bridge")
MQTT_PASS     = os.getenv("MQTT_PASSWORD", "")
TOPIC_PREFIX  = os.getenv("MQTT_TOPIC_PREFIX", "devices")
LOG_DIR       = "/app/logs"

os.makedirs(LOG_DIR, exist_ok=True)
logger.add(f"{LOG_DIR}/bridge_{{time}}.log", rotation="1 day", retention="7 days")


def parse_lora_packet(raw: str) -> dict | None:
    """
    Parse CSV packet: MD001,20260427,0900,DOSE_TAKEN,CONFIRMED,15
    Returns dict or None if invalid.
    """
    try:
        parts = [p.strip() for p in raw.strip().split(",")]
        if len(parts) != 6:
            return None
        return {
            "device_id":       parts[0],
            "date":            parts[1],
            "time":            parts[2],
            "event_type":      parts[3],
            "status":          parts[4],
            "pills_remaining": int(parts[5]),
            "received_at":     datetime.utcnow().isoformat() + "Z",
        }
    except Exception as e:
        logger.warning(f"Parse error: {e} | raw={raw!r}")
        return None


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Connected to MQTT broker")
    else:
        logger.error(f"MQTT connect failed, rc={rc}")


def main():
    # Setup MQTT
    client = mqtt.Client(client_id="lora_bridge")
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.on_connect = on_connect

    while True:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
            client.loop_start()
            break
        except Exception as e:
            logger.error(f"MQTT connect error: {e}. Retrying in 5s...")
            time.sleep(5)

    # Setup serial
    ser = None
    while True:
        try:
            if ser is None or not ser.is_open:
                ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
                logger.info(f"Serial port {SERIAL_PORT} opened at {BAUD_RATE} baud")

            raw = ser.readline().decode("utf-8", errors="ignore").strip()
            if not raw:
                continue

            logger.debug(f"RAW: {raw}")

            payload = parse_lora_packet(raw)
            if payload is None:
                logger.warning(f"Invalid packet skipped: {raw!r}")
                continue

            topic = f"{TOPIC_PREFIX}/{payload['device_id']}/telemetry"
            msg   = json.dumps(payload)
            result = client.publish(topic, msg, qos=1)

            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published → {topic} | {msg}")
            else:
                logger.error(f"Publish failed rc={result.rc}")

        except serial.SerialException as e:
            logger.error(f"Serial error: {e}. Reconnecting in 3s...")
            if ser:
                ser.close()
            ser = None
            time.sleep(3)

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            time.sleep(1)


if __name__ == "__main__":
    main()
