import L from "leaflet";

// Leaflet 1.9.4 bug: when a zoom animation is in flight and the map is torn
// down mid-transition (React unmounts MapContainer — e.g. the admin
// navigates away right after scrolling to zoom), map.remove() deletes
// `_mapPane` but never clears `_animatingZoom` or cancels the 250ms
// `_onZoomTransitionEnd` fallback timer already scheduled by
// `_tryAnimatedZoom`. That timer still fires after removal and
// unconditionally calls `_move(...)`, which reads `_leaflet_pos` off the
// now-`undefined` `_mapPane` and throws. Patch it to no-op once the pane is
// gone, since there is nothing left to animate anyway.
const proto = L.Map.prototype as unknown as {
  _onZoomTransitionEnd: (this: L.Map & { _mapPane?: HTMLElement }) => void;
  __patchedZoomTransitionEnd?: boolean;
};

if (!proto.__patchedZoomTransitionEnd) {
  const original = proto._onZoomTransitionEnd;
  proto._onZoomTransitionEnd = function (this: L.Map & { _mapPane?: HTMLElement }) {
    if (!this._mapPane) return;
    return original.call(this);
  };
  proto.__patchedZoomTransitionEnd = true;
}
