"use client";

import { useEffect, useState } from "react";

// Shared singleton around ONE /ws/prices socket. Components subscribe by
// conditionId; subscriptions are ref-counted, so many cards/options share a
// single connection. On every price_update we fan out the latest {yes,no} to
// listeners of that conditionId.

import { API_BASE, WS_BASE } from "@/src/config/api";

export interface LivePrice {
  yes: number;
  no: number;
  resolved?: boolean;
  locked?: boolean;
}

type Listener = (price: LivePrice) => void;

let ws: WebSocket | null = null;
const subscribers = new Map<string, Set<Listener>>(); // conditionId -> listeners
const latest      = new Map<string, LivePrice>();      // last value per conditionId
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function isOpen() {
  return ws?.readyState === WebSocket.OPEN;
}

function send(obj: unknown) {
  if (isOpen()) ws!.send(JSON.stringify(obj));
}

function ensureSocket() {
  if (typeof window === "undefined") return;          // never connect during SSR
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(`${WS_BASE}/ws/prices`);

  ws.onopen = () => {
    // (re)subscribe to everything currently active
    subscribers.forEach((_, conditionId) => send({ action: "subscribe", conditionId }));
  };

  ws.onmessage = (ev) => {
    let msg: any;
    try { msg = JSON.parse(ev.data); } catch { return; }

    const cid: string | undefined = msg.conditionId;
    if (!cid) return;

    if (msg.type === "price_update") {
      const prev = latest.get(cid);
      const price: LivePrice = {
        yes: typeof msg.yes === "number" ? msg.yes : prev?.yes ?? 0,
        no:  typeof msg.no  === "number" ? msg.no  : prev?.no  ?? 0,
        resolved: prev?.resolved,
        locked: prev?.locked,
      };
      latest.set(cid, price);
      subscribers.get(cid)?.forEach((fn) => fn(price));
    } else if (msg.type === "market_resolved" || msg.type === "market_locked") {
      const prev = latest.get(cid) ?? { yes: 0, no: 0 };
      const price: LivePrice = {
        ...prev,
        resolved: msg.type === "market_resolved" ? true : prev.resolved,
        locked:   msg.type === "market_locked"   ? true : prev.locked,
      };
      latest.set(cid, price);
      subscribers.get(cid)?.forEach((fn) => fn(price));
    }
    // history_point / spot etc. are ignored here.
  };

  ws.onclose = () => {
    ws = null;
    scheduleReconnect();
  };

  ws.onerror = () => {
    try { ws?.close(); } catch { /* noop */ }
  };
}

function scheduleReconnect() {
  if (reconnectTimer || subscribers.size === 0) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (subscribers.size > 0) ensureSocket();
  }, 1500);
}

/** Subscribe a single conditionId. Returns an unsubscribe fn. */
export function subscribePrice(conditionId: string, fn: Listener): () => void {
  ensureSocket();

  let set = subscribers.get(conditionId);
  if (!set) {
    set = new Set();
    subscribers.set(conditionId, set);
    send({ action: "subscribe", conditionId }); // first subscriber → tell server
  }
  set.add(fn);

  const last = latest.get(conditionId); // deliver last known immediately
  if (last) fn(last);

  return () => {
    const s = subscribers.get(conditionId);
    if (!s) return;
    s.delete(fn);
    if (s.size === 0) {
      subscribers.delete(conditionId);
      send({ action: "unsubscribe", conditionId });
    }
  };
}

/** Hook: subscribe to several conditionIds, get a map conditionId → LivePrice. */
export function useLivePrices(conditionIds: (string | undefined)[]): Record<string, LivePrice> {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});

  // stable dependency key so a fresh array identity doesn't resubscribe
  const key = Array.from(new Set(conditionIds.filter(Boolean) as string[])).sort().join(",");

  useEffect(() => {
    if (!key) return;
    const ids = key.split(",");
    const unsubs = ids.map((id) =>
      subscribePrice(id, (price) => setPrices((prev) => ({ ...prev, [id]: price })))
    );
    return () => { unsubs.forEach((u) => u()); };
  }, [key]);

  return prices;
}
