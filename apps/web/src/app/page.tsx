import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="text-xl font-bold text-brand-700">NutriPlan</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-brand-700 font-medium hover:bg-brand-50 rounded-lg transition">
            Ingresar
          </Link>
          <Link href="/register" className="px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition">
            Empezar gratis
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
        <span className="inline-block px-3 py-1 text-sm font-medium bg-brand-100 text-brand-700 rounded-full mb-6">
          Nutrición inteligente para Argentina
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Tu plan de alimentación <br />
          <span className="text-brand-600">personalizado con IA</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Calculamos tus macros, generamos recetas adaptadas a tu inventario y te ayudamos a alcanzar
          tus objetivos sin complicaciones.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register" className="px-8 py-4 bg-brand-600 text-white text-lg font-semibold rounded-xl hover:bg-brand-700 transition shadow-lg">
            Crear mi plan gratis
          </Link>
          <Link href="/login" className="px-8 py-4 border-2 border-brand-200 text-brand-700 text-lg font-semibold rounded-xl hover:bg-brand-50 transition">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: '🧮',
            title: 'Cálculo nutricional preciso',
            desc: 'Calculamos tu TMB y TDEE con la fórmula Mifflin-St Jeor y distribuimos tus macros según tu objetivo.',
          },
          {
            icon: '🍳',
            title: 'Recetas con lo que tenés',
            desc: 'Nuestra IA genera recetas priorizando los ingredientes que ya tenés en casa, adaptadas a la cocina argentina.',
          },
          {
            icon: '📦',
            title: 'Gestión de inventario',
            desc: 'Registrá tus alimentos, controlá fechas de vencimiento y recibí alertas antes de que caduquen.',
          },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
