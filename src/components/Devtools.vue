<script lang="ts" setup>
import {
	mdiContentCopy,
	mdiDeleteClockOutline,
	mdiShapePolygonPlus,
	mdiUpload,
	mdiVectorPolylineRemove,
} from '@mdi/js'
import { useDebounceFn } from '@vueuse/core'
import { inject, ref, watchEffect } from 'vue'
import { STATE_KEY } from '../constants'
import untypedTargets from '../targets.json'
import type { Point, Target } from '../types'
import { normalizeCoordinates } from '../util'
import SidebarButton from './SidebarButton.vue'

const {
	canvas,
	devPolyMode,
	imageEl,
	currentTargetIndexOrUrl,
	panzoomInstance,
} = inject(STATE_KEY)!

const POINT_RADIUS = 7

const targets = untypedTargets as Target[]
let polygons: Point[][] = [[]]

const fileInputEl = ref<HTMLInputElement>()

const draw = () => {
	if (!canvas.value) return

	canvas.value.clear()

	const ctx = canvas.value.canvasContext!

	for (let i = 0; i < polygons.length; i++) {
		let [nX, nY]: Point = [-1, -1]

		ctx.beginPath()

		for (let j = 0; j < polygons[i].length; j++) {
			if (j > 0) {
				ctx.moveTo(nX, nY)
			}

			;[nX, nY] = normalizeCoordinates(...polygons[i][j], imageEl.value!)

			ctx.lineTo(nX, nY)
			ctx.lineWidth = 3
			ctx.strokeStyle = '#fff'
			ctx.stroke()

			ctx.beginPath()
			ctx.arc(
				nX,
				nY,
				POINT_RADIUS / panzoomInstance.value!.getTransform().scale,
				0,
				2 * Math.PI,
			)
			ctx.strokeStyle = '#fff'
			ctx.fillStyle = '#fff'
			ctx.fill()
			ctx.stroke()

			if (i < polygons.length - 1 && j === polygons[i].length - 1) {
				ctx.beginPath()
				ctx.moveTo(nX, nY)
				ctx.lineTo(...normalizeCoordinates(...polygons[i][0], imageEl.value!))
				ctx.lineWidth = 3
				ctx.strokeStyle = '#fff'
				ctx.stroke()
			}
		}
	}

	console.log(polygons)
}

const onImageClick = (x: number, y: number) => {
	if (!canvas.value) return

	const currentPoly = polygons[polygons.length - 1]
	const firstPoint = currentPoly?.[0]

	if (
		firstPoint != null &&
		currentPoly.length >= 3 &&
		Math.abs(x - firstPoint[0]) <= POINT_RADIUS * 2 &&
		Math.abs(y - firstPoint[1]) <= POINT_RADIUS * 2
	) {
		polygons.push([])
	} else {
		currentPoly.push([Math.round(x), Math.round(y)])
	}

	draw()
}

const onFileUpload = () => {
	if (!fileInputEl.value || !imageEl.value || fileInputEl.value.files == null)
		return

	const [file] = fileInputEl.value.files

	if (file) {
		currentTargetIndexOrUrl.value = URL.createObjectURL(file)
	}
}

const removeLastLine = () => {
	let lastPoly = polygons[polygons.length - 1]

	if (lastPoly.length === 0) {
		if (polygons.length === 1) return
		else {
			lastPoly = polygons[polygons.length - 2]
			polygons.pop()
		}
	} else {
		lastPoly.pop()
	}

	draw()
}

const clearLocalStorage = () => localStorage.clear()

const copyPolygons = () =>
	navigator.clipboard.writeText(JSON.stringify(polygons))

const onGlobalKeyDown = (event: KeyboardEvent) => {
	if (!devPolyMode.value) return

	switch (event.key) {
		case 'z': {
			removeLastLine()
			break
		}
	}
}

watchEffect(() => {
	if (typeof currentTargetIndexOrUrl.value === 'number') {
		polygons = structuredClone(targets[currentTargetIndexOrUrl.value][2])
		polygons.push([])
	} else {
		polygons = [[]]
	}

	draw()
})

watchEffect(() => {
	const appEl = document.getElementById('app')!

	if (devPolyMode.value) {
		draw()
		appEl.classList.remove('active:cursor-grabbing')
	} else {
		canvas.value?.clear()
		appEl.classList.add('active:cursor-grabbing')
	}
})

defineExpose({
	onImageClick,
})

window.addEventListener('keydown', onGlobalKeyDown)
window.addEventListener(
	'resize',
	useDebounceFn(() => (devPolyMode.value ? draw() : null), 500),
)
</script>

<template>
	<div
		class="absolute left-0 top-1/2 z-40 hidden -translate-y-1/2 transform flex-col items-center space-y-2 pl-2 sm:flex"
	>
		<SidebarButton
			@click="devPolyMode = !devPolyMode"
			:icon-path="mdiShapePolygonPlus"
			:class="
				devPolyMode
					? 'bg-red-500 hover:bg-red-400'
					: 'bg-orange-500 hover:bg-orange-400'
			"
			title="Add target polygon(s)"
		/>

		<SidebarButton
			@click="removeLastLine"
			:icon-path="mdiVectorPolylineRemove"
			class="bg-orange-500 hover:bg-orange-400"
			title="Remove last line (z)"
		/>

		<SidebarButton
			@click="clearLocalStorage"
			:icon-path="mdiDeleteClockOutline"
			class="bg-orange-500 hover:bg-orange-400"
			title="Clear localStorage"
		/>

		<SidebarButton
			@click="copyPolygons"
			:icon-path="mdiContentCopy"
			class="bg-orange-500 hover:bg-orange-400"
			title="Copy polygons"
		/>

		<label
			class="cursor-pointer rounded-full bg-orange-500 p-4 text-2xl text-white transition-[background-color,transform] hover:bg-orange-400 active:scale-95"
			title="Upload image"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				class="size-6"
				fill="currentColor"
			>
				<path :d="mdiUpload" />
			</svg>

			<input
				type="file"
				@change="onFileUpload"
				ref="fileInputEl"
				class="hidden"
				accept="image/*"
			/>
		</label>
	</div>
</template>
