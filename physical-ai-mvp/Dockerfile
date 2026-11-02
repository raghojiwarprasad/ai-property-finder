# Hugging Face Space (Docker SDK) image for the Physical AI data MVP. Also works locally:
#   docker build -t pai-mvp . && docker run -p 7860:7860 pai-mvp
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg git && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

# CPU-only PyTorch wheels keep the image several GB smaller than the default CUDA build.
COPY requirements.txt .
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple \
        torch==2.11.0 torchvision==0.26.0 torchcodec==0.11.1 \
    && pip install --no-cache-dir -r requirements.txt

COPY --chown=user . .
RUN mkdir -p storage && chown -R user:user /home/user/app
USER user
ENV HOME=/home/user PAI_STORAGE=/home/user/app/storage HF_HOME=/home/user/.cache/huggingface
EXPOSE 7860
CMD ["streamlit", "run", "app.py", "--server.port=7860", "--server.address=0.0.0.0", "--server.headless=true", "--browser.gatherUsageStats=false", "--server.maxUploadSize=2000"]
