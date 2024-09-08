<script lang="ts" setup>
import { usePreferredReducedMotion } from '@vueuse/core'
import canvasConfetti, { type CreateTypes } from 'canvas-confetti'
import { inject, onMounted, ref, shallowRef } from 'vue'
import { STATE_KEY } from '../constants'
import { Point } from '../types'
import { normalizeCoordinates } from '../util'

const { panzoomInstance, imageEl } = inject(STATE_KEY)!

const preferredMotion = usePreferredReducedMotion()

const canvasEl = ref<HTMLCanvasElement>()
const canvasContext = shallowRef<CanvasRenderingContext2D>()
const canvasConfettiInstance = shallowRef<CreateTypes>()

const clear = () => {
	canvasContext.value!.clearRect(
		0,
		0,
		canvasEl.value!.width,
		canvasEl.value!.height,
	)
}

const resize = () => {
	if (!canvasEl.value)
		throw new Error('Could not reference canvas element during resize')

	const { width, height } = canvasEl.value.getBoundingClientRect()

	const dpr = window.devicePixelRatio || 1
	const zoomFactor = panzoomInstance.value!.getTransform().scale

	canvasEl.value.width = (width * dpr) / zoomFactor
	canvasEl.value.height = (height * dpr) / zoomFactor
}

const highlightPolygons = (polygons: Point[][], scale = 1) => {
	if (!canvasEl.value || !canvasContext.value) {
		throw new Error(
			'Could not reference canvas element or canvas context during highlight',
		)
	}

	const ctx = canvasContext.value

	ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
	ctx.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height)

	ctx.globalCompositeOperation = 'destination-out'

	for (let i = 0; i < polygons.length; i++) {
		ctx.beginPath()

		ctx.moveTo(
			...normalizeCoordinates(
				polygons[i][0][0] * scale,
				polygons[i][0][1] * scale,
				imageEl.value!,
			),
		)

		for (let j = 0; j < polygons[i].length; j++) {
			ctx.lineTo(
				...normalizeCoordinates(
					polygons[i][j][0] * scale,
					polygons[i][j][1] * scale,
					imageEl.value!,
				),
			)
		}

		ctx.closePath()

		ctx.fill()
	}

	ctx.globalCompositeOperation = 'source-over'
}

const animateHighlightPolygons = (polygons: Point[][]) => {
	if (!canvasEl.value || !canvasContext.value) {
		throw new Error(
			'Could not reference canvas element or canvas context during animate highlight',
		)
	}

	const duration = 1000
	const startTime = performance.now()
	const maxScale = 4
	const minScale = 1

	const animate = (currentTime: number) => {
		const elapsed = currentTime - startTime
		const progress = Math.min(elapsed / duration, 1)

		const scale = maxScale - progress * (maxScale - minScale)

		clear()

		highlightPolygons(polygons, scale)

		if (progress < 1) {
			requestAnimationFrame(animate)
		}
	}

	requestAnimationFrame(animate)
}

const fireworks = () => {
	if (preferredMotion.value === 'reduce') return

	const duration = 3000
	const animationEnd = Date.now() + duration
	const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

	function randomInRange(min: number, max: number) {
		return Math.random() * (max - min) + min
	}

	const interval = setInterval(function () {
		const timeLeft = animationEnd - Date.now()

		if (timeLeft <= 0) {
			return clearInterval(interval)
		}

		const particleCount = 50 * (timeLeft / duration)

		canvasConfetti({
			...defaults,
			origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
		})

		canvasConfetti({
			...defaults,
			particleCount,
			origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
		})
	}, 250)
}

const confetti = (x: number, y: number) => {
	if (
		preferredMotion.value === 'reduce' ||
		!canvasConfettiInstance.value ||
		!canvasEl.value ||
		!imageEl.value
	)
		return

	const [nX, nY] = normalizeCoordinates(x, y, imageEl.value)

	canvasConfettiInstance.value({
		particleCount: 100,
		spread: 70,
		origin: {
			x: nX / canvasEl.value!.width,
			y: nY / canvasEl.value!.height,
		},
	})
}

defineExpose({
	clear,
	resize,
	highlightPolygons,
	animateHighlightPolygons,
	confetti,
	fireworks,
	canvasContext,
})

onMounted(() => {
	if (!canvasEl.value) return

	resize()

	canvasContext.value = canvasEl.value.getContext('2d')!
	canvasConfettiInstance.value = canvasConfetti.create(canvasEl.value)
})
</script>

<template>
	<canvas ref="canvasEl" />
</template>
