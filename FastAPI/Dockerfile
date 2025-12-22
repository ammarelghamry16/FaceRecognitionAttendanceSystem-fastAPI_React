# Use Python 3.10
FROM python:3.10

# Set working directory inside the container
WORKDIR /code

# Install system dependencies for OpenCV (fix for libGL error)
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0

# Copy requirements and install them
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy ALL your code (api_gateway, services, shared, etc.) into the container
COPY . /code

# Create a non-root user (Mandatory for Hugging Face Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

# Start the app
# "main:app" means file "main.py" and object "app = FastAPI()" inside it.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]