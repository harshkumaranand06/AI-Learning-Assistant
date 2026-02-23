from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig, GenericProxyConfig
from urllib.parse import urlparse, parse_qs
import os

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

def _get_api() -> YouTubeTranscriptApi:
    """
    Returns a YouTubeTranscriptApi instance, optionally configured with a proxy
    to bypass cloud IP blocks (e.g. on Render).

    Cookie auth is currently disabled in youtube-transcript-api v1.x.
    A proxy is the recommended workaround for cloud provider IP bans.

    Proxy options (set via environment variables):
      - WEBSHARE_PROXY_USERNAME + WEBSHARE_PROXY_PASSWORD → uses WebshareProxyConfig
      - YOUTUBE_PROXY_URL → uses GenericProxyConfig with the given URL
      - Neither set → no proxy (works locally but may fail on Render)
    """
    webshare_user = os.getenv("WEBSHARE_PROXY_USERNAME")
    webshare_pass = os.getenv("WEBSHARE_PROXY_PASSWORD")
    generic_proxy = os.getenv("YOUTUBE_PROXY_URL")

    if webshare_user and webshare_pass:
        return YouTubeTranscriptApi(
            proxy_config=WebshareProxyConfig(
                proxy_username=webshare_user,
                proxy_password=webshare_pass,
            )
        )
    elif generic_proxy:
        return YouTubeTranscriptApi(
            proxy_config=GenericProxyConfig(
                http_url=generic_proxy,
                https_url=generic_proxy,
            )
        )
    else:
        return YouTubeTranscriptApi()


def fetch_youtube_transcript(url: str) -> str:
    """Fetches the transcript for a given YouTube URL as a single text block."""
    try:
        video_id = extract_video_id(url)
        api = _get_api()

        # Attempt to get English or Hindi first
        try:
            transcript_list = api.list(video_id)
            transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB', 'en-IN', 'hi'])
        except Exception:
            # Fallback to the first available transcript
            transcript_list = api.list(video_id)
            available_transcripts = list(transcript_list)
            if not available_transcripts:
                raise Exception("No transcripts found for this video")
            transcript = available_transcripts[0]

        transcript_obj = transcript.fetch()

        # Combine all transcript texts into one string
        full_text = " ".join([snippet.text for snippet in transcript_obj.snippets])
        return full_text
    except Exception as e:
        raise Exception(f"Failed to fetch transcript: {str(e)}")
