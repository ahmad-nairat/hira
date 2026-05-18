import os
import boto3


def get_r2():
    return boto3.client(
        "s3",
        endpoint_url=os.environ["R2_ENDPOINT"],
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def download_file(key: str) -> bytes:
    r2 = get_r2()
    obj = r2.get_object(Bucket=os.environ["R2_BUCKET"], Key=key)
    return obj["Body"].read()


def url_to_key(url: str) -> str:
    """Strip the configured R2 public URL prefix to recover the storage key."""
    public_prefix = (os.environ.get("R2_PUBLIC_URL") or "").rstrip("/") + "/"
    if public_prefix and url.startswith(public_prefix):
        return url[len(public_prefix):]
    return url
