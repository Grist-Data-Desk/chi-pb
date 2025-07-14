import type { Popup } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';

export class TractPopup {
	private map: maplibregl.Map;
	private popup: Popup | null = null;

	constructor(map: maplibregl.Map) {
		this.map = map;
	}

	showPopup(lngLat: maplibregl.LngLat, data: any): maplibregl.Popup {
		if (this.popup) {
			this.popup.remove();
		}

		const clickPoint = this.map.project(lngLat);
		const mapHeight = this.map.getContainer().offsetHeight;
		const anchor = clickPoint.y < mapHeight / 2 ? 'top' : 'bottom';

		this.popup = new maplibregl.Popup({
			closeButton: true,
			closeOnClick: true,
			maxWidth: '320px',
			anchor
		})
			.setLngLat(lngLat)
			.setHTML(this.generatePopupContent(data))
			.addTo(this.map);

		return this.popup;
	}

	removePopup() {
		if (this.popup) {
			this.popup.remove();
			this.popup = null;
		}
	}

	private generatePopupContent(data: any): string {
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

		const isCommunityArea = data.community !== undefined;

		if (isCommunityArea) {
			// Community area popup
			return `
				<div style="padding: 4px 12px 12px 12px;">
					<h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px; margin-top: 0;">${data.community || 'Unknown Community'}</h3>
					
					<div style="font-size: 11px;">
						<p style="font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; margin-top: 0;">Service Line Inventory</p>
						
						<div style="background-color: #f9fafb; border-radius: 4px; padding: 8px; margin-bottom: 12px;">
							<table style="width: 100%; font-size: 11px; table-layout: fixed;">
								<colgroup>
									<col style="width: 60%;">
									<col style="width: 20%;">
									<col style="width: 20%;">
								</colgroup>
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 4px 0; color: #6b7280;">Lead</td>
									<td style="padding: 4px 4px; text-align: right; font-weight: 500;">${formatCount(data.L)}</td>
									<td style="padding: 4px 0; text-align: right; color: #6b7280;">${formatPercent(data.pct_lead)}</td>
								</tr>
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 4px 0; color: #6b7280;">Galvanized (Replace)</td>
									<td style="padding: 4px 4px; text-align: right; font-weight: 500;">${formatCount(data.GRR)}</td>
									<td style="padding: 4px 0; text-align: right; color: #6b7280;">${formatPercent(data.pct_grr)}</td>
								</tr>
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 4px 0; color: #6b7280;">Unknown (Suspected Lead)</td>
									<td style="padding: 4px 4px; text-align: right; font-weight: 500;">${formatCount(data.U)}</td>
									<td style="padding: 4px 0; text-align: right; color: #6b7280;">${formatPercent(data.pct_suspected_lead)}</td>
								</tr>
								<tr>
									<td style="padding: 4px 0; color: #6b7280;">Non-Lead</td>
									<td style="padding: 4px 4px; text-align: right; font-weight: 500;">${formatCount(data.NL)}</td>
									<td style="padding: 4px 0; text-align: right; color: #6b7280;">${formatPercent(data.pct_not_lead)}</td>
								</tr>
							</table>
							
							<div style="padding: 0 8px;">
								<table style="width: 100%; font-size: 11px; table-layout: fixed; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
									<colgroup>
										<col style="width: 60%;">
										<col style="width: 20%;">
										<col style="width: 20%;">
									</colgroup>
									<tr>
										<td style="padding: 4px 0; color: #4b5563;">Total</td>
										<td style="padding: 4px 4px; text-align: right; font-weight: bold;">${formatCount(data.total)}</td>
										<td style="padding: 4px 0;"></td>
									</tr>
								</table>
							</div>
							
							<div style="margin-top: 8px; padding: 8px; background-color: #f3e8ff; border-radius: 4px;">
								<table style="width: 100%; font-size: 11px; table-layout: fixed;">
									<colgroup>
										<col style="width: 60%;">
										<col style="width: 20%;">
										<col style="width: 20%;">
									</colgroup>
									<tr>
										<td style="padding: 0; color: #6b21a8; font-weight: 500;">Requires Replacement</td>
										<td style="padding: 0 4px; text-align: right; font-weight: bold; color: #581c87;">${formatCount(data.requires_replacement || 0)}</td>
										<td style="padding: 0; text-align: right; font-weight: bold; color: #581c87;">${formatPercent(data.pct_requires_replacement || 0)}</td>
									</tr>
								</table>
							</div>
						</div>
						
						${(data.median_household_income !== undefined || data.pct_minority !== undefined || data.pct_poverty !== undefined) ? `
							<p style="font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; margin-top: 12px;">Demographics</p>
							<div style="background-color: #f9fafb; border-radius: 4px; padding: 8px;">
								<table style="width: 100%; font-size: 11px;">
									<tr ${data.median_household_income !== undefined && (data.pct_minority !== undefined || data.pct_poverty !== undefined) ? 'style="border-bottom: 1px solid #e5e7eb;"' : ''}>
										<td style="padding: 4px 0; color: #6b7280;">Median Income</td>
										<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatCurrency(data.median_household_income)}</td>
									</tr>
									${data.pct_minority !== undefined ? `
										<tr ${data.pct_poverty !== undefined ? 'style="border-bottom: 1px solid #e5e7eb;"' : ''}>
											<td style="padding: 4px 0; color: #6b7280;">Minority Population</td>
											<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatPercent(data.pct_minority)}</td>
										</tr>
									` : ''}
									${data.pct_poverty !== undefined ? `
										<tr>
											<td style="padding: 4px 0; color: #6b7280;">Poverty Rate</td>
											<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatPercent(data.pct_poverty)}</td>
										</tr>
									` : ''}
								</table>
							</div>
						` : ''}
					</div>
				</div>
			`;
		} else {
			// Census tract popup
			return `
				<div style="padding: 4px 12px 12px 12px;">
					<h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px; margin-top: 0;">Census Tract ${data.geoid || 'Unknown'}</h3>
					
					<div style="font-size: 11px;">
						${data.total !== undefined ? `
							<p style="font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; margin-top: 0;">Service Line Inventory</p>
							
							<div style="background-color: #f9fafb; border-radius: 4px; padding: 8px; margin-bottom: 12px;">
								<table style="width: 100%; font-size: 11px; table-layout: fixed;">
									<colgroup>
										<col style="width: 60%;">
										<col style="width: 20%;">
										<col style="width: 20%;">
									</colgroup>
									<tr style="border-bottom: 1px solid #e5e7eb;">
										<td style="padding: 4px 0; color: #6b7280;">Lead</td>
										<td style="padding: 4px 4px; text-align: right; font-weight: 500;">${formatCount(data.L)}</td>
										<td style="padding: 4px 0; text-align: right; color: #6b7280;">${formatPercent(data.pct_lead)}</td>
									</tr>
									<tr style="border-bottom: 1px solid #e5e7eb;">
										<td style="padding: 4px 0; color: #6b7280;">Galvanized (Replace)</td>
										<td style="padding: 4px 4px; text-align: right; font-weight: 500;">${formatCount(data.GRR)}</td>
										<td style="padding: 4px 0; text-align: right; color: #6b7280;">${formatPercent(data.pct_grr)}</td>
									</tr>
									<tr style="border-bottom: 1px solid #e5e7eb;">
										<td style="padding: 4px 0; color: #6b7280;">Unknown (Suspected Lead)</td>
										<td style="padding: 4px 4px; text-align: right; font-weight: 500;">${formatCount(data.U)}</td>
										<td style="padding: 4px 0; text-align: right; color: #6b7280;">${formatPercent(data.pct_suspected_lead)}</td>
									</tr>
									<tr>
										<td style="padding: 4px 0; color: #6b7280;">Non-Lead</td>
										<td style="padding: 4px 4px; text-align: right; font-weight: 500;">${formatCount(data.NL)}</td>
										<td style="padding: 4px 0; text-align: right; color: #6b7280;">${formatPercent(data.pct_not_lead)}</td>
									</tr>
								</table>
								
								<div style="padding: 0 8px;">
									<table style="width: 100%; font-size: 11px; table-layout: fixed; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
										<colgroup>
											<col style="width: 60%;">
											<col style="width: 20%;">
											<col style="width: 20%;">
										</colgroup>
										<tr>
											<td style="padding: 4px 0; color: #4b5563;">Total</td>
											<td style="padding: 4px 4px; text-align: right; font-weight: bold;">${formatCount(data.total)}</td>
											<td style="padding: 4px 0;"></td>
										</tr>
									</table>
								</div>
								
								${data.requires_replacement !== undefined ? `
									<div style="margin-top: 8px; padding: 8px; background-color: #f3e8ff; border-radius: 4px;">
										<table style="width: 100%; font-size: 11px; table-layout: fixed;">
											<colgroup>
												<col style="width: 60%;">
												<col style="width: 20%;">
												<col style="width: 20%;">
											</colgroup>
											<tr>
												<td style="padding: 0; color: #6b21a8; font-weight: 500;">Requires Replacement</td>
												<td style="padding: 0 4px; text-align: right; font-weight: bold; color: #581c87;">${formatCount(data.requires_replacement || 0)}</td>
												<td style="padding: 0; text-align: right; font-weight: bold; color: #581c87;">${formatPercent(data.pct_requires_replacement || 0)}</td>
											</tr>
										</table>
									</div>
								` : ''}
							</div>
						` : ''}
						
						<p style="font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; margin-top: 12px;">Demographics</p>
						<div style="background-color: #f9fafb; border-radius: 4px; padding: 8px;">
							<table style="width: 100%; font-size: 11px;">
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 4px 0; color: #6b7280;">Median Income</td>
									<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatCurrency(data.median_household_income)}</td>
								</tr>
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 4px 0; color: #6b7280;">Poverty Rate</td>
									<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatPercent(data.pct_poverty)}</td>
								</tr>
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 4px 0; color: #6b7280;">Black Population</td>
									<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatPercent(data.pct_black_nonhispanic || data.pct_black)}</td>
								</tr>
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 4px 0; color: #6b7280;">White Population</td>
									<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatPercent(data.pct_white_nonhispanic)}</td>
								</tr>
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 4px 0; color: #6b7280;">Asian Population</td>
									<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatPercent(data.pct_asian_nonhispanic)}</td>
								</tr>
								<tr>
									<td style="padding: 4px 0; color: #6b7280;">Minority Population</td>
									<td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatPercent(data.pct_minority)}</td>
								</tr>
							</table>
						</div>
					</div>
				</div>
			`;
		}
	}
}