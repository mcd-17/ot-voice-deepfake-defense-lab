import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// OT DEEPFAKE ATTACK SIMULATOR — Advanced Prototype
// Voice Fingerprinting + 5-Layer AI Detection + Training UI
// ============================================================

const VOICE_PROFILES = {
  chief_engineer: {
    id: "chief_engineer",
    name: "Chief Engineer Vasquez",
    role: "Chief Process Engineer",
    clearance: "LEVEL-5",
    voiceprint: { pitch: 142, formant1: 780, formant2: 1220, jitter: 0.003, shimmer: 0.021 },
    authorized_cmds: ["MAINTENANCE_MODE", "SENSOR_CALIBRATION", "FLOW_ADJUSTMENT"],
  },
  plant_director: {
    id: "plant_director",
    name: "Plant Director Chen",
    role: "Facility Director",
    clearance: "LEVEL-4",
    voiceprint: { pitch: 198, formant1: 860, formant2: 1480, jitter: 0.002, shimmer: 0.018 },
    authorized_cmds: ["EMERGENCY_SHUTDOWN", "MAINTENANCE_MODE"],
  },
  safety_officer: {
    id: "safety_officer",
    name: "Safety Officer Patel",
    role: "HSE Manager",
    clearance: "LEVEL-3",
    voiceprint: { pitch: 175, formant1: 820, formant2: 1350, jitter: 0.004, shimmer: 0.025 },
    authorized_cmds: ["ALARM_ACK", "SENSOR_CALIBRATION"],
  },
};

const ATTACK_SCENARIOS = [
  {
    id: "scenario_1",
    name: "Safety Interlock Bypass",
    severity: "CRITICAL",
    impersonating: "chief_engineer",
    command: "DISABLE_SAFETY_INTERLOCK",
    script: "This is Chief Engineer Vasquez. We have a pressure buildup in Unit 3. Disable the safety interlock on Valve PV-301 immediately.",
    deepfakePitch: 144,
    deepfakeFormant1: 778,
    deepfakeFormant2: 1218,
    deepfakeJitter: 0.009,
    deepfakeShimmer: 0.038,
  },
  {
    id: "scenario_2",
    name: "Emergency Shutdown Abort",
    severity: "HIGH",
    impersonating: "plant_director",
    command: "ABORT_EMERGENCY_SHUTDOWN",
    script: "Director Chen here. Cancel the emergency shutdown sequence in progress. We've resolved the issue.",
    deepfakePitch: 201,
    deepfakeFormant1: 863,
    deepfakeFormant2: 1483,
    deepfakeJitter: 0.007,
    deepfakeShimmer: 0.031,
  },
  {
    id: "scenario_3",
    name: "Pressure Override",
    severity: "HIGH",
    impersonating: "safety_officer",
    command: "OVERRIDE_PRESSURE_ALARM",
    script: "Patel from safety. Override the high pressure alarm on reactor R-102. It's a false positive from a faulty sensor.",
    deepfakePitch: 177,
    deepfakeFormant1: 822,
    deepfakeFormant2: 1352,
    deepfakeJitter: 0.011,
    deepfakeShimmer: 0.042,
  },
];

const LAYER_NAMES = [
  { id: 1, name: "Spectral Analysis", desc: "FFT pitch & frequency analysis" },
  { id: 2, name: "Formant Fingerprint", desc: "Vocal tract resonance mapping" },
  { id: 3, name: "Micro-artifact Detection", desc: "GAN/TTS artifact scanning" },
  { id: 4, name: "Prosody Behavioral", desc: "Speech rhythm & cadence profiling" },
  { id: 5, name: "Context Anomaly", desc: "Command-authority cross-validation" },
];

const OT_SYSTEMS = [
  { id: "reactor_r102", name: "Reactor R-102", status: "NOMINAL", temp: 342, pressure: 14.2, interlock: true },
  { id: "valve_pv301", name: "Valve PV-301", status: "NOMINAL", position: 67, flow: 82.4, interlock: true },
  { id: "pump_p204", name: "Pump P-204", status: "NOMINAL", rpm: 1450, current: 48.2, interlock: true },
  { id: "heat_ex_e501", name: "Heat Exchanger E-501", status: "NOMINAL", inlet: 180, outlet: 95, interlock: true },
];

