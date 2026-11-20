"""
FitVision AI - Food-101 Dataset Downloader & Extractor
Downloads the official Food-101 dataset (~5 GB) with HTTP resume support,
live progress updates, and automatic extraction.
"""

import os
import sys
import time
import tarfile
import urllib.request
from pathlib import Path

FOOD101_URL = "http://data.vision.ee.ethz.ch/cvl/food-101.tar.gz"
TOTAL_SIZE = 4996278331  # ~4.996 GB

CURRENT_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = CURRENT_DIR / "data"

def format_bytes(num_bytes: int) -> str:
    """Format bytes to human readable string (KB, MB, GB)."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if abs(num_bytes) < 1024.0:
            return f"{num_bytes:3.1f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.1f} TB"

def download_file_with_resume(url: str, dest_path: Path):
    """Download file with HTTP Range header resume support."""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = dest_path.with_suffix(".tar.gz.part")

    existing_bytes = temp_path.stat().st_size if temp_path.exists() else 0

    if dest_path.exists() and dest_path.stat().st_size == TOTAL_SIZE:
        print(f"[Food-101] Archive already completely downloaded: {dest_path}")
        return

    headers = {}
    if existing_bytes > 0:
        print(f"[Food-101] Resuming download from {format_bytes(existing_bytes)} / {format_bytes(TOTAL_SIZE)}...")
        headers['Range'] = f"bytes={existing_bytes}-"
    else:
        print(f"[Food-101] Starting fresh download ({format_bytes(TOTAL_SIZE)})...")

    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            # Handle partial vs full response
            if resp.status == 206:
                mode = "ab"
                downloaded = existing_bytes
            else:
                mode = "wb"
                downloaded = 0

            chunk_size = 1024 * 1024  # 1 MB chunks
            start_time = time.time()
            last_print_time = start_time
            bytes_since_last = 0

            with open(temp_path, mode) as f:
                while True:
                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    bytes_since_last += len(chunk)

                    now = time.time()
                    if now - last_print_time >= 1.0 or downloaded == TOTAL_SIZE:
                        elapsed = now - start_time
                        speed = bytes_since_last / max(now - last_print_time, 0.001)
                        pct = (downloaded / TOTAL_SIZE) * 100
                        remaining_bytes = max(0, TOTAL_SIZE - downloaded)
                        eta_sec = remaining_bytes / max(speed, 1.0)
                        eta_str = f"{int(eta_sec // 60)}m {int(eta_sec % 60):02d}s"

                        bar_width = 30
                        filled = int(bar_width * downloaded / TOTAL_SIZE)
                        bar = "=" * filled + (">" if filled < bar_width else "") + " " * (bar_width - filled - 1)

                        print(f"\r[Food-101] [{bar}] {pct:5.1f}% | {format_bytes(downloaded)} / {format_bytes(TOTAL_SIZE)} | {format_bytes(speed)}/s | ETA: {eta_str}", end="", flush=True)
                        last_print_time = now
                        bytes_since_last = 0

            print("\n[Food-101] Download complete!")
            temp_path.rename(dest_path)

    except Exception as e:
        print(f"\n[Food-101] Download paused or encountered error: {e}")
        print(f"[Food-101] Run again to resume from {format_bytes(temp_path.stat().st_size if temp_path.exists() else 0)}.")
        raise

def extract_archive(archive_path: Path, extract_dir: Path):
    """Extract tar.gz archive."""
    print(f"[Food-101] Extracting {archive_path.name} into {extract_dir}...")
    with tarfile.open(archive_path, "r:gz") as tar:
        tar.extractall(path=extract_dir)
    print(f"[Food-101] Extraction complete! Dataset ready in {extract_dir / 'food-101'}")

def setup_food101_dataset(data_dir: Path = None):
    """Main setup entrypoint."""
    if data_dir is None:
        data_dir = DEFAULT_DATA_DIR

    food101_dir = data_dir / "food-101"
    images_dir = food101_dir / "images"
    meta_dir = food101_dir / "meta"

    if images_dir.is_dir() and meta_dir.is_dir():
        num_classes = len([d for d in images_dir.iterdir() if d.is_dir()])
        print(f"✅ Food-101 dataset is already set up and ready at: {food101_dir}")
        print(f"   Found {num_classes} categories in {images_dir}")
        return True

    archive_path = data_dir / "food-101.tar.gz"
    
    # 1. Download
    download_file_with_resume(FOOD101_URL, archive_path)

    # 2. Extract
    extract_archive(archive_path, data_dir)

    print("🎉 Setup finished successfully!")
    return True

if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DATA_DIR
    setup_food101_dataset(target)
