FROM python:3.10-slim

# System deps (ffmpeg + build tools)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    git \
    curl \
 && rm -rf /var/lib/apt/lists/*

# AWS Lambda Runtime Interface Emulator (for local testing)
RUN curl -Lo /usr/local/bin/aws-lambda-rie \
  https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie \
 && chmod +x /usr/local/bin/aws-lambda-rie


WORKDIR /app

# only install binaries so that we dont have to install
# a compiler like gcc
ENV UV_PIP_ONLY_BINARY=:all:
ENV PIP_ONLY_BINARY=:all:

# Python deps
# install from lockfile
COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir uv \
 && uv sync --locked

# Use the project environment created by uv sync
ENV VIRTUAL_ENV="/app/.venv"
ENV PATH="/app/.venv/bin:$PATH"

# App code
COPY app/ ./app/

# Lambda handler
ENTRYPOINT ["python", "-m", "awslambdaric"]
CMD ["app.handler.handler"]

# commands to push to registry
# aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 909487697336.dkr.ecr.us-east-1.amazonaws.com
# docker buildx build --platform linux/amd64 --provenance=false -t chordmonkey-backend:latest --load backend
# docker tag chordmonkey-backend:latest 909487697336.dkr.ecr.us-east-1.amazonaws.com/chordmonkey-backend:latest
# docker push 909487697336.dkr.ecr.us-east-1.amazonaws.com/chordmonkey-backend:latest

# to update lamdba function
# aws lambda update-function-code --function-name backend --image-uri 909487697336.dkr.ecr.us-east-1.amazonaws.com/chordmonkey-backend:latest


# local testing of lamdba function
# docker run --name cm-lambda --rm -p 9000:8080 --entrypoint /usr/local/bin/aws-lambda-rie chordmonkey-backend:latest python -m awslambdaric app.handler.handler