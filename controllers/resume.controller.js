import dotenv from "dotenv"
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import { resumeSchema } from "../utils/validations.js";

dotenv.config()
 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export const generateResume = async (req, res) => {

  const parsedData = resumeSchema.safeParse(req.body)

  if (!parsedData.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parsedData.error.errors.map((e) => e.message),
    });
  }
  

  const {job_title, job_description, field, experience} = parsedData.data


  try {
    const prompt = `
    You are an expert resume writer and career coach.
    
    Generate a professional resume in **strict JSON format** (no explanations, no markdown, no extra text).
    
    The user provided the following details:
    - Job Title: ${job_title}
    - Job Description: ${job_description}
    - Field: ${field}
    - Experience: ${experience}
    
    Follow these rules strictly:
    1. Output only valid JSON.
    2. The JSON must have the following structure:
    {
      "name": "string (placeholder)",
      "job_title": "string",
      "summary": "string",
      "skills": ["string"],
      "experience": [
        {
          "company": "string (if available, or 'Not specified')",
          "role": "string",
          "duration": "string",
          "description": ["string"]
        }
      ],
      "education": [
        {
          "degree": "string (placeholder)",
          "school": "string (placeholder)",
          "year": "string (placeholder)"
        }
      ]
    }
    3. The summary and skills must align with the job title and description.
    4. Ensure the JSON is valid and parsable — no comments or trailing commas.
    `;
      
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
       
  
  const data = await response.json();
  let text =  data.candidates[0].content.parts[0].text

  text = text.replace(/```json|```/g, "").trim();

  let resumeData;
  try {
    resumeData = JSON.parse(text);
  } catch (err) {
    console.error("Error parsing JSON:", err);
    resumeData = { rawText: text }; // fallback
  }

  res.status(200).json({ resume: resumeData });

  
  } catch (error) {
    console.error("Error generating resume:", error)
  }
}


export const downloadResume = async (req, res) => {
  try {
    const {resume} = req.body; 

    const doc = new PDFDocument();
    const stream = new Readable().wrap(doc);

    // Set headers for browser download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${resume.name.replace(/\s+/g, "_")}_resume.pdf`
    );

    // Title
    doc.fontSize(20).text(`${resume.name}`, { align: "center" });
    doc.fontSize(14).text(`${resume.job_title}`, { align: "center" });
    doc.moveDown();

    // Summary
    doc.fontSize(12).text("Summary", { underline: true });
    doc.text(resume.summary);
    doc.moveDown();

    // Skills
    doc.text("Skills", { underline: true });
    doc.text(resume.skills.join(", "));
    doc.moveDown();

    // Experience
    doc.text("Experience", { underline: true });
    resume.experience.forEach((exp) => {
      doc.text(`${exp.role} at ${exp.company} (${exp.duration})`);
      exp.description.forEach((line) => doc.text(`- ${line}`));
      doc.moveDown();
    });

    // Education
    doc.text("Education", { underline: true });
    resume.education.forEach((edu) => {
      doc.text(`${edu.degree}, ${edu.school} (${edu.year})`);
    });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};