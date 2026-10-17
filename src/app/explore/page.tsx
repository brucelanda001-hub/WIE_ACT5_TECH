"use client";
import Link from "next/link";

export default function ExploreSubjects() {
  const subjects = [
    { title: "Math Mastery", tag: "Grade 4 • Numbers", desc: "12 practice quests ready with geometry & algebra puzzles.", color: "bg-blue-600", iconColor: "text-blue-600", iconBg: "bg-blue-100", shadow: "shadow-[0_3px_0_#00419C]", level: "Level 4", icon: "functions" },
    { title: "Curious Science", tag: "Lab & Nature", desc: "Explore volcanoes, ecosystems, and simple machines.", color: "bg-green-600", iconColor: "text-green-700", iconBg: "bg-green-100", shadow: "shadow-[0_3px_0_#21833F]", level: "Level 6", icon: "science" },
    { title: "Story & Words", tag: "Language Arts", desc: "Vocabulary builders, reading games, and creative stories.", color: "bg-pink-600", iconColor: "text-pink-600", iconBg: "bg-pink-100", shadow: "shadow-[0_3px_0_#8E004C]", level: "Level 3", icon: "auto_stories" },
    { title: "Cosmic World", tag: "Space Exploration", desc: "Solar system journeys, deep constellations, and space rovers.", color: "bg-yellow-500", iconColor: "text-yellow-700", iconBg: "bg-yellow-100", shadow: "shadow-[0_3px_0_#574500]", level: "Level 5", icon: "rocket_launch" },
    { title: "Time Travelers", tag: "World History", desc: "Ancient Egypt pyramids, castle builders, & inventions.", color: "bg-gray-500", iconColor: "text-gray-700", iconBg: "bg-gray-200", shadow: "shadow-[0_3px_0_#424654]", level: "Level 2", icon: "explore" },
  ];

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
            <Link href="/parent" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Parent Insights</Link>
          </nav>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 bg-[#ffd9e3] text-[#3e001e] px-3 py-1 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[#af2464] text-[20px]">local_fire_department</span>
              <span className="text-xs font-bold">5 Day Streak</span>
            </div>
            <div className="flex items-center gap-1 bg-[#ffe087] text-[#231a00] px-3 py-1 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[#735c00] text-[20px]">monetization_on</span>
              <span className="text-xs font-bold">240 Coins</span>
            </div>
            <div className="flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">A</div>
              <span className="text-sm font-bold text-gray-800">Alex</span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="w-full mt-4 mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Explore Your Subjects</h1>
        <p className="text-lg text-gray-500 mt-2">Jump right into bite-sized missions and unlock badges.</p>
      </section>

      {/* SUBJECTS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        import Link from "next/link";
// ...
{subjects.map((sub, i) => (
  <Link 
    key={i} 
    href={`/?subject=${encodeURIComponent(sub.title.split(" ")[0])}`} 
    className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
  >
    <div className={`w-full h-2 rounded-full ${sub.color} mb-4`}></div>
    <div>
      <div className={`w-14 h-14 rounded-full ${sub.iconBg} flex items-center justify-center ${sub.iconColor} mb-4 ${sub.shadow}`}>
        <span className="material-symbols-outlined text-[30px]">{sub.icon}</span>
      </div>
      <span className={`text-xs font-bold uppercase ${sub.iconColor}`}>{sub.tag}</span>
      <h3 className="text-2xl font-bold text-gray-800 mt-1">{sub.title}</h3>
      <p className="text-sm text-gray-500 mt-2">{sub.desc}</p>
    </div>
    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
      <span className={`text-sm font-bold ${sub.iconColor}`}>{sub.level}</span>
      <span className={`w-8 h-8 rounded-full ${sub.iconBg} flex items-center justify-center ${sub.iconColor} group-hover:translate-x-1 transition-transform`}>
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </span>
    </div>
  </Link>
))}
      </section>

    </main>
  );
}