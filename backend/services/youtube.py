from youtube_transcript_api import YouTubeTranscriptApi
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
    except Exception as e:
        raise ValueError(f"Invalid YouTube URL: {url}")
    raise ValueError(f"Could not extract video ID from URL: {url}")

def fetch_youtube_transcript(url: str) -> str:
    """Fetches the transcript for a given YouTube URL as a single text block."""
    try:
        video_id = extract_video_id(url)
        
        # Determine available transcripts
        transcript_list = YouTubeTranscriptApi().list(video_id)
        
        # Attempt to get English or Hindi first
        try:
            transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB', 'en-IN', 'hi'])
        except Exception:
            # Fallback to the first available transcript
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
