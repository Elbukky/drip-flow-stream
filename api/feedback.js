const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = "l00ppinside@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, feedback } = req.body;

    if (!name || !email || !feedback) {
      return res.status(400).json({ error: "Name, email, and feedback are required" });
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return res.status(500).json({ error: "Email service not configured. Please add RESEND_API_KEY in Vercel settings." });
    }

    const emailHtml = `
      <h2>New Feedback Received</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Feedback:</strong></p>
      <p>${feedback.replace(/\n/g, "<br>")}</p>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: TO_EMAIL,
        subject: `New Feedback from ${name}`,
        html: emailHtml,
        reply_to: email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return res.status(500).json({ error: data.message || "Failed to send email. Check Resend API key." });
    }

    console.log("Email sent successfully:", data.id);

    return res.status(200).json({ success: true, message: "Feedback sent successfully" });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
