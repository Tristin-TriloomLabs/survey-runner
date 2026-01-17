// ====== CONFIG ======
const FLOW_GET_URL = "https://9f48aec3eda0e4b1bfc9a32779c7c8.4a.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/f6e6dde5110e40d4b269c2d4a954b82c/triggers/manual/paths/invoke/survey?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KmgLO3Qspxo-l45H8BnXe6mj-ags27IOYXhA41NQxcQ&surveyId=22375dd3-9af3-f011-8406-002248f9b6c4&token=8ad6f5bd-d2a1-4091-bb10-96e23c9cd899"; // your GET flow
const FLOW_POST_URL = "https://9f48aec3eda0e4b1bfc9a32779c7c8.4a.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/a128a9d378bb429bb93a422e2529f7e3/triggers/manual/paths/invoke/submit?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=QRr_Swy0AV8z7exa2wSkB9zL7Mf8tIxWFbPeaNn_8Pg"; // we'll add in Flow B
// Optional: pass a surveyId in the email link like: ?surveyId=abc123
// ====== END CONFIG ======

const qs = new URLSearchParams(location.search);
const surveyId = qs.get("surveyId") || ""; // use if your flow supports it

const elStatus = document.getElementById("status");
const elTitle = document.getElementById("surveyTitle");

function setStatus(msg) { elStatus.textContent = msg || ""; }

async function getSurveyJson() {
  setStatus("Fetching survey JSON…");
  const url = surveyId ? `${FLOW_GET_URL}&surveyId=${encodeURIComponent(surveyId)}` : FLOW_GET_URL;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`GET failed: ${res.status} ${res.statusText}`);

  // Flow can return JSON directly, or a string containing JSON
  const data = await res.json();
  // If your flow responds like { "surveyJson": "{...}" } then handle that:
  const surveyJson = (typeof data === "string") ? data
                    : (data.surveyJson || data.SurveyJson || data.survey || data.json || data);

  return (typeof surveyJson === "string") ? JSON.parse(surveyJson) : surveyJson;
}

async function postResponse(payload) {
  if (!FLOW_POST_URL || FLOW_POST_URL.includes("PASTE_")) {
    console.warn("No Flow B URL configured yet. Skipping submit.");
    setStatus("Submitted locally (Flow B not configured yet).");
    return;
  }

  setStatus("Submitting response…");
  const res = await fetch(FLOW_POST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`POST failed: ${res.status} ${res.statusText}`);
  setStatus("Submitted ✅");
}

(async function init() {
  try {
    const json = await getSurveyJson();

    elTitle.textContent = json.title || "Survey";

    const survey = new Survey.Model(json);

    survey.onComplete.add(async (sender) => {
      // What we submit to Flow B (you can add more fields)
      const payload = {
        surveyId,
        completedOn: new Date().toISOString(),
        response: sender.data
      };
      await postResponse(payload);
    });

    Survey.SurveyNG.render("surveyContainer", { model: survey });
    setStatus("");
  } catch (e) {
    console.error(e);
    setStatus(e.message || "Error");
    document.getElementById("surveyContainer").innerHTML =
      `<div style="color:#b00020;">Could not load survey. Check Flow A URL / response format.</div>`;
  }
})();
