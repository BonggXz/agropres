import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { ref, onValue, set, get, push, update } from 'firebase/database';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

import { DashboardHeader, StatusCard, ControlCard, ScheduleCard } from './DashboardCards';
import GPSRadarCard from './GPSRadarCard';
import { WhatsAppSchedulerCard, LogsCard } from './AdditionalCards';

// Import Alert Shadcn
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; 
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const DashboardPage = ({ user }) => {
  const [deviceData, setDeviceData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  
  // State Lokal untuk UI yang Responsif
  const [relayScheduleForm, setRelayScheduleForm] = useState({ uv_light: {}, ultrasonic: {}, });
  const [servoAngleDeg, setServoAngleDeg] = useState(90);
  const [autoCfg, setAutoCfg] = useState({ profile: 'bird', running: false });
  
  // State lokal untuk Switch agar tidak lompat-lompat
  const [localControls, setLocalControls] = useState({ uv_light: false, ultrasonic: false });

  const lastAlertTime = useRef({ geofence: 0, offline: 0 });

  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, []);

  // --- CUSTOM NOTIFICATION (SHADCN ALERT) ---
  const showCustomToast = (title, type = 'default') => {
    toast.custom((t) => (
      <div className="w-full min-w-[340px] max-w-[400px] animate-in slide-in-from-top-2 fade-in duration-300">
        <Alert variant={type === 'error' ? 'destructive' : 'default'} className="bg-white border shadow-md">
          {type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
          {type === 'default' && <Info className="h-5 w-5 text-blue-600" />}
          
          <AlertTitle className={`font-semibold ml-2 ${type === 'success' ? 'text-green-700' : type === 'error' ? 'text-red-700' : 'text-slate-800'}`}>
            {type === 'success' ? 'Berhasil' : type === 'error' ? 'Peringatan' : 'Info'}
          </AlertTitle>
          <AlertDescription className="text-slate-600 font-medium ml-2">
            {title}
          </AlertDescription>
        </Alert>
      </div>
    ), { duration: 3000, unstyled: true }); // unstyled: true agar style sonner default hilang
  };

  useEffect(() => {
    if (!user?.uid) return;
    const loadData = async () => {
      try {
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const uData = userSnap.val();
        setUserData(uData);

        if (uData?.device_id) {
          const unsub = onValue(ref(db, `devices/${uData.device_id}`), (snapshot) => {
            const data = snapshot.val() || {};
            setDeviceData(data);
            
            // Sync State Firebase ke State Lokal (Hanya jika data valid)
            if (data.relay_schedules) setRelayScheduleForm((prev) => ({ ...prev, ...data.relay_schedules }));
            
            // Note: Kita tidak menimpa servo/auto jika user sedang interaksi (logic ini sederhana, 
            // menimpa langsung agar sinkron, tapi update manual akan menimpa balik)
            if (data.controls) {
                setServoAngleDeg(data.controls.servo_angle_deg);
                setLocalControls({
                    uv_light: data.controls.uv_light || false,
                    ultrasonic: data.controls.ultrasonic || false
                });
            }
            if (data.auto_sweep) setAutoCfg((prev) => ({ ...prev, ...data.auto_sweep }));
            
            setLoading(false);
          });
          return () => unsub();
        } else { setLoading(false); }
      } catch (error) { console.error('Error loading data:', error); setLoading(false); }
    };
    loadData();
  }, [user]);

  const deviceId = userData?.device_id;
  const lastSeen = deviceData?.status?.last_seen || 0;
  const isOnlineCalc = (now - lastSeen) < 60000;
  const lastSeenSeconds = Math.max(0, Math.floor((now - lastSeen) / 1000));

  useEffect(() => {
    if (!deviceId || !deviceData) return;
    const checkAlerts = () => {
      if (!isOnlineCalc && (now - lastSeen > 180000) && (now - lastAlertTime.current.offline > 3600000)) {
        lastAlertTime.current.offline = now;
        push(ref(db, `devices/${deviceId}/logs`), { type: 'alert', message: 'PERINGATAN: Perangkat Offline!', timestamp: now, });
        showCustomToast('Perangkat Terdeteksi Offline!', 'error');
      }
      const geo = deviceData.geofence;
      const gps = deviceData.gps;
      const safeRadius = deviceData.controls?.max_distance || 30;

      if (geo?.center_lat && gps?.lat) {
        const dist = calculateDistance(gps.lat, gps.lng, geo.center_lat, geo.center_lng);
        if (dist > safeRadius && (now - lastAlertTime.current.geofence > 300000)) {
          lastAlertTime.current.geofence = now;
          push(ref(db, `devices/${deviceId}/logs`), { type: 'alert', message: `BAHAYA: Alat keluar zona aman (${dist.toFixed(0)}m > ${safeRadius}m)`, timestamp: now, });
          showCustomToast(`ALAT KELUAR ZONA! Jarak: ${dist.toFixed(0)}m`, 'error');
        }
      }
    };
    const interval = setInterval(checkAlerts, 10000);
    return () => clearInterval(interval);
  }, [deviceId, deviceData, isOnlineCalc, lastSeen, now]);

  // --- HANDLERS (OPTIMISTIC UPDATES) ---

  const handleModeChange = (key, val) => { if (deviceId) set(ref(db, `devices/${deviceId}/control_modes/${key}`), val); };

  const handleManualToggle = (key, val) => { 
      if (!deviceId) return;
      // 1. Update UI Lokal Instan
      setLocalControls(prev => ({...prev, [key]: val})); 
      // 2. Kirim ke Firebase
      set(ref(db, `devices/${deviceId}/controls/${key}`), val); 
  };

  const pushServoAngle = () => { 
      if (!deviceId) return;
      // UI State servoAngleDeg sudah diupdate oleh slider/input, tinggal kirim
      set(ref(db, `devices/${deviceId}/controls/servo_angle_deg`), servoAngleDeg); 
  };
  
  const toggleAutoRun = () => { 
    if (deviceId) { 
        const newRunningState = !autoCfg.running;
        // 1. Update UI Lokal Instan
        setAutoCfg((p) => ({ ...p, running: newRunningState })); 
        // 2. Kirim ke Firebase
        update(ref(db, `devices/${deviceId}/auto_sweep`), { ...autoCfg, enabled: newRunningState, running: newRunningState }); 
        showCustomToast(newRunningState ? 'Auto Sweep BERJALAN' : 'Auto Sweep BERHENTI', 'success'); 
    }
  };
  
  const applyPreset = (key) => { 
      if(!deviceId) return;
      
      const angle = key === 'rat' ? 90 : key === 'bird' ? 20 : 150; 
      
      // 1. Update UI Servo Instan
      setServoAngleDeg(angle); 
      
      // 2. MATIKAN AUTO SWEEP SECARA PAKSA (Fix Bug Bentrok)
      // Update state lokal
      setAutoCfg(prev => ({...prev, running: false}));
      
      // 3. Kirim ke Firebase (Servo Angle + Matikan Auto Sweep)
      const updates = {};
      updates[`devices/${deviceId}/controls/servo_angle_deg`] = angle;
      updates[`devices/${deviceId}/auto_sweep/enabled`] = false;
      updates[`devices/${deviceId}/auto_sweep/running`] = false;
      
      update(ref(db), updates); // Update sekaligus biar atomik

      showCustomToast(`Preset ${key} aktif (Auto Sweep OFF)`, 'success'); 
  };
  
  const handleRelayScheduleSave = () => { 
      if (deviceId) { 
          update(ref(db, `devices/${deviceId}/relay_schedules`), relayScheduleForm); 
          showCustomToast('Jadwal berhasil disimpan', 'success'); 
      }
  };
  
  const handleLogout = async () => { try { await signOut(auth); showCustomToast('Berhasil logout', 'success'); } catch { showCustomToast('Gagal logout', 'error'); }};

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <DashboardHeader user={user} onLogout={handleLogout} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              <StatusCard 
                isOnline={isOnlineCalc} 
                lastSeenSeconds={lastSeenSeconds} 
                lastSeenDate={lastSeen} 
              />
              
              <GPSRadarCard 
                gpsData={deviceData?.gps} 
                geofenceData={deviceData?.geofence} 
                deviceId={deviceId}
                currentMaxDistance={deviceData?.controls?.max_distance}
                customToast={showCustomToast}
              />

              <ControlCard
                deviceData={deviceData} // Pass deviceData raw
                localControls={localControls} // Pass local state untuk switch
                uvMode={deviceData?.control_modes?.uv_light}
                ultrasonicMode={deviceData?.control_modes?.ultrasonic}
                handleModeChange={handleModeChange}
                handleManualToggle={handleManualToggle}
                servoAngleDeg={servoAngleDeg}
                setServoAngleDeg={setServoAngleDeg}
                pushServoAngle={pushServoAngle}
                applyPreset={applyPreset}
                autoCfg={autoCfg}
                toggleAutoRun={toggleAutoRun}
                customToast={showCustomToast} 
              />
            </div>
            <div className="lg:col-span-1 space-y-6 flex flex-col">
              <ScheduleCard 
                deviceData={deviceData} 
                relayScheduleForm={relayScheduleForm} 
                setRelayScheduleForm={setRelayScheduleForm} 
                handleRelayScheduleSave={handleRelayScheduleSave}
                customToast={showCustomToast}
              />
              <WhatsAppSchedulerCard 
                user={user} 
                userData={userData} 
                customToast={showCustomToast}
              />
              <LogsCard logs={deviceData?.logs} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default DashboardPage;