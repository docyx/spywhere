<script lang="ts" setup>
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { useDebounceFn, useStorage, useTitle } from '@vueuse/core'
import panzoom, { type PanZoom } from 'panzoom'
import {
	type ComponentInstance,
	computed,
	nextTick,
	onMounted,
	provide,
	ref,
	shallowRef,
	watch,
} from 'vue'
import type Devtools from './components/Devtools.vue'
import Loading from './components/Loading.vue'
import Modal from './components/Modal.vue'
import OverlayCanvas from './components/OverlayCanvas.vue'
import Sidebar from './components/Sidebar.vue'
import SidebarButton from './components/SidebarButton.vue'
import TargetSelector from './components/TargetSelector.vue'
import { STATE_KEY } from './constants'
import untypedTargets from './targets.json'
import type { SolvedTarget, Target } from './types'
import { getCoordinatesRelativeToImage, pointInPolygons } from './util'

const devtools = shallowRef<typeof Devtools>()
const devtoolsInstance = ref<ComponentInstance<typeof Devtools>>()
const devPolyMode = ref(false)

if (import.meta.env.DEV) {
	import('./components/Devtools.vue').then(
		(module) => (devtools.value = module.default),
	)
}

const targets = untypedTargets as Target[]

const currentTargetIndexOrUrl = useStorage('current-target', 0, localStorage, {
	// FIXME: This is a hacky solution to make sure we don't error out when
	//        target is a string (image upload in dev mode).
	serializer: {
		read: (v) => {
			const parsed = parseInt(v)

			if (parsed > targets.length - 1) return 0
			return parsed
		},
		write: (v) => (typeof v === 'number' ? v.toString() : '0'),
	},
})

if (window.location.hash) {
	const parsedTargetIndex = parseInt(window.location.hash.slice(1))

	if (
		!isNaN(parsedTargetIndex) &&
		parsedTargetIndex >= 1 &&
		parsedTargetIndex <= targets.length
	)
		currentTargetIndexOrUrl.value = parsedTargetIndex - 1
}

const solvedTargets = useStorage<Record<number, SolvedTarget>>('solved', {})
const numFullySolvedTargets = computed(
	() => Object.values(solvedTargets.value).filter((t) => t === 1).length,
)

const pageTitle = useTitle()
const currentTarget = computed<Target>(() => {
	if (typeof currentTargetIndexOrUrl.value === 'number')
		return targets[currentTargetIndexOrUrl.value]
	else return ['???', '???', [[]]]
})
const imageLoaded = ref(false)
const imageEl = ref<HTMLImageElement>()
const imageContainerEl = ref<HTMLDivElement>()
const showTargetSelectorModal = ref(false)
const showSuccessModal = ref(false)
const canvas = ref<ComponentInstance<typeof OverlayCanvas>>()
const panzoomInstance = shallowRef<PanZoom>()

const onImageClick = (event: MouseEvent | TouchEvent) => {
	if (!currentTarget.value) {
		throw new Error(`Invalid target: ${currentTargetIndexOrUrl}`)
	} else if (!imageEl.value || !canvas.value || !panzoomInstance.value) {
		throw new Error(
			'Could not reference the canvas and/or image. This is very bad!',
		)
	} else if (
		!(event.target instanceof HTMLCanvasElement) ||
		solvedTargets.value?.[currentTargetIndexOrUrl.value] === 1
	) {
		return
	}

	let pageX: number
	let pageY: number

	if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
		pageX = event.changedTouches[0].pageX
		pageY = event.changedTouches[0].pageY
	} else {
		pageX = (event as MouseEvent).pageX
		pageY = (event as MouseEvent).pageY
	}

	const [x, y] = getCoordinatesRelativeToImage(
		pageX,
		pageY,
		panzoomInstance.value.getTransform().scale,
		imageEl.value,
	)

	if (devPolyMode.value && devtoolsInstance.value) {
		devtoolsInstance.value.onImageClick(x, y)

		return
	}

	const [, , polygons] = currentTarget.value
	const found = pointInPolygons(x, y, polygons)

	if (found == null || typeof currentTargetIndexOrUrl === 'string') return

	const solved = solvedTargets.value?.[currentTargetIndexOrUrl.value]

	if (Array.isArray(solved) && solved.find((v) => v === found)) return

	if (
		polygons.length === 1 ||
		(Array.isArray(solved) && solved.length === polygons.length - 1)
	) {
		solvedTargets.value[currentTargetIndexOrUrl.value] = 1
	} else {
		if (typeof solved === 'undefined') {
			solvedTargets.value[currentTargetIndexOrUrl.value] = [found]
		} else {
			;(solvedTargets.value[currentTargetIndexOrUrl.value] as number[]).push(
				found,
			)
		}

		canvas.value.confetti(x, y)
		return
	}

	canvas.value.fireworks()
	canvas.value.highlightPolygons(polygons)

	setTimeout(() => {
		showSuccessModal.value = true
	}, 2000)
}

const onTargetSelected = (index: number) => {
	showTargetSelectorModal.value = false
	currentTargetIndexOrUrl.value = index
}

const onGiveUp = () => {
	showTargetSelectorModal.value = false
	resetPanzoom()

	nextTick().then(() => {
		solvedTargets.value[currentTargetIndexOrUrl.value] = 1

		canvas.value!.animateHighlightPolygons(currentTarget.value[2])
	})
}

