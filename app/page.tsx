'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle2, 
  BookOpen, 
  Flame, 
  Moon, 
  Sun, 
  LogOut, 
  Save, 
  Sparkles,
  TrendingUp,
  Calendar
} from 'lucide-react'

export default function Dashboard() {
  const [supabase] = useState(() => createClientComponentClient())
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // State Mutabaah & Habit
  const [streak, setStreak] = useState(0)
  const [todayLog, setTodayLog] = useState<{ [key: string]: boolean }>({})
  const [tilawahPages, setTilawahPages] = useState<number>(0)
  const [reflection, setReflection] = useState<string>('')

  // Daftar Amalan Harian
  const habits = [
    { id: 'sholat_jamaah', label: 'Sholat Fardhu Berjamaah' },
    { id: 'sholat_rawatib', label: 'Sholat Sunnah Rawatib' },
    { id: 'sholat_dhuha', label: 'Sholat Dhuha' },
    { id: 'sholat_tahajud', label: 'Sholat Tahajud / Qiyamullail' },
    { id: 'dzikir_pagi_petang', label: 'Dzikir Pagi & Petang' },
    { id: 'sedekah_harian', label: 'Sedekah Subuh / Harian' },
  ]

  const todayDate = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // Fetch data hari ini
    const { data: logs } = await supabase
      .from('mutabaah_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', todayDate)
      .single()

    if (logs) {
      setTodayLog(logs.habits || {})
      setTilawahPages(logs.tilawah_pages || 0)
      setReflection(logs.reflection || '')
    }

    // Hitung streak sederhananya
    const { data: allLogs } = await supabase
      .from('mutabaah_logs')
      .select('date')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })

    if (allLogs) {
      setStreak(allLogs.length)
    }

    setLoading(false)
  }

  // FUNGSI UTAMA: Simpan Kegiatan Hari Ini
  const handleSaveData = async () => {
    setSaving(true)
    setSaveSuccess(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const payload = {
      user_id: session.user.id,
      date: todayDate,
      habits: todayLog,
      tilawah_pages: Number(tilawahPages) || 0,
      reflection: reflection,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('mutabaah_logs')
      .upsert(payload, { onConflict: 'user_id, date' })

    setSaving(false)

    if (!error) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000) // Hilangkan notif sukses dalam 3 detik
    } else {
      alert('Gagal menyimpan data: ' + error.message)
    }
  }

  const toggleHabit = (id: string) => {
    setTodayLog((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <h1 className="font-bold text-lg">Mutaba'ah Digital</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6 pb-24">
        {/* Banner Ringkasan */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <Flame className="w-8 h-8 text-amber-300" />
            <div>
              <p className="text-xs opacity-80">Istiqomah</p>
              <p className="text-xl font-bold">{streak} Hari</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
            <Calendar className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hari Ini</p>
              <p className="text-sm font-semibold">{todayDate}</p>
            </div>
          </div>
        </div>

        {/* Form Amalan Harian */}
        <section className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Amalan Yomi
          </h2>
          <div className="space-y-2">
            {habits.map((h) => {
              const isChecked = !!todayLog[h.id]
              return (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-sm font-medium">{h.label}</span>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Input Tilawah */}
        <section className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Tilawah Al-Qur'an
          </h2>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400">Capaian Hari Ini (Halaman)</label>
            <input
              type="number"
              min="0"
              value={tilawahPages}
              onChange={(e) => setTilawahPages(Number(e.target.value))}
              placeholder="Contoh: 5"
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </section>

        {/* Jurnal Refleksi */}
        <section className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Catatan / Jurnal Refleksi
          </h2>
          <textarea
            rows={3}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Apa evaluasi ibadah dan kebaikanmu hari ini?"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
          />
        </section>

        {/* TOMBOL SIMPAN UTAMA */}
        <div className="sticky bottom-4 z-10">
          <button
            onClick={handleSaveData}
            disabled={saving}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold shadow-lg text-white flex items-center justify-center gap-2 transition-all ${
              saveSuccess
                ? 'bg-teal-600'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
            } disabled:opacity-50`}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Menyimpan...' : saveSuccess ? '✓ Berhasil Disimpan!' : 'Simpan Kegiatan Hari Ini'}
          </button>
        </div>
      </main>
    </div>
  )
}