"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const ADMIN_KEY = "drop-admin-2024";

const SKELETON_CONNECTIONS: [number, number][] = [
  [5, 6],   // left_shoulder - right_shoulder
  [5, 7],   // left_shoulder - left_elbow
  [7, 9],   // left_elbow - left_wrist
  [6, 8],   // right_shoulder - right_elbow
  [8, 10],  // right_elbow - right_wrist
  [5, 11],  // left_shoulder - left_hip
  [6, 12],  // right_shoulder - right_hip
  [11, 12], // left_hip - right_hip
  [11, 13], // left_hip - left_knee
  [13, 15], // left_knee - left_ankle
  [12, 14], // right_hip - right_knee
  [14, 16], // right_knee - right_ankle
];

const KEYPOINT_NAMES = [
  "nose", "left_eye", "right_eye", "left_ear", "right_ear",
  "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_wrist", "right_wrist", "left_hip", "right_hip",
  "left_knee", "right_knee", "left_ankle", "right_ankle",
];

interface SequenceRow {
  id: string;
  exercise_type: string;
  fps: number;
  duration_ms: number;
  frame_count: number;
  reported_count: number;
  created_at: string;
  has_label: boolean;
  keypoints?: number[][];
}

export default function LabelPage() {
  const { loading: authLoading } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [sequences, setSequences] = useState<SequenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SequenceRow | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const storedKey = localStorage.getItem("drop_admin_key");
    if (storedKey === ADMIN_KEY) {
      setAuthorized(true);
    }
  }, [authLoading]);

  const handleKeySubmit = () => {
    if (adminKey === ADMIN_KEY) {
      localStorage.setItem("drop_admin_key", adminKey);
      setAuthorized(true);
    }
  };

  const fetchSequences = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: seqs } = await supabase
      .from("workout_sequences")
      .select("id, exercise_type, fps, duration_ms, frame_count, reported_count, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: labels } = await supabase
      .from("sequence_labels")
      .select("sequence_id");

    const labeledIds = new Set((labels ?? []).map((l: { sequence_id: string }) => l.sequence_id));

    setSequences(
      (seqs ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        exercise_type: s.exercise_type as string,
        fps: s.fps as number,
        duration_ms: s.duration_ms as number,
        frame_count: s.frame_count as number,
        reported_count: s.reported_count as number,
        created_at: s.created_at as string,
        has_label: labeledIds.has(s.id as string),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authorized) fetchSequences();
  }, [authorized, fetchSequences]);

  const handleSelectSequence = async (seq: SequenceRow) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("workout_sequences")
      .select("keypoints")
      .eq("id", seq.id)
      .single();

    if (data) {
      setSelected({ ...seq, keypoints: data.keypoints as number[][] });
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-neutral-500">Loading...</p></div>;
  }

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <h1 className="text-2xl font-black text-white mb-2">ML Label Tool</h1>
        <p className="text-neutral-500 text-sm mb-6">Enter the admin key to access.</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
            placeholder="Admin key..."
            className="flex-1 px-3 py-2 bg-neutral-800 text-white rounded-lg border border-white/5 focus:border-drop-600 focus:outline-none placeholder-neutral-600 text-sm"
          />
          <button onClick={handleKeySubmit} className="px-4 py-2 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-semibold text-sm">
            Enter
          </button>
        </div>
      </div>
    );
  }

  if (selected && selected.keypoints) {
    const seq = selected as SequenceRow & { keypoints: number[][] };
    return (
      <SequenceLabeler
        sequence={seq}
        onBack={() => { setSelected(null); fetchSequences(); }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">ML Label Tool</h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            {loading ? "Loading..." : `${sequences.length} sequences · ${sequences.filter(s => !s.has_label).length} unlabeled`}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/admin" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition">
            Dashboard
          </a>
          <button onClick={fetchSequences} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-6 h-6 border-2 border-drop-600 border-t-transparent rounded-full" />
        </div>
      ) : sequences.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-400 text-lg mb-2">No sequences recorded yet</p>
          <p className="text-neutral-600 text-sm">Complete a workout to start collecting training data.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sequences.map((seq) => (
            <button
              key={seq.id}
              onClick={() => handleSelectSequence(seq)}
              className="w-full drop-card rounded-xl p-4 flex items-center gap-4 hover:bg-neutral-800/50 transition text-left"
            >
              <div className={`w-3 h-3 rounded-full shrink-0 ${seq.has_label ? "bg-green-500" : "bg-yellow-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">
                  {seq.exercise_type} — {seq.reported_count} reps
                </p>
                <p className="text-neutral-500 text-xs">
                  {seq.frame_count} frames · {Math.round(seq.duration_ms / 1000)}s · {seq.fps}fps
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-neutral-400 text-xs">
                  {new Date(seq.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="text-neutral-600 text-[10px]">
                  {seq.has_label ? "Labeled" : "Unlabeled"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stick Figure Replay + Labeling ────────────────────────────

interface SequenceLabelerProps {
  sequence: SequenceRow & { keypoints: number[][] };
  onBack: () => void;
}

function SequenceLabeler({ sequence, onBack }: SequenceLabelerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [repFrames, setRepFrames] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const animRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const totalFrames = sequence.keypoints.length;
  const msPerFrame = 1000 / sequence.fps;

  // Load existing labels if any
  useEffect(() => {
    const loadLabels = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("sequence_labels")
        .select("rep_frames")
        .eq("sequence_id", sequence.id)
        .order("labeled_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.rep_frames) {
        setRepFrames(data.rep_frames as number[]);
      }
    };
    loadLabels();
  }, [sequence.id]);

  // Draw the current frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frame = sequence.keypoints[currentFrame];
    if (!frame) return;

    const W = 640;
    const H = 480;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = "#171717";
    ctx.fillRect(0, 0, W, H);

    // Find bounding box to auto-scale the skeleton
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < 17; i++) {
      const score = frame[i * 3 + 2];
      if (score > 0.2) {
        const x = frame[i * 3];
        const y = frame[i * 3 + 1];
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    // Scale to fit canvas with padding
    const dataW = maxX - minX || 1;
    const dataH = maxY - minY || 1;
    const pad = 60;
    const scaleX = (W - pad * 2) / dataW;
    const scaleY = (H - pad * 2) / dataH;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (W - dataW * scale) / 2 - minX * scale;
    const offsetY = (H - dataH * scale) / 2 - minY * scale;

    const tx = (x: number) => x * scale + offsetX;
    const ty = (y: number) => y * scale + offsetY;

    // Draw skeleton connections
    ctx.lineWidth = 3;
    for (const [a, b] of SKELETON_CONNECTIONS) {
      const scoreA = frame[a * 3 + 2];
      const scoreB = frame[b * 3 + 2];
      if (scoreA > 0.2 && scoreB > 0.2) {
        ctx.strokeStyle = "#dc2626";
        ctx.beginPath();
        ctx.moveTo(tx(frame[a * 3]), ty(frame[a * 3 + 1]));
        ctx.lineTo(tx(frame[b * 3]), ty(frame[b * 3 + 1]));
        ctx.stroke();
      }
    }

    // Draw keypoints
    for (let i = 0; i < 17; i++) {
      const score = frame[i * 3 + 2];
      if (score > 0.2) {
        const x = tx(frame[i * 3]);
        const y = ty(frame[i * 3 + 1]);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = score > 0.5 ? "#ffffff" : "#fca5a5";
        ctx.fill();
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw frame info
    ctx.fillStyle = "#737373";
    ctx.font = "12px monospace";
    ctx.fillText(`Frame ${currentFrame + 1}/${totalFrames}`, 8, 16);
    ctx.fillText(`${sequence.exercise_type} · reported: ${sequence.reported_count} reps`, 8, 32);

    // Indicate if this frame is a labeled rep
    if (repFrames.includes(currentFrame)) {
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`REP #${repFrames.indexOf(currentFrame) + 1}`, W - 100, 24);
    }
  }, [currentFrame, sequence, repFrames, totalFrames]);

  // Playback loop
  useEffect(() => {
    if (!playing) return;

    const step = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= msPerFrame / playbackSpeed) {
        lastFrameTimeRef.current = timestamp;
        setCurrentFrame((prev) => {
          if (prev >= totalFrames - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, playbackSpeed, msPerFrame, totalFrames]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPlaying(false);
        setCurrentFrame((p) => Math.min(totalFrames - 1, p + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        setCurrentFrame((p) => Math.max(0, p - 1));
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        toggleRepMark(currentFrame);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentFrame, totalFrames]);

  const toggleRepMark = (frame: number) => {
    setRepFrames((prev) => {
      if (prev.includes(frame)) {
        return prev.filter((f) => f !== frame).sort((a, b) => a - b);
      }
      return [...prev, frame].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    // Delete existing labels for this sequence
    await supabase
      .from("sequence_labels")
      .delete()
      .eq("sequence_id", sequence.id);

    const { error } = await supabase.from("sequence_labels").insert({
      sequence_id: sequence.id,
      rep_frames: repFrames,
      labeled_by: "admin",
      notes: "",
    });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    onBack();
  };

  const timeAtFrame = (frame: number) => {
    const ms = Math.round((frame / sequence.fps) * 1000);
    const s = Math.floor(ms / 1000);
    const frac = Math.floor((ms % 1000) / 100);
    return `${s}.${frac}s`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-neutral-400 text-sm font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to list
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-drop-600 text-white rounded-lg hover:bg-drop-700 transition font-semibold text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Labels"}
          </button>
          <button
            onClick={handleSaveAndNext}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm disabled:opacity-50"
          >
            Save & Next
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        {/* Canvas + controls */}
        <div>
          <div className="drop-card rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ aspectRatio: "640/480" }}
            />
          </div>

          {/* Timeline scrubber */}
          <div className="mt-3 px-1">
            <div className="relative">
              <input
                type="range"
                min={0}
                max={totalFrames - 1}
                value={currentFrame}
                onChange={(e) => {
                  setPlaying(false);
                  setCurrentFrame(parseInt(e.target.value));
                }}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-drop-600"
              />
              {/* Rep markers on the timeline */}
              {repFrames.map((frame) => (
                <div
                  key={frame}
                  className="absolute top-0 w-1 h-2 bg-green-500 rounded-full pointer-events-none"
                  style={{ left: `${(frame / (totalFrames - 1)) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPlaying(false); setCurrentFrame((p) => Math.max(0, p - 1)); }}
                className="w-8 h-8 rounded-lg bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 text-sm"
              >
                &lt;
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="w-10 h-10 rounded-lg bg-drop-600 text-white flex items-center justify-center hover:bg-drop-700 font-bold"
              >
                {playing ? "||" : "▶"}
              </button>
              <button
                onClick={() => { setPlaying(false); setCurrentFrame((p) => Math.min(totalFrames - 1, p + 1)); }}
                className="w-8 h-8 rounded-lg bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 text-sm"
              >
                &gt;
              </button>
            </div>

            <div className="flex items-center gap-2">
              {[0.25, 0.5, 1, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition ${
                    playbackSpeed === speed
                      ? "bg-drop-600 text-white"
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button
              onClick={() => toggleRepMark(currentFrame)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                repFrames.includes(currentFrame)
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {repFrames.includes(currentFrame) ? "Unmark Rep (R)" : "Mark Rep (R)"}
            </button>
          </div>

          {/* Keyboard shortcuts legend */}
          <div className="mt-3 text-neutral-600 text-[10px] flex gap-4">
            <span>Space: play/pause</span>
            <span>Arrow keys: step frames</span>
            <span>R: mark/unmark rep</span>
          </div>
        </div>

        {/* Right panel: info + labeled reps */}
        <div className="space-y-4">
          <div className="drop-card rounded-xl p-4">
            <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Session Info</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Exercise</span>
                <span className="text-white font-medium">{sequence.exercise_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Reported reps</span>
                <span className="text-white font-medium">{sequence.reported_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Duration</span>
                <span className="text-white font-medium">{Math.round(sequence.duration_ms / 1000)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Frames</span>
                <span className="text-white font-medium">{totalFrames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">FPS</span>
                <span className="text-white font-medium">{sequence.fps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Current</span>
                <span className="text-white font-mono text-xs">{timeAtFrame(currentFrame)}</span>
              </div>
            </div>
          </div>

          <div className="drop-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-neutral-500 text-xs uppercase tracking-wider">Labeled Reps</p>
              <span className={`text-sm font-bold ${repFrames.length === sequence.reported_count ? "text-green-400" : "text-yellow-400"}`}>
                {repFrames.length}/{sequence.reported_count}
              </span>
            </div>

            {repFrames.length === 0 ? (
              <p className="text-neutral-600 text-xs">No reps marked yet. Play the sequence and press R at the bottom of each rep.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {repFrames.map((frame, i) => (
                  <div
                    key={frame}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-neutral-800/50 cursor-pointer group"
                    onClick={() => { setPlaying(false); setCurrentFrame(frame); }}
                  >
                    <span className="text-white text-sm font-medium">Rep {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 text-xs font-mono">{timeAtFrame(frame)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleRepMark(frame); }}
                        className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs"
                      >
                        remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Keypoint visibility for current frame */}
          <div className="drop-card rounded-xl p-4">
            <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Keypoint Confidence</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {KEYPOINT_NAMES.map((name, i) => {
                const frame = sequence.keypoints[currentFrame];
                const score = frame ? frame[i * 3 + 2] : 0;
                return (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${score > 0.5 ? "bg-green-500" : score > 0.2 ? "bg-yellow-500" : "bg-red-500"}`} />
                    <span className="text-neutral-500 text-[10px] truncate">{name.replace(/_/g, " ")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
