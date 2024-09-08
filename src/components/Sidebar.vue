<script lang="ts" setup>
import {
	mdiArrowULeftTop,
	mdiFullscreen,
	mdiFullscreenExit,
	mdiMinus,
	mdiPlus,
} from '@mdi/js'
import { useFullscreen } from '@vueuse/core'
import { inject } from 'vue'
import { STATE_KEY } from '../constants'
import SidebarButton from './SidebarButton.vue'

const { panzoomInstance, resetPanzoom } = inject(STATE_KEY)!

const {
	isFullscreen,
	isSupported,
	toggle: toggleFullscreen,
} = useFullscreen(document.documentElement)
</script>

<template>
	<div class="absolute right-0 top-0 z-40 p-2">
		<SidebarButton
			v-if="isSupported"
			@click="toggleFullscreen"
			:title="isFullscreen ? 'Exit fullscreen' : 'Go fullscreen'"
			:icon-path="isFullscreen ? mdiFullscreenExit : mdiFullscreen"
			class="hidden bg-neutral-700 hover:bg-neutral-600 sm:inline-block"
		/>
	</div>

	<div
		class="absolute right-0 top-1/2 z-40 hidden -translate-y-1/2 transform flex-col items-center space-y-2 pr-2 sm:flex"
	>
		<SidebarButton
			@click="panzoomInstance!.zoomTo(0, 0, 1.25)"
			:icon-path="mdiPlus"
			class="bg-blue-500 hover:bg-blue-400"
			title="Zoom in (+)"
		/>

		<SidebarButton
			@click="panzoomInstance!.zoomTo(0, 0, 0.75)"
			:icon-path="mdiMinus"
			class="bg-blue-500 hover:bg-blue-400"
			title="Zoom out (-)"
		/>

		<SidebarButton
			@click="resetPanzoom"
			:icon-path="mdiArrowULeftTop"
			class="bg-blue-500 hover:bg-blue-400"
			title="Reset pan/zoom"
		/>
	</div>
</template>
