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
TEACHER_API_KEY = "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"
ASSISTANT_API_KEY = "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"

TEACHER_MODEL = "deepseek/deepseek-chat" 
ASSISTANT_MODEL = "deepseek/deepseek-chat"

# Setup OpenRouter clients
t_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=TEACHER_API_KEY)
a_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=ASSISTANT_API_KEY)

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
        else:
            self.status_circle.configure(fg_color="#1a1a1a")

    def ask_ai(self, question, model_type="assistant"):
        self.set_status("THINKING", "#F1C40F")
        target_model = TEACHER_MODEL if model_type == "teacher" else ASSISTANT_MODEL
        client = t_client if model_type == "teacher" else a_client
        
        # Add to memory
        self.memory.append({"role": "user", "content": question})
        if len(self.memory) > 6: self.memory = self.memory[-6:] # Keep last 3 exchanges

        try:
            role_prompt = (
                "You are a helpful Teacher. Be short, warm, and conversational. Use 1-2 sentences. Avoid being robotic."
                if model_type == "teacher" else "You are a friendly friend. Be extremely brief and person-like."
            )
            
            messages = [{"role": "system", "content": role_prompt}] + self.memory

            completion = client.chat.completions.create(
              model=target_model,
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
