"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  BookOpen, 
  HeartHandshake, 
  Moon, 
  Sparkles,
  Calendar as CalendarIcon,
  LogOut,
  Loader2,
  History,
  TrendingUp,
  Sun,
  Bell,
  BellRing,
  PenLine,
  Save,
  Check
} from "lucide-react";

interface DailyLog {
  date: string;
  subuh: boolean;
  dzuhur: boolean;
  ashar: boolean;
  maghrib: boolean;
  isya: boolean;
  tilawah: boolean;
  dzikir: boolean;
  sedekah: boolean;
  tilawah_pages?: number;
  reflection?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);

  // State Dark Mode
  const [darkMode, setDarkMode] = useState(false);

  // State Notifikasi
  const [notifEnabled, setNotifEnabled] = useState(false);

  // State amalan harian
  const [habits, setHabits] = useState({
    subuh: false,
    dzuhur: false,
    ashar: false,
    maghrib: false,
    isya: false,
    tilawah: false,
    dzikir: false,
    sedekah: false,
  });

  const [tilawahPages, setTilawahPages] = useState<number>(0);
  const [reflection, setReflection] = useState<string>("");

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem("theme", nextMode ? "dark" : "light");
  };

  const requestNotif = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotifEnabled(true);
        new Notification("Mutaba'ah Digital", {
          body: "Pengingat amalan harian berhasil diaktifkan!",
          icon: "/favicon.ico",
        });
      }
    }
  };

  const calculateStreak = (logs: DailyLog[]) => {
    let currentStreak = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let checkDate = new Date();
    
    const todayLog = sortedLogs.find((l) => l.date === todayStr);
    const hasTodayActivity = todayLog && Object.entries(todayLog).some(([key, val]) => key !== "date" && val === true);

    if (!hasTodayActivity) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const logFound = sortedLogs.find((l) => l.date === dateStr);

      if (logFound) {
        const isFilled = Object.entries(logFound).some(([key, val]) => key !== "date" && val === true);
        if (isFilled) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      const todayStr = new Date().toISOString().split("T")[0];

      const { data: allLogs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id);

      if (allLogs) {
        setHistoryLogs(allLogs as DailyLog[]);
        calculateStreak(allLogs as DailyLog[]);

        const todayData = allLogs.find((log) => log.date === todayStr);
        if (todayData) {
          setHabits({
            subuh: todayData.subuh || false,
            dzuhur: todayData.dzuhur || false,
            ashar: todayData.ashar || false,
            maghrib: todayData.maghrib || false,
            isya: todayData.isya || false,
            tilawah: todayData.tilawah || false,
            dzikir: todayData.dzikir || false,
            sedekah: todayData.sedekah || false,
          });
          setTilawahPages(todayData.tilawah_pages || 0);
          setReflection(todayData.reflection || "");
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const saveToSupabase = async () => {
    if (!userId) return;

    setSaving(true);
    setSaveSuccess(false);
    const todayStr = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("daily_logs").upsert(
      {
        user_id: userId,
        date: todayStr,
        ...habits,
        tilawah_pages: tilawahPages,
        reflection: reflection,
      },
      { onConflict: "user_id,date" }
    );

    if (!error) {
      const { data: updatedLogs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId);

      if (updatedLogs) {
        setHistoryLogs(updatedLogs as DailyLog[]);
        calculateStreak(updatedLogs as DailyLog[]);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert("Gagal menyimpan data: " + error.message);
    }

    setSaving(false);
  };

  const toggleHabit = (key: keyof typeof habits) => {
    const newHabits = { ...habits, [key]: !habits[key] };
    setHabits(newHabits);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const completedCount = Object.values(habits).filter(Boolean).length;
  const totalHabits = Object.keys(habits).length;
  const progressPercentage = Math.round((completedCount / totalHabits) * 100);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
      const dayNumber = d.getDate();

      const log = historyLogs.find((l) => l.date === dateStr);
      let count = 0;
      if (log) {
        count = Object.entries(log).filter(([k, v]) => k !== "date" && k !== "tilawah_pages" && k !== "reflection" && v === true).length;
      }

      days.push({
        dateStr,
        dayName,
        dayNumber,
        count,
        percentage: Math.round((count / 8) * 100),
      });
    }
    return days;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center gap-2 ${darkMode ? "bg-slate-900 text-emerald-400" : "bg-slate-50 text-emerald-700"}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="font-semibold text-sm">Memuat data ibadah...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-28 ${darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      <header className={`${darkMode ? "bg-slate-800 border-b border-slate-700" : "bg-emerald-700"} text-white p-6 shadow-md transition-colors`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Moon className="h-6 w-6 text-emerald-300" />
              Mutaba'ah Digital
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Pantau & tingkatkan kualitas ibadah harianmu
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-emerald-800/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-amber-300 font-bold border border-emerald-600/80 text-xs sm:text-sm">
              <Flame className="h-4 w-4 fill-amber-400 text-amber-400 animate-pulse" />
              <span>{streak} Hari</span>
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 transition"
              title="Ganti Tema"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5 text-emerald-100" />}
            </button>

            <button
              onClick={requestNotif}
              className={`p-2 rounded-xl transition ${notifEnabled ? "bg-amber-500 text-slate-900" : "bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100"}`}
              title="Aktifkan Notifikasi"
            >
              {notifEnabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-emerald-800 hover:bg-emerald-900 rounded-xl text-emerald-100 transition"
              title="Keluar"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        <div className={`border rounded-2xl p-5 shadow-sm flex items-start gap-4 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"}`}>
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-500 uppercase">
              Quote Motivasi
            </span>
            <p className="font-medium mt-1 italic">
              "Amalan yang paling dicintai oleh Allah adalah amalan yang kontinyu (istiqomah) walaupun sedikit."
            </p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              — HR. Muslim
            </p>
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-200/20">
            <h3 className="text-md font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-500" />
              Riwayat 7 Hari Terakhir
            </h3>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Konsistensi
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {getLast7Days().map((day, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center p-3 rounded-xl border transition ${
                  day.count > 0
                    ? darkMode ? "bg-slate-700/60 border-emerald-500/40" : "bg-emerald-50/60 border-emerald-200"
                    : darkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <span className="text-xs font-medium text-slate-400">{day.dayName}</span>
                <span className="text-sm font-bold my-1">{day.dayNumber}</span>
                <div className="w-full bg-slate-200/20 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${day.percentage}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500 mt-1">
                  {day.count}/8
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-lg font-bold">Capaian Hari Ini</h2>
              <p className="text-sm text-slate-400">
                {completedCount} dari {totalHabits} amalan selesai
              </p>
            </div>
            <span className="text-2xl font-black text-emerald-500">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200/20 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <h3 className="text-md font-bold flex items-center gap-2 border-b pb-3 border-slate-200/20">
            <CalendarIcon className="h-5 w-5 text-emerald-500" />
            Sholat Wajib 5 Waktu
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { id: "subuh", label: "Subuh" },
              { id: "dzuhur", label: "Dzuhur" },
              { id: "ashar", label: "Ashar" },
              { id: "maghrib", label: "Maghrib" },
              { id: "isya", label: "Isya" },
            ].map((sholat) => {
              const isDone = habits[sholat.id as keyof typeof habits];
              return (
                <button
                  key={sholat.id}
                  onClick={() => toggleHabit(sholat.id as keyof typeof habits)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    isDone
                      ? darkMode ? "bg-emerald-950/60 border-emerald-500 text-emerald-400 font-bold" : "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold"
                      : darkMode ? "bg-slate-700/30 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                  ) : (
                    <Circle className="h-6 w-6 text-slate-400 mb-1" />
                  )}
                  <span>{sholat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <h3 className="text-md font-bold border-b pb-3 border-slate-200/20">
            Amalan Harian Tambahan
          </h3>
          <div className="space-y-3">
            {[
              {
                id: "tilawah",
                label: "Tilawah Al-Qur'an",
                desc: "Minimal 1 Lembar / Halaman",
                icon: BookOpen,
              },
              {
                id: "dzikir",
                label: "Dzikir Pagi / Petang",
                desc: "Mengingat Allah di waktu pagi & petang",
                icon: Moon,
              },
              {
                id: "sedekah",
                label: "Sedekah Harian",
                desc: "Berbagi kebaikan meski sedikit",
                icon: HeartHandshake,
              },
            ].map((item) => {
              const isDone = habits[item.id as keyof typeof habits];
              const Icon = item.icon;
              return (
                <div key={item.id} className="space-y-2">
                  <div
                    onClick={() => toggleHabit(item.id as keyof typeof habits)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isDone
                        ? darkMode ? "bg-emerald-950/60 border-emerald-500" : "bg-emerald-50 border-emerald-500 text-emerald-900"
                        : darkMode ? "bg-slate-700/30 border-slate-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-200/20 text-slate-400"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    {isDone ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-slate-400" />}
                  </div>

                  {item.id === "tilawah" && isDone && (
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ml-4 ${darkMode ? "bg-slate-700/40 border-slate-700" : "bg-emerald-50/40 border-emerald-200"}`}>
                      <span className="font-semibold text-emerald-500">Jumlah Halaman Dibaca Hari Ini:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={tilawahPages}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setTilawahPages(val);
                          }}
                          className={`w-16 px-2 py-1 border rounded-lg text-center font-bold outline-none ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`}
                        />
                        <span>Halaman</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border space-y-3 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <h3 className="text-md font-bold flex items-center gap-2 border-b pb-3 border-slate-200/20">
            <PenLine className="h-5 w-5 text-emerald-500" />
            Catatan Refleksi Diri (Muhasabah)
          </h3>
          <p className="text-xs text-slate-400">
            Tuliskan kebaikan yang kamu lakukan, rasa syukur, atau evaluasi diri hari ini.
          </p>
          <textarea
            rows={3}
            placeholder="Contoh: Hari ini merasa tenang setelah dzikir, besok harus lebih tepat waktu sholat Dzuhur..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className={`w-full p-3 rounded-xl border text-sm outline-none transition ${darkMode ? "bg-slate-900 border-slate-700 focus:border-emerald-500 text-slate-200" : "bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-800"}`}
          />
        </div>
      </main>

      <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-30">
        <button
          onClick={saveToSupabase}
          disabled={saving}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all duration-300 text-white ${
            saveSuccess
              ? "bg-teal-600 ring-4 ring-teal-300/50 scale-[1.01]"
              : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Menyimpan Aktivitas Hari Ini...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-5 w-5 text-white" />
              <span>✓ Berhasil Disimpan Ke Supabase!</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Simpan Aktivitas Hari Ini</span>
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-40 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            darkMode
              ? "bg-emerald-950 border-emerald-700 text-emerald-100"
              : "bg-white border-emerald-200 text-emerald-800"
          }`}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span className="text-sm font-semibold">
            Data amalan berhasil disimpan!
          </span>
        </div>
      )}
    </div>
  );
}