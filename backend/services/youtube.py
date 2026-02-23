import os
import json
import tempfile
import subprocess
from urllib.parse import urlparse, parse_qs


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
    Fetches the transcript for a given YouTube URL using yt-dlp.
    yt-dlp has better anti-blocking support and works on cloud providers like Render.
    """
    try:
        video_id = extract_video_id(url)

        with tempfile.TemporaryDirectory() as tmpdir:
            output_template = os.path.join(tmpdir, "%(id)s")

            # yt-dlp command to download only subtitles (no video)
            cmd = [
                "yt-dlp",
                "--skip-download",           # Don't download video
                "--write-subs",              # Write subtitles
                "--write-auto-subs",         # Also include auto-generated subs
                "--sub-langs", "en.*,hi",    # English variants + Hindi
                "--sub-format", "json3",     # JSON format for easy parsing
                "--convert-subs", "json3",
                "-o", output_template,
                f"https://www.youtube.com/watch?v={video_id}",
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
            )

            # Find any subtitle file downloaded
            subtitle_files = [
                f for f in os.listdir(tmpdir)
                if f.endswith(".json3")
            ]

            if not subtitle_files:
                # Fallback: try vtt format if json3 didn't work
                cmd_vtt = [
                    "yt-dlp",
                    "--skip-download",
                    "--write-subs",
                    "--write-auto-subs",
                    "--sub-langs", "en.*,hi",
                    "--sub-format", "vtt",
                    "-o", output_template,
                    f"https://www.youtube.com/watch?v={video_id}",
                ]
                subprocess.run(cmd_vtt, capture_output=True, text=True, timeout=60)
                subtitle_files = [
                    f for f in os.listdir(tmpdir)
                    if f.endswith(".vtt")
                ]

            if not subtitle_files:
                raise Exception(
                    "No subtitles/transcripts found for this video. "
                    "The video may not have captions available."
                )

            # Read the first subtitle file found
            subtitle_path = os.path.join(tmpdir, subtitle_files[0])

            if subtitle_path.endswith(".json3"):
                text = _parse_json3_subtitles(subtitle_path)
            else:
                text = _parse_vtt_subtitles(subtitle_path)

            return text

    except subprocess.TimeoutExpired:
        raise Exception("Timed out while fetching transcript from YouTube.")
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
    import re

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove WEBVTT header and timing lines
    lines = content.splitlines()
    texts = []
    for line in lines:
        line = line.strip()
        # Skip empty lines, WEBVTT header, timing lines, and position tags
        if (
            not line
            or line.startswith("WEBVTT")
            or line.startswith("NOTE")
            or "-->" in line
            or re.match(r"^\d+$", line)
        ):
            continue
        # Remove HTML tags
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
