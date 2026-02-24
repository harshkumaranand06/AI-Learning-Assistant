import os
import tempfile
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url: str) -> str:
    """Extracts the video ID from a YouTube URL (handles multiple formats)."""
    try:
        parsed_url = urlparse(url)
        if parsed_url.hostname in ('youtu.be', 'www.youtu.be'):
            return parsed_url.path[1:]
        if parsed_url.hostname in ('youtube.com', 'www.youtube.com'):
            if parsed_url.path == '/watch':
                return parse_qs(parsed_url.query)['v'][0]
            if parsed_url.path.startswith('/embed/'):
                return parsed_url.path.split('/')[2]
            if parsed_url.path.startswith('/v/'):
                return parsed_url.path.split('/')[2]
    except Exception:
        pass
    
    if "v=" in url:
        return url.split("v=")[-1].split("&")[0]
    return url.split("/")[-1].split("?")[0]

def fetch_youtube_transcript(url: str) -> str:
    """
    Fetches the transcript using youtube-transcript-api v1.x (instance-based API).
    Works on Render and local without yt-dlp.
    """
    try:
        video_id = extract_video_id(url)
        print(f"Fetching transcript for video: {video_id}")
        
        ytt = YouTubeTranscriptApi()
        
        # Try English first, then any available transcript
        try:
            transcript = ytt.fetch(video_id, languages=['en', 'en-US', 'en-GB', 'en-IN'])
        except Exception:
            # Fallback: try to get any available transcript
            transcript_list = ytt.list(video_id)
            first = next(iter(transcript_list))
            transcript = first.fetch()
        
        return " ".join([t.text for t in transcript])

    except Exception as e:
        print(f"Transcript fetching failed: {str(e)}")
        raise Exception(f"Transcript fetch failed: {str(e)}")
