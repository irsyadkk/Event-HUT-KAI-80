
import React, { useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import api from "../api";

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
    if (jenis === "KOLEKTIF" && (!pjNipp.trim() || !pjNama.trim())) return false;
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
      // timestamp: new Date().toISOString(),
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
      // Jika axios instance belum otomatis menambahkan Authorization header,
      // aktifkan baris berikut:
      // const token = localStorage.getItem("token");
      // const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await api.post("/pickup", payload);

      // sukses → reset untuk scan berikutnya
      setSuccessMsg(res?.data?.message || "Konfirmasi tersimpan!");
      setQrData(null);
      setRawText("");
      setStep("scan");
    } catch (err) {
      // tampilkan pesan dari server bila ada
      const msg = err?.response?.data?.message || "Gagal menyimpan pickup";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-xl mx-auto p-4">
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
            errorMsg={errorMsg}
            successMsg={successMsg}
          />
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-semibold">
        SCAN PENGAMBILAN – Gelang & Kupon
      </h1>
      <p className="text-sm text-gray-600">
        Flow: Pos → Jenis (Individu/Kolektif & PJ) → Scan QR → Konfirmasi → Simpan (DB)
      </p>
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
    <div className="bg-white rounded-2xl shadow p-4">
      <ol className="list-decimal ml-5 space-y-4">
        <li>
          <div className="font-medium mb-2">Pilih Pos Pengambilan</div>
          <select
            className="border p-2 rounded w-full"
            value={pos}
            onChange={(e) => setPos(e.target.value)}
          >
            <option>POS 1</option>
            <option>POS 2</option>
            <option>POS 3</option>
          </select>
        </li>

        <li>
          <div className="font-medium mb-2">Pilih Jenis Pengambilan</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-4 py-2 rounded text-white ${
                jenis === "INDIVIDU" ? "bg-amber-500" : "bg-gray-400"
              }`}
              onClick={() => setJenis("INDIVIDU")}
            >
              INDIVIDU
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded text-white ${
                jenis === "KOLEKTIF" ? "bg-orange-600" : "bg-gray-400"
              }`}
              onClick={() => setJenis("KOLEKTIF")}
            >
              KOLEKTIF
            </button>
          </div>
          {jenis === "INDIVIDU" && (
            <p className="text-xs text-gray-600 mt-2">
              Individu: pegawai NIPP tsb ambil sendiri gelang kupon miliknya.
            </p>
          )}
          {jenis === "KOLEKTIF" && (
            <div className="mt-3">
              <p className="text-xs text-gray-600">
                Kolektif: pegawai NIPP tsb diminta utk bantu ambil kupon
                rekan-rekannya (perwakilan).
              </p>
              <div className="mt-2 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm mb-1">
                    NIPP/NIPKWT Penanggung Jawab
                  </label>
                  <input
                    className="border p-2 rounded w-full"
                    value={pjNipp}
                    onChange={(e) => setPjNipp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Nama Penanggung Jawab
                  </label>
                  <input
                    className="border p-2 rounded w-full"
                    value={pjNama}
                    onChange={(e) => setPjNama(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </li>
      </ol>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`px-4 py-2 rounded text-white ${
            canGoScan ? "bg-green-600" : "bg-gray-400"
          }`}
          disabled={!canGoScan}
          onClick={goScan}
        >
          LANJUT SCAN
        </button>
      </div>
    </div>
  );
}

function ScanQR({ onBack, onResult, rawText, setRawText }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Halaman Scan QR</h2>
        <button
          className="px-3 py-1 rounded bg-gray-600 text-white"
          onClick={onBack}
        >
          KEMBALI
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded">
        <Scanner
          onScan={(results) => {
            const code = results?.[0]?.rawValue;
            if (code) onResult(code);
          }}
          onError={(err) => console.error(err)}
        />
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Tidak bisa akses kamera? Tempel JSON QR di bawah lalu klik "LANJUT".
        </p>
        <textarea
          className="border p-2 rounded w-full h-28"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <button
          className="mt-2 px-4 py-2 rounded bg-blue-600 text-white"
          onClick={() => onResult(rawText)}
        >
          LANJUT (dari teks)
        </button>
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
  errorMsg,
  successMsg,
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">SCAN SUCCESS!!</h2>
        <button
          className="px-3 py-1 rounded bg-gray-600 text-white"
          onClick={onBack}
        >
          KEMBALI
        </button>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <div>
          <b>POS:</b> {pos}
        </div>
        <div>
          <b>Jenis:</b> {jenis}
        </div>
        {jenis === "KOLEKTIF" && (
          <div>
            <b>Penanggung Jawab:</b> {pjNipp} - {pjNama}
          </div>
        )}
        <div>
          <b>NIPP (QR):</b> {qrData?.nipp}
        </div>
        <div>
          <b>Nama (pertama):</b> {namaPertama}
        </div>
        <div>
          <b>Jumlah Kuota:</b> {kuota}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded text-white ${submitting ? "bg-green-400" : "bg-green-700"}`}
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? "MENYIMPAN..." : "KONFIRMASI PENGAMBILAN"}
        </button>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-gray-700">
          Lihat JSON QR
        </summary>
        <pre className="bg-gray-50 border rounded p-2 text-xs overflow-auto">
          {JSON.stringify(qrData, null, 2)}
        </pre>
      </details>
    </div>
  );
}
