import React, { useMemo, useState, useEffect, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import api from "../api";
import { useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master-01.png";

export default function QRPickupApp() {
  const [step, setStep] = useState("start"); // start | scan | confirm

  // Start page state (digabung jadi satu halaman)
  const [pos, setPos] = useState("POS 1");
  const [jenis, setJenis] = useState("INDIVIDU"); // INDIVIDU | KOLEKTIF
  const [pjNipp, setPjNipp] = useState("");
  const [pjNama, setPjNama] = useState("");

  // QR & konfirmasi state
  const [qrData, setQrData] = useState(null); // objek dari QR (nipp, nama[])
  const [rawText, setRawText] = useState(""); // fallback paste
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const kuota = useMemo(
    () => (Array.isArray(qrData?.nama) ? qrData.nama.length : 0),
    [qrData]
  );
  const namaPertama = useMemo(
    () => (Array.isArray(qrData?.nama) ? qrData.nama[0] : "-"),
    [qrData]
  );

  const canGoScan = useMemo(() => {
    if (!pos) return false;
    if (!jenis) return false;
    if (jenis === "KOLEKTIF" && (!pjNipp.trim() || !pjNama.trim()))
      return false;
    return true;
  }, [pos, jenis, pjNipp, pjNama]);

  function goScan() {
    if (!canGoScan) {
      alert("Lengkapi data POS/Jenis (dan Penanggung Jawab bila KOLEKTIF)");
      return;
    }
    setStep("scan");
  }

  function handleQRText(text) {
    try {
      const parsed = JSON.parse(text);
      if (
        !parsed?.nipp ||
        !Array.isArray(parsed?.nama) ||
        parsed.nama.length === 0
      ) {
        alert("QR tidak valid. Harus berisi nipp dan array nama.");
        return;
      }
      setQrData(parsed);
      setErrorMsg("");
      setSuccessMsg("");
      setStep("confirm");
    } catch {
      alert("QR bukan JSON valid.");
    }
  }

  async function confirmPickup() {
    if (!qrData) return;
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      // timestamp bisa dikosongkan agar server pakai Date.now(); kirim jika mau catat waktu client
      //   timestamp: new Date(),
      nipp: String(qrData.nipp),
      nama: namaPertama,
      jumlah_kuota: kuota,
      jenis_pengambilan: jenis,
      pos_pengambilan: pos,
      nipp_pj: jenis === "KOLEKTIF" ? pjNipp : null,
      nama_pj: jenis === "KOLEKTIF" ? pjNama : null,
      status: "KONFIRMASI",
    };

    try {
      const res = await api.post("/pickup", payload);
      setSuccessMsg("Berhasil menyimpan data pengambilan!");
      setQrData(null);
      setRawText("");
      setStep("start"); // ⬅️ NAVIGASI KE HALAMAN INPUT SEBELUM SCAN
    } catch (err) {
      const status = err?.response?.status;

      if (status === 409) {
        // duplikat NIPP
        setErrorMsg("NIPP ini sudah melakukan pengambilan.");
      } else if (status === 400) {
        // validasi request (field kosong/salah)
        setErrorMsg("Data tidak valid atau belum lengkap.");
      } else {
        setErrorMsg("Gagal menyimpan pickup. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const closePopup = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* === POPUP (global) === */}
      {(errorMsg || successMsg) && (
        <PopupNotification
          type={successMsg ? "success" : "error"}
          message={successMsg || errorMsg}
          onClose={closePopup}
        />
      )}

      <div className="max-w-2xl mx-auto p-6">
        <Header />

        {step === "start" && (
          <StartCombined
            pos={pos}
            setPos={setPos}
            jenis={jenis}
            setJenis={setJenis}
            pjNipp={pjNipp}
            setPjNipp={setPjNipp}
            pjNama={pjNama}
            setPjNama={setPjNama}
            canGoScan={canGoScan}
            goScan={goScan}
          />
        )}

        {step === "scan" && (
          <ScanQR
            onBack={() => setStep("start")}
            onResult={handleQRText}
            rawText={rawText}
            setRawText={setRawText}
          />
        )}

        {step === "confirm" && (
          <Confirm
            pos={pos}
            jenis={jenis}
            pjNipp={pjNipp}
            pjNama={pjNama}
            qrData={qrData}
            kuota={kuota}
            namaPertama={namaPertama}
            onBack={() => setStep("scan")}
            onConfirm={confirmPickup}
            submitting={submitting}
            // kirim state pesan ke Confirm (untuk banner di dalam kartu)
            errorMsg={errorMsg}
            successMsg={successMsg}
          />
        )}
      </div>
    </div>
  );
}

function PopupNotification({ type, message, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Popup */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div
          className={`p-6 rounded-t-2xl ${
            type === "success"
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gradient-to-r from-red-500 to-red-600"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              {type === "success" ? (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {type === "success" ? "Berhasil!" : "Terjadi Kesalahan"}
              </h3>
              <p className="text-white text-opacity-90 text-sm">
                {type === "success" ? "" : "Silakan coba lagi"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-6 leading-relaxed">{message}</p>

          <button
            onClick={onClose}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg ${
              type === "success"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {type === "success" ? "✓ OK" : "↻ COBA LAGI"}
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-8 text-center">
      <div className="inline-flex items-center justify-center w-120 h-16 mb-4">
        <img
          src={LogoKAI}
          alt="Logo HUT KAI 80"
          className="h-20 w-auto object-contain"
        />
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        SCAN PENGAMBILAN
      </h1>
      <p className="text-lg font-medium text-gray-600 mb-3">Gelang & Kupon</p>
    </div>
  );
}

function StartCombined({
  pos,
  setPos,
  jenis,
  setJenis,
  pjNipp,
  setPjNipp,
  pjNama,
  setPjNama,
  canGoScan,
  goScan,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="space-y-8">
          {/* Step 1: Pos */}
          <div className="relative">
            <div className="flex items-center mb-4">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold mr-3"
                style={{ backgroundColor: "#406017" }}
              >
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Pilih Pos Pengambilan
              </h3>
            </div>
            <div className="ml-11">
              <select
                className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg font-medium transition-all duration-200 focus:border-opacity-60 focus:outline-none focus:ring-4 focus:ring-opacity-20"
                value={pos}
                onChange={(e) => setPos(e.target.value)}
              >
                <option>POS 1</option>
                <option>POS 2</option>
                <option>POS 3</option>
              </select>
            </div>
          </div>

          {/* Step 2: Jenis */}
          <div className="relative">
            <div className="flex items-center mb-4">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold mr-3"
                style={{ backgroundColor: "#406017" }}
              >
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Pilih Jenis Pengambilan
              </h3>
            </div>
            <div className="ml-11">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  className={`px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                    jenis === "INDIVIDU"
                      ? "text-white shadow-lg transform scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200"
                  }`}
                  style={
                    jenis === "INDIVIDU" ? { backgroundColor: "#406017" } : {}
                  }
                  onClick={() => setJenis("INDIVIDU")}
                >
                  <div className="text-center">
                    <div className="text-lg">👤</div>
                    <div>INDIVIDU</div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                    jenis === "KOLEKTIF"
                      ? "text-white shadow-lg transform scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200"
                  }`}
                  style={
                    jenis === "KOLEKTIF" ? { backgroundColor: "#406017" } : {}
                  }
                  onClick={() => setJenis("KOLEKTIF")}
                >
                  <div className="text-center">
                    <div className="text-lg">👥</div>
                    <div>KOLEKTIF</div>
                  </div>
                </button>
              </div>

              {jenis === "INDIVIDU" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">ℹ️</div>
                    <p className="text-sm text-blue-700">
                      <strong>Individu:</strong> Pegawai dengan NIPP tersebut
                      mengambil sendiri gelang dan kupon miliknya.
                    </p>
                  </div>
                </div>
              )}

              {jenis === "KOLEKTIF" && (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-orange-500 mt-0.5">⚠️</div>
                      <p className="text-sm text-orange-700">
                        <strong>Kolektif:</strong> Pegawai dengan NIPP tersebut
                        diminta untuk membantu mengambil kupon rekan-rekannya
                        sebagai perwakilan.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center">
                      <span
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: "#406017" }}
                      ></span>
                      Data Penanggung Jawab
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          NIPP/NIPKWT Penanggung Jawab
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-xl p-3 transition-all duration-200 focus:border-opacity-60 focus:outline-none focus:ring-4 focus:ring-opacity-20"
                          value={pjNipp}
                          onChange={(e) => setPjNipp(e.target.value)}
                          placeholder="Masukkan NIPP/NIPKWT"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Penanggung Jawab
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-xl p-3 transition-all duration-200 focus:border-opacity-60 focus:outline-none focus:ring-4 focus:ring-opacity-20"
                          value={pjNama}
                          onChange={(e) => setPjNama(e.target.value)}
                          placeholder="Masukkan nama lengkap"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="bg-gray-50 px-6 py-4">
        <button
          type="button"
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            canGoScan
              ? "text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          style={canGoScan ? { backgroundColor: "#406017" } : {}}
          disabled={!canGoScan}
          onClick={goScan}
        >
          {canGoScan
            ? "🚀 LANJUT KE SCAN QR"
            : "⚠️ LENGKAPI DATA TERLEBIH DAHULU"}
        </button>
      </div>
    </div>
  );
}

function ScanQR({ onBack, onResult, rawText, setRawText }) {
  const scanLockRef = React.useRef(false);
  const bufferRef = React.useRef("");
  const lastTsRef = React.useRef(0);

  // --- state fallback cari order by NIPP
  const [manualNipp, setManualNipp] = React.useState("");
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [lookupError, setLookupError] = React.useState("");

  // jeda antar char untuk mendeteksi input dari scanner (cepat)
  const GAP_LIMIT_MS = 35;

  const handleDecoded = (text) => {
    if (!text) return;
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    onResult(text);
    setTimeout(() => (scanLockRef.current = false), 700); // cegah double-trigger
  };

  // Tangkap input dari barcode/QR USB (keyboard wedge)
  React.useEffect(() => {
    const onKeyDown = (e) => {
      // kalau sedang fokus di input/textarea, biarkan user mengetik manual
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.isComposing) return;

      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const txt = bufferRef.current.trim();
        bufferRef.current = "";
        if (txt) handleDecoded(txt);
        return;
      }

      // ambil hanya char printable
      if (e.key.length === 1) {
        const now = Date.now();
        const gap = now - lastTsRef.current;
        lastTsRef.current = now;

        if (gap > GAP_LIMIT_MS) bufferRef.current = ""; // kemungkinan manusia → reset buffer
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ENTER di textarea manual-JSON juga memproses
  const handleTextareaEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleDecoded(rawText);
    }
  };

  // pastikan kolom nama dari DB jadi array
  function ensureNamaArray(namaFromDb) {
    if (Array.isArray(namaFromDb)) return namaFromDb;
    if (typeof namaFromDb === "string") {
      try {
        const parsed = JSON.parse(namaFromDb);
        return Array.isArray(parsed) ? parsed : [namaFromDb];
      } catch {
        return [namaFromDb];
      }
    }
    return [String(namaFromDb ?? "")].filter(Boolean);
  }

  async function lookupByNipp() {
    const nipp = manualNipp.trim();
    if (!nipp) {
      setLookupError("NIPP wajib diisi.");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    try {
      const res = await api.get(`/order/${encodeURIComponent(nipp)}`);
      const order = res?.data?.data;
      if (!order) {
        setLookupError("Order tidak ditemukan.");
        return;
      }

      const payload = {
        nipp: String(order.nipp).trim(),
        nama: ensureNamaArray(order.nama),
      };

      // reuse pipeline yang sama dengan kamera/textarea
      handleDecoded(JSON.stringify(payload));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) setLookupError("Order tidak ditemukan.");
      else
        setLookupError(
          err?.response?.data?.message || "Gagal mengambil order."
        );
    } finally {
      setLookupLoading(false);
    }
  }

  const onManualNippKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupByNipp();
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 00-1 1H9a1 1 0 00-1-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-200 font-medium"
            onClick={onBack}
          >
            ← KEMBALI
          </button>
        </div>
      </div>

      {/* AREA KAMERA */}
      <div className="p-6">
        <div className="rounded-2xl overflow-hidden border-4 border-gray-200 mb-6 bg-black">
          <Scanner
            onScan={(results) => {
              const code = results?.[0]?.rawValue;
              if (code) handleDecoded(code);
            }}
            onError={(err) => console.error(err)}
          />
        </div>

        {/* FALLBACK: Input NIPP → Ambil dari ORDER */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-gray-600">🧾</div>
            <h3 className="font-semibold text-gray-800">
              Tidak bisa scan? Cari berdasarkan NIPP
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              className="w-full border-2 border-gray-200 rounded-xl p-3 transition-all duration-200 focus:border-opacity-60 focus:outline-none focus:ring-4 focus:ring-opacity-20"
              placeholder="Masukkan NIPP"
              value={manualNipp}
              onChange={(e) => setManualNipp(e.target.value)}
              onKeyDown={onManualNippKeyDown}
            />
            <button
              type="button"
              onClick={lookupByNipp}
              disabled={lookupLoading}
              className={`px-5 py-3 rounded-xl font-semibold text-white ${
                lookupLoading ? "bg-gray-400" : ""
              }`}
              style={!lookupLoading ? { backgroundColor: "#406017" } : {}}
            >
              {lookupLoading ? "Mencari..." : "Ambil dari ORDER"}
            </button>
          </div>

          {lookupError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {lookupError}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-3">
            Sistem akan mengambil <em>nipp</em> & <em>nama (array)</em> dari
            tabel <code>orders</code>, lalu lanjut ke konfirmasi.
          </p>
        </div>

        
      </div>
    </div>
  );
}

function Confirm({
  pos,
  jenis,
  pjNipp,
  pjNama,
  qrData,
  kuota,
  namaPertama,
  onBack,
  onConfirm,
  submitting,
  // === tambahkan dua props ini agar banner di dalam kartu bekerja ===
  errorMsg,
  successMsg,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div
        className="bg-gradient-to-r px-6 py-4"
        style={{
          background: "linear-gradient(135deg, #406017 0%, #5a7c2a 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <div className="text-2xl">✅</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">SCAN BERHASIL!</h2>
              <p className="text-green-100 text-sm">
                Verifikasi data sebelum konfirmasi
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-200 font-medium"
            onClick={onBack}
          >
            ← KEMBALI
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Data Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <span
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: "#406017" }}
            ></span>
            Ringkasan Data
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Pos Pengambilan
              </div>
              <div className="text-lg font-semibold text-gray-800">{pos}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Jenis
              </div>
              <div className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">
                  {jenis === "INDIVIDU" ? "👤" : "👥"}
                </span>
                {jenis}
              </div>
            </div>
            {jenis === "KOLEKTIF" && (
              <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Penanggung Jawab
                </div>
                <div className="text-lg font-semibold text-gray-800">
                  {pjNipp} - {pjNama}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                NIPP (dari QR)
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {qrData?.nipp}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Nama Pertama
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {namaPertama}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Jumlah Kuota
              </div>
              <div
                className="text-2xl font-bold flex items-center"
                style={{ color: "#406017" }}
              >
                <span className="mr-2">🎫</span>
                {kuota} kupon
              </div>
            </div>
          </div>
        </div>

        {/* Messages (banner kecil di dalam kartu) */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
            <div className="flex items-start space-x-3">
              <div className="text-red-500 text-xl mt-0.5">❌</div>
              <div>
                <div className="font-semibold text-red-800 mb-1">
                  Terjadi Kesalahan
                </div>
                <div className="text-red-700 text-sm">{errorMsg}</div>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200">
            <div className="flex items-start space-x-3">
              <div className="text-green-500 text-xl mt-0.5">✅</div>
              <div>
                <div className="font-semibold text-green-800 mb-1">
                  Berhasil!
                </div>
                <div className="text-green-700 text-sm">{successMsg}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            submitting
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          }`}
          style={!submitting ? { backgroundColor: "#406017" } : {}}
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
              <span>MENYIMPAN...</span>
            </div>
          ) : (
            "💾 KONFIRMASI PENGAMBILAN"
          )}
        </button>

        {/* QR Data Details */}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium p-3 bg-gray-50 rounded-xl transition-colors duration-200">
            📋 Lihat Detail JSON QR
          </summary>
          <div className="mt-3 bg-gray-900 rounded-xl p-4 overflow-hidden">
            <pre className="text-green-400 text-xs overflow-auto font-mono leading-relaxed">
              {JSON.stringify(qrData, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}
