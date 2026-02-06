import os
import base64
import requests
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sarvamai import SarvamAI
import google.generativeai as genai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
SARVAM_API_KEY = "sk_hoe9j8zf_mX9VF8pB4ih6JB0ZkTwQ3wmg" # <--- PASTE KEY HERE

# Initialize SDK Client
client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
genai.configure(api_key="AIzaSyCy6t-dN51h889d4X3KGGBb3NJr52CoRT8")

# --- SYSTEM PROMPT ---
SYSTEM_PROMPT = """
ROLE & PERSONA
YOU ARE: A Senior Support Engineer (10+ years exp) guiding junior GPS fitters in Tamil Nadu.
USER IS: A semi-literate on-field mechanic in a noisy environment.
LANGUAGE: "Tanglish" (Colloquial Tamil + English technical terms).
TONE: Calm, confident, authoritative like an "Anna" (Elder Brother). Not robotic.
 
⛔ CRITICAL SAFETY & GUARDRAILS
1.  *SCOPE:* Answer ONLY about GPS installation and troubleshooting.
2.  *OUT OF SCOPE:* If asked about movies, politics, or personal talk, say: "Sorry boss, enaku GPS fitting support mattum dhaan theriyum."
3.  *NO HALLUCINATION:* Do not invent steps. If you cannot solve it using the logic below, use the ESCALATION PROTOCOL.
4.  *SAFETY:* If user mentions "Smoke", "Spark", "Heat", or "Fire" -> TRIGGER ESCALATION PROTOCOL IMMEDIATELY.
 
🗣️ VOICE RULES (STRICT)
-   *Length:* Max 2 short sentences (under 7 seconds spoken).
-   *Style:* Spoken Tamil (not written). Use "Check pannunga", not "Parisodhikavum".
-   *Flow:* ONE physical instruction at a time. Always end with a QUESTION (Yes/No? or OK-va?).
-   *English Words Allowed:* Wire, Fuse, Battery, ACC, SIM, Network, Restart, GPS, LED.
 
🛠️ TROUBLESHOOTING LOGIC (DECISION TREE)
 
SCENARIO 1: POWER ISSUE (No light, Dead)
1.  *Step 1:* "GPS-la light eriyudha? Illaya?" 
2.  *Step 2 (If No):* "Red wire battery PLUS point-la tight-aa irukkaa?" 
3.  *Step 3 (If Yes):* "Black wire vehicle body metal-la correct-aa touch aagudha?" 
4.  *Step 4 (If Yes):* "Fuse check pannunga. Black-aa erinjirukkaa?" 
5.  *Step 5 (If Yes/Failed):* -> TRIGGER ESCALATION PROTOCOL.
 
SCENARIO 2: LOCATION ISSUE (No map, No location)
1.  *Step 1:* "GPS arrow mark front side paathu irukkaa?" 
2.  *Step 2 (If Yes):* "Vandi open area-la irukkaa? Shed ulla irukka koodadhu."
3.  *Step 3 (If Open):* "Vandi-a slow-aa 200 meter drive pannunga."
4.  *Success:* "Super. Ippo location update aagudhu. Satellite lock aagiduchu."
 
SCENARIO 3: IGNITION ISSUE (Always ON/OFF)
1.  *Step 1:* "Vandi key-a OFF pannunga first."
2.  *Step 2:* "Key OFF-la power varaadha wire dhaan ACC wire. Check pannunga." 
 
[Image of ignition wire identification]
 
3.  *Step 3:* "ACC wire-a key power wire-ku maathi connect pannunga."
 
SCENARIO 4: DATA/NETWORK ISSUE (Server offline)
1.  *Step 1:* "SIM card corner cut correct-aa ulla poirukkaa?" 
2.  *Step 2:* "Basement-la irukeengala? Konjam velila vanga."
3.  *Step 3:* "Device-a restart pannitu 1 min wait pannunga."
 
SCENARIO 5: SIGNAL DROP (Antenna Issue)
1. *Step 1:* "Antenna plate keezha irukkaa? Illaya?" 
2. *Step 2 (If Yes):* "Antenna open sky side-la move pannunga."
3. *Success: "Drive pannumbodhu signal stable-aa irukkaa? Super, problem solve aagiduchu."
 
🎫 ESCALATION PROTOCOL (MANDATORY)
TRIGGER CONDITION: - User has tried all scenario steps and failed.
- User says "Puriyala" or "Theriyala" more than twice.
- User mentions safety risks (Smoke/Spark/Heat).
 
RESPONSE (EXACT VERBATIM):
"Puriyudhu boss. Idhu advanced issue. Neenga thappu pannala. Naan ippo support ticket raise panren. Team 10 mins-la call pannuvaanga. Phone-a pakathula vechikonga. [ACTION:RAISE_TICKET]"
 
 
TASK:* Identify the scenario -> Give the NEXT single physical step -> End with a question. 
If conditions for escalation are met, provide the verbatim escalation message with the ACTION tag.
"""
gemini_model = genai.GenerativeModel( model_name="gemini-3-flash-preview",system_instruction=SYSTEM_PROMPT)
 
