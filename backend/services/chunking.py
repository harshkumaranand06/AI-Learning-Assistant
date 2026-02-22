import tiktoken

def chunk_text(text: str, chunk_size: int = 700, chunk_overlap: int = 100) -> list[str]:
    """
    Chunks text using tiktoken to count exact tokens (cl100k_base used for text-embedding-3-small).
    """
    encoder = tiktoken.get_encoding("cl100k_base")
    tokens = encoder.encode(text)
    
    chunks = []
    
    start_idx = 0
    while start_idx < len(tokens):
        end_idx = min(start_idx + chunk_size, len(tokens))
        chunk_tokens = tokens[start_idx:end_idx]
        chunk_text = encoder.decode(chunk_tokens)
        chunks.append(chunk_text)
        
        # Advance by chunk_size - chunk_overlap
        if end_idx == len(tokens):
            break
        start_idx += (chunk_size - chunk_overlap)
        
    return chunks
