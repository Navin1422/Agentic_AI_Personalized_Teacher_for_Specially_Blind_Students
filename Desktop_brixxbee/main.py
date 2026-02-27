import cv2
import base64
import speech_recognition as sr
import pyttsx3
import webbrowser
import os
import time
import threading
import customtkinter as ctk
from PIL import Image
from openai import OpenAI

# --- CONFIGURATION ---
# Agent 1: The Vision Specialist (Gemini Flash)
VISION_API_KEY = "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"
VISION_MODEL = "google/gemini-2.0-flash-001" 

# Agent 2: The Pedagogy Expert (DeepSeek V3)
BRAIN_API_KEY = "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"
BRAIN_MODEL = "deepseek/deepseek-chat" # DeepSeek V3

# Setup OpenRouter clients
v_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=VISION_API_KEY)
b_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=BRAIN_API_KEY)

# Project Config
WEBSITE_URL = "http://localhost:5174"
WAKE_WORDS = ["hey brixbee", "hey bricks b", "hey bixby", "hey brix", "brixbee", "brix"]

# --- APP SETUP ---
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class BrixbeeApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Brixbee - AI Teacher for Blind Children")
        self.geometry("450x650")
        self.configure(fg_color="#0F0F0B") # Black-gold aesthetic
        
        # Center the window
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        x = (screen_width // 2) - (450 // 2)
        y = (screen_height // 2) - (650 // 2)
        self.geometry(f"450x650+{x}+{y}")
        
        self.grid_columnconfigure(0, weight=1)

        # Header Image/Icon
        self.title_label = ctk.CTkLabel(self, text="BRIXBEE", font=ctk.CTkFont(size=36, weight="bold", family="Helvetica"))
        self.title_label.grid(row=0, column=0, pady=(60, 0))
        
        self.subtitle_label = ctk.CTkLabel(self, text="AI LEARNING ASSISTANT", text_color="#aaaaaa", font=ctk.CTkFont(size=14, weight="normal"))
        self.subtitle_label.grid(row=1, column=0, pady=(5, 40))

        # Status Indicator Circle (Visual Feedback)
        self.status_circle = ctk.CTkFrame(self, width=200, height=200, corner_radius=100, fg_color="#1a1a1a", border_width=4, border_color="#D4AF37") # Gold border
        self.status_circle.grid(row=2, column=0, pady=20)
        self.status_circle.grid_propagate(False)
        self.status_circle.grid_columnconfigure(0, weight=1)
        self.status_circle.grid_rowconfigure(0, weight=1)

        self.status_label = ctk.CTkLabel(self.status_circle, text="IDLE", font=ctk.CTkFont(size=18, weight="bold"))
        self.status_label.grid(row=0, column=0)

        # Log Window
        self.log_text = ctk.CTkTextbox(self, width=380, height=120, corner_radius=15, border_width=1, border_color="#333333", bg_color="transparent", fg_color="#161616")
        self.log_text.grid(row=3, column=0, pady=30, padx=20)
        self.log_text.configure(state="disabled")

        # Pulse Animation Settings
        self.pulse_val = 0
        self.pulse_dir = 1
        self.animate_pulse()

        # Conversation Context
        self.memory = [] 
        self.conversation_active = False
        self.last_interaction_time = 0

        # Start logic
        self.thread = threading.Thread(target=self.run_logic, daemon=True)
        self.thread.start()

    def animate_pulse(self):
        """Creates a smooth breathing animation on the status circle."""
        if hasattr(self, 'current_state') and self.current_state == "LISTENING":
            self.pulse_val += self.pulse_dir * 5
            if self.pulse_val > 100 or self.pulse_val < 0:
                self.pulse_dir *= -1
            # Interpolate between dark blue and light blue
            self.status_circle.configure(fg_color=f"#0D2E49") 
        self.after(50, self.animate_pulse)

    def speak(self, text):
        self.log_text.configure(state="normal")
        self.log_text.insert("end", f"Brixbee: {text}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")
        
        self.set_status("SPEAKING", "#2ECC71")
        # Ensure TTS and UI play nice
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')
        for v in voices:
            if "Samantha" in v.name or "Daniel" in v.name:
                engine.setProperty('voice', v.id)
                break
        engine.setProperty('rate', 190) # Snappy speech
        engine.say(text)
        engine.runAndWait()
        self.set_status("IDLE")

    def set_status(self, text, color="#D4AF37"):
        self.current_state = text.upper()
        self.status_label.configure(text=text.upper())
        self.status_circle.configure(border_color=color)
        if text.upper() == "LISTENING":
            self.status_circle.configure(fg_color="#0D2E49")
        elif text.upper() == "THINKING":
            self.status_circle.configure(fg_color="#4F3601")
        elif text.upper() == "SPEAKING":
            self.status_circle.configure(fg_color="#1B4D2D")
        elif text.upper() == "SEEING":
            self.status_circle.configure(fg_color="#5D3FD3") # Purple for vision
        else:
            self.status_circle.configure(fg_color="#1a1a1a")

    def capture_image(self):
        """Captures a frame from the webcam and returns it as base64."""
        self.set_status("SEEING", "#9B59B6")
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            return None
        
        # Give camera time to adjust
        time.sleep(0.5)
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return None
            
        # Convert to base64
        _, buffer = cv2.imencode('.jpg', frame)
        return base64.b64encode(buffer).decode('utf-8')

    def analyze_image(self, image_base64, prompt):
        """Vision Agent (Gemini): Processes pixels and describes them to the Brain."""
        self.set_status("THINKING", "#F1C40F")
        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]
            
            completion = v_client.chat.completions.create(
                model=VISION_MODEL,
                messages=messages,
                max_tokens=300
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"Vision Agent Error: {e}")
            return "I am having trouble processing the image."

    def ask_ai(self, question, model_type="teacher", vision_data=None):
        """Brain Agent (DeepSeek): The lead orchestrator and persona."""
        self.set_status("THINKING", "#F1C40F")
        
        # Add to memory
        self.memory.append({"role": "user", "content": question})
        if len(self.memory) > 6: self.memory = self.memory[-6:] 

        try:
            # Multi-Agent Context: If we have vision data, we tell the Brain Agent!
            system_context = ""
            if vision_data:
                system_context = f"\n[VISION DATA FROM GEMINI]: The student is holding or looking at: {vision_data}. Use this info to guide them."

            if model_type == "teacher":
                role_prompt = (
                    "You are 'Akka', a warm Tamil AI teacher. Speak in Tanglish (Tamil-English mix). "
                    "Use simple local examples from Tamil Nadu. Be very encouraging. Keep it to 2 sentences."
                    f"{system_context}"
                )
            else:
                role_prompt = (
                    "You are Brixbee, a friendly AI companion for a blind child in Tamil Nadu. "
                    "Be warm and supportive. Use occasional Tamil words like 'Kanna'. "
                    f"Keep responses very short (1-2 sentences). {system_context}"
                )
            
            messages = [{"role": "system", "content": role_prompt}] + self.memory

            completion = b_client.chat.completions.create(
              model=BRAIN_MODEL,
              messages=messages,
              max_tokens=150,
              timeout=8.0
            )
            response = completion.choices[0].message.content
            self.memory.append({"role": "assistant", "content": response})

            # --- STORE IN DATABASE ---
            try:
                # Send to backend logger endpoint
                import requests
                requests.post("http://localhost:5001/api/ai/log", json={
                    "query": question,
                    "response": response,
                    "type": model_type
                }, timeout=1) 
            except:
                pass # Don't crash if backend is down

            return response
        except Exception as e:
            return "I missed that, could you say it again?"

    def get_audio(self, timeout=7):
        r = sr.Recognizer()
        with sr.Microphone() as source:
            r.energy_threshold = 400
            r.adjust_for_ambient_noise(source, duration=0.4)
            self.set_status("LISTENING", "#3498DB")
            try:
                audio = r.listen(source, timeout=timeout, phrase_time_limit=10)
                query = r.recognize_google(audio, language='en-in')
                return query.lower()
            except:
                return ""

    def run_logic(self):
        time.sleep(2)
        self.speak("I am ready for a live chat. Just say Hey Brixbee to start.")
        
        while True:
            current_time = time.time()
            
            # If we are in an active conversation, listen without needing the wake word
            if self.conversation_active:
                # If silent for more than 40 seconds, end live mode
                if current_time - self.last_interaction_time > 40:
                    self.conversation_active = False
                    self.speak("I'll go to sleep now. Call me if you need me!")
                    continue

                query = self.get_audio(timeout=10) # Longer timeout in live mode
            else:
                self.set_status("IDLE")
                query = self.get_audio()
            
            if not query: continue

            # Detect wake word
            is_wake = any(w in query for w in WAKE_WORDS)
            
            if is_wake or self.conversation_active:
                self.last_interaction_time = time.time()
                
                # Activate live mode
                if not self.conversation_active:
                    self.conversation_active = True
                
                user_msg = query
                if is_wake:
                    for w in WAKE_WORDS:
                        if user_msg.startswith(w):
                            user_msg = user_msg.replace(w, "", 1).strip()
                            break

                # Handle Goodbye/Exit
                if any(x in user_msg for x in ["goodbye", "stop", "exit", "go to sleep", "shut down"]):
                    self.speak("Goodbye! I will be waiting.")
                    self.conversation_active = False
                    self.memory = []
                    continue

                # Command Routing
                vision_words = ["see", "look", "describe", "read", "color", "what is this", "what am i holding"]
                search_words = ["where is", "find my", "locate"]
                
                # 1. Handle Object Search (Multi-Agent Flow)
                if any(k in user_msg for k in search_words):
                    target = user_msg.split("is")[-1].strip() if "is" in user_msg else user_msg.split("my")[-1].strip()
                    self.speak(f"Looking for your {target}. Hold on.")
                    img = self.capture_image()
                    if img:
                        # Agent 1 (Vision) gets raw data
                        prompt = f"Identify the location of the {target} relative to the center. Be brief."
                        raw_vision = self.analyze_image(img, prompt)
                        
                        # Agent 2 (Brain) creates a warm response for the child
                        ans = self.ask_ai(f"I found the {target}. Tell the child where it is based on this data: {raw_vision}", vision_data=raw_vision)
                        self.speak(ans)
                        continue

                # 2. Handle General Vision (Multi-Agent Flow)
                if any(k in user_msg for k in vision_words):
                    self.speak("Let me take a look.")
                    img = self.capture_image()
                    if img:
                        v_prompt = "Describe exactly what is in front of the camera."
                        if "read" in user_msg: v_prompt = "Transcribe all text visible in this image."
                        
                        raw_vision = self.analyze_image(img, v_prompt)
                        
                        # Brain Agent interprets the vision data for the blind student
                        ans = self.ask_ai(f"Explain what I am seeing in simple words. Vision report: {raw_vision}", vision_data=raw_vision)
                        self.speak(ans)
                        continue

                # 3. Handle Weather
                if "weather" in user_msg:
                    self.speak("Checking the weather in Tamil Nadu for you.")
                    try:
                        import requests
                        # Simple free weather service (no key needed for basic info)
                        resp = requests.get("https://wttr.in/Tamil%20Nadu?format=3", timeout=3)
                        if resp.status_code == 200:
                            self.speak(f"The weather is {resp.text}")
                        else:
                            self.speak("I couldn't reach the weather service right now.")
                    except:
                        self.speak("I'm unable to check the weather at the moment.")
                    continue

                if "open" in user_msg:
                    # 1. Check for specific learning website
                    if any(x in user_msg for x in ["brixbee", "learning", "specially", "notes", "project", "website"]):
                        self.speak("Sure thing! Opening your learning website.")
                        webbrowser.open(WEBSITE_URL)
                        continue
                    
                    # 2. Check for common sites
                    sites = {
                        "youtube": "https://www.youtube.com",
                        "amazon": "https://www.amazon.in",
                        "flipkart": "https://www.flipkart.com",
                        "google": "https://www.google.com",
                        "facebook": "https://www.facebook.com"
                    }
                    
                    handled = False
                    for site_name, url in sites.items():
                        if site_name in user_msg:
                            self.speak(f"Opening {site_name} for you.")
                            webbrowser.open(url)
                            handled = True
                            break
                    if handled: continue
                
                # If just the wake word without a query, wait for them to speak
                if not user_msg:
                    self.speak("Yes? I'm listening.")
                    continue

                # AI Brain
                teaching_words = ["explain", "why", "what is", "teach", "how", "tell me about"]
                if any(k in user_msg for k in teaching_words):
                    ans = self.ask_ai(user_msg, model_type="teacher")
                else:
                    ans = self.ask_ai(user_msg, model_type="assistant")
                
                self.speak(ans)
                
            time.sleep(0.1)

if __name__ == "__main__":
    app = BrixbeeApp()
    app.mainloop()
