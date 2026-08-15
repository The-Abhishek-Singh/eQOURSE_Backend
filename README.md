<!--
    AI Support Request Router - Backend Service
    Role: Forward Deployment Engineer Assessment
    GitHub: https://github.com/the-abhishek-singh
-->

<!-- Banner -->
<a href="https://abhishekworks.com" target="_blank">
  <img src="https://i.pinimg.com/originals/d5/84/0b/d5840b194bc468e606984aa99f6558c8.gif" alt="Portfolio Banner" style="width:100%; height:auto"/>
</a>

</br>

<img src="https://media.tenor.com/Gh3LKX9HMFkAAAAj/hollow-knight-knight.gif" width=330 align="left">

<div align="center">
  
**🪄 About This Project**
</div>

<div align="justify">

This is the core **Backend Service for the AI Support Request Router** — a production-minded API designed to ingest, deduplicate, classify, and persist customer support tickets in real-time.

Built with **Node.js, Express, MongoDB Atlas, and Groq Cloud (LLaMA 3.1)**, this pipeline processes incoming requests, enforces privacy-first data sanitization (zero PII sent to AI), performs 60-second semantic deduplication with priority escalation, and implements fault-tolerant fallback mechanisms.

🌐 **Live API:** [https://eqourse-backend.onrender.com](https://eqourse-backend.onrender.com)

</div>
</br>

<img align="right" alt="about-me-gif" width="300" src="https://i.pinimg.com/originals/10/27/f8/1027f80aeabcbb74a2e698be71829e9e.gif"></br>

<h3 align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" width=18>
    Core Features & Architecture
  <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" width=18>
</h3>

🟣 **End-to-End Request Flow:** `Frontend Form → Express Controller → Token/AI Deduplication Check → Sanitized AI Classifier → MongoDB Atlas → Admin Dashboard` </br>
🟪 **60-Second Deduplication & Escalation:** Duplicate messages from the same email within 60s are caught via token overlap and semantic evaluation; if a duplicate arrives with higher priority, the existing record is escalated seamlessly without creating duplicate documents. </br>
🟣 **Zero PII Exposure (Privacy First):** `Name` and `Email` are strictly stripped at the controller level; only the message body is evaluated by the AI provider. </br>
🟪 **Fault-Tolerant Fallback:** If the LLM times out, errors, or returns an unapproved category, the system gracefully defaults to `General` with `classificationSource: "FALLBACK"`. </br>
🟣 **Allowed Output Validation:** Enforces strict categorization into only `Billing`, `Technical`, `Sales`, or `General`. </br>
🟪 **High-Priority Triage Handling:** Escalated requests trigger visual alert flags and weighted priority handling for expedited response. </br>
ㅤ

<div align="center"> 
  <a href="mailto:dev.abhishekworks@gmail.com" target="_blank">
    <img src="https://skillicons.dev/icons?i=gmail" />
  </a>
  <a href="https://www.linkedin.com/in/abhishek-singh-399645272/" target="_blank">
    <img src="https://skillicons.dev/icons?i=linkedin" />
  </a> 
  <a href="https://open.spotify.com/playlist/6m17JoyqPYP3euc31KIBaH" target="_blank">
    <img src="https://cdn.iconscout.com/icon/free/png-256/free-spotify-11-432546.png?f=webp" width="48px" />
  </a>
</div>

</br>

<h3 align="center">
<img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" width=20>
  Tech Stack & Tools Used
<img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" width=20>
</h3>

<div align="center">
  <img src="https://skillicons.dev/icons?i=nodejs,express,mongodb,postman,git,github,vscode&theme=dark" /><br>
  <p align="center"><b>LLM Engine:</b> Groq Cloud (LLaMA 3.1 8B Instant) • <b>Hosting:</b> Render</p>
</div>

</br>

<h3 align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" width="16px">
    Installation & Setup
  <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" width="16px">
</h3>

```bash
# 1️⃣ Clone this repo
git clone [https://github.com/the-abhishek-singh/eQOURSE_Backend.git](https://github.com/the-abhishek-singh/eQOURSE_Backend.git)

# 2️⃣ Move into the project directory
cd eQOURSE_Backend

# 3️⃣ Install dependencies
npm install

# 4️⃣ Configure Environment Variables (.env)
# Create a .env file based on .env.example:
# PORT=5000
# MONGO_URI=your_mongodb_connection_string
# GROQ_API_KEY=your_groq_api_key

# 5️⃣ Run the development server
npm start
