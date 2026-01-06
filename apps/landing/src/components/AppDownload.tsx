import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Smartphone, Monitor } from 'lucide-react';

export default function AppDownload() {
  const { t } = useTranslation();

  return (
    <div id="download" className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          <div className="lg:w-1/2">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
            >
              {t('app.title')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-xl"
            >
              {t('app.subtitle')}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a href="#" className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl transition-all w-fit">
                <Smartphone className="w-8 h-8" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-slate-300">{t('app.downloadOn')}</span>
                  <span className="text-lg font-bold leading-none">{t('app.appStore')}</span>
                </div>
              </a>

              <a href="#" className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl transition-all w-fit">
                <div className="flex flex-col items-start">
                  <span className="text-xs text-slate-300">{t('app.getItOn')}</span>
                  <span className="text-lg font-bold leading-none">{t('app.googlePlay')}</span>
                </div>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800"
            >
              <a 
                href="https://garry-app.antoinelaborderie.com" 
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Monitor className="w-5 h-5" />
                {t('app.web_btn')}
              </a>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2 relative"
          >
            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl">
              <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
              <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-slate-950">
                <div className="flex flex-col h-full">
                    <div className="bg-blue-600 p-6 pt-12 text-white">
                        <div className="text-sm opacity-80">{t('app.mockup.hello')}</div>
                        <div className="text-2xl font-bold">Antoine</div>
                    </div>
                    <div className="p-4 flex-1 bg-slate-50 dark:bg-slate-900">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm mb-4 border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-slate-900 dark:text-white">MacBook Pro M3</div>
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{t('app.mockup.valid')}</span>
                            </div>
                            <div className="text-sm text-slate-500">{t('app.mockup.expiresIn2Years')}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm mb-4 border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-slate-900 dark:text-white">Sony WH-1000XM5</div>
                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">{t('app.mockup.expiring')}</span>
                            </div>
                            <div className="text-sm text-slate-500">{t('app.mockup.expiresIn15Days')}</div>
                        </div>
                         <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm mb-4 border border-slate-100 dark:border-slate-700 opacity-60">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-slate-900 dark:text-white">AirPods Pro</div>
                                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">{t('app.mockup.expired')}</span>
                            </div>
                            <div className="text-sm text-slate-500">{t('app.mockup.expired2MonthsAgo')}</div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
