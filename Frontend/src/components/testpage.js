import { useState } from "react";

function TimerForm() {
  const [date, setDate] = useState("");

  const saveTimer = async () => {
    await fetch("http://localhost:5000/timer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    alert("Timer saved!");
  };

  return (
    <div>
      <label>Pilih Waktu (WIB):</label>
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button onClick={saveTimer}>Simpan</button>
    </div>
  );
}

export default TimerForm;
