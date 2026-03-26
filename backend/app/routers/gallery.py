from fastapi import APIRouter
from pydantic import BaseModel
from app.services.cloudinary_service import get_upload_url

router = APIRouter()

class GalleryUploadRequest(BaseModel):
    trip_id: str
    filename: str
    location: str = ""

@router.post("/api/gallery/upload-url")
async def get_gallery_upload_url(req: GalleryUploadRequest):
    return get_upload_url(req.trip_id, req.filename, req.location)

@router.get("/api/gallery/{trip_id}")
async def get_gallery(trip_id: str):
    return {"photos": [], "trip_id": trip_id}
