"""
Abstraction over the API's file storage. Mirrors the API's `IFileService`:
- FILE_STORAGE=r2  → fetch via the S3-compatible SDK.
- otherwise       → fetch the URL via HTTP, rewriting the host to INTERNAL_API_URL
                    so workers inside the Docker network can reach the API container.
"""
import os
import httpx

from services.r2_client import download_file as r2_download_file, url_to_key as r2_url_to_key


def _is_r2() -> bool:
    return os.environ.get("FILE_STORAGE") == "r2"


def download_resume(resume_url: str) -> bytes:
    if _is_r2():
        return r2_download_file(r2_url_to_key(resume_url))

    # Local mode: rewrite the public-facing host to the in-network API URL.
    public_base = (os.environ.get("API_PUBLIC_URL") or "").rstrip("/")
    internal_base = (os.environ.get("INTERNAL_API_URL") or "http://api:3000").rstrip("/")
    fetch_url = resume_url
    if public_base and fetch_url.startswith(public_base):
        fetch_url = internal_base + fetch_url[len(public_base):]

    resp = httpx.get(fetch_url, timeout=30)
    resp.raise_for_status()
    return resp.content
