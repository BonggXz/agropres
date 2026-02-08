import React from 'react';
import { 
  Settings, Lightbulb, Volume2, Save, Pause, Play, Clock, Edit2, Activity
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Input } from './ui/input';

/* HEADER COMPONENT */
export const DashboardHeader = ({ user, onLogout }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Agro Pres</h1>
      <p className="text-muted-foreground">Sistem Monitoring & Kontrol Hama</p>
    </div>
    <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
        {user?.email?.[0].toUpperCase() || 'U'}
      </div>
      <div className="text-sm mr-2 hidden md:block">
        <p className="font-medium">{user?.email}</p>
        <p className="text-xs text-muted-foreground">Administrator</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
        Keluar
      </Button>
    </div>
  </div>
);

/* STATUS CARD */
export const StatusCard = ({ isOnline, lastSeenSeconds, lastSeenDate }) => {
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds} detik`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} jam ${minutes} menit`;
  };

  const onlineSince = lastSeenDate 
    ? new Date(lastSeenDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <Card className="bg-white/80 backdrop-blur border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">Status Sistem</CardTitle>
        <Activity className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold flex items-center gap-2">
            {isOnline ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isOnline 
              ? `Online sejak pukul ${onlineSince} WIB` 
              : `Terakhir terlihat ${formatDuration(lastSeenSeconds)} yang lalu`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/* CONTROL CARD */
const ModeToggle = ({ mode, onChange }) => (
  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
    <Button size="sm" variant={mode === 'manual' ? 'default' : 'ghost'} onClick={() => onChange('manual')} className={`h-7 px-3 text-xs ${mode === 'manual' ? 'shadow-sm' : ''}`}>Manual</Button>
    <Button size="sm" variant={mode === 'auto' ? 'default' : 'ghost'} onClick={() => onChange('auto')} className={`h-7 px-3 text-xs ${mode === 'auto' ? 'shadow-sm' : ''}`}>Auto</Button>
  </div>
);

export const ControlCard = ({
  deviceData, localControls, uvMode, ultrasonicMode, handleModeChange, handleManualToggle,
  servoAngleDeg, setServoAngleDeg, pushServoAngle, applyPreset, autoCfg, toggleAutoRun, 
  customToast 
}) => {
  return (
    <Card className="bg-white/80 backdrop-blur shadow-sm col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Kontrol Perangkat</CardTitle>
              <CardDescription>Kelola aktuator dan sensor</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pb-8">
        {/* UV Light */}
        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Lampu UV</h3>
                <p className="text-xs text-muted-foreground">Pembasmi Serangga</p>
              </div>
            </div>
            <ModeToggle mode={uvMode} onChange={(m) => handleModeChange('uv_light', m)} />
          </div>
          <Separator className="my-3 bg-amber-100" />
          <div className="flex items-center justify-between">
            <Label htmlFor="uv-switch" className="text-sm cursor-pointer font-medium text-slate-600">Status Daya</Label>
            <Switch
              id="uv-switch"
              // GUNAKAN localControls agar respon instan
              checked={localControls?.uv_light} 
              onCheckedChange={(checked) => {
                handleManualToggle('uv_light', checked);
                if(customToast) customToast(checked ? 'Lampu UV Dinyalakan' : 'Lampu UV Dimatikan', 'success');
              }}
              disabled={uvMode !== 'manual'}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>

        {/* Ultrasonic */}
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg shadow-sm">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Ultrasonik</h3>
                <p className="text-xs text-muted-foreground">Pengusir Tikus</p>
              </div>
            </div>
            <ModeToggle mode={ultrasonicMode} onChange={(m) => handleModeChange('ultrasonic', m)} />
          </div>
          <Separator className="my-3 bg-indigo-100" />
          <div className="flex items-center justify-between mb-5">
            <Label htmlFor="ultrasonic-switch" className="text-sm cursor-pointer font-medium text-slate-600">Status Daya</Label>
            <Switch
              id="ultrasonic-switch"
              // GUNAKAN localControls agar respon instan
              checked={localControls?.ultrasonic}
              onCheckedChange={(checked) => {
                handleManualToggle('ultrasonic', checked);
                if(customToast) customToast(checked ? 'Ultrasonik Dinyalakan' : 'Ultrasonik Dimatikan', 'success');
              }}
              disabled={ultrasonicMode !== 'manual'}
              className="data-[state=checked]:bg-indigo-500"
            />
          </div>

          {/* Servo Control */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-600">Posisi Servo (Derajat)</Label>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded border shadow-sm">{servoAngleDeg}°</span>
            </div>
            <input type="range" min="0" max="180" value={servoAngleDeg} onChange={(e) => setServoAngleDeg(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button onClick={() => { pushServoAngle(); if(customToast) customToast('Posisi servo diperbarui', 'success'); }} className="gap-2 bg-indigo-600 hover:bg-indigo-700 w-full" size="sm">
                <Save className="w-4 h-4" /> Set Posisi
              </Button>
              {['Tikus', 'Burung', 'Serangga'].map((preset) => {
                const key = preset.toLowerCase() === 'tikus' ? 'rat' : preset.toLowerCase() === 'burung' ? 'bird' : 'insect';
                return (
                  <Button key={key} onClick={() => applyPreset(key)} variant="outline" size="sm" className="text-xs hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 w-full">
                    {preset}
                  </Button>
                );
              })}
            </div>

            {/* Auto Sweep */}
            <div className="mt-4 p-3 bg-white rounded-lg border flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-700">Auto Sweep</p>
                <p className="text-xs text-muted-foreground">Gerak otomatis</p>
              </div>
              <Button onClick={toggleAutoRun} variant={autoCfg.running ? 'destructive' : 'default'} size="sm" className={`gap-2 ${!autoCfg.running && 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {autoCfg.running ? <><Pause className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Start</>}
              </Button>
            </div>
            <div className="h-4"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* SCHEDULE CARD */
export const ScheduleCard = ({ deviceData, relayScheduleForm, setRelayScheduleForm, handleRelayScheduleSave, customToast }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  return (
    <Card className="bg-white/80 backdrop-blur shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg">Jadwal Relay</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} className="gap-1 h-8 text-xs hover:bg-slate-100">
            {isEditing ? 'Batal' : <><Edit2 className="w-3 h-3" /> Edit</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
          {!isEditing ? (
            <div className="space-y-3">
              {['uv_light', 'ultrasonic'].map((key) => (
                <div key={key} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                  <span className="text-sm font-medium capitalize text-slate-700">{key.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-slate-600">ON: {deviceData?.relay_schedules?.[key]?.on_time || '--:--'}</span>
                    <span className="text-xs text-slate-400">➜</span>
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-slate-600">OFF: {deviceData?.relay_schedules?.[key]?.off_time || '--:--'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {['uv_light', 'ultrasonic'].map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs font-semibold capitalize text-slate-600">{key.replace('_', ' ')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Jam Nyala</span>
                        <Input type="time" className="h-8 text-xs" value={relayScheduleForm[key]?.on_time || ''} onChange={(e) => setRelayScheduleForm({ ...relayScheduleForm, [key]: { ...relayScheduleForm[key], on_time: e.target.value }, })} />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Jam Mati</span>
                        <Input type="time" className="h-8 text-xs" value={relayScheduleForm[key]?.off_time || ''} onChange={(e) => setRelayScheduleForm({ ...relayScheduleForm, [key]: { ...relayScheduleForm[key], off_time: e.target.value }, })} />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={() => { 
                  handleRelayScheduleSave(); 
                  setIsEditing(false); 
              }} className="w-full gap-2 mt-2" size="sm">
                <Save className="w-4 h-4" /> Simpan Jadwal
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  );
};