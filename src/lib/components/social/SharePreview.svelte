<script lang="ts">
	import { social } from '$lib/state/social.svelte';
	import { COLORS } from '$lib/utils/constants';
</script>

{#if social.showSharePreview}
	<!-- Backdrop with blur -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={() => social.closeSharePreview()}
		onkeydown={(e) => e.key === 'Escape' && social.closeSharePreview()}
		role="button"
		tabindex="0"
		aria-label="Close preview"
	>
		<!-- Modal content -->
		<div
			class="floating-panel relative max-h-[90vh] w-[90vw] max-w-lg overflow-auto p-4 sm:p-6"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-label="Share preview"
		>
			<!-- Close button -->
			<button
				onclick={() => social.closeSharePreview()}
				class="bg-smog absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex h-6 w-6 items-center justify-center border-none transition-opacity hover:opacity-70"
				aria-label="Close preview"
			>
				<svg class="text-earth/80 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<!-- Preview content -->
			<div class="flex flex-col gap-4">
				<h3 class="font-sans-secondary text-earth mt-0 mb-2 pr-6 text-base font-medium sm:mb-3 sm:text-xl">
					Share your results
				</h3>

				<!-- Image preview -->
				{#if social.shareImageUrl}
					<img
						src={social.shareImageUrl}
						alt="Share preview"
						class="h-auto w-full max-w-full rounded-sm shadow-md"
					/>
				{/if}

				<!-- Actions centered -->
				<div class="flex flex-col items-center gap-3">
					<!-- Download button styled like the share pill -->
					<button
						onclick={() => social.downloadShareImage()}
						class="inline-flex items-center rounded-full border-2 border-white px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
						style="background-color: {COLORS.EARTH}"
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						Download Image
					</button>

					<p class="text-earth/60 text-sm text-center font-sans">
						Save this image to share on social media
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}