import cloudinary
import cloudinary.utils
import os
import time
import hashlib
from dotenv import load_dotenv
load_dotenv('.env')

CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "")

def setup_cloudinary():
    if CLOUDINARY_URL and "your_cloudinary" not in CLOUDINARY_URL:
        cloudinary.config(cloudinary_url=CLOUDINARY_URL)
        return True
    return False

IS_CONNECTED = setup_cloudinary()

def get_upload_url(trip_id: str, filename: str, location: str = ""):
    if not IS_CONNECTED:
        return {
            "upload_url": "https://api.cloudinary.com/v1_1/demo/image/upload",
            "signature": "mock-signature",
            "timestamp": int(time.time()),
            "public_id": f"tripdone/trips/{trip_id}/{filename}",
            "cloud_name": "demo",
            "api_key": "demo"
        }
    try:
        timestamp = int(time.time())
        public_id = f"tripdone/trips/{trip_id}/{filename}"
        params = {"timestamp": timestamp, "public_id": public_id}
        signature = cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret)
        return {
            "upload_url": f"https://api.cloudinary.com/v1_1/{cloudinary.config().cloud_name}/image/upload",
            "signature": signature,
            "timestamp": timestamp,
            "public_id": public_id,
            "cloud_name": cloudinary.config().cloud_name,
            "api_key": cloudinary.config().api_key
        }
    except Exception as e:
        print(f"Cloudinary error: {e}")
        return {"upload_url": "mock", "signature": "mock", "timestamp": int(time.time()), "public_id": f"tripdone/{trip_id}"}
