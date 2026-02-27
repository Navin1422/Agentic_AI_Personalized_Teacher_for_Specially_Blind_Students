#!/bin/bash
# Brixbee Setup Script for Mac

echo "--- Installing PortAudio (necessary for PyAudio) ---"
brew install portaudio

echo "--- Installing Python Dependencies ---"
pip3 install -r requirements.txt

echo "--- Brixbee is ready! ---"
echo "To run Brixbee, use: python3 main.py"
echo "Brixbee is now powered by DeepSeek v3.1 via OpenRouter!"