// Simulate 5-layer AI detection via Anthropic API
async function runAIDetection(scenario, voiceProfile) {
  const prompt = `You are an AI voice authentication system for industrial OT security. Analyze this voice authentication attempt and provide a 5-layer deepfake detection analysis.

REGISTERED VOICE PROFILE for ${voiceProfile.name}:
- Pitch: ${voiceProfile.voiceprint.pitch} Hz
- Formant F1: ${voiceProfile.voiceprint.formant1} Hz
- Formant F2: ${voiceProfile.voiceprint.formant2} Hz
- Jitter: ${voiceProfile.voiceprint.jitter}
- Shimmer: ${voiceProfile.voiceprint.shimmer}

INCOMING CALL VOICE MEASUREMENTS:
- Pitch: ${scenario.deepfakePitch} Hz (delta: ${Math.abs(scenario.deepfakePitch - voiceProfile.voiceprint.pitch).toFixed(1)} Hz)
- Formant F1: ${scenario.deepfakeFormant1} Hz (delta: ${Math.abs(scenario.deepfakeFormant1 - voiceProfile.voiceprint.formant1).toFixed(1)} Hz)
- Formant F2: ${scenario.deepfakeFormant2} Hz (delta: ${Math.abs(scenario.deepfakeFormant2 - voiceProfile.voiceprint.formant2).toFixed(1)} Hz)
- Jitter: ${scenario.deepfakeJitter} (delta: ${Math.abs(scenario.deepfakeJitter - voiceProfile.voiceprint.jitter).toFixed(4)})
- Shimmer: ${scenario.deepfakeShimmer} (delta: ${Math.abs(scenario.deepfakeShimmer - voiceProfile.voiceprint.shimmer).toFixed(4)})

REQUESTED COMMAND: ${scenario.command}
AUTHORIZED COMMANDS FOR THIS PROFILE: ${voiceProfile.authorized_cmds.join(", ")}
ATTACK SCRIPT SPOKEN: "${scenario.script}"

Respond ONLY with a JSON object (no markdown, no extra text):
{
  "layer1": { "score": <0-100 confidence deepfake %>, "status": "<PASS|FAIL|SUSPICIOUS>", "finding": "<1 sentence>" },
  "layer2": { "score": <0-100>, "status": "<PASS|FAIL|SUSPICIOUS>", "finding": "<1 sentence>" },
  "layer3": { "score": <0-100>, "status": "<PASS|FAIL|SUSPICIOUS>", "finding": "<1 sentence>" },
  "layer4": { "score": <0-100>, "status": "<PASS|FAIL|SUSPICIOUS>", "finding": "<1 sentence>" },
  "layer5": { "score": <0-100>, "status": "<PASS|FAIL|SUSPICIOUS>", "finding": "<1 sentence>" },
  "overall_deepfake_confidence": <0-100>,
  "verdict": "<AUTHENTIC|DEEPFAKE|SUSPECTED_DEEPFAKE>",
  "threat_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "recommended_action": "<1-2 sentences>",
  "attack_vector": "<description of how this deepfake was constructed>"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    // Fallback simulation if API fails
    return {
      layer1: { score: 87, status: "FAIL", finding: "Pitch deviation of 2-3 Hz detected, consistent with TTS synthesis artifacts." },
      layer2: { score: 91, status: "FAIL", finding: "Formant resonance mismatch in F1/F2 ratios exceeds registered baseline by 15%." },
      layer3: { score: 94, status: "FAIL", finding: "Neural codec compression artifacts detected at 8kHz harmonic frequencies." },
      layer4: { score: 78, status: "SUSPICIOUS", finding: "Prosodic stress patterns deviate from known speaker behavioral baseline." },
      layer5: { score: 99, status: "FAIL", finding: "DISABLE_SAFETY_INTERLOCK is not in authorized command set for this identity." },
      overall_deepfake_confidence: 91,
      verdict: "DEEPFAKE",
      threat_level: "CRITICAL",
      recommended_action: "Reject command, lock caller authentication, alert security team immediately.",
      attack_vector: "Neural TTS voice cloning using ~30 seconds of sampled audio from public interviews.",
    };
  }
}

// Train AI model with new sample
async function trainModel(trainingData) {
  const prompt = `You are an OT security AI model trainer. A new voice sample has been logged. Analyze it and provide training feedback to improve the 5-layer detection model.

TRAINING SAMPLE:
- Sample Type: ${trainingData.type}
- Outcome: ${trainingData.outcome}
- Layer Scores: ${JSON.stringify(trainingData.scores)}
- False Positive/Negative: ${trainingData.error_type || "None"}

Provide training recommendations as JSON only:
{
  "model_update": "<which layer improved>",
  "accuracy_delta": <+/- percentage improvement>,
  "new_threshold": { "layer": <1-5>, "old": <value>, "new": <value> },
  "training_note": "<1-2 sentences on what the model learned>",
  "total_accuracy": <current estimated accuracy 85-99>
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      model_update: "Layer 3 Micro-artifact Detection",
      accuracy_delta: 1.2,
      new_threshold: { layer: 3, old: 0.72, new: 0.81 },
      training_note: "Model now better distinguishes VALL-E neural codec artifacts from natural vocal compression.",
      total_accuracy: 94.7,
    };
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function OTDeepfakeSimulator() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [attackPhase, setAttackPhase] = useState("idle"); // idle | incoming | analyzing | result
  const [layerResults, setLayerResults] = useState({});
  const [currentLayer, setCurrentLayer] = useState(0);
  const [finalResult, setFinalResult] = useState(null);
  const [otSystems, setOtSystems] = useState(OT_SYSTEMS);
  const [eventLog, setEventLog] = useState([]);
  const [modelAccuracy, setModelAccuracy] = useState(89.3);
  const [trainingLog, setTrainingLog] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [waveformData, setWaveformData] = useState(Array(40).fill(5));
  const timerRef = useRef(null);
  const waveRef = useRef(null);

  const addLog = useCallback((msg, type = "info") => {
    setEventLog(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      msg,
      type
    }, ...prev].slice(0, 50));
  }, []);

  // Animate waveform during call
  useEffect(() => {
    if (attackPhase === "incoming" || attackPhase === "analyzing") {
      waveRef.current = setInterval(() => {
        setWaveformData(Array(40).fill(0).map(() =>
          attackPhase === "analyzing" ? Math.random() * 60 + 10 : Math.random() * 30 + 5
        ));
      }, 120);
    } else {
      clearInterval(waveRef.current);
      setWaveformData(Array(40).fill(5));
    }
    return () => clearInterval(waveRef.current);
  }, [attackPhase]);

  // Call timer
  useEffect(() => {
    if (attackPhase === "incoming") {
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [attackPhase]);

  const launchAttack = async (scenario) => {
    setSelectedScenario(scenario);
    setAttackPhase("incoming");
    setLayerResults({});
    setFinalResult(null);
    setCurrentLayer(0);
    addLog(`⚠ INCOMING CALL: Caller claims to be ${VOICE_PROFILES[scenario.impersonating].name}`, "warning");
    addLog(`Command requested: ${scenario.command}`, "warning");
  };

  const analyzeCall = async () => {
    if (!selectedScenario) return;
    setAttackPhase("analyzing");
    addLog("🔍 Initiating 5-layer biometric authentication...", "info");

    const profile = VOICE_PROFILES[selectedScenario.impersonating];
    const result = await runAIDetection(selectedScenario, profile);

    // Animate layers one by one
    for (let i = 1; i <= 5; i++) {
      setCurrentLayer(i);
      const layerKey = `layer${i}`;
      setLayerResults(prev => ({ ...prev, [layerKey]: result[layerKey] }));
      addLog(`Layer ${i} [${LAYER_NAMES[i-1].name}]: ${result[layerKey].status} — ${result[layerKey].finding}`,
        result[layerKey].status === "FAIL" ? "danger" : result[layerKey].status === "SUSPICIOUS" ? "warning" : "success");
      await new Promise(r => setTimeout(r, 900));
    }

    setFinalResult(result);
    setAttackPhase("result");
    addLog(`🚨 VERDICT: ${result.verdict} | Confidence: ${result.overall_deepfake_confidence}%`,
      result.verdict === "AUTHENTIC" ? "success" : "danger");

    if (result.verdict !== "AUTHENTIC") {
      addLog("🔒 Command BLOCKED. Security team alerted. Caller session terminated.", "danger");
    }
  };

  const rejectCall = () => {
    addLog(`Call rejected by operator without analysis.`, "warning");
    setAttackPhase("idle");
    setSelectedScenario(null);
  };

  const runTraining = async () => {
    if (!finalResult) return;
    setIsTraining(true);
    addLog("🧠 Submitting sample to model training pipeline...", "info");
    const td = {
      type: finalResult.verdict === "DEEPFAKE" ? "deepfake_confirmed" : "false_positive",
      outcome: finalResult.verdict,
      scores: Object.fromEntries(Object.entries(finalResult).filter(([k]) => k.startsWith("layer")).map(([k, v]) => [k, v.score])),
      error_type: null,
    };
    const training = await trainModel(td);
    setModelAccuracy(training.total_accuracy);
    setTrainingLog(prev => [{ ...training, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    setIsTraining(false);
    addLog(`✅ Model updated: ${training.model_update} | Accuracy: ${training.total_accuracy}%`, "success");
  };

  const resetSimulator = () => {
    setAttackPhase("idle");
    setSelectedScenario(null);
    setLayerResults({});
    setFinalResult(null);
    setCurrentLayer(0);
  };

  const statusColor = (s) => s === "NOMINAL" ? "#00ff88" : s === "WARNING" ? "#ffaa00" : "#ff3344";
  const layerStatusColor = (s) => s === "PASS" ? "#00ff88" : s === "FAIL" ? "#ff3344" : "#ffaa00";
  const severityColor = (s) => s === "CRITICAL" ? "#ff3344" : s === "HIGH" ? "#ff8800" : "#ffcc00";
  const verdictColor = (v) => v === "AUTHENTIC" ? "#00ff88" : v === "DEEPFAKE" ? "#ff3344" : "#ffaa00";

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      background: "#040810",
      color: "#c8d8f0",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,120,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,120,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Scan line effect */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* ---- HEADER ---- */}
        <header style={{
          borderBottom: "1px solid rgba(0,120,255,0.3)",
          padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(4,8,16,0.9)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 42, height: 42, border: "2px solid #0088ff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "#0088ff",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              background: "rgba(0,136,255,0.1)",
            }}>🛡</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>OT DEEPFAKE ATTACK SIMULATOR</div>
              <div style={{ fontSize: 10, color: "#0088ff", letterSpacing: 3 }}>INDUSTRIAL SOCIAL ENGINEERING DEFENSE LAB v2.6</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#6080a0", letterSpacing: 2 }}>MODEL ACCURACY</div>
              <div style={{ fontSize: 18, color: "#00ff88", fontWeight: 700 }}>{modelAccuracy.toFixed(1)}%</div>
            </div>
            <div style={{
              padding: "4px 12px", border: "1px solid #00ff88",
              color: "#00ff88", fontSize: 10, letterSpacing: 2,
              animation: attackPhase === "incoming" ? "blink 1s infinite" : "none",
            }}>
              {attackPhase === "idle" ? "● MONITORING" : attackPhase === "incoming" ? "⚠ INCOMING CALL" : attackPhase === "analyzing" ? "◌ ANALYZING" : "✓ RESULT READY"}
            </div>
          </div>
        </header>

        {/* ---- TABS ---- */}
        <nav style={{ display: "flex", borderBottom: "1px solid rgba(0,120,255,0.2)", padding: "0 24px", background: "rgba(4,8,16,0.7)" }}>
          {["dashboard", "attack_lab", "ot_systems", "ai_training", "event_log"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "12px 20px", border: "none", background: "none",
              color: activeTab === tab ? "#0088ff" : "#4060a0",
              borderBottom: activeTab === tab ? "2px solid #0088ff" : "2px solid transparent",
              cursor: "pointer", fontSize: 11, letterSpacing: 2,
              fontFamily: "inherit", textTransform: "uppercase",
            }}>
              {tab.replace("_", " ")}
            </button>
          ))}
        </nav>

        {/* ---- MAIN CONTENT ---- */}
        <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>

          {/* INCOMING CALL MODAL */}
          {(attackPhase === "incoming" || attackPhase === "analyzing" || attackPhase === "result") && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(4,8,16,0.92)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 680, border: `2px solid ${attackPhase === "result" && finalResult ? verdictColor(finalResult.verdict) : "#0088ff"}`,
                background: "#060e1e", padding: 32, position: "relative",
                boxShadow: `0 0 60px ${attackPhase === "result" && finalResult ? verdictColor(finalResult.verdict) : "#0088ff"}40`,
              }}>
                {selectedScenario && (
                  <>
                    {/* Call header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#6080a0", letterSpacing: 3, marginBottom: 4 }}>
                          {attackPhase === "incoming" ? "INCOMING AUTHENTICATED VOICE CALL" : attackPhase === "analyzing" ? "BIOMETRIC ANALYSIS IN PROGRESS" : "AUTHENTICATION RESULT"}
                        </div>
                        <div style={{ fontSize: 20, color: "#fff", fontWeight: 700 }}>
                          {VOICE_PROFILES[selectedScenario.impersonating].name}
                        </div>
                        <div style={{ fontSize: 12, color: "#4080c0" }}>
                          {VOICE_PROFILES[selectedScenario.impersonating].role} · {VOICE_PROFILES[selectedScenario.impersonating].clearance}
                        </div>
                      </div>
                      <div style={{
                        padding: "4px 12px", fontSize: 10, letterSpacing: 2,
                        border: `1px solid ${severityColor(selectedScenario.severity)}`,
                        color: severityColor(selectedScenario.severity),
                      }}>⚠ {selectedScenario.severity}</div>
                    </div>

                    {/* Waveform */}
                    <div style={{
                      height: 80, background: "#040810", border: "1px solid rgba(0,120,255,0.2)",
                      display: "flex", alignItems: "center", gap: 2, padding: "0 12px",
                      marginBottom: 20, overflow: "hidden",
                    }}>
                      {waveformData.map((h, i) => (
                        <div key={i} style={{
                          flex: 1, height: `${h}%`, minHeight: 2,
                          background: attackPhase === "analyzing" ? `hsl(${200 + i * 3}, 80%, 60%)` : "#0088ff",
                          borderRadius: 1, transition: "height 0.1s",
                          opacity: 0.8,
                        }} />
                      ))}
                    </div>

                    {/* Script */}
                    {attackPhase === "incoming" && (
                      <>
                        <div style={{
                          background: "rgba(0,136,255,0.05)", border: "1px solid rgba(0,136,255,0.2)",
                          padding: 16, marginBottom: 20, fontStyle: "italic", color: "#a0c0e0", fontSize: 13,
                        }}>
                          "{selectedScenario.script}"
                        </div>
                        <div style={{
                          padding: 12, border: "1px solid rgba(255,51,68,0.4)",
                          background: "rgba(255,51,68,0.05)", marginBottom: 20, fontSize: 12, color: "#ff8090",
                        }}>
                          🚨 REQUESTED COMMAND: <strong>{selectedScenario.command}</strong> — This command is NOT in authorized set for caller identity.
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button onClick={analyzeCall} style={{
                            flex: 1, padding: "14px", background: "#0055ff", border: "none",
                            color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                            letterSpacing: 2, fontWeight: 700,
                          }}>⚡ RUN 5-LAYER ANALYSIS</button>
                          <button onClick={rejectCall} style={{
                            padding: "14px 20px", background: "none", border: "1px solid #ff3344",
                            color: "#ff3344", cursor: "pointer", fontFamily: "inherit", fontSize: 12, letterSpacing: 2,
                          }}>✕ REJECT</button>
                        </div>
                      </>
                    )}

                    {/* Analysis layers */}
                    {(attackPhase === "analyzing" || attackPhase === "result") && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: "#6080a0", marginBottom: 12 }}>DETECTION LAYERS</div>
                        {LAYER_NAMES.map((layer, idx) => {
                          const layerKey = `layer${layer.id}`;
                          const lr = layerResults[layerKey];
                          const active = currentLayer === layer.id && attackPhase === "analyzing";
                          return (
                            <div key={layer.id} style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "8px 12px",
                              marginBottom: 4, background: active ? "rgba(0,136,255,0.1)" : "rgba(4,8,16,0.6)",
                              border: `1px solid ${lr ? layerStatusColor(lr.status) + "44" : active ? "#0088ff44" : "rgba(0,120,255,0.1)"}`,
                              transition: "all 0.3s",
                            }}>
                              <div style={{
                                width: 24, height: 24, border: `1px solid ${lr ? layerStatusColor(lr.status) : active ? "#0088ff" : "#2040608"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, color: lr ? layerStatusColor(lr.status) : active ? "#0088ff" : "#304060",
                                flexShrink: 0,
                              }}>
                                {lr ? (lr.status === "PASS" ? "✓" : lr.status === "FAIL" ? "✕" : "~") : active ? "◌" : layer.id}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, color: lr ? "#c0d0e0" : active ? "#8090a0" : "#304060" }}>
                                  {layer.name}
                                </div>
                                {lr && <div style={{ fontSize: 10, color: layerStatusColor(lr.status), marginTop: 2 }}>{lr.finding}</div>}
                              </div>
                              {lr && (
                                <div style={{
                                  fontSize: 12, fontWeight: 700, color: layerStatusColor(lr.status), minWidth: 48, textAlign: "right",
                                }}>
                                  {lr.score}%
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Final result */}
                    {attackPhase === "result" && finalResult && (
                      <div style={{
                        border: `2px solid ${verdictColor(finalResult.verdict)}`,
                        background: `${verdictColor(finalResult.verdict)}10`,
                        padding: 16, marginBottom: 16,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: verdictColor(finalResult.verdict) }}>
                            {finalResult.verdict === "DEEPFAKE" ? "🚫" : "✓"} {finalResult.verdict}
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: verdictColor(finalResult.verdict) }}>
                            {finalResult.overall_deepfake_confidence}% DEEPFAKE
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#a0b0c0", marginBottom: 8 }}>{finalResult.recommended_action}</div>
                        <div style={{ fontSize: 11, color: "#6080a0" }}>Attack vector: {finalResult.attack_vector}</div>
                        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                          <button onClick={runTraining} disabled={isTraining} style={{
                            flex: 1, padding: "10px", background: isTraining ? "#1a2040" : "#004422",
                            border: `1px solid ${isTraining ? "#304060" : "#00ff88"}`,
                            color: isTraining ? "#6080a0" : "#00ff88", cursor: isTraining ? "default" : "pointer",
                            fontFamily: "inherit", fontSize: 11, letterSpacing: 2,
                          }}>
                            {isTraining ? "◌ TRAINING..." : "🧠 TRAIN AI MODEL"}
                          </button>
                          <button onClick={resetSimulator} style={{
                            padding: "10px 20px", background: "none",
                            border: "1px solid #304060", color: "#6080a0",
                            cursor: "pointer", fontFamily: "inherit", fontSize: 11, letterSpacing: 2,
                          }}>RESET</button>
                        </div>
                      </div>
                    )}

                    {attackPhase === "analyzing" && (
                      <div style={{ textAlign: "center", color: "#6080a0", fontSize: 11, letterSpacing: 2 }}>
                        ANALYZING LAYER {currentLayer} OF 5... PLEASE WAIT
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ---- DASHBOARD TAB ---- */}
          {activeTab === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Attacks Simulated", value: "47", sub: "This session", color: "#ff8800" },
                  { label: "Deepfakes Detected", value: "44", sub: "93.6% detection rate", color: "#ff3344" },
                  { label: "Model Accuracy", value: `${modelAccuracy.toFixed(1)}%`, sub: "5-layer ensemble", color: "#00ff88" },
                  { label: "Training Samples", value: "1,284", sub: "Voice fingerprints", color: "#0088ff" },
                ].map(m => (
                  <div key={m.label} style={{
                    border: `1px solid ${m.color}33`, background: `${m.color}08`,
                    padding: 20, position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: m.color }} />
                    <div style={{ fontSize: 11, color: "#6080a0", letterSpacing: 2, marginBottom: 8 }}>{m.label.toUpperCase()}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: "#4060a0", marginTop: 4 }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* 5-Layer Architecture Diagram */}
              <div style={{ border: "1px solid rgba(0,120,255,0.2)", padding: 24, marginBottom: 24, background: "rgba(4,8,16,0.6)" }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#6080a0", marginBottom: 20 }}>5-LAYER AI DETECTION ARCHITECTURE</div>
                <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                  {LAYER_NAMES.map((layer, i) => (
                    <div key={layer.id} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                      <div style={{
                        flex: 1, border: "1px solid rgba(0,136,255,0.3)",
                        background: `rgba(0,${80 + i * 20},${180 + i * 10},0.1)`,
                        padding: 16, position: "relative",
                      }}>
                        <div style={{
                          position: "absolute", top: -1, left: 0, right: 0, height: 2,
                          background: `hsl(${200 + i * 20}, 80%, 60%)`,
                        }} />
                        <div style={{ fontSize: 10, color: `hsl(${200 + i * 20}, 80%, 60%)`, marginBottom: 6 }}>L{layer.id}</div>
                        <div style={{ fontSize: 11, color: "#c0d0e0", marginBottom: 4, lineHeight: 1.3 }}>{layer.name}</div>
                        <div style={{ fontSize: 9, color: "#4060a0", lineHeight: 1.4 }}>{layer.desc}</div>
                      </div>
                      {i < 4 && <div style={{ width: 20, textAlign: "center", color: "#2040608", fontSize: 16, flexShrink: 0 }}>→</div>}
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 12, padding: 12, background: "rgba(0,255,136,0.05)",
                  border: "1px solid rgba(0,255,136,0.2)", fontSize: 11, color: "#00ff88", textAlign: "center",
                }}>
                  ↓ ENSEMBLE VERDICT: AUTHENTIC / SUSPECTED_DEEPFAKE / DEEPFAKE
                </div>
              </div>

              {/* Quick launch */}
              <div style={{ border: "1px solid rgba(0,120,255,0.2)", padding: 24, background: "rgba(4,8,16,0.6)" }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#6080a0", marginBottom: 16 }}>QUICK ATTACK LAUNCH</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {ATTACK_SCENARIOS.map(sc => (
                    <button key={sc.id} onClick={() => { setActiveTab("attack_lab"); launchAttack(sc); }} style={{
                      padding: 16, border: `1px solid ${severityColor(sc.severity)}44`,
                      background: `${severityColor(sc.severity)}08`, cursor: "pointer",
                      textAlign: "left", fontFamily: "inherit", color: "#c0d0e0",
                    }}>
                      <div style={{ fontSize: 10, color: severityColor(sc.severity), letterSpacing: 2, marginBottom: 6 }}>
                        ⚠ {sc.severity}
                      </div>
                      <div style={{ fontSize: 13, color: "#fff", marginBottom: 4 }}>{sc.name}</div>
                      <div style={{ fontSize: 10, color: "#6080a0" }}>
                        Impersonating: {VOICE_PROFILES[sc.impersonating].name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- ATTACK LAB TAB ---- */}
          {activeTab === "attack_lab" && (
            <div>
              <div style={{ marginBottom: 24, fontSize: 11, color: "#6080a0", letterSpacing: 2 }}>
                SELECT ATTACK SCENARIO TO SIMULATE — ALL SCENARIOS USE AI-GENERATED DEEPFAKE VOICE PARAMETERS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {ATTACK_SCENARIOS.map(sc => {
                  const profile = VOICE_PROFILES[sc.impersonating];
                  return (
                    <div key={sc.id} style={{
                      border: `1px solid ${severityColor(sc.severity)}44`,
                      background: "rgba(4,8,16,0.8)", padding: 24,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: severityColor(sc.severity), letterSpacing: 2 }}>⚠ {sc.severity}</div>
                        <div style={{ fontSize: 10, color: "#4060a0" }}>SCENARIO {sc.id.split("_")[1]}</div>
                      </div>
                      <div style={{ fontSize: 16, color: "#fff", marginBottom: 8 }}>{sc.name}</div>
                      <div style={{ marginBottom: 16, padding: 12, background: "rgba(0,136,255,0.05)", border: "1px solid rgba(0,136,255,0.15)", fontSize: 11, color: "#8090a0", fontStyle: "italic" }}>
                        "{sc.script}"
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, color: "#4060a0", marginBottom: 8 }}>VOICE DEVIATION FROM BASELINE:</div>
                        {[
                          ["Pitch", profile.voiceprint.pitch, sc.deepfakePitch, "Hz"],
                          ["Formant F1", profile.voiceprint.formant1, sc.deepfakeFormant1, "Hz"],
                          ["Jitter", profile.voiceprint.jitter, sc.deepfakeJitter, ""],
                        ].map(([label, real, fake, unit]) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                            <span style={{ color: "#6080a0" }}>{label}</span>
                            <span style={{ color: "#a0c0e0" }}>
                              {real}{unit} → <span style={{ color: "#ff8844" }}>{fake}{unit}</span>
                              <span style={{ color: "#ff4444", marginLeft: 4 }}>
                                (+{Math.abs(Number(fake) - Number(real)).toFixed(4)})
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => launchAttack(sc)} style={{
                        width: "100%", padding: 12, background: `${severityColor(sc.severity)}22`,
                        border: `1px solid ${severityColor(sc.severity)}`,
                        color: severityColor(sc.severity), cursor: "pointer",
                        fontFamily: "inherit", fontSize: 11, letterSpacing: 2,
                      }}>
                        🎯 INJECT ATTACK
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Voice Profile Viewer */}
              <div style={{ marginTop: 24, border: "1px solid rgba(0,120,255,0.2)", padding: 24, background: "rgba(4,8,16,0.6)" }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#6080a0", marginBottom: 16 }}>REGISTERED VOICE FINGERPRINT DATABASE</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {Object.values(VOICE_PROFILES).map(vp => (
                    <div key={vp.id} style={{ border: "1px solid rgba(0,255,136,0.2)", padding: 16 }}>
                      <div style={{ color: "#00ff88", fontSize: 12, marginBottom: 4 }}>{vp.name}</div>
                      <div style={{ color: "#4060a0", fontSize: 10, marginBottom: 12 }}>{vp.role} · {vp.clearance}</div>
                      {Object.entries(vp.voiceprint).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                          <span style={{ color: "#4060a0" }}>{k}</span>
                          <span style={{ color: "#a0c0e0" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- OT SYSTEMS TAB ---- */}
          {activeTab === "ot_systems" && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#6080a0", marginBottom: 16 }}>
                VIRTUAL OT PLANT — SIMULATED INDUSTRIAL CONTROL SYSTEMS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
                {otSystems.map(sys => (
                  <div key={sys.id} style={{
                    border: `1px solid ${statusColor(sys.status)}44`,
                    background: "rgba(4,8,16,0.8)", padding: 24,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, color: "#fff" }}>{sys.name}</div>
                        <div style={{ fontSize: 10, color: "#4060a0", marginTop: 2 }}>{sys.id.toUpperCase()}</div>
                      </div>
                      <div style={{
                        padding: "3px 10px", fontSize: 10, letterSpacing: 2,
                        border: `1px solid ${statusColor(sys.status)}`,
                        color: statusColor(sys.status),
                      }}>
                        ● {sys.status}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                      {Object.entries(sys).filter(([k]) => !["id", "name", "status", "interlock"].includes(k)).map(([k, v]) => (
                        <div key={k} style={{ background: "rgba(0,136,255,0.05)", padding: 10, border: "1px solid rgba(0,136,255,0.1)" }}>
                          <div style={{ fontSize: 9, color: "#4060a0", letterSpacing: 2 }}>{k.toUpperCase()}</div>
                          <div style={{ fontSize: 16, color: "#a0d0ff", fontWeight: 600 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: sys.interlock ? "#00ff88" : "#ff3344" }}>
                        {sys.interlock ? "🔒 SAFETY INTERLOCK: ACTIVE" : "🔓 SAFETY INTERLOCK: DISABLED"}
                      </div>
                      <button
                        onClick={() => setOtSystems(prev => prev.map(s => s.id === sys.id ? {...s, interlock: !s.interlock, status: s.interlock ? "WARNING" : "NOMINAL"} : s))}
                        style={{
                          padding: "6px 14px", background: "none",
                          border: `1px solid ${sys.interlock ? "#ff3344" : "#00ff88"}`,
                          color: sys.interlock ? "#ff3344" : "#00ff88",
                          cursor: "pointer", fontFamily: "inherit", fontSize: 10, letterSpacing: 1,
                        }}>
                        {sys.interlock ? "SIMULATE DISABLE" : "RE-ENABLE"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, background: "rgba(255,136,0,0.05)", border: "1px solid rgba(255,136,0,0.2)", fontSize: 11, color: "#ffaa44" }}>
                ⚠ This is a virtual OT simulation environment. All system states are simulated for training purposes only. No real industrial systems are connected or affected.
              </div>
            </div>
          )}

          {/* ---- AI TRAINING TAB ---- */}
          {activeTab === "ai_training" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Training controls */}
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 3, color: "#6080a0", marginBottom: 16 }}>5-LAYER MODEL TRAINING STATUS</div>
                  {LAYER_NAMES.map((layer, i) => {
                    const accuracy = [88.2, 91.4, 87.6, 84.9, 99.1][i];
                    return (
                      <div key={layer.id} style={{
                        border: "1px solid rgba(0,120,255,0.2)", padding: 16, marginBottom: 12,
                        background: "rgba(4,8,16,0.6)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div>
                            <span style={{ color: `hsl(${200 + i * 20}, 80%, 60%)`, marginRight: 8 }}>L{layer.id}</span>
                            <span style={{ color: "#c0d0e0", fontSize: 12 }}>{layer.name}</span>
                          </div>
                          <span style={{ color: "#00ff88", fontSize: 13 }}>{accuracy}%</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(0,120,255,0.1)", borderRadius: 2 }}>
                          <div style={{
                            height: "100%", width: `${accuracy}%`,
                            background: `hsl(${200 + i * 20}, 80%, 60%)`, borderRadius: 2,
                          }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#4060a0", marginTop: 6 }}>{layer.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Training log */}
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 3, color: "#6080a0", marginBottom: 16 }}>TRAINING SESSION LOG</div>
                  {trainingLog.length === 0 ? (
                    <div style={{
                      border: "1px dashed rgba(0,120,255,0.2)", padding: 32, textAlign: "center",
                      color: "#2040608", fontSize: 12,
                    }}>
                      Run an attack simulation and click "Train AI Model" to see training updates here
                    </div>
                  ) : trainingLog.map((t, i) => (
                    <div key={i} style={{
                      border: "1px solid rgba(0,255,136,0.2)", padding: 16, marginBottom: 12,
                      background: "rgba(0,255,136,0.03)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "#00ff88" }}>Training Update #{trainingLog.length - i}</div>
                        <div style={{ fontSize: 10, color: "#4060a0" }}>{t.time}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#c0d0e0", marginBottom: 6 }}>{t.model_update}</div>
                      <div style={{ fontSize: 11, color: "#8090a0", marginBottom: 8 }}>{t.training_note}</div>
                      <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                        <span style={{ color: "#0088ff" }}>
                          Threshold L{t.new_threshold.layer}: {t.new_threshold.old} → {t.new_threshold.new}
                        </span>
                        <span style={{ color: t.accuracy_delta > 0 ? "#00ff88" : "#ff3344" }}>
                          {t.accuracy_delta > 0 ? "+" : ""}{t.accuracy_delta}% accuracy
                        </span>
                        <span style={{ color: "#00ff88" }}>Total: {t.total_accuracy}%</span>
                      </div>
                    </div>
                  ))}

                  {/* Model config */}
                  <div style={{ marginTop: 24, border: "1px solid rgba(0,120,255,0.2)", padding: 16, background: "rgba(4,8,16,0.6)" }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: "#6080a0", marginBottom: 12 }}>MODEL CONFIGURATION</div>
                    {[
                      ["Base Model", "Whisper + Custom CNN"],
                      ["Training API", "Anthropic Claude Sonnet 4"],
                      ["Voice DB Size", "1,284 samples"],
                      ["False Positive Rate", "3.2%"],
                      ["False Negative Rate", "2.1%"],
                      ["Inference Latency", "~1.8s"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                        <span style={{ color: "#4060a0" }}>{k}</span>
                        <span style={{ color: "#a0c0e0" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- EVENT LOG TAB ---- */}
          {activeTab === "event_log" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#6080a0" }}>SECURITY EVENT LOG — REAL-TIME</div>
                <button onClick={() => setEventLog([])} style={{
                  padding: "6px 16px", background: "none", border: "1px solid #304060",
                  color: "#6080a0", cursor: "pointer", fontFamily: "inherit", fontSize: 10, letterSpacing: 2,
                }}>CLEAR LOG</button>
              </div>
              <div style={{
                border: "1px solid rgba(0,120,255,0.2)", background: "rgba(4,8,16,0.8)",
                height: 500, overflowY: "auto", fontFamily: "'Courier New', monospace",
              }}>
                {eventLog.length === 0 ? (
                  <div style={{ padding: 24, color: "#2040608", fontSize: 12 }}>No events yet. Run an attack simulation to generate events.</div>
                ) : eventLog.map(e => (
                  <div key={e.id} style={{
                    padding: "8px 16px", borderBottom: "1px solid rgba(0,120,255,0.08)",
                    display: "flex", gap: 12, alignItems: "flex-start",
                    background: e.type === "danger" ? "rgba(255,51,68,0.04)" : e.type === "success" ? "rgba(0,255,136,0.04)" : "transparent",
                  }}>
                    <span style={{ color: "#304060", fontSize: 11, flexShrink: 0 }}>[{e.time}]</span>
                    <span style={{
                      fontSize: 12,
                      color: e.type === "danger" ? "#ff6677" : e.type === "warning" ? "#ffaa44" : e.type === "success" ? "#00ff88" : "#8090a0",
                    }}>{e.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #040810; }
        ::-webkit-scrollbar-thumb { background: #0044aa; }
        button:hover { filter: brightness(1.15); transition: filter 0.15s; }
      `}</style>
    </div>
  );
}
