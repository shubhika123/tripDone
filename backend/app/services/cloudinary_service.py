import os
# Clear CLOUDINARY_URL before import — the cloudinary package auto-parses it
# on import and crashes if the format is wrong. We configure manually below.
os.environ.pop("CLOUDINARY_URL", None)

import cloudinary
import cloudinary.utils
import cloudinary.uploader
import time

cloudinary.config(
    cloud_name="dreb8pzbb",
    api_key="324125924744397",
    api_secret="qixdJbCNzKA84jkFPwZ0hmYwZIM"
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
        return None

def upload_image(file_content, public_id):
    """Uploads a file directly to Cloudinary from the server."""
    try:
        result = cloudinary.uploader.upload(
            file_content,
            public_id=public_id,
            overwrite=True,
            resource_type="image"
        )
        return result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None
