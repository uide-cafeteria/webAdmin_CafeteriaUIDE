import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, X, User, Loader2 } from 'lucide-react';

export default function ScanConfirmPage() {
  const [estudiante, setEstudiante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const token = new URLSearchParams(location.search).get('token')
    || new URLSearchParams(location.search).get('loyalty_token');

  useEffect(() => {
    if (!token) {
      setError("No se encontró QR válido");
      setLoading(false);
      return;
    }

    buscarEstudiante(token);
  }, [token]);

  const buscarEstudiante = async (loyalty_token) => {
    try {
      const res = await fetch(`http://localhost:3001/api/historial/buscar/${loyalty_token}`);
      const data = await res.json();

      if (res.ok && data.status) {
        setEstudiante(data.usuario);
      } else {
        setError(data.message || "Estudiante no encontrado");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const registrarAlmuerzo = async () => {
    setRegistrando(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:3001/api/historial/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ loyalty_token: token })
      });

      const data = await res.json();

      if (res.ok && data.status) {
        setResultado({
          success: true,
          mensaje: data.message,
          esGratis: data.data?.almuerzo?.es_gratis || false
        });
      } else {
        setResultado({ success: false, mensaje: data.message || "Error" });
      }
    } catch (err) {
      setResultado({ success: false, mensaje: "Error de conexión" });
    } finally {
      setRegistrando(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" size={60} /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
        {error ? (
          <>
            <X className="w-24 h-24 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-xl text-gray-700">{error}</p>
            <button onClick={() => navigate('/cafeteria')} className="mt-8 bg-gray-600 text-white px-8 py-4 rounded-full text-xl font-bold">
              Volver
            </button>
          </>
        ) : !resultado ? (
          <>
            <User className="w-32 h-32 text-orange-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">¿Registrar almuerzo?</h1>
            <h2 className="text-3xl font-bold text-orange-600 mb-2">{estudiante?.nombre}</h2>
            <p className="text-2xl text-gray-600 mb-10">#{estudiante?.codigoUnico || 'Sin código'}</p>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/cafeteria')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-5 rounded-2xl text-xl font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={registrarAlmuerzo}
                disabled={registrando}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3"
              >
                {registrando ? "Registrando..." : <><Check size={32} /> Confirmar</>}
              </button>
            </div>
          </>
        ) : (
          <>
            {resultado.success ? (
              <>
                <Check className="w-32 h-32 text-green-500 mx-auto mb-6" />
                <h1 className="text-5xl font-bold text-green-600 mb-6">¡REGISTRADO!</h1>
                {resultado.esGratis && (
                  <div className="bg-green-100 text-green-800 px-8 py-4 rounded-full text-3xl font-bold mb-6 inline-block">
                    ALMUERZO GRATIS
                  </div>
                )}
                <p className="text-2xl text-gray-700">{resultado.mensaje}</p>
              </>
            ) : (
              <>
                <X className="w-32 h-32 text-red-500 mx-auto mb-6" />
                <h1 className="text-5xl font-bold text-red-600 mb-6">ERROR</h1>
                <p className="text-2xl text-gray-700">{resultado.mensaje}</p>
              </>
            )}
            <button
              onClick={() => navigate('/scan-qr')}
              className="mt-10 bg-orange-600 hover:bg-orange-700 text-white px-12 py-5 rounded-full text-2xl font-bold"
            >
              Escanear otro
            </button>
          </>
        )}
      </div>
    </div>
  );
}