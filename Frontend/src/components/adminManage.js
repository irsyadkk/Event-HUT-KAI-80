import { getUserRole } from "../getUserRole.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminManagePage = () => {
  const role = getUserRole();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nipp = localStorage.getItem("nipp");
    if (!token || !nipp) {
      navigate("/");
      return;
    }
    try {
      if (!role === "superadmin" || !role === "admin") navigate("/");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  if (!allowed) return null;
};

export default AdminManagePage;
