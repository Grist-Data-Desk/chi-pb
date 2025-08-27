import maplibregl from 'maplibre-gl';

import { messages, type Language } from '$lib/i18n/messages';
import type { CensusTract, CommunityArea } from '$lib/types';
import {
	formatCount,
	formatCurrency,
	formatPercent,
	formatAreaIdentifier
} from '$lib/utils/formatters';
import { getTooltipPositioningScript } from '$lib/utils/tooltips';

export class Popup {
	private map: maplibregl.Map;
	private popup: maplibregl.Popup | null = null;
	private isTabletOrAbove: boolean;
	private lang: Language;

	constructor(map: maplibregl.Map, isTabletOrAbove: boolean, lang: Language) {
		this.map = map;
		this.isTabletOrAbove = isTabletOrAbove;
		this.lang = lang;
	}

	showPopup(lngLat: maplibregl.LngLat, data: CensusTract | CommunityArea): maplibregl.Popup {
		if (this.popup) {
			this.popup.remove();
		}

		const { x, y } = this.map.project(lngLat);
		const mapHeight = this.map.getContainer().offsetHeight;
		const mapWidth = this.map.getContainer().offsetWidth;
		const popupWidth = this.isTabletOrAbove ? 332 : 282;
		const popupHeight = this.isTabletOrAbove ? 242 : 245;

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
			// accounting for the Legend button.
			anchor = 'bottom-left';
			const x = (mapWidth / 100) * 3; // 3% from the left.
			const y = mapHeight - 24 - 34 - 8; // 24px of padding, 34px for Legend button, 8px additional padding.
			position = this.map.unproject([x, y]);
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
					color: #3c383066;
					vertical-align: text-bottom;
					position: relative;
					top: -1px;
					transition: color 0.2s;
				}
				.tooltip-trigger:hover {
					color: #3c3830cc;
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
			<h3 class="m-0 mb-1 text-base font-medium sm:mb-2 sm:text-lg">${formatAreaIdentifier(data, {
				lang: this.lang
			})}</h3>
			<div>
				<ul class="-mx-1.5 my-0 flex list-none gap-4 border-b border-earth px-1.5 sm:-mx-3 sm:px-3 font-sans">
					<li class="active-tab border-b-2 border-b-transparent pb-1 transition-all">
						<button
							class="text-xs border-0 bg-transparent p-0 text-earth sm:text-sm"
							data-popup-tab="service-line-inventory"
						>
							${messages[this.lang].tabs.serviceLineInventoryTabTitle}
						</button>
					</li>
					<li class="border-b-2 border-b-transparent pb-1 transition-all">
						<button
							class="text-xs border-0 bg-transparent p-0 text-earth sm:text-sm"
							data-popup-tab="demographics"
						>
							${messages[this.lang].tabs.demographicContextTabTitle}
						</button>
					</li>
				</ul>
				<div data-popup-tabcontent="service-line-inventory" class="mt-2">
					<table class="text-2xs w-full table-fixed border-collapse font-sans text-earth/80 sm:text-xs">
						<tbody>
							<colgroup>
								<col width="60%" />
								<col width="20%" />
								<col width="20%" />
							</colgroup>
							<tr>
								<td class="p-1">
									${messages[this.lang].serviceLineInventory.leadLabel}
									<span class="tooltip-container">
										<svg class="tooltip-trigger" width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
										</svg>
										<span class="tooltip-content">${messages[this.lang].tooltips.leadDefinition}</span>
									</span>
								</td>
								<td class="p-1 text-right">${formatCount(data.L)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_lead)}</td>
							</tr>
							<tr>
								<td class="p-1">
									${messages[this.lang].serviceLineInventory.suspectedLeadLabel}
									<span class="tooltip-container">
										<svg class="tooltip-trigger" width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
										</svg>
										<span class="tooltip-content">${messages[this.lang].tooltips.suspectedLeadDefinition}</span>
									</span>
								</td>
								<td class="p-1 text-right">${formatCount(data.U)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_suspected_lead)}</td>
							</tr>
							<tr>
								<td class="p-1">
									${messages[this.lang].serviceLineInventory.galvanizedReplaceLabel}
									<span class="tooltip-container">
										<svg class="tooltip-trigger" width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
										</svg>
										<span class="tooltip-content">${messages[this.lang].tooltips.galvanizedDefinition}</span>
									</span>
								</td>
								<td class="p-1 text-right">${formatCount(data.GRR)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_grr)}</td>
							</tr>
							<tr>
								<td class="p-1">
									${messages[this.lang].serviceLineInventory.nonLeadLabel}
									<span class="tooltip-container">
										<svg class="tooltip-trigger" width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
										</svg>
										<span class="tooltip-content">${messages[this.lang].tooltips.nonLeadDefinition}</span>
									</span>
								</td>
								<td class="p-1 text-right">${formatCount(data.NL)}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_not_lead)}</td>
							</tr>
						</tbody>
						<tfoot class="border-t border-earth/30">
							<tr>
								<td class="p-1">${messages[this.lang].serviceLineInventory.totalLabel}</td>
								<td class="p-1 text-right">${formatCount(data.total)}</td>
							</tr>
							<tr class="rounded bg-red-100 text-red-600">
								<td class="p-1">${messages[this.lang].serviceLineInventory.requiresReplacementLabel}</td>
								<td class="p-1 text-right font-semibold">${formatCount(data.requires_replacement)}</td>
								<td class="p-1 text-right font-semibold">
									${formatPercent(data.pct_requires_replacement)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
				<div data-popup-tabcontent="demographics" style="display: none" class="mt-2">
					<table class="text-2xs w-full table-fixed border-collapse font-sans text-earth/80 sm:text-xs">
						<tbody>
							<colgroup>
								<col width="65%" />
								<col width="35%" />
							</colgroup>
							<tr>
								<td class="p-1 ">${messages[this.lang].demographicContext.medianHouseholdIncomeLabel}</td>
								<td class="p-1 text-right">
									${formatCurrency(data.median_household_income)}
								</td>
							</tr>
							<tr>
								<td class="p-1 ">${messages[this.lang].demographicContext.povertyRateLabel}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_poverty)}</td>
							</tr>
							<tr>
								<td class="p-1 ">${messages[this.lang].demographicContext.blackPopulationLabel}</td>
								<td class="p-1 text-right">
									${formatPercent(data.pct_black_nonhispanic)}
								</td>
							</tr>
							<tr>
								<td class="p-1 ">${messages[this.lang].demographicContext.latinoPopulationLabel}</td>
								<td class="p-1 text-right">
									${formatPercent(data.pct_hispanic)}
								</td>
							</tr>
							<tr>
								<td class="p-1 ">${messages[this.lang].demographicContext.whitePopulationLabel}</td>
								<td class="p-1 text-right">
									${formatPercent(data.pct_white_nonhispanic)}
								</td>
							</tr>
							<tr>
								<td class="p-1 ">${messages[this.lang].demographicContext.asianPopulationLabel}</td>
								<td class="p-1 text-right">
									${formatPercent(data.pct_asian_nonhispanic)}
								</td>
							</tr>
							<tr>
								<td class="p-1 ">${messages[this.lang].demographicContext.nonWhitePopulationLabel}</td>
								<td class="p-1 text-right">${formatPercent(data.pct_minority)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		`;
	}
}