const onGlobalKeyDown = (event: KeyboardEvent) => {
	switch (event.key) {
		case '-': {
			if (event.ctrlKey) event.preventDefault()

			panzoomInstance.value?.smoothZoom(0, 0, 0.75)
			break
		}
		case '=': {
			if (event.ctrlKey) event.preventDefault()

			panzoomInstance.value?.smoothZoom(0, 0, 1.25)
			break
		}
		case 'ArrowLeft': {
			panzoomInstance.value?.moveBy(50, 0, true)
			break
		}
		case 'ArrowRight': {
			panzoomInstance.value?.moveBy(-50, 0, true)
			break
		}
		case 'ArrowUp': {
			panzoomInstance.value?.moveBy(0, 50, true)
			break
		}
		case 'ArrowDown': {
			panzoomInstance.value?.moveBy(0, -50, true)
			break
		}
	}
}

const resetPanzoom = () => {
	panzoomInstance.value!.moveTo(0, 0)
	panzoomInstance.value!.zoomAbs(0, 0, 1)
}

onMounted(() => {
	if (imageContainerEl.value) {
		panzoomInstance.value = panzoom(imageContainerEl.value, {
			smoothScroll: false,
			filterKey: () => true,
			onClick: (event) => onImageClick(event as MouseEvent),
		})
	}
})

provide(STATE_KEY, {
	devPolyMode,
	canvas,
	imageEl,
	currentTargetIndexOrUrl,
	panzoomInstance,
	resetPanzoom,
	solvedTargets,
})

watch(
	currentTargetIndexOrUrl,
	(v) => {
		imageLoaded.value = false

		if (typeof v === 'number') window.location.hash = (v + 1).toString()

		pageTitle.value = `Find the ${currentTarget.value[0]} | Spywhere`
	},
	{ immediate: true },
)

watch(imageLoaded, (v) => {
	if (!v) return

	nextTick().then(() => {
		resetPanzoom()

		if (solvedTargets.value?.[currentTargetIndexOrUrl.value] === 1)
			canvas.value!.highlightPolygons(currentTarget.value[2])
	})
})

window.addEventListener('keydown', onGlobalKeyDown)
window.addEventListener(
	'resize',
	useDebounceFn(() => canvas.value?.resize(), 500),
)
</script>

<template>
	<Loading
		class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
		v-if="!imageLoaded"
	/>

	<Sidebar v-if="panzoomInstance" />

	<component v-if="devtools" :is="devtools" ref="devtoolsInstance" />

	<Modal
		:show="showTargetSelectorModal"
		@close="showTargetSelectorModal = false"
	>
		<TargetSelector @give-up="onGiveUp" @target-selected="onTargetSelected" />
	</Modal>

	<Modal :show="showSuccessModal" @close="showSuccessModal = false">
		<div class="text-center">
			<h2 class="mb-4 text-2xl font-semibold">Nice job!</h2>
			<p>
				You've solved
				{{ numFullySolvedTargets }}
				challenge{{ numFullySolvedTargets === 1 ? '' : 's' }} so far.
			</p>

			<p class="my-4" v-if="currentTargetIndexOrUrl < targets.length - 1">
				Next: Find the
				<strong>{{ targets[currentTargetIndexOrUrl + 1]?.[0] }}</strong>
			</p>

			<div class="flex justify-between">
				<button
					@click="showSuccessModal = false"
					class="mr-3 rounded-md bg-neutral-700 px-3 py-2 font-medium transition-colors hover:bg-neutral-600"
				>
					&times; Close
				</button>

				<button
					v-if="currentTargetIndexOrUrl !== targets.length - 1"
					@click="
						() => {
							showSuccessModal = false
							currentTargetIndexOrUrl += 1
						}
					"
					class="rounded-md bg-blue-500 px-3 py-2 font-medium transition-colors hover:bg-blue-400"
				>
					Next &rarr;
				</button>
			</div>
		</div>
	</Modal>

	<div
		class="absolute left-1/2 top-0 z-40 mx-auto flex w-max -translate-x-1/2 transform items-center space-x-0.5 pl-0.5 pt-3 sm:left-0 sm:w-auto sm:transform-none"
	>
		<SidebarButton
			@click="currentTargetIndexOrUrl -= 1"
			:icon-path="mdiChevronLeft"
			:disabled="currentTargetIndexOrUrl === 0"
			class="hover:bg-neutral-700/50"
			small
		/>

		<button
			@click="showTargetSelectorModal = true"
			class="flex items-center rounded-full bg-neutral-700 pr-4"
			@dblclick.stop
			@mousedown.stop
			@touchstart.stop
		>
			<span
				class="mr-2 inline-flex size-12 items-center justify-center rounded-full bg-white text-xl text-black"
			>
				{{
					typeof currentTargetIndexOrUrl === 'number'
						? (currentTargetIndexOrUrl + 1).toString().padStart(2, '0')
						: '??'
				}}
			</span>

			<span class="text-lg">
				Find the <strong>{{ currentTarget?.[0] }}</strong>
			</span>
		</button>

		<SidebarButton
			@click="currentTargetIndexOrUrl += 1"
			:icon-path="mdiChevronRight"
			:disabled="currentTargetIndexOrUrl === targets.length - 1"
			class="hover:bg-neutral-700/50"
			small
		/>
	</div>

	<div
		ref="imageContainerEl"
		class="relative flex h-dvh items-center justify-center"
	>
		<img
			ref="imageEl"
			class="block h-auto max-h-full max-w-full"
			@load="imageLoaded = true"
			:class="{ invisible: !imageLoaded }"
			:src="
				typeof currentTargetIndexOrUrl === 'number'
					? `/img/${currentTargetIndexOrUrl + 1}.avif`
					: currentTargetIndexOrUrl
			"
		/>

		<OverlayCanvas
			ref="canvas"
			v-if="imageLoaded"
			class="absolute z-40 w-full object-contain"
			:width="imageEl?.clientWidth"
			:height="imageEl?.clientHeight"
		/>
	</div>
</template>
