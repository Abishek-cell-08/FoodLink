import React, { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { io, type Socket } from "socket.io-client";
import { latLngBounds, type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "../../api/client";
import { Button, Card } from "../UI";
import { appStorage, getApiBaseUrl, getGeolocation, isNativeAppShell, openExternalUrl } from "../../utils/platform";

type TrackingRole = "NGO" | "DONOR";
type SocketStatus = "connecting" | "joined" | "disconnected";

interface TrackingLocation {
  lat?: number | null;
  lng?: number | null;
  updatedAt?: string | null;
}

interface TrackingSession {
  requestId: number;
  donationId: number;
  foodType: string;
  quantity: string;
  pickupAddress: string;
  trackingStatus: string;
  verifiedAt?: string | null;
  ngoName?: string | null;
  ngoLocation: TrackingLocation;
  donorLocation: TrackingLocation;
  destination: TrackingLocation;
}

interface LivePickupTrackerProps {
  role: TrackingRole;
  requestId?: number;
  donationId?: number;
  onClose: () => void;
}

interface MapPoint {
  id: "destination" | "ngo" | "donor";
  label: string;
  subtitle: string;
  color: string;
  fillColor: string;
  position: LatLngExpression;
  updatedAt?: string | null;
}

const LivePickupTracker: React.FC<LivePickupTrackerProps> = ({ role, requestId, donationId, onClose }) => {
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("connecting");
  const [socketError, setSocketError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const useMobileShell = isNativeAppShell();

  const fetchUrl = role === "NGO" ? `/api/ngo/tracking/${requestId}` : `/api/donor/donations/${donationId}/tracking`;
  const updateUrl =
    role === "NGO"
      ? `/api/ngo/tracking/${requestId}/location`
      : `/api/donor/donations/${donationId}/tracking/location`;

  async function fetchSession() {
    try {
      setError(null);
      const response = await api.get(fetchUrl);
      setSession(response.data?.data || null);
    } catch (err) {
      console.error("Failed to load tracking session", err);
      setError("Failed to load live tracking session");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchSession();
    const intervalId = window.setInterval(fetchSession, 15000);
    return () => window.clearInterval(intervalId);
  }, [fetchUrl]);

  const resolvedRequestId = role === "NGO" ? requestId : session?.requestId;

  useEffect(() => {
    if (!resolvedRequestId) {
      return;
    }

    const token = appStorage.get("token");
    if (!token) {
      setSocketStatus("disconnected");
      setSocketError("Missing session token for live tracking");
      return;
    }

    setSocketStatus("connecting");
    setSocketError(null);

    const socket = io(getApiBaseUrl(), {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("connecting");
      socket.emit("tracking:join", { requestId: resolvedRequestId, token });
    });

    socket.on("tracking:joined", () => {
      setSocketStatus("joined");
    });

    socket.on("tracking:update", (nextSession: TrackingSession) => {
      if (nextSession?.requestId === resolvedRequestId) {
        setSession(nextSession);
      }
    });

    socket.on("tracking:error", (payload: { message?: string }) => {
      setSocketStatus("disconnected");
      setSocketError(payload?.message ?? "Unable to join the live tracking room");
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    return () => {
      socket.emit("tracking:leave", { requestId: resolvedRequestId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [resolvedRequestId]);

  function stopSharing() {
    const geolocation = getGeolocation();
    if (watchIdRef.current != null && geolocation) {
      geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setSharing(false);
  }

  useEffect(() => () => stopSharing(), []);

  async function pushLocation(lat: number, lng: number) {
    try {
      const response = await api.post(updateUrl, { lat, lng });
      if (response.data?.data) {
        setSession(response.data.data);
      }
    } catch (err) {
      console.error("Failed to update live location", err);
      setShareError("Failed to publish live location");
    }
  }

  function startSharing() {
    setShareError(null);
    stopSharing();

    const geolocation = getGeolocation();
    if (!geolocation) {
      setShareError("Geolocation is not available on this device");
      return;
    }

    const watchId = geolocation.watchPosition(
      async (position) => {
        await pushLocation(position.coords.latitude, position.coords.longitude);
        setSharing(true);
      },
      (positionError) => {
        console.error("Geolocation error", positionError);
        setShareError("Location permission denied or unavailable");
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    watchIdRef.current = watchId;
  }

  const mapPoints = useMemo<MapPoint[]>(() => {
    if (!session) {
      return [];
    }

    const points = [
      {
        id: "destination" as const,
        label: "Pickup Point",
        subtitle: session.pickupAddress,
        color: "#0f172a",
        fillColor: "#0f172a",
        location: session.destination,
      },
      {
        id: "ngo" as const,
        label: role === "NGO" ? "Your NGO Team" : session.ngoName ?? "NGO Team",
        subtitle: "En route live position",
        color: "#047857",
        fillColor: "#10b981",
        location: session.ngoLocation,
      },
      {
        id: "donor" as const,
        label: role === "DONOR" ? "Your Position" : "Donor",
        subtitle: "Coordination signal",
        color: "#4338ca",
        fillColor: "#6366f1",
        location: session.donorLocation,
      },
    ];

    return points
      .filter((point) => point.location.lat != null && point.location.lng != null)
      .map((point) => ({
        id: point.id,
        label: point.label,
        subtitle: point.subtitle,
        color: point.color,
        fillColor: point.fillColor,
        position: [point.location.lat as number, point.location.lng as number],
        updatedAt: point.location.updatedAt,
      }));
  }, [role, session]);

  const mapBounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (!mapPoints.length) {
      return null;
    }

    return latLngBounds(mapPoints.map((point) => point.position));
  }, [mapPoints]);

  const polylineSegments = useMemo<LatLngExpression[][]>(() => {
    const pickupPoint = mapPoints.find((point) => point.id === "destination");
    const ngoPoint = mapPoints.find((point) => point.id === "ngo");
    const donorPoint = mapPoints.find((point) => point.id === "donor");
    const segments: LatLngExpression[][] = [];

    if (pickupPoint && ngoPoint) {
      segments.push([ngoPoint.position, pickupPoint.position]);
    }

    if (pickupPoint && donorPoint) {
      segments.push([donorPoint.position, pickupPoint.position]);
    }

    return segments;
  }, [mapPoints]);

  const openStreetMapUrl = useMemo(() => {
    const targetPoint = mapPoints[0];
    if (!targetPoint) {
      return session?.pickupAddress
        ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(session.pickupAddress)}`
        : null;
    }

    const [lat, lng] = targetPoint.position as [number, number];
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  }, [mapPoints, session]);

  const distanceKm = useMemo(() => {
    if (
      session?.ngoLocation?.lat == null ||
      session?.ngoLocation?.lng == null ||
      session?.destination?.lat == null ||
      session?.destination?.lng == null
    ) {
      return null;
    }

    return haversineKm(
      session.ngoLocation.lat,
      session.ngoLocation.lng,
      session.destination.lat,
      session.destination.lng,
    );
  }, [session]);

  const etaMinutes = useMemo(() => {
    if (distanceKm == null) {
      return null;
    }

    return Math.max(1, Math.round((distanceKm / 22) * 60));
  }, [distanceKm]);

  const distanceLabel = distanceKm != null ? `${distanceKm.toFixed(2)} km` : "Unknown";
  const progressLabel = distanceKm == null ? 0 : Math.max(8, Math.min(96, 100 - distanceKm * 9));

  const statusTone = session?.verifiedAt
    ? "Completed"
    : sharing
      ? "Live sharing active"
      : socketStatus === "joined"
        ? "Realtime connected"
        : session?.trackingStatus === "TRACKING_ACTIVE"
          ? "Pickup in motion"
          : "Awaiting live updates";

  return (
    <Card
      className={`w-full overflow-y-auto border-none bg-white p-0 shadow-2xl ${
        useMobileShell
          ? "max-h-[96svh] max-w-[430px] rounded-[18px]"
          : "max-h-[94vh] max-w-6xl"
      }`}
    >
      <style>{`
        .tracker-map .leaflet-container {
          height: 100%;
          width: 100%;
          background: linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%);
        }
        .tracker-map .leaflet-tooltip {
          border: none;
          border-radius: 14px;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
          color: #0f172a;
          font-size: 11px;
          font-weight: 700;
          padding: 8px 10px;
        }
      `}</style>

      <div className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.24),_transparent_32%),linear-gradient(135deg,#f4fbf7_0%,#ffffff_45%,#eef4ff_100%)] px-5 py-6 sm:px-6">
        <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute left-10 top-10 h-20 w-20 rounded-full bg-indigo-200/30 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 shadow-sm ring-1 ring-emerald-100">
              Live Pickup Command Center
            </div>
            <h3 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{session?.foodType ?? "Pickup Tracking"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Live positions are now streamed through Socket.IO and visualized on an OpenStreetMap-powered Leaflet board.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusChip label={statusTone} tone="emerald" />
              <StatusChip label={`Request #${session?.requestId ?? "-"}`} tone="slate" />
              <StatusChip label={session?.quantity ?? "-"} tone="indigo" />
            </div>
          </div>
          <div className={`flex gap-2 ${useMobileShell ? "flex-col" : "flex-col sm:flex-row"}`}>
            {openStreetMapUrl && (
              <Button
                variant="outline"
                className={`border-slate-200 bg-white/90 shadow-sm backdrop-blur ${useMobileShell ? "w-full" : ""}`}
                onClick={() => openExternalUrl(openStreetMapUrl)}
              >
                Open Map
              </Button>
            )}
            <Button
              variant="outline"
              className={`border-white/80 bg-white/90 shadow-sm backdrop-blur ${useMobileShell ? "w-full" : ""}`}
              onClick={() => {
                stopSharing();
                onClose();
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center font-medium text-slate-400">Loading live tracker...</div>
      ) : error ? (
        <div className="m-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      ) : session ? (
        <div className="space-y-6 p-4 sm:p-6">
          <div className={`grid gap-4 ${useMobileShell ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"}`}>
            <MetricCard
              label="Tracking Status"
              value={session.trackingStatus}
              meta={session.verifiedAt ? "Pickup confirmed" : statusTone}
              accent="emerald"
            />
            <MetricCard
              label="ETA"
              value={etaMinutes != null ? `${etaMinutes} min` : "-"}
              meta={`Distance ${distanceLabel}`}
              accent="indigo"
            />
            <MetricCard
              label="Route Progress"
              value={`${Math.round(progressLabel)}%`}
              meta="Estimated from NGO to pickup point"
              accent="amber"
            />
            <Card className="border-slate-200 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sharing Control</div>
              <div className="mt-2 text-lg font-black text-slate-900">{sharing ? "Broadcasting" : "Paused"}</div>
              <div className="mt-1 text-xs text-slate-500">
                Socket: {socketStatus === "joined" ? "connected" : socketStatus}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={startSharing} disabled={sharing || session.verifiedAt != null}>
                  Start Live
                </Button>
                <Button size="sm" variant="outline" onClick={stopSharing} disabled={!sharing}>
                  Stop
                </Button>
              </div>
            </Card>
          </div>

          {shareError && <div className="rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-800">{shareError}</div>}
          {socketError && <div className="rounded-lg bg-slate-100 p-4 text-sm font-medium text-slate-700">{socketError}</div>}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.9fr]">
            <div className={`overflow-hidden border border-slate-200 bg-white shadow-sm ${useMobileShell ? "rounded-[16px]" : "rounded-[28px]"}`}>
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Live Route View</h4>
                  <p className="text-xs text-slate-500">Leaflet map with live NGO, donor, and pickup markers over OpenStreetMap tiles</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <LegendPill label="Pickup" className="bg-slate-900 text-white" />
                  <LegendPill label="NGO" className="bg-emerald-600 text-white" />
                  <LegendPill label="Donor" className="bg-indigo-600 text-white" />
                </div>
              </div>

              {mapPoints.length ? (
                <div className={`tracker-map w-full ${useMobileShell ? "h-[280px]" : "h-[360px] sm:h-[470px]"}`}>
                  <MapContainer
                    center={mapPoints[0].position}
                    zoom={13}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapBounds && <FitMapBounds bounds={mapBounds} />}
                    {polylineSegments.map((segment, index) => (
                      <Polyline
                        key={`${index}-${segment.length}`}
                        positions={segment}
                        pathOptions={{
                          color: index === 0 ? "#10b981" : "#6366f1",
                          weight: index === 0 ? 5 : 4,
                          opacity: 0.85,
                          dashArray: index === 0 ? "10 10" : "6 8",
                        }}
                      />
                    ))}
                    {mapPoints.map((point) => (
                      <CircleMarker
                        key={point.id}
                        center={point.position}
                        radius={point.id === "destination" ? 12 : 11}
                        pathOptions={{
                          color: point.color,
                          fillColor: point.fillColor,
                          fillOpacity: 0.92,
                          weight: 3,
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -10]} permanent>
                          <div>{point.label}</div>
                          <div className="mt-1 font-medium text-slate-500">{point.subtitle}</div>
                          <div className="mt-1 font-medium text-slate-400">
                            {point.updatedAt ? new Date(point.updatedAt).toLocaleTimeString() : "Waiting for update"}
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              ) : (
                <div className={`flex items-center justify-center px-6 text-center text-sm text-slate-500 ${useMobileShell ? "h-[280px]" : "h-[360px] sm:h-[470px]"}`}>
                  Waiting for location coordinates to render the live map.
                </div>
              )}
            </div>

            <div className="space-y-5">
              <Card className="overflow-hidden border-none bg-slate-900 text-white shadow-xl">
                <div className="bg-[linear-gradient(135deg,rgba(16,185,129,0.34),rgba(99,102,241,0.14))] p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Mission Snapshot</div>
                  <div className="mt-2 text-lg font-black sm:text-xl">{session.foodType}</div>
                  <div className="mt-2 text-sm text-slate-300">{session.pickupAddress}</div>
                </div>
                <div className="space-y-3 p-5 text-sm">
                  <InfoRow label="Quantity" value={session.quantity} />
                  <InfoRow label="ETA" value={etaMinutes != null ? `${etaMinutes} min` : "-"} />
                  <InfoRow label="Distance" value={distanceLabel} />
                  <InfoRow label="Live Feed" value={socketStatus === "joined" ? "Socket.IO" : "REST fallback"} />
                </div>
              </Card>

              <Card className="border-slate-200 p-5">
                <h4 className="mb-4 font-bold text-slate-900">Tracked Positions</h4>
                <div className="space-y-4 text-sm">
                  <LocationBlock
                    title="Pickup Point"
                    subtitle={session.pickupAddress}
                    location={session.destination}
                    accent="slate"
                  />
                  <LocationBlock
                    title={role === "NGO" ? "Your NGO Team" : session.ngoName ?? "NGO Team"}
                    subtitle="Primary moving unit"
                    location={session.ngoLocation}
                    accent="emerald"
                  />
                  <LocationBlock
                    title={role === "DONOR" ? "Your Live Position" : "Donor Live Position"}
                    subtitle="Optional donor coordination signal"
                    location={session.donorLocation}
                    accent="indigo"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};

const FitMapBounds: React.FC<{ bounds: LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [bounds, map]);

  return null;
};

const MetricCard: React.FC<{ label: string; value: string; meta: string; accent: "emerald" | "indigo" | "amber" }> = ({
  label,
  value,
  meta,
  accent,
}) => {
  const accentMap = {
    emerald: "from-emerald-50 to-emerald-100/70 text-emerald-700",
    indigo: "from-indigo-50 to-indigo-100/70 text-indigo-700",
    amber: "from-amber-50 to-amber-100/70 text-amber-700",
  };

  return (
    <Card className={`border-slate-200 bg-gradient-to-br p-4 ${accentMap[accent]}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{meta}</div>
    </Card>
  );
};

const LocationBlock: React.FC<{
  title: string;
  subtitle: string;
  location: TrackingLocation;
  accent: "slate" | "emerald" | "indigo";
}> = ({ title, subtitle, location, accent }) => {
  const accentMap = {
    slate: "border-slate-200 bg-slate-50",
    emerald: "border-emerald-100 bg-emerald-50/70",
    indigo: "border-indigo-100 bg-indigo-50/70",
  };

  return (
    <div className={`rounded-2xl border p-3 ${accentMap[accent]}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      <div className="mt-2 font-semibold text-slate-900">
        {location.lat != null && location.lng != null ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Not available"}
      </div>
      <div className="mt-1 text-[11px] text-slate-400">
        {location.updatedAt ? `Updated ${new Date(location.updatedAt).toLocaleTimeString()}` : "No recent update"}
      </div>
    </div>
  );
};

const StatusChip: React.FC<{ label: string; tone: "emerald" | "slate" | "indigo" }> = ({ label, tone }) => {
  const toneMap = {
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${toneMap[tone]}`}>{label}</span>;
};

const LegendPill: React.FC<{ label: string; className: string }> = ({ label, className }) => (
  <span className={`rounded-full px-2 py-1 font-bold ${className}`}>{label}</span>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-white/10 pb-2">
    <span className="text-slate-400">{label}</span>
    <span className="font-bold text-white">{value}</span>
  </div>
);

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

export default LivePickupTracker;
