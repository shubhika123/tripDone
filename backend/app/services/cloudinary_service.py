import cloudinary
import cloudinary.utils
import os, time
from dotenv import load_dotenv
load_dotenv('.env')

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dreb8pzbb"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "324125924744397"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "qixdJbCNzKA84jkFPwZ0hmYwZIM")
)

def get_upload_url(trip_id: str, filename: str, location: str = ""):
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
        return {
            "upload_url": "https://api.cloudinary.com/v1_1/dreb8pzbb/image/upload",
            "signature": "mock",
            "timestamp": int(time.time()),
            "public_id": f"tripdone/{trip_id}"
        }
