/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plane, 
  Building, 
  Palette, 
  Sparkles, 
  GitPullRequest, 
  Cpu, 
  Database, 
  BarChart3, 
  Activity, 
  Heart, 
  HardDrive, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Star, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  FlightResult, 
  HotelResult, 
  CanvaDesignResult, 
  GitHubRepoResult, 
  VercelStatusResult, 
  SupabaseQueryResult, 
  MixpanelAnalyticsResult, 
  CorosFitnessResult, 
  AppleHealthResult, 
  DriveSearchResult 
} from '@/services/pluginExecutors';

interface PluginArtifactCardProps {
  pluginType: string;
  data: any;
  onOpenStore?: () => void;
}

export const PluginArtifactCard: React.FC<PluginArtifactCardProps> = ({ pluginType, data, onOpenStore }) => {
  if (!data) return null;

  // 1. Skyscanner Flights
  if (pluginType === 'skyscanner_search_flights' && Array.isArray(data)) {
    const flights: FlightResult[] = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 font-bold">
              <Plane size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-900">Skyscanner Flight Finder</h4>
              <p className="text-[10px] text-zinc-400 font-medium">Tawaran Penerbangan Tambang Murah</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            {flights.length} Pilihan Dijumpai
          </span>
        </div>

        <div className="space-y-3">
          {flights.map((flight) => (
            <div key={flight.id} className="p-3.5 rounded-xl bg-zinc-50 border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-black/15 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{flight.airlineLogo}</span>
                  <span className="font-bold text-xs text-zinc-900">{flight.airline}</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-medium">({flight.flightNumber})</span>
                  <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                    {flight.stops}
                  </span>
                </div>
                <div className="text-xs text-zinc-700 font-medium flex items-center gap-2">
                  <span className="font-bold">{flight.departureTime}</span>
                  <span>{flight.origin}</span>
                  <ArrowRight size={12} className="text-zinc-400" />
                  <span className="font-bold">{flight.arrivalTime}</span>
                  <span>{flight.destination}</span>
                  <span className="text-zinc-400 text-[10px]">· {flight.duration}</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">{flight.cabinClass}</p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <span className="text-sm font-extrabold text-zinc-900">RM {flight.priceMyr.toLocaleString()}</span>
                <a 
                  href={flight.bookingUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Tempah</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Booking.com Hotels
  if (pluginType === 'booking_search_hotels' && Array.isArray(data)) {
    const hotels: HotelResult[] = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-100 font-bold">
              <Building size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-900">Booking.com Hotels & Lodging</h4>
              <p className="text-[10px] text-zinc-400 font-medium">Penginapan & Bilik Terpilih</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {hotels.length} Penginapan
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="p-3.5 rounded-xl bg-zinc-50 border border-black/5 flex flex-col sm:flex-row gap-3.5 hover:border-black/15 transition-colors">
              <img 
                src={hotel.imageUrl} 
                alt={hotel.name} 
                className="w-full sm:w-28 h-24 object-cover rounded-lg shrink-0" 
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-xs text-zinc-900">{hotel.name}</h5>
                    <p className="text-[10px] text-zinc-400 font-medium">{hotel.city} · {hotel.distanceFromCenter}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                    <Star size={10} className="fill-white" />
                    <span>{hotel.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {hotel.amenities.slice(0, 3).map((a, i) => (
                    <span key={i} className="text-[9px] bg-white border border-black/5 text-zinc-600 px-1.5 py-0.5 rounded font-medium">
                      {a}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/5">
                  <div className="text-xs">
                    <span className="text-[10px] text-zinc-400 font-medium">Mulai: </span>
                    <strong className="text-zinc-900 font-bold">RM {hotel.pricePerNightMyr}</strong>
                    <span className="text-[9px] text-zinc-400 font-medium"> / malam</span>
                  </div>
                  <a
                    href={hotel.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-full bg-blue-800 hover:bg-blue-900 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Pilih Bilik</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Canva Design
  if (pluginType === 'canva_generate_design') {
    const canva: CanvaDesignResult = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <Palette size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-900">Canva Design Template Generated</h4>
              <p className="text-[10px] text-zinc-400 font-medium">{canva.dimensions} · {canva.type}</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
            Sedia Disunting
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <img 
            src={canva.previewUrl} 
            alt="Preview" 
            className="w-full sm:w-36 h-28 object-cover rounded-xl border border-black/5" 
          />
          <div className="flex-1 space-y-2 text-xs">
            <h5 className="font-bold text-zinc-900">{canva.title}</h5>
            <p className="text-[11px] text-zinc-600 font-medium leading-relaxed bg-zinc-50 p-2.5 rounded-xl border border-black/5">
              "{canva.suggestedCopy}"
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Palet:</span>
              <div className="flex gap-1.5">
                {canva.colorPalette.map((c, i) => (
                  <span key={i} className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <a
            href={canva.editUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Buka & Sunting di Canva</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    );
  }

  // 4. Adobe Creative Cloud
  if (pluginType === 'adobe_process_asset') {
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-600" />
            <span className="font-bold text-xs text-zinc-900">Adobe Creative Cloud Engine</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {data.status || 'COMPLETED'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 block font-medium">Aset</span>
            <strong className="text-zinc-900 font-bold">{data.assetName}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 block font-medium">Resolusi</span>
            <strong className="text-zinc-900 font-bold">{data.outputFormat || '300 DPI'}</strong>
          </div>
        </div>
      </div>
    );
  }

  // 5. GitHub Repo Management
  if (pluginType === 'github_manage_repo') {
    const gh: GitHubRepoResult = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <GitPullRequest size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-900">{gh.repo}</h4>
              <p className="text-[10px] text-zinc-400 font-medium">Branch: {gh.branch} · {gh.totalOpen} Terbuka</p>
            </div>
          </div>
          <a
            href={`https://github.com/${gh.repo}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-zinc-600 hover:text-black flex items-center gap-1"
          >
            <span>GitHub</span>
            <ExternalLink size={10} />
          </a>
        </div>

        <div className="space-y-2">
          {gh.items.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-zinc-50 border border-black/5 flex items-center justify-between gap-3 text-xs hover:border-black/15 transition-colors">
              <div className="flex items-center gap-2 truncate">
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0",
                  item.type === 'PR' ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                )}>
                  {item.type} #{item.number}
                </span>
                <span className="font-medium text-zinc-800 truncate">{item.title}</span>
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                item.status === 'merged' ? "bg-purple-50 text-purple-700" :
                item.status === 'open' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                "bg-zinc-100 text-zinc-600"
              )}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. Vercel Status
  if (pluginType === 'vercel_deploy_status') {
    const v: VercelStatusResult = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-black" />
            <span className="font-bold text-xs text-zinc-900">Vercel Deployment ({v.projectName})</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {v.status}
          </span>
        </div>
        <div className="p-3 bg-zinc-50 rounded-xl border border-black/5 text-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] text-zinc-400 block font-medium">Domain Pengeluaran:</span>
            <a href={v.url} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
              <span>{v.url}</span>
              <ExternalLink size={10} />
            </a>
          </div>
          <div className="text-right text-[11px] text-zinc-500">
            <span>Masa Bina: {v.buildTime}</span> · <span>{v.region}</span>
          </div>
        </div>
      </div>
    );
  }

  // 7. Supabase Database
  if (pluginType === 'supabase_query_db') {
    const sb: SupabaseQueryResult = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-emerald-600" />
            <span className="font-bold text-xs text-zinc-900">Supabase PostgreSQL ({sb.table})</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            RLS Active · {sb.executionTimeMs}ms
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span className="truncate">Projek: bktksvhcgszaoqkdyhil.supabase.co</span>
          <span className="text-emerald-600 font-bold shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE CLOUD
          </span>
        </div>
        <p className="font-mono text-[10px] bg-zinc-900 text-zinc-200 p-2 rounded-lg truncate">
          {sb.query}
        </p>
        <div className="space-y-1.5 pt-1">
          {sb.rows.slice(0, 4).map((r, i) => (
            <div key={i} className="p-2 rounded-lg bg-zinc-50 border border-black/5 text-[11px] font-mono flex flex-wrap justify-between gap-1 text-zinc-700">
              {r.id ? <span>ID: <strong className="text-zinc-900">{r.id}</strong></span> : null}
              {r.customer_name ? <span>Pelanggan: {r.customer_name}</span> : null}
              {r.total_amount ? <span className="text-emerald-700 font-bold">RM {r.total_amount}</span> : null}
              {r.project ? <span>Ref: <strong>{r.project}</strong></span> : null}
              {r.table ? <span>Jadual: <strong>{r.table}</strong></span> : null}
              {r.status ? <span className="text-emerald-600 font-bold">{r.status}</span> : null}
              {r.note ? <span className="text-zinc-500 italic">{r.note}</span> : null}
              {r.response ? <span className="text-zinc-600">{r.response}</span> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 8. Mixpanel Analytics
  if (pluginType === 'mixpanel_track_analytics') {
    const mp: MixpanelAnalyticsResult = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-600" />
            <span className="font-bold text-xs text-zinc-900">Mixpanel Conversion Funnel</span>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            Penukaran: {mp.overallConversionRate}%
          </span>
        </div>
        <div className="space-y-2">
          {mp.steps.map((st, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-zinc-700">
                <span>{st.name}</span>
                <span className="font-bold">{st.count.toLocaleString()} ({st.conversionRate}%)</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${st.conversionRate}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 9. COROS Fitness
  if (pluginType === 'coros_health_metrics') {
    const cr: CorosFitnessResult = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-orange-600" />
            <span className="font-bold text-xs text-zinc-900">COROS Wearable Training Hub</span>
          </div>
          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
            Stamina {cr.staminaScore}%
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 font-medium block">Langkah Harian</span>
            <strong className="text-zinc-900 font-bold">{cr.dailySteps.toLocaleString()}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 font-medium block">Beban Latihan</span>
            <strong className="text-emerald-700 font-bold">{cr.trainingLoad.status}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 font-medium block">Masa Pemulihan</span>
            <strong className="text-zinc-900 font-bold">{cr.recoveryRemainingHours} Jam</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 font-medium block">Degupan Rehat</span>
            <strong className="text-zinc-900 font-bold">{cr.restingHeartRate} bpm</strong>
          </div>
        </div>
      </div>
    );
  }

  // 10. Apple Health
  if (pluginType === 'apple_health_summary') {
    const ah: AppleHealthResult = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-pink-600" />
            <span className="font-bold text-xs text-zinc-900">Apple Health Sync</span>
          </div>
          <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
            Disegerak
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 block font-medium">Langkah</span>
            <strong className="text-zinc-900 font-bold">{ah.steps.toLocaleString()}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 block font-medium">Tidur</span>
            <strong className="text-zinc-900 font-bold">{ah.sleepHours} Jam</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/5">
            <span className="text-[10px] text-zinc-400 block font-medium">Kalori Aktif</span>
            <strong className="text-zinc-900 font-bold">{ah.activeEnergyKcal} kcal</strong>
          </div>
        </div>
      </div>
    );
  }

  // 11. Google Drive Search
  if (pluginType === 'google_drive_search_files') {
    const drv: DriveSearchResult = data;
    return (
      <div className="my-3 p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-blue-600" />
            <span className="font-bold text-xs text-zinc-900">Google Drive Files ({drv.query})</span>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {drv.files.length} Fail
          </span>
        </div>
        <div className="space-y-1.5">
          {drv.files.map((f, i) => (
            <a 
              key={i} 
              href={f.url} 
              target="_blank" 
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-black/5 flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <HardDrive size={14} className="text-blue-600 shrink-0" />
                <span className="font-medium text-zinc-800 truncate">{f.name}</span>
              </div>
              <span className="text-[10px] text-zinc-400 shrink-0">{f.size}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
