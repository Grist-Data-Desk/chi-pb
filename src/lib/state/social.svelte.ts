import { DISPLAY_CODES_TO_MATERIAL_LABELS_SOCIAL, getMaterialColor } from '$lib/utils/constants';

class SocialState {
	showSharePreview = $state(false);
	shareImageUrl = $state<string | null>(null);
	shareImageBlob = $state<Blob | null>(null);

	// Generate share image
	async generateShareImage(
		displayCode: string,
		communityName: string | null | undefined
	): Promise<void> {
		// Create canvas
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvas.width = 1080;
		canvas.height = 1080;

		ctx.fillStyle = '#3C3830';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const gristLogo = new Image();
		gristLogo.src = '/Grist.svg';
		
		const icnLogo = new Image();
		icnLogo.src = '/ICN.png';
		
		const wbezLogo = new Image();
		wbezLogo.src = '/WBEZ.svg';

		await Promise.all([
			new Promise((resolve) => { gristLogo.onload = resolve; }),
			new Promise((resolve) => { icnLogo.onload = resolve; }),
			new Promise((resolve) => { wbezLogo.onload = resolve; })
		]);

		const gristHeight = 50;
		const icnHeight = 50; 
		const wbezHeight = 47;
		
		const baselineY = 40; 
		const logoSpacing = 25;
		const rightMargin = 40;
		
		const gristWidth = (gristLogo.width / gristLogo.height) * gristHeight;
		const icnWidth = (icnLogo.width / icnLogo.height) * icnHeight;
		const wbezWidth = (wbezLogo.width / wbezLogo.height) * wbezHeight;
		
		const gristY = baselineY;
		const icnY = baselineY;  
		const wbezY = baselineY + 5; 
		
		const totalWidth = gristWidth + icnWidth + wbezWidth + (logoSpacing * 2);
		let currentX = canvas.width - rightMargin - totalWidth;
		
		ctx.drawImage(gristLogo, currentX, gristY, gristWidth, gristHeight);
		currentX += gristWidth + logoSpacing;
		
		ctx.drawImage(icnLogo, currentX, icnY, icnWidth, icnHeight);
		currentX += icnWidth + logoSpacing;
		
		ctx.drawImage(wbezLogo, currentX, wbezY, wbezWidth, wbezHeight);

		ctx.fillStyle = 'white';
		const community = communityName || 'Chicago';
		const ln1 = 430;
		const lnspc = 70;
		ctx.font = '60px "PolySans", -apple-system, sans-serif';

		ctx.fillText('I looked up my address', 80, ln1);
		ctx.fillText('in '+community+' and', 80, ln1 + lnspc);
		ctx.fillText('found out the water', 80, ln1 + lnspc*2);
		ctx.fillText('service line is made of', 80, ln1 + lnspc*3);

		// Lead status pill
		const statusLabel =
		DISPLAY_CODES_TO_MATERIAL_LABELS_SOCIAL[displayCode as keyof typeof DISPLAY_CODES_TO_MATERIAL_LABELS_SOCIAL] ||
			(displayCode === 'U' ? 'Suspected Lead' : 'Unknown');
		const pillColor = getMaterialColor(displayCode);

		ctx.font = '700 50px "Basis Grotesque", -apple-system, sans-serif';
		const textMetrics = ctx.measureText(statusLabel);

		const pillY = 680;
		const pillHeight = 90;
		const pillPadding = 35;
		const pillX = 80;
		const pillWidth = textMetrics.width + pillPadding * 2;

		ctx.fillStyle = pillColor;
		ctx.beginPath();
		ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
		ctx.fill();

		ctx.fillStyle = 'white';
		const textX = pillX + pillPadding;
		const textY = pillY + pillHeight / 2 + 17; // Vertical centering
		ctx.fillText(statusLabel, textX, textY);

		ctx.fillStyle = 'white';
		ctx.font = '48px "Basis Grotesque", -apple-system, sans-serif';
		ctx.fillText('Chicago, check your lead status:', 80, 920);
		ctx.fillText('grist.org/chicago-lead', 80, 980);

		// Convert to blob and show preview
		canvas.toBlob((blob) => {
			if (!blob) return;

			// Clean up previous URL if it exists
			if (this.shareImageUrl) {
				URL.revokeObjectURL(this.shareImageUrl);
			}

			const url = URL.createObjectURL(blob);
			this.shareImageUrl = url;
			this.shareImageBlob = blob;
			this.showSharePreview = true;
		}, 'image/jpeg', 0.9);
	}

	// Download
	downloadShareImage(): void {
		if (!this.shareImageUrl || !this.shareImageBlob) return;

		const a = document.createElement('a');
		a.href = this.shareImageUrl;
		a.download = `chicago-lead-status-${Date.now()}.jpg`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		this.closeSharePreview();
	}

	// Close
	closeSharePreview(): void {
		this.showSharePreview = false;
		if (this.shareImageUrl) {
			URL.revokeObjectURL(this.shareImageUrl);
			this.shareImageUrl = null;
		}
		this.shareImageBlob = null;
	}

	// Clean up resources
	cleanup(): void {
		if (this.shareImageUrl) {
			URL.revokeObjectURL(this.shareImageUrl);
		}
	}
}

export const social = new SocialState();