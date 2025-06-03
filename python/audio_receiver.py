import asyncio
import websockets
import datetime
import random
from gtts import gTTS
import io
import base64
import json
import os

PORT = 8000

SAMPLE_RESPONSES = [
    "Hello! How can I help you?",
    "This is a random response from the bot.",
    "The weather today is sunny with a chance of code.",
    "Let's build something amazing!",
    "I'm listening, go on.",
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # directory of current script
SAVE_DIR = os.path.join(BASE_DIR, "audio_chunks")
os.makedirs(SAVE_DIR, exist_ok=True)

async def handle_audio(websocket):
    print("🔌 Client connected")
    counter = 0
    try:
        async for message in websocket:
            # Save received audio
            counter += 1
            input_filename = os.path.join(SAVE_DIR, f"received_{datetime.datetime.now().strftime('%H%M%S')}_{counter}.webm")
            with open(input_filename, "wb") as f:
                f.write(message)
            print(f"📥 Saved: {input_filename}")

            # Generate random response
            response_text = random.choice(SAMPLE_RESPONSES)
            tts = gTTS(response_text)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)

            # Send back base64-encoded audio and text
            audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode('utf-8')
            response_payload = {
                "text": response_text,
                "audio": audio_base64,
            }
            await websocket.send(json.dumps(response_payload))  # Send as stringified dict
            print(f"📤 Sent TTS + text: {response_text}")

    except websockets.exceptions.ConnectionClosed:
        print("❌ Connection closed")

async def main():
    async with websockets.serve(handle_audio, "0.0.0.0", PORT):
        print(f"🚀 Server listening on ws://localhost:{PORT}")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
