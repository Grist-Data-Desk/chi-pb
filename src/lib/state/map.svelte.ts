import type { Map } from 'maplibre-gl';

export const mapState = $state<{ map: Map | null }>({ map: null });
