import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Profil() {
  const [user, setUser] = useState(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:3000/profil", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          // Affiche le vrai message d'erreur au lieu de rediriger
          return res.json().then((data) => {
            throw new Error(data.message || "Erreur serveur");
          });
        }
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [navigate]);

  const deconnexion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── Affichage selon l'état ──────────────────────────────
  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Chargement...</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <p className="text-red-500 font-medium mb-4">❌ {erreur}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">👤</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Mon Profil</h1>
        {user && (
          <>
            <p className="text-gray-500 mb-1">
              Connecté en tant que{" "}
              <span className="font-medium text-blue-600">{user.email}</span>
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Membre depuis {new Date(user.created_at).toLocaleDateString("fr-FR")}
            </p>
          </>
        )}
        <button
          onClick={deconnexion}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}