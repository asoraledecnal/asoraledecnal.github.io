# Use a slim Python base image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies needed for ping and traceroute
# iputils-ping provides the 'ping' command
# traceroute provides the 'traceroute' command
RUN apt-get update && \
    apt-get install -y iputils-ping traceroute && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements.txt and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose the port Gunicorn will listen on
EXPOSE 8000

# Command to run the application using Gunicorn
# app:app refers to the 'app' Flask instance in 'app.py'
# -b 0.0.0.0:8000 binds Gunicorn to all network interfaces on port 8000
CMD ["gunicorn", "app:app", "-b", "0.0.0.0:8000"]
