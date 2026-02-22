import fitz  # PyMuPDF
import io

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from a PDF file provided as bytes."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text_content = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text_content.append(page.get_text())
        doc.close()
        return " ".join(text_content)
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")