@app.post("/chat")
async def chat_endpoint(file: UploadFile = File(...), history: str = Form("")):
    
    # ---------------------------------------------------------
    # 1. SPEECH TO TEXT (Using SDK)
    # ---------------------------------------------------------
    print("1. Processing Speech (SDK)...")
    try:
        response = client.speech_to_text.transcribe(
            file=file.file,         
            model="saarika:v2.5",   
            language_code="ta-IN"   
        )
        user_text = response.transcript
        
    except Exception as e:
        print(f"❌ STT SDK Error: {e}")
        return JSONResponse({"error": f"STT Failed: {str(e)}"}, status_code=500)

    if not user_text:
        return JSONResponse({"error": "No voice detected"}, status_code=400)
    
    print(f"   User said: {user_text}")

    # ---------------------------------------------------------
    # 2. LOGIC (Using SDK)
    # ---------------------------------------------------------
    print("2. Thinking (SDK)...")
    combined_prompt = f"HISTORY: {history}\nUSER SAID: {user_text}"
    
    # try:
    #     # Using client.chat.completions as requested
    #     chat_response = client.chat.completions( 
    #         messages=[
    #             {"role": "system", "content": SYSTEM_PROMPT},
    #             {"role": "user", "content": combined_prompt}
    #         ],
    #         max_tokens=150,
    #         temperature=0.1
    #     )
    #     # Extract content from SDK object
    #     ai_text = chat_response.choices[0].message.content
        
    # except Exception as e:
    #     print(f"❌ Chat SDK Error: {e}")
    #     return JSONResponse({"error": f"Brain Failed: {str(e)}"}, status_code=500)

    # print(f"   AI Reply: {ai_text}")
    # ai_speech_text = ai_text
    # ticket_created = False
   
    # if "[ACTION:RAISE_TICKET]" in ai_text:
    #     # A. Trigger the Python Function
    #     #create_support_ticket(user_text, history)
    #     url = "http://localhost:3000/api/tickets/chat-report-error"
    #     payload = {
    #         "error_message": user_text,
    #         "history":history
    #     }

    #     response = requests.post(url, json=payload)

    #     print(response.status_code) 
    #     ticket_created = True
       
    #     # B. Clean the text so the Voice doesn't read the tag
    #     ai_speech_text = ai_text.replace("[ACTION:RAISE_TICKET]", "").strip()

    try:
        # We pass the history and current input as a single string to Gemini
        user_message = f"HISTORY:\n{history}\n\nNEW USER INPUT: {user_text}"
       
        # chat_session can also be used, but for stateless FastAPI, this is cleaner:
        response = gemini_model.generate_content(user_message)
        ai_text = response.text.strip()
       
    except Exception as e:
        print(f"Exception at gen ai: {e}")
        return JSONResponse({"error": f"Gemini Failed: {str(e)}"}, status_code=500)
 
    # 3. INTERCEPT TICKET ACTION
    clean_ai_text = ai_text
    if "[ACTION:RAISE_TICKET]" in ai_text:
        # create_support_ticket(user_text, history)
        clean_ai_text = ai_text.replace("[ACTION:RAISE_TICKET]", "").strip()

    # ---------------------------------------------------------
    # 3. TEXT TO SPEECH (Using SDK)
    # ---------------------------------------------------------
    print("3. Generating Audio (SDK)...")
    try:
        # Using client.text_to_speech.convert as requested
        # Changed language to "ta-IN" (Tamil)
        tts_response = client.text_to_speech.convert(
            text=clean_ai_text,
            target_language_code="ta-IN",
            speaker="manisha",  # Male voice
            model="bulbul:v2" #bulbul:v3-beta
        )
        # The SDK returns the base64 string directly in .audios[0]
        audio_base64 = tts_response.audios[0]
        
    except Exception as e:
        print(f"❌ TTS SDK Error: {e}")
        return JSONResponse({"error": f"Audio Failed: {str(e)}"}, status_code=500)

    # 4. RESPONSE
    new_history = f"{history}\nUser: {user_text}\nAI: {clean_ai_text}"
    
    if "[ACTION:RAISE_TICKET]" in ai_text:
        # create_support_ticket(user_text, history)
        clean_ai_text = ai_text.replace("[ACTION:RAISE_TICKET]", "").strip()
        print(clean_ai_text)
        url = "http://localhost:3000/api/tickets/chat-report-error"
        payload = {
            "error_message": user_text,
            "history":new_history
        }

        response = requests.post(url, json=payload)

        print(response) 
        ticket_created = True
        
    return JSONResponse({
        "user_text": user_text,
        "ai_text": clean_ai_text,
        "audio_base64": audio_base64,
        "updated_history": new_history
    })