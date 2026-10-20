"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  HeartHandshake, 
  Moon, 
  Sparkles,
  Calendar as CalendarIcon,
  LogOut,
  Loader2,
  Sun,
  Bell,
  BellRing,
  PenLine,
  Save,
  Check
} from "lucide-react";

interface DailyLog {
  date: string;
  created_at?: string;
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

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateStreak = (dates: string[], today = new Date()) => {
  const loggedDates = new Set(dates);
  const todayString = getLocalDateString(today);
  let currentDate = todayString;

  if (!loggedDates.has(currentDate)) {
    const yesterday = new Date(`${todayString}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    currentDate = yesterday.toISOString().slice(0, 10);
  }

  if (!loggedDates.has(currentDate)) return 0;

  let streak = 0;
  while (loggedDates.has(currentDate)) {
    streak += 1;
    const previousDate = new Date(`${currentDate}T00:00:00Z`);
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    currentDate = previousDate.toISOString().slice(0, 10);
  }

  return streak;
};

const dailyQuotes = [
  {
    text: "Sesungguhnya bersama kesulitan ada kemudahan.",
    source: "QS. Al-Insyirah: 5–6",
    url: "https://quran.com/94/5-6?translations=33",
  },
  {
    text: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.",
    source: "QS. Al-Baqarah: 286",
    url: "https://quran.com/2/286?translations=33",
  },
  {
    text: "Jika kamu bersyukur, niscaya Aku akan menambah (nikmat) kepadamu.",
    source: "QS. Ibrahim: 7",
    url: "https://quran.com/14/7?translations=33",
  },
  {
    text: "Janganlah kamu bersikap lemah dan jangan pula bersedih hati.",
    source: "QS. Ali 'Imran: 139",
    url: "https://quran.com/3/139?translations=33",
  },
  {
    text: "Mohonlah pertolongan dengan sabar dan salat. Sesungguhnya Allah beserta orang-orang yang sabar.",
    source: "QS. Al-Baqarah: 153",
    url: "https://quran.com/2/153?translations=33",
  },
  {
    text: "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.",
    source: "QS. Ar-Ra'd: 28",
    url: "https://quran.com/13/28?translations=33",
  },
  {
    text: "Janganlah berputus asa dari rahmat Allah.",
    source: "QS. Az-Zumar: 53",
    url: "https://quran.com/39/53?translations=33",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [dailyQuoteIndex, setDailyQuoteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);

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
  const dailyQuote = dailyQuotes[dailyQuoteIndex];

  useEffect(() => {
    let midnightTimer: number | undefined;

    const updateQuote = () => {
      const now = new Date();
      const dateKey = getLocalDateString(now);
      const dateSeed = Number(dateKey.replaceAll("-", ""));
      setDailyQuoteIndex(dateSeed % dailyQuotes.length);

      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      midnightTimer = window.setTimeout(
        updateQuote,
        nextMidnight.getTime() - now.getTime()
      );
    };

    const initialTimer = window.setTimeout(updateQuote, 0);
    return () => {
      window.clearTimeout(initialTimer);
      if (midnightTimer !== undefined) {
        window.clearTimeout(midnightTimer);
      }
    };
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    const checkUserSession = async () => {
      let redirectingToLogin = false;
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          if (sessionError) {
            console.error("Sesi Supabase tidak valid:", sessionError);
          }
          redirectingToLogin = true;
          try {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) {
              console.error("Gagal membersihkan sesi Supabase:", signOutError);
            }
          } catch (signOutError) {
            console.error("Gagal membersihkan sesi Supabase:", signOutError);
          } finally {
            if (isMounted) {
              window.location.href = "/login";
            }
          }
          return;
        }

        const { user } = session;
        setUserId(user.id);
        setUserEmail(user.email ?? null);

        const todayStr = getLocalDateString(new Date());

        const [todayResult, historyResult] = await Promise.all([
          supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", user.id)
            .eq("date", todayStr)
            .maybeSingle(),
          supabase
            .from("daily_logs")
            .select("date")
            .eq("user_id", user.id)
            .order("date", { ascending: false }),
        ]);

        if (todayResult.error) throw todayResult.error;
        if (historyResult.error) throw historyResult.error;

        if (!isMounted) return;

        const dates = (historyResult.data ?? []).map((entry) => entry.date);
        setHistoryDates(dates);
        setStreakCount(calculateStreak(dates));

        if (todayResult.data) {
          const log = todayResult.data as DailyLog;
          setHabits({
            subuh: log.subuh || false,
            dzuhur: log.dzuhur || false,
            ashar: log.ashar || false,
            maghrib: log.maghrib || false,
            isya: log.isya || false,
            tilawah: log.tilawah || false,
            dzikir: log.dzikir || false,
            sedekah: log.sedekah || false,
          });
          setTilawahPages(log.tilawah_pages || 0);
          setReflection(log.reflection || "");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat memuat aktivitas hari ini."
          );
        }
      } finally {
        if (isMounted && !redirectingToLogin) setLoading(false);
      }
    };

    void checkUserSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setSaveSuccess(false);
    const todayStr = getLocalDateString(new Date());

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
      const updatedDates = [...new Set([...historyDates, todayStr])];
      setHistoryDates(updatedDates);
      setStreakCount(calculateStreak(updatedDates));
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Gagal keluar: " + error.message);
      return;
    }

    router.push("/login");
  };

  const completedCount = Object.values(habits).filter(Boolean).length;
  const totalHabits = Object.keys(habits).length;
  const progressPercentage = Math.round((completedCount / totalHabits) * 100);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center gap-2 ${darkMode ? "bg-slate-900 text-emerald-400" : "bg-slate-50 text-emerald-700"}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="font-semibold text-sm">Memuat data ibadah...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div role="alert" className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-red-700">Gagal memuat aktivitas hari ini.</p>
          <p className="mt-2 text-sm text-slate-600">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-28 ${darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      <header className={`${darkMode ? "bg-slate-800 border-b border-slate-700" : "bg-emerald-700"} text-white p-6 shadow-md transition-colors`}>
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Moon className="h-6 w-6 text-emerald-300" />
              Mutaba&apos;ah Digital
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Pantau & tingkatkan kualitas ibadah harianmu
            </p>
            {userEmail && (
              <p className="text-emerald-100 text-xs mt-1 truncate">
                Login sebagai: {userEmail}
              </p>
            )}
            <div
              aria-label={`Streak ${streakCount} hari`}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200/40 bg-amber-400/20 px-3 py-2 text-amber-100 shadow-sm"
            >
              <span aria-hidden="true" className="text-xl">🔥</span>
              <span className="text-sm font-bold">
                {streakCount} hari streak
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
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
              className="flex items-center gap-2 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 rounded-xl text-emerald-100 transition"
              title="Keluar"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-semibold">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        <div className="rounded-2xl border border-emerald-700/30 bg-gradient-to-r from-emerald-800 to-teal-700 p-5 text-white shadow-lg sm:p-6">
          <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/15 p-3 text-emerald-100">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Quotes Harian
            </span>
            <p className="mt-2 text-base font-medium italic leading-relaxed sm:text-lg">
              “{dailyQuote.text}”
            </p>
            <a
              href={dailyQuote.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-xs font-semibold text-emerald-100 underline decoration-emerald-200/60 underline-offset-4 hover:text-white"
            >
              Sumber: {dailyQuote.source} · Baca ayat
            </a>
          </div>
          </div>
        </div>

        <Link
          href="/riwayat"
          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
        >
          <span aria-hidden="true">📜</span>
          Lihat Riwayat Ibadah
        </Link>

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
                          className={`w-16 px-2 py-1 border rounded-lg text-base text-center font-bold outline-none ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`}
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
            className={`w-full p-3 rounded-xl border text-base outline-none transition ${darkMode ? "bg-slate-900 border-slate-700 focus:border-emerald-500 text-slate-200" : "bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-800"}`}
          />
        </div>

      </main>

      <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-30">
        <button
          onClick={handleSave}
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