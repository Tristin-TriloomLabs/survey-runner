
// ================================
// CONFIG
// ================================
const FLOW_GET_URL =
  "https://9f48aec3eda0e4b1bfc9a32779c7c8.4a.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/f6e6dde5110e40d4b269c2d4a954b82c/triggers/manual/paths/invoke/survey?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KmgLO3Qspxo-l45H8BnXe6mj-ags27IOYXhA41NQxcQ&surveyId=22375dd3-9af3-f011-8406-002248f9b6c4&token=8ad6f5bd-d2a1-4091-bb10-96e23c9cd899"; // must be logic.azure.com

const FLOW_POST_URL =
  "https://9f48aec3eda0e4b1bfc9a32779c7c8.4a.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/a128a9d378bb429bb93a422e2529f7e3/triggers/manual/paths/invoke/submit?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=QRr_Swy0AV8z7exa2wSkB9zL7Mf8tIxWFbPeaNn_8Pg"; // must be logic.azure.com

// ================================
// READ QUERY STRING PARAMS
// ================================
const qs = new URLSearchParams(window.location.search);
const surveyId = qs.get("surveyId") || "";
const token = qs.get("token") || "";

// ================================
// HELPER: POST SURVEY RESPONSE
// ================================
async function postResponse(payload) {
  const res = await fetch(FLOW_POST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("Failed to submit survey response");
  }

  return res.json();
}

// ================================
// LOAD SURVEY FROM FLOW A
// ================================
(async function loadSurvey() {
  try {
    if (!window.Survey || !Survey.Model) {
      throw new Error("SurveyJS not loaded");
    }

    // Build GET URL (append params only if present)
    let url = FLOW_GET_URL;
    if (surveyId) {
      url += `&surveyId=${encodeURIComponent(surveyId)}`;
    }
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new Error("Failed to load survey");
    }

    const surveyJson = await res.json();

    // Create SurveyJS model
    const survey = new Survey.Model(surveyJson);

    // Handle completion → Flow B
    survey.onComplete.add(async function (sender) {
      try {
        const payload = {
          surveyId: surveyId,
          token: token,
          completedOn: new Date().toISOString(),
          response: sender.data
        };

        await postResponse(payload);

        document.getElementById("surveyContainer").innerHTML =
          "<h3>Thank you. Your response has been submitted.</h3>";
      } catch (err) {
        console.error(err);
        alert("Survey submission failed. Please contact support.");
      }
    });

    // Render survey
    survey.render("surveyContainer");
  } catch (err) {
    console.error(err);
    document.getElementById("surveyContainer").innerHTML =
      "<h3>Unable to load survey.</h3><p>Please check your link or try again later.</p>";
  }
})();

