"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, Loader2, Moon, PenLine } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DailyLog {
  date: string;
  created_at: string;
  tilawah_pages: number | null;
  reflection: string | null;
  subuh: boolean;
  dzuhur: boolean;
  ashar: boolean;
  maghrib: boolean;
  isya: boolean;
  tilawah: boolean;
  dzikir: boolean;
  sedekah: boolean;
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function HistoryPage() {
  const router = useRouter();
  const [yesterdayLog, setYesterdayLog] = useState<DailyLog | null>(null);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [yesterdayDate, setYesterdayDate] = useState("");

  useEffect(() => {
    let active = true;

    const fetchHistory = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (!user) {
          router.push("/login");
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = getLocalDateString(yesterday);
        if (active) setYesterdayDate(yesterdayKey);

        const [yesterdayResult, historyResult] = await Promise.all([
          supabase
            .from("daily_logs")
            .select("date, created_at, tilawah_pages, reflection, subuh, dzuhur, ashar, maghrib, isya, tilawah, dzikir, sedekah")
            .eq("user_id", user.id)
            .eq("date", yesterdayKey)
            .maybeSingle(),
          supabase
            .from("daily_logs")
            .select("date, created_at, tilawah_pages, reflection, subuh, dzuhur, ashar, maghrib, isya, tilawah, dzikir, sedekah")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(7),
        ]);

        if (yesterdayResult.error) throw yesterdayResult.error;
        if (historyResult.error) throw historyResult.error;

        if (active) {
          setYesterdayLog(yesterdayResult.data as DailyLog | null);
          setHistory((historyResult.data ?? []) as DailyLog[]);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat memuat riwayat ibadah."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchHistory();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:py-10">
      <main className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Utama
        </Link>

        <header className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Moon className="h-7 w-7 text-emerald-200" />
            <div>
              <p className="text-sm text-emerald-100">Mutaba&apos;ah Digital</p>
              <h1 className="text-2xl font-bold">Riwayat Ibadah</h1>
            </div>
          </div>
        </header>

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Gagal memuat riwayat: {errorMessage}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-emerald-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Memuat riwayat ibadah...</span>
          </div>
        ) : !errorMessage ? (
          <>
            <section className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalendarDays className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="font-bold">Rapor Kemarin</h2>
                  {yesterdayDate && (
                    <p className="text-xs text-slate-500">{formatDate(yesterdayDate)}</p>
                  )}
                </div>
              </div>

              {yesterdayLog ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-emerald-700">
                      <BookOpen className="h-4 w-4" />
                      <h3 className="text-sm font-semibold">Tilawah</h3>
                    </div>
                    <p className="text-2xl font-bold text-emerald-800">
                      {yesterdayLog.tilawah_pages ?? 0}
                      <span className="ml-1 text-sm font-medium">halaman</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-amber-700">
                      <PenLine className="h-4 w-4" />
                      <h3 className="text-sm font-semibold">Refleksi</h3>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                      {yesterdayLog.reflection?.trim() || "Belum ada catatan refleksi."}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Belum ada data ibadah yang tersimpan untuk kemarin.
                </p>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <h2 className="font-bold">Riwayat 7 Hari Terakhir</h2>
              </div>

              {history.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Belum ada riwayat ibadah yang tersimpan.
                </p>
              ) : (
                <ul className="space-y-3">
                  {history.map((log) => {
                    const completed = [
                      log.subuh,
                      log.dzuhur,
                      log.ashar,
                      log.maghrib,
                      log.isya,
                      log.tilawah,
                      log.dzikir,
                      log.sedekah,
                    ].filter(Boolean).length;

                    return (
                      <li
                        key={log.date}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <p className="font-semibold">{formatDate(log.date)}</p>
                          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {completed}/8 amalan
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          Tilawah: {log.tilawah_pages ?? 0} halaman
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                          {log.reflection?.trim() || "Belum ada catatan refleksi."}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
