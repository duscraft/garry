import { motion } from 'framer-motion';
import { 
  ScanLine, 
  Calculator, 
  BellRing, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden selection:bg-primary-200 selection:text-primary-900">
      
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-slate-900">Garry</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Tarifs</a>
              <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:scale-105 active:scale-95">
                Accès Anticipé
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute w-full bg-white border-b border-slate-100 p-4 flex flex-col gap-4 shadow-xl">
            <a href="#features" className="text-slate-600 font-medium p-2" onClick={() => setIsMenuOpen(false)}>Fonctionnalités</a>
            <a href="#pricing" className="text-slate-600 font-medium p-2" onClick={() => setIsMenuOpen(false)}>Tarifs</a>
            <button className="bg-primary-600 text-white w-full py-3 rounded-xl font-bold">
              Accès Anticipé
            </button>
          </div>
        )}
      </nav>

      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-bl from-primary-50 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 -z-10 w-1/3 h-1/2 bg-gradient-to-tr from-accent-50 to-transparent opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-8 shadow-sm hover:border-primary-200 transition-colors cursor-default"
            >
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
              <span className="text-sm font-medium text-slate-600">Maintenant disponible en bêta</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-display font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight"
            >
              Ne perdez plus jamais <br/>
              <span className="gradient-text">une garantie</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Garry pense à vos garanties, pour que vous n'ayez pas à le faire. 
              Scannez, stockez et soyez notifié avant l'expiration.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button className="w-full sm:w-auto bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all hover:shadow-xl hover:shadow-primary-200/50 hover:-translate-y-1 flex items-center justify-center gap-2 group">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                Voir la démo
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="bg-slate-900 rounded-[2rem] p-4 shadow-2xl shadow-slate-200 border-4 border-slate-900 aspect-[16/9] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
              
              <div className="relative h-full w-full bg-slate-950 rounded-xl overflow-hidden flex">
                <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 hidden md:flex flex-col gap-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-24 bg-slate-800 rounded-full" />
                    <div className="h-2 w-32 bg-slate-800 rounded-full" />
                    <div className="h-2 w-20 bg-slate-800 rounded-full" />
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                    <div className="h-8 w-48 bg-slate-800 rounded-lg" />
                    <div className="h-10 w-10 bg-primary-600 rounded-full shadow-lg shadow-primary-900/50 flex items-center justify-center">
                      <ScanLine className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-primary-500/50 transition-colors group/card cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 1 ? 'bg-blue-500/10 text-blue-400' : i === 2 ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {i === 1 ? <Calculator className="w-5 h-5" /> : i === 2 ? <ScanLine className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                          </div>
                          <div className="px-2 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400 font-medium">Active</div>
                        </div>
                        <div className="h-3 w-24 bg-slate-800 rounded-full mb-2" />
                        <div className="h-2 w-16 bg-slate-800 rounded-full opacity-50" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="absolute bottom-8 right-8 bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-4 floating-element max-w-xs">
                    <div className="bg-accent-500/10 p-2 rounded-lg text-accent-400">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="h-2 w-32 bg-slate-600 rounded-full mb-1.5" />
                      <div className="h-2 w-20 bg-slate-700 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-500/20 blur-[100px] rounded-full -z-10" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent-500/20 blur-[100px] rounded-full -z-10" />
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-6">Tout ce dont vous avez besoin pour <span className="text-primary-600">rester serein</span></h2>
            <p className="text-lg text-slate-600">Une suite d'outils intelligente pour gérer la vie de vos produits, de l'achat jusqu'à la fin de la garantie.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<ScanLine className="w-6 h-6" />}
              title="Capture Intelligente"
              description="Prenez une photo de votre ticket, notre IA extrait automatiquement la date, le produit et le magasin."
              color="bg-blue-500"
            />
            <FeatureCard 
              icon={<Calculator className="w-6 h-6" />}
              title="Calcul Automatique"
              description="Garry détecte la durée de garantie légale et calcule la date d'expiration précise."
              color="bg-purple-500"
            />
            <FeatureCard 
              icon={<BellRing className="w-6 h-6" />}
              title="Rappels Malins"
              description="Recevez une notification 30 jours avant la fin de votre garantie pour ne pas être pris au dépourvu."
              color="bg-amber-500"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Coffre-fort Sécurisé"
              description="Tous vos documents sont chiffrés et stockés en lieu sûr. Accessibles partout, tout le temps."
              color="bg-emerald-500"
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-6">Simple et transparent</h2>
            <p className="text-lg text-slate-600">Choisissez le plan qui correspond à vos besoins.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Découverte</h3>
                <p className="text-slate-500">Pour les particuliers organisés</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">0€</span>
                  <span className="text-slate-500 ml-2">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <PricingFeature text="Jusqu'à 5 garanties" />
                <PricingFeature text="Capture photo basique" />
                <PricingFeature text="Rappels par email" />
                <PricingFeature text="Support standard" />
              </ul>
              <button className="w-full py-4 rounded-xl border-2 border-slate-100 text-slate-900 font-bold hover:border-slate-900 transition-colors">
                Commencer gratuitement
              </button>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white group">
              <div className="absolute top-0 right-0 bg-accent-500 text-accent-950 text-xs font-bold px-3 py-1 rounded-bl-xl">
                POPULAIRE
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="text-slate-400">Pour une tranquillité totale</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-bold">4.99€</span>
                  <span className="text-slate-400 ml-2">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <PricingFeature text="Garanties illimitées" dark />
                <PricingFeature text="Extraction IA illimitée" dark />
                <PricingFeature text="Rappels SMS & Push" dark />
                <PricingFeature text="Export comptable" dark />
              </ul>
              <button className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 transition-colors shadow-lg shadow-primary-900/50">
                Essayer Premium
              </button>
              
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl text-white">Garry</span>
              </div>
              <p className="max-w-sm leading-relaxed">
                Votre assistant personnel pour la gestion de garanties. Ne laissez plus jamais un ticket de caisse s'effacer ou une garantie expirer.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Produit</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Sécurité</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Légal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">CGU</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; 2024 Garry. Tous droits réservés.</p>
            <div className="flex gap-6">
              <div className="w-6 h-6 bg-slate-800 rounded-full hover:bg-primary-600 transition-colors cursor-pointer"></div>
              <div className="w-6 h-6 bg-slate-800 rounded-full hover:bg-primary-600 transition-colors cursor-pointer"></div>
              <div className="w-6 h-6 bg-slate-800 rounded-full hover:bg-primary-600 transition-colors cursor-pointer"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
  return (
    <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300">
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  )
}

function PricingFeature({ text, dark = false }: { text: string, dark?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle2 className={`w-5 h-5 ${dark ? 'text-accent-400' : 'text-primary-600'}`} />
      <span className={dark ? 'text-slate-300' : 'text-slate-600'}>{text}</span>
    </li>
  )
}

export default App
