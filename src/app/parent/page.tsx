"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ParentDashboard() {
  const [openSession, setOpenSession] = useState<number | null>(null);
  const [audioToggle, setAudioToggle] = useState(true);
  const [emailToggle, setEmailToggle] = useState(true);
  const [timeLimit, setTimeLimit] = useState(45);
  
  // Fetching dynamic data from the API
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then((data) => setInsights(data))
      .catch((err) => console.error("Failed to load insights", err));
  }, []);

  return (
    <main className="w-full pt-20 bg-[#f8f9ff] flex-1 max-w-[1280px] mx-auto px-6">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-xl shadow-[0_4px_20px_rgba(39,50,64,0.06)]">
        <div className="h-20 max-w-[1280px] mx-auto px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">E</div>
            <span className="text-xl text-blue-600 tracking-tight font-extrabold">EdNova</span>
          </div>
          <nav className="hidden lg:flex items-center bg-[#eef4ff] p-1 rounded-full gap-1">
            <Link href="/dashboard" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Dashboard</Link>
            <Link href="/" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Ask EdNova</Link>
            <Link href="/companions" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">My Companions</Link>
            <Link href="/parent" className="px-4 py-2 rounded-full text-sm font-bold bg-blue-600 text-white shadow-[0_3px_0_#00419c]">Parent Insights</Link>
            <Link href="/explore" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Explore Subjects</Link>
          </nav>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all" title="Parent Corner">
              <span className="material-symbols-outlined text-[20px] text-gray-600">verified_user</span>
            </button>
            <div className="flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">A</div>
              <span className="text-sm font-bold text-gray-800">Alex</span>
            </div>
          </div>
        </div>
      </header>

      {/* TOP BANNER */}
      <div className="w-full bg-[#dee9fc] rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm mt-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-800">Parent Corner & Insights</span>
              <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-0.5 rounded-full">Private Adult View</span>
            </div>
            <p className="text-sm text-gray-600">Review learning curiosity, set safe boundaries, and celebrate Alex's discoveries.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Link href="/dashboard" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-[0_4px_0_#00419c] active:translate-y-1 transition-all text-sm font-bold">
            <span className="material-symbols-outlined text-[18px]">child_care</span>
            <span>Return to Learner Mode</span>
          </Link>
        </div>
      </div>

      {/* WEEKLY TARGET */}
      <div className="w-full bg-white rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ffe087] text-[#735c00] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">flag</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-gray-800">Weekly Discovery Target</span>
              <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">85% Achieved</span>
            </div>
            <p className="text-sm text-gray-500">Last session active: Today, 10:18 AM • Volcanoes & Magma</p>
          </div>
        </div>
        <div className="flex-1 max-w-md flex flex-col gap-1">
          <div className="flex justify-between text-xs font-bold text-gray-500">
            <span>Target: 4.5 hours / week</span>
            <span className="text-blue-600">3h 45m / 4h 30m</span>
          </div>
          <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: "85%" }}></div>
          </div>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">schedule</span>
              </span>
              <span className="flex items-center text-blue-600 text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +25%
              </span>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time This Week</span>
            <div className="text-4xl font-extrabold text-gray-800 leading-tight mt-1">{insights?.stats?.timeSpent || "3h 45m"}</div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Healthy daily pacing. Peak session length: 22 mins.</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">psychology_alt</span>
              </span>
              <span className="text-pink-600 text-xs font-bold bg-pink-50 px-2 py-0.5 rounded-full">4 Subjects</span>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inquiries & Solves</span>
            <div className="text-4xl font-extrabold text-gray-800 leading-tight mt-1">{insights?.stats?.questionsAsked || 42} Qs</div>
          </div>
          <p className="text-xs text-gray-500 mt-4">High inquiry velocity. 92% solved with guided step hints.</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">menu_book</span>
              </span>
              <span className="text-yellow-700 text-xs font-bold bg-yellow-50 px-2 py-0.5 rounded-full">New Mastery</span>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vocabulary & Rules</span>
            <div className="text-4xl font-extrabold text-gray-800 leading-tight mt-1">{insights?.stats?.conceptsMastered || 18} Items</div>
          </div>
          <div className="flex flex-wrap gap-1 mt-4">
            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">Photosynthesis</span>
            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">Fractions</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-full bg-gray-100 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">savings</span>
              </span>
              <span className="text-yellow-700 text-xs font-bold bg-yellow-50 px-2 py-0.5 rounded-full">Saver Trait</span>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Earned & Saved</span>
            <div className="text-4xl font-extrabold text-gray-800 leading-tight mt-1">{insights?.stats?.coinsEarned || 240} Coins</div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Saving up for <strong>Barnaby the Owl</strong> companion (Goal: 300).</p>
        </div>
      </div>

      {/* SECTION 2: Breakdown & Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Cognitive Footprint</span>
              <h2 className="text-2xl font-bold text-gray-800">Subject-Level Curiosity Breakdown</h2>
            </div>
          </div>
          <p className="text-sm text-gray-500">Alex has gravitated toward Earth sciences this week following a natural curiosity about rock formations.</p>
          
          <div className="flex flex-col gap-4 mt-2">
            {insights?.breakdown ? insights.breakdown.map((item: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm font-bold mb-1">
                  <span className="flex items-center gap-2 text-gray-800"><span className={`w-3 h-3 rounded-full ${item.color}`}></span> {item.subject}</span>
                  <span className="text-gray-600">{item.percentage}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500">Loading breakdown...</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">shield_lock</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">EdNova Safety & Guardrails</h3>
                <p className="text-sm text-gray-500">Active protection filter for 4th-grade comprehension.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>100% Child-Safe Filtered Responses</span>
              </div>
              <p className="text-xs text-gray-500 pl-6">All dynamic AI prompts are sandboxed to neutral, age-graded pedagogy vetted by specialists.</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-gray-500">Language Difficulty Level</span>
              <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">Lexile 650L–800L</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl shrink-0 shadow-inner">🐘</div>
            <div>
              <span className="text-xs font-bold text-pink-600 uppercase">Companion Feedback</span>
              <h4 className="text-lg font-bold text-gray-800 leading-snug">Barnaby the Elephant</h4>
              <p className="text-sm text-gray-500 mt-1">"Alex asks really great 'why' questions and always checks twice before moving past fractions!"</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Recent Sessions */}
      <div className="w-full bg-white rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Chronological Feed</span>
            <h2 className="text-2xl font-bold text-gray-800">Recent Learning Sessions</h2>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-xl p-4 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">volcano</span>
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-800">Volcanoes & Magma</span>
                    <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">Science</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Today, 10:14 AM — Discovered the difference between magma and lava.</p>
                </div>
              </div>
              <button 
                onClick={() => setOpenSession(openSession === 1 ? null : 1)}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm hover:bg-gray-100 transition-all self-start md:self-auto"
              >
                <span>{openSession === 1 ? "Hide Transcript" : "Review Conversation"}</span>
                <span className="material-symbols-outlined text-[18px]">{openSession === 1 ? "expand_less" : "expand_more"}</span>
              </button>
            </div>
            
            {openSession === 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">A</span>
                  <div className="bg-white rounded-lg p-3 max-w-xl shadow-sm">
                    <p className="text-sm text-gray-800 font-semibold">Alex: "Is magma hotter than pizza oven fire?"</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 pl-4">
                  <span className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">E</span>
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xl shadow-sm">
                    <p className="text-sm text-gray-800"><strong>EdNova:</strong> "Yes, Alex! Magma can reach 1,300°F—way hotter than a pizza oven! But rock melts slowly like thick butter."</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">calculate</span>
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-800">Dividing Fractions</span>
                    <span className="bg-pink-200 text-pink-800 text-xs font-bold px-2 py-0.5 rounded">Math</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Yesterday, 4:20 PM — Answered 11 of 12 practice questions correctly.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400 self-start md:self-auto px-2">Archived</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Parental Controls */}
      <div className="w-full bg-white rounded-2xl p-6 shadow-sm mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">tune</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Parental Controls & Healthy Balance</h2>
            <p className="text-sm text-gray-500">Calibrate learning limits and feedback preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">Daily Pacing Limit</span>
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{timeLimit} Mins</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Gentle pause prompt when session reaches target.</p>
            </div>
            <input 
              type="range" min="20" max="90" step="5" 
              value={timeLimit} 
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer" 
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">Audio Celebration</span>
                <span className="text-pink-600 text-xs font-bold bg-pink-100 px-2 py-0.5 rounded-full">Enabled</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Plays cheerful trumpet chimes when solving difficult questions.</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-bold">Audio Cues</span>
              <button onClick={() => setAudioToggle(!audioToggle)} className={`w-11 h-6 rounded-full transition-colors relative ${audioToggle ? "bg-pink-500" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${audioToggle ? "translate-x-5" : "translate-x-0"}`}></span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">Weekly Digest</span>
                <span className="text-yellow-700 text-xs font-bold bg-yellow-100 px-2 py-0.5 rounded-full">Every Sunday</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Sends learning topics and dinner-table discussion prompts to parent email.</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-bold">Email Delivery</span>
              <button onClick={() => setEmailToggle(!emailToggle)} className={`w-11 h-6 rounded-full transition-colors relative ${emailToggle ? "bg-blue-600" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${emailToggle ? "translate-x-5" : "translate-x-0"}`}></span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span className="material-symbols-outlined text-[18px] text-yellow-600">lock</span>
            <span>Settings apply instantly across Alex's logged-in devices.</span>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-[0_4px_0_#00419c] active:translate-y-1 transition-all text-sm w-full sm:w-auto">
            Save Preferences
          </button>
        </div>
      </div>

    </main>
  );
}