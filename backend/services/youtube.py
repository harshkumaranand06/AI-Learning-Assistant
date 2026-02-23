import os
import io
import json
import re
import tempfile
from urllib.parse import urlparse, parse_qs

import yt_dlp


def extract_video_id(url: str) -> str:
    """Extracts the video ID from a YouTube URL."""
    try:
        parsed_url = urlparse(url)
        if parsed_url.hostname in ('youtu.be', 'www.youtu.be'):
            return parsed_url.path[1:]
        if parsed_url.hostname in ('youtube.com', 'www.youtube.com'):
            if parsed_url.path == '/watch':
                return parse_qs(parsed_url.query)['v'][0]
    except Exception:
        raise ValueError(f"Invalid YouTube URL: {url}")
    raise ValueError(f"Could not extract video ID from URL: {url}")


def fetch_youtube_transcript(url: str) -> str:
    """
    Fetches the transcript for a given YouTube URL using yt-dlp Python API.
    yt-dlp works on cloud providers like Render without proxy or cookies.
    """
    try:
        video_id = extract_video_id(url)

        with tempfile.TemporaryDirectory() as tmpdir:
            output_template = os.path.join(tmpdir, "%(id)s.%(ext)s")

            ydl_opts = {
                "skip_download": True,
                "writesubtitles": True,
                "writeautomaticsub": True,
                "subtitleslangs": ["en", "en-US", "en-GB", "en-IN", "hi"],
                "subtitlesformat": "json3",
                "outtmpl": output_template,
                "quiet": True,
                "no_warnings": True,
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])

            # Find any subtitle file downloaded
            subtitle_files = [
                f for f in os.listdir(tmpdir)
                if f.endswith(".json3")
            ]

            # Fallback: try vtt if json3 not found
            if not subtitle_files:
                vtt_opts = dict(ydl_opts)
                vtt_opts["subtitlesformat"] = "vtt"
                with yt_dlp.YoutubeDL(vtt_opts) as ydl:
                    ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
                subtitle_files = [
                    f for f in os.listdir(tmpdir)
                    if f.endswith(".vtt")
                ]

            if not subtitle_files:
                raise Exception(
                    "No subtitles/transcripts found for this video. "
                    "The video may not have captions enabled."
                )

            subtitle_path = os.path.join(tmpdir, subtitle_files[0])

            if subtitle_path.endswith(".json3"):
                return _parse_json3_subtitles(subtitle_path)
            else:
                return _parse_vtt_subtitles(subtitle_path)

    except Exception as e:
        raise Exception(f"Failed to fetch transcript: {str(e)}")


def _parse_json3_subtitles(filepath: str) -> str:
    """Parse yt-dlp's json3 subtitle format into plain text."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = []
    for event in data.get("events", []):
        segs = event.get("segs", [])
        line = "".join(seg.get("utf8", "") for seg in segs).strip()
        if line and line != "\n":
            texts.append(line)

    return " ".join(texts)


def _parse_vtt_subtitles(filepath: str) -> str:
    """Parse VTT subtitle format into plain text."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    texts = []
    for line in lines:
        line = line.strip()
        if (
            not line
            or line.startswith("WEBVTT")
            or line.startswith("NOTE")
            or "-->" in line
            or re.match(r"^\d+$", line)
        ):
            continue
        clean = re.sub(r"<[^>]+>", "", line).strip()
        if clean:
            texts.append(clean)

    # Deduplicate consecutive identical lines (common in VTT)
    deduped = []
    prev = None
    for t in texts:
        if t != prev:
            deduped.append(t)
            prev = t

    return " ".join(deduped)
