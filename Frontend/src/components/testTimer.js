import { useState, useEffect } from "react";
import { BASE_URL } from "../utils";
import api from "../api";

function TimerForm() {
  const [date, setDate] = useState("");
  const [status, setStatus] = useState(false);

  useEffect(() => {
    const fetchTimer = async () => {
      try {
        const res = await api.get(`${BASE_URL}/timer`);
        if (res.data?.data) {
          setDate(res.data.data.date?.slice(0, 16));
          setStatus(res.data.data.active);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTimer();
  }, []);

  const saveTimer = async () => {
    try {
      await api.patch(`${BASE_URL}/timer`, { date, status: status });
      alert("Timer updated");
    } catch (err) {
      console.error(err);
      alert("Gagal update timer");
    }
  };

  return (
    <div>
      <label>Pilih Waktu (WIB):</label>
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={status}
          onChange={(e) => setStatus(e.target.checked)}
        />
        Aktifkan Timer
      </label>

      <button onClick={saveTimer}>Simpan</button>
    </div>
  );
}

export default TimerForm;
