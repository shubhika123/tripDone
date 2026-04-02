"""
Notification Service — Twilio WhatsApp + Resend Email
Sends price drop alerts and train delay alerts.
For demo: call send_whatsapp_alert() directly to trigger manually.
"""

import os
from dotenv import load_dotenv
load_dotenv('.env')

TWILIO_SID   = os.getenv("TWILIO_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_TOKEN", "")
TWILIO_PHONE = os.getenv("TWILIO_PHONE", "")   # e.g. whatsapp:+14783128613
RESEND_KEY   = os.getenv("RESEND_API_KEY", "")


def send_whatsapp_alert(to_phone: str, message: str) -> dict:
    """
    Send a WhatsApp message via Twilio Sandbox.
    to_phone should be in E.164 format e.g. '+919876543210'
    Returns {"success": True/False, "sid": "...", "error": "..."}
    """
    if not TWILIO_SID or not TWILIO_TOKEN:
        print(f"[Twilio] No creds — would send to {to_phone}: {message}")
        return {"success": False, "error": "Twilio not configured"}

    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)

        # Twilio sandbox requires 'whatsapp:' prefix
        from_wa = f"whatsapp:{TWILIO_PHONE}" if not TWILIO_PHONE.startswith("whatsapp:") else TWILIO_PHONE
        to_wa   = f"whatsapp:{to_phone}"     if not to_phone.startswith("whatsapp:")    else to_phone

        msg = client.messages.create(
            body=message,
            from_=from_wa,
            to=to_wa
        )
        print(f"[Twilio] Sent WhatsApp SID={msg.sid}")
        return {"success": True, "sid": msg.sid}
    except Exception as e:
        print(f"[Twilio] Error: {e}")
        return {"success": False, "error": str(e)}


def send_price_alert_whatsapp(to_phone: str, route: str, old_price: float, new_price: float, platform_url: str = "") -> dict:
    """Convenience wrapper for price drop alerts."""
    saving = round(old_price - new_price)
    message = (
        f"✈️ *TripDone Price Alert*\n\n"
        f"Good news! The price for *{route}* has dropped.\n\n"
        f"💰 New price: ₹{int(new_price):,}\n"
        f"📉 You save: ₹{saving:,}\n\n"
        f"{'Book now → ' + platform_url if platform_url else 'Open TripDone to book now.'}\n\n"
        f"_Reply STOP to unsubscribe_"
    )
    return send_whatsapp_alert(to_phone, message)


def send_delay_alert_whatsapp(
    to_phone: str,
    train_number: str,
    train_name: str,
    delay_minutes: int,
    cancel_deadline: str,
    cab_provider: str = "your cab"
) -> dict:
    """
    Send train delay + cab cancellation warning.
    cancel_deadline: human-readable string e.g. '11:30 AM'
    """
    message = (
        f"🚂 *TripDone Delay Alert*\n\n"
        f"*{train_name}* ({train_number}) is running *{delay_minutes} minutes late*.\n\n"
        f"⚠️ To cancel {cab_provider} for free, you must cancel before *{cancel_deadline}*.\n\n"
        f"Open your cab app now to cancel — avoid the penalty charge.\n\n"
        f"_TripDone is monitoring your train every 2 hours._"
    )
    return send_whatsapp_alert(to_phone, message)


def send_email_alert(to_email: str, subject: str, html_body: str) -> dict:
    """Send email via Resend. Falls back gracefully if key not set."""
    if not RESEND_KEY or "your_resend" in RESEND_KEY:
        print(f"[Resend] No key — would email {to_email}: {subject}")
        return {"success": False, "error": "Resend not configured"}
    try:
        import resend
        resend.api_key = RESEND_KEY
        r = resend.Emails.send({
            "from": "TripDone <alerts@tripdone.app>",
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        })
        return {"success": True, "id": r.get("id", "")}
    except Exception as e:
        print(f"[Resend] Error: {e}")
        return {"success": False, "error": str(e)}
