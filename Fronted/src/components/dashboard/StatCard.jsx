import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = "blue", trend, trendLabel, subtext }) => {
  // Mapas de colores para diferentes temas
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  };

  const selectedColor = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      {/* Decoración de fondo */}
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 scale-150 rounded-full p-4 ${selectedColor.split(' ')[0]}`}>
        <Icon size={120} />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${selectedColor} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        
        {/* Indicador de Tendencia (Opcional) */}
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
          }`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
            {trend === 'neutral' && <Minus size={12} />}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
          {value}
        </h3>
        
        {subtext && (
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
