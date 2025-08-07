import maplibregl from 'maplibre-gl';

import type { CensusTract, CommunityArea } from '$lib/types';

export class Popup {
	private map: maplibregl.Map;
	private popup: maplibregl.Popup | null = null;
	private isTabletOrAbove: boolean;

	constructor(map: maplibregl.Map, isTabletOrAbove: boolean) {
		this.map = map;
		this.isTabletOrAbove = isTabletOrAbove;
	}

	showPopup(lngLat: maplibregl.LngLat, data: CensusTract | CommunityArea): maplibregl.Popup {
		if (this.popup) {
			this.popup.remove();
		}

		const { x, y } = this.map.project(lngLat);
		const mapHeight = this.map.getContainer().offsetHeight;
		const mapWidth = this.map.getContainer().offsetWidth;
		const popupWidth = 318;
		const popupHeight = 246;

		let anchor: maplibregl.PositionAnchor = 'top';
		let position: maplibregl.LngLatLike = lngLat;

		// On tablet or desktop, position
		if (this.isTabletOrAbove) {
			let verticalAnchor = 'bottom';
			let horizontalAnchor = '';

			if (y < mapHeight - popupHeight) {
				verticalAnchor = 'top';
			}

			if (x < popupWidth) {
				horizontalAnchor = 'left';
			} else if (x > mapWidth - popupWidth) {
				horizontalAnchor = 'right';
			}

			anchor =
				`${verticalAnchor}${horizontalAnchor ? '-' + horizontalAnchor : ''}` as maplibregl.PositionAnchor;
		} else {
			anchor = 'top-left';
			position = this.map.unproject([(mapWidth / 100) * 3, mapHeight - popupHeight - 24 - 34 - 8]);
		}

		this.popup = new maplibregl.Popup({
			closeButton: false,
			closeOnClick: true,
			maxWidth: `${popupWidth}px`,
			anchor
		})
			.setLngLat(position)
			.setHTML(this.generatePopupContent(data))
			.addTo(this.map);

		// Add tab event listeners.
		const tabs = document.querySelectorAll<HTMLButtonElement>('[data-popup-tab]');
		const tabsContent = document.querySelectorAll<HTMLDivElement>('[data-popup-tabcontent]');

		tabs.forEach((tab) => {
			tab.addEventListener('click', () => {
				// Reset all tabs to normal weight.
				tabs.forEach((tab) => {
					tab.parentElement?.classList.remove('active-tab');
				});

				tabsContent.forEach((content) => {
					content.style.display = 'none';
				});

				tab.parentElement?.classList.add('active-tab');

				const targetContent = document.querySelector<HTMLDivElement>(
					`[data-popup-tabcontent="${tab.getAttribute('data-popup-tab')}"]`
				);

				if (targetContent) {
					targetContent.style.display = 'block';
				}
			});
		});

		return this.popup;
	}

	removePopup() {
		if (this.popup) {
			this.popup.remove();
			this.popup = null;
		}
	}

	private generatePopupContent(data: CensusTract | CommunityArea): string {
		const formatCurrency = (value: number | null | undefined) => {
			if (!value || value === null || value === undefined) return 'N/A';
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			}).format(value);
		};

		const formatPercent = (value: number | null | undefined) => {
			if (value === null || value === undefined) return 'N/A';
			return `${value.toFixed(1)}%`;
		};

		const formatCount = (value: number | null | undefined) => {
			if (value === null || value === undefined) return 'N/A';
			return value.toLocaleString();
		};

		const formatTitle = (data: CensusTract | CommunityArea) => {
			if ('community' in data) {
				return data.community;
			} else if ('geoid' in data) {
				return `Census Tract ${data.geoid}`;
			}
		};

		return `
			<h3 class="m-0 mb-2 text-lg font-medium">${formatTitle(data)}</h3>
			<div>
				<ul class="-mx-3 mb-0 flex list-none gap-4 border-b border-slate-500 px-3">
					<li class="active-tab border-b-2 border-b-transparent pb-1 transition-all">
						<button
							class="border-0 bg-transparent p-0 text-xs tracking-wider text-slate-500 uppercase"
							data-popup-tab="service-line-inventory"
						>
							Service Line Inventory
						</button>
					</li>
					<li class="border-b-2 border-b-transparent pb-1 transition-all">
						<button
							class="border-0 bg-transparent p-0 text-xs tracking-wider text-slate-500 uppercase"
							data-popup-tab="demographics"
						>
							Demographics
						</button>
					</li>
				</ul>
				<div data-popup-tabcontent="service-line-inventory" class="mt-2">
					<table class="table-fixed border-collapse font-sans text-xs text-slate-500">
						<colgroup>
							<col class="w-60" />
							<col class="w-20" />
							<col class="w-20" />
						</colgroup>
						<tbody>
							<tr>
								<td class="p-1">Lead</td>
								<td class="text-earth p-1 text-right font-medium">${formatCount(data.L)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_lead)}</td>
							</tr>
							<tr>
								<td class="p-1">Galvanized (Replace)</td>
								<td class="text-earth p-1 text-right font-medium">${formatCount(data.GRR)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_grr)}</td>
							</tr>
							<tr>
								<td class="p-1">Unknown (Suspected Lead)</td>
								<td class="text-earth p-1 text-right font-medium">${formatCount(data.U)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_suspected_lead)}</td>
							</tr>
							<tr>
								<td class="p-1">Non-Lead</td>
								<td class="text-earth p-1 text-right font-medium">${formatCount(data.NL)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_not_lead)}</td>
							</tr>
						</tbody>
						<tfoot class="border-t border-slate-300">
							<tr>
								<td class="p-1">Total</td>
								<td class="text-earth p-1 text-right font-medium">${formatCount(data.total)}</td>
							</tr>
							<tr class="rounded bg-red-100 text-red-600">
								<td class="p-1">Requires Replacement</td>
								<td class="p-1 text-right font-medium">${formatCount(data.requires_replacement || 0)}</td>
								<td class="p-1 text-right font-medium">
									${formatPercent(data.pct_requires_replacement || 0)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
				<div data-popup-tabcontent="demographics" style="display: none" class="mt-2">
					<table class="w-full table-fixed border-collapse text-xs">
						<tr>
							<td class="p-1 text-slate-500">Median Income</td>
							<td class="text-earth p-1 text-right font-medium">
								${formatCurrency(data.median_household_income)}
							</td>
						</tr>
						<tr>
							<td class="p-1 text-slate-500">Poverty Rate</td>
							<td class="text-earth p-1 text-right font-medium">${formatPercent(data.pct_poverty)}</td>
						</tr>
						<tr>
							<td class="p-1 text-slate-500">Black Population</td>
							<td class="text-earth p-1 text-right font-medium">
								${formatPercent(data.pct_black_nonhispanic)}
							</td>
						</tr>
						<tr>
							<td class="p-1 text-slate-500">White Population</td>
							<td class="text-earth p-1 text-right font-medium">
								${formatPercent(data.pct_white_nonhispanic)}
							</td>
						</tr>
						<tr>
							<td class="p-1 text-slate-500">Asian Population</td>
							<td class="text-earth p-1 text-right font-medium">
								${formatPercent(data.pct_asian_nonhispanic)}
							</td>
						</tr>
						<tr class="border-b border-transparent">
							<td class="p-1 text-slate-500">Minority Population</td>
							<td class="text-earth p-1 text-right font-medium">${formatPercent(data.pct_minority)}</td>
						</tr>
					</table>
				</div>
			</div>
		`;
	}
}
