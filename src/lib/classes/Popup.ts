import maplibregl from 'maplibre-gl';

import type { CensusTract, CommunityArea } from '$lib/types';
import {
	formatCount,
	formatCurrency,
	formatPercent,
	formatAreaIdentifier
} from '$lib/utils/formatters';
import { SERVICE_LINE_DEFINITIONS, getTooltipPositioningScript } from '$lib/utils/tooltips';

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
		const popupWidth = this.isTabletOrAbove ? 318 : 264;
		const popupHeight = this.isTabletOrAbove ? 242 : 222;

		let anchor: maplibregl.PositionAnchor = 'top';
		let position: maplibregl.LngLatLike = lngLat;

		// On tablet or desktop, position the tooltip dynamically to prevent it from
		// rendering offscreen.
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
			// On mobile, use a fixed position in the bottom left of the screen,
			// accounting for the Filters button.
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
		// Add inline styles for tooltips
		const tooltipStyles = `
			<style>
				.tooltip-trigger {
					cursor: help;
					display: inline-block;
					margin-left: 2px;
					color: #cbd5e1;
					vertical-align: text-bottom;
					position: relative;
					top: -1px;
					transition: color 0.2s;
				}
				.tooltip-trigger:hover {
					color: #94a3b8;
				}
				.tooltip-container {
					position: relative;
					display: inline-block;
				}
				.tooltip-content {
					visibility: hidden;
					width: 200px;
					background-color: #1e293b;
					color: #fff;
					text-align: left;
					border-radius: 6px;
					padding: 8px 10px;
					position: fixed;
					z-index: 99999;
					opacity: 0;
					transition: opacity 0.3s;
					font-size: 11px;
					line-height: 1.4;
					pointer-events: none;
				}
				.tooltip-container:hover .tooltip-content {
					visibility: visible;
					opacity: 1;
				}
			</style>
		`;

		// Inline JavaScript for viewport-aware positioning
		const tooltipScript = `
			<script>
				${getTooltipPositioningScript()}
				
				function setupTooltips() {
					const containers = document.querySelectorAll('.tooltip-container');
					containers.forEach(container => {
						const trigger = container.querySelector('.tooltip-trigger');
						const content = container.querySelector('.tooltip-content');
						if (!trigger || !content) return;
						
						trigger.addEventListener('mouseenter', () => {
							positionTooltip(trigger, content);
						});
					});
				}
				setTimeout(setupTooltips, 0);
			</script>
		`;

		return `
			${tooltipStyles}
			${tooltipScript}
			<h3 class="m-0 mb-1 text-base font-medium sm:mb-2 sm:text-lg">${formatAreaIdentifier(data)}</h3>
			<div>
				<ul class="-mx-1.5 my-0 flex list-none gap-4 border-b border-slate-500 px-1.5 sm:-mx-3 sm:px-3">
					<li class="active-tab border-b-2 border-b-transparent pb-1 transition-all">
						<button
							class="text-2xs border-0 bg-transparent p-0 tracking-wider text-slate-500 uppercase sm:text-xs"
							data-popup-tab="service-line-inventory"
						>
							Service Line Inventory
						</button>
					</li>
					<li class="border-b-2 border-b-transparent pb-1 transition-all">
						<button
							class="text-2xs border-0 bg-transparent p-0 tracking-wider text-slate-500 uppercase sm:text-xs"
							data-popup-tab="demographics"
						>
							Demographics
						</button>
					</li>
				</ul>
				<div data-popup-tabcontent="service-line-inventory" class="mt-2">
					<table class="text-2xs w-full table-fixed border-collapse font-sans text-slate-500 sm:text-xs">
						<tbody>
							<colgroup>
								<col width="60%" />
								<col width="20%" />
								<col width="20%" />
							</colgroup>
							<tr>
								<td class="p-1">
									Lead
									<span class="tooltip-container">
										<svg class="tooltip-trigger" width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
										</svg>
										<span class="tooltip-content">${SERVICE_LINE_DEFINITIONS.lead}</span>
									</span>
								</td>
								<td class="text-earth p-1 text-right font-medium">${formatCount(data.L)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_lead)}</td>
							</tr>
							<tr>
								<td class="p-1">
									Suspected Lead
									<span class="tooltip-container">
										<svg class="tooltip-trigger" width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
										</svg>
										<span class="tooltip-content">${SERVICE_LINE_DEFINITIONS.suspected}</span>
									</span>
								</td>
								<td class="text-earth p-1 text-right font-medium">${formatCount(data.U)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_suspected_lead)}</td>
							</tr>
							<tr>
								<td class="p-1">
									Galvanized (Replace)
									<span class="tooltip-container">
										<svg class="tooltip-trigger" width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
										</svg>
										<span class="tooltip-content">${SERVICE_LINE_DEFINITIONS.galvanized}</span>
									</span>
								</td>
								<td class="text-earth p-1 text-right font-medium">${formatCount(data.GRR)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_grr)}</td>
							</tr>
							<tr>
								<td class="p-1">
									Non-Lead
									<span class="tooltip-container">
										<svg class="tooltip-trigger" width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
										</svg>
										<span class="tooltip-content">${SERVICE_LINE_DEFINITIONS['non-lead']}</span>
									</span>
								</td>
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
								<td class="p-1 text-right font-medium">${formatCount(data.requires_replacement)}</td>
								<td class="p-1 text-right font-medium">
									${formatPercent(data.pct_requires_replacement)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
				<div data-popup-tabcontent="demographics" style="display: none" class="mt-2">
					<table class="text-2xs w-full table-fixed border-collapse font-sans text-slate-500 sm:text-xs">
						<tbody>
							<colgroup>
								<col width="50%" />
								<col width="50%" />
							</colgroup>
							<tr>
								<td class="p-1 text-slate-500">Median Household Income</td>
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
								<td class="p-1 text-slate-500">Non-White Population</td>
								<td class="text-earth p-1 text-right font-medium">${formatPercent(data.pct_minority)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		`;
	}
}
