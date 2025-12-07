FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY scraper.py .

# Run as non-root user
RUN useradd -m -u 1000 scraper && chown -R scraper:scraper /app
USER scraper

CMD ["python3", "-u", "scraper.py"]
